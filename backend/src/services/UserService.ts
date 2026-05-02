import z from 'zod';
import { prisma } from '../lib/prisma';
import { createUserSchema } from '../schemas/userSchema';
import bcrypt from 'bcryptjs';

export class UserService {
  async getAll() {
    return prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
  async create(data: z.infer<typeof createUserSchema>) {
  const existing = await prisma.user.findUnique({
    where: { email: data.email }
  });
  if (existing) throw new Error('Email already in use');

  const hashed = await bcrypt.hash(data.password, 10);
  const user = await prisma.user.create({
    data: { ...data, password: hashed }
  });

  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
}
}
