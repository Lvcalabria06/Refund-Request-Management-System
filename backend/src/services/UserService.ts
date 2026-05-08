import z from 'zod';
import { prisma } from '../lib/prisma';
import { createUserSchema, updateUserSchema } from '../schemas/userSchema';
import bcrypt from 'bcryptjs';

export class UserService {
  /** List only active (non-deleted) users */
  async getAll() {
    return prisma.user.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** List soft-deleted users */
  async getDeleted() {
    return prisma.user.findMany({
      where: { deletedAt: { not: null } },
      select: { id: true, name: true, email: true, role: true, deletedAt: true },
      orderBy: { deletedAt: 'desc' },
    });
  }

  async findById(id: string) {
    const user = await prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true },
    });
    if (!user) throw new Error('User not found');
    return user;
  }

  async create(data: z.infer<typeof createUserSchema>) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new Error('Email already in use');

    const hashed = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({ data: { ...data, password: hashed } });
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async update(id: string, data: z.infer<typeof updateUserSchema>, requesterId: string) {
    const existing = await prisma.user.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new Error('User not found');

    if (id === requesterId && data.role && data.role !== existing.role) {
      throw new Error('You cannot change your own role');
    }

    if (data.email && data.email !== existing.email) {
      const emailExists = await prisma.user.findUnique({ where: { email: data.email } });
      if (emailExists) throw new Error('Email already in use');
    }

    const updateData: { name?: string; email?: string; role?: string; password?: string } = {
      name: data.name,
      email: data.email,
      role: data.role,
    };

    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    const updated = await prisma.user.update({ where: { id }, data: updateData });
    const { password, ...userWithoutPassword } = updated;
    return userWithoutPassword;
  }

  /** Soft-delete: sets deletedAt and revokes all refresh tokens */
  async deactivate(id: string, requesterId: string) {
    if (id === requesterId) throw new Error('You cannot deactivate your own account');

    const existing = await prisma.user.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new Error('User not found');

    await prisma.$transaction([
      // Revoke all active refresh tokens so the session ends immediately
      prisma.refreshToken.deleteMany({ where: { userId: id } }),
      // Soft-delete
      prisma.user.update({ where: { id }, data: { deletedAt: new Date() } }),
    ]);

    return { success: true };
  }

  /** Restore a soft-deleted user */
  async restore(id: string) {
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing || existing.deletedAt === null) {
      throw new Error('User not found or is not deactivated');
    }

    await prisma.user.update({ where: { id }, data: { deletedAt: null } });
    return { success: true };
  }
}
