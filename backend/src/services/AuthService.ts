import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { z } from 'zod';
import { loginSchema } from '../schemas/authSchema';

const ACCESS_TOKEN_EXPIRY = '15m';  // short-lived
const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

function getSecret(): string {
  return process.env.JWT_SECRET || 'supersecret';
}

/** Hash a token before storing so the DB doesn't hold raw values */
function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export class AuthService {

  async login(data: z.infer<typeof loginSchema>) {
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) throw new Error('Invalid credentials');

    // Block login for soft-deleted (deactivated) accounts
    if (user.deletedAt !== null) throw new Error('Account is deactivated. Contact your administrator.');

    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) throw new Error('Invalid credentials');

    const { password, ...userWithoutPassword } = user;
    return {
      user: userWithoutPassword,
      ...(await this.generateTokenPair(user.id, user.email, user.role)),
    };
  }

  async refresh(rawRefreshToken: string) {
    const hashed = hashToken(rawRefreshToken);

    const stored = await prisma.refreshToken.findUnique({ where: { token: hashed } });
    if (!stored) throw new Error('Invalid refresh token');
    if (stored.expiresAt < new Date()) {
      // cleanup expired token
      await prisma.refreshToken.delete({ where: { id: stored.id } });
      throw new Error('Refresh token expired');
    }

    const user = await prisma.user.findUnique({ where: { id: stored.userId } });
    if (!user) throw new Error('User not found');

    // Rotate: delete old token, issue new pair
    await prisma.refreshToken.delete({ where: { id: stored.id } });

    const { password, ...userWithoutPassword } = user;
    return {
      user: userWithoutPassword,
      ...(await this.generateTokenPair(user.id, user.email, user.role)),
    };
  }

  async logout(rawRefreshToken: string) {
    const hashed = hashToken(rawRefreshToken);
    await prisma.refreshToken.deleteMany({ where: { token: hashed } });
  }

  private async generateTokenPair(userId: string, email: string, role: string) {
    // 1. Access token (short-lived JWT)
    const accessToken = jwt.sign({ id: userId, email, role }, getSecret(), {
      expiresIn: ACCESS_TOKEN_EXPIRY,
    });

    // 2. Refresh token (random opaque string, stored hashed)
    const rawRefresh = crypto.randomBytes(64).toString('hex');
    await prisma.refreshToken.create({
      data: {
        token: hashToken(rawRefresh),
        userId,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY),
      },
    });

    return { token: accessToken, refreshToken: rawRefresh };
  }
}
