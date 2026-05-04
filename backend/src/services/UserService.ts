import z from 'zod';
import { prisma } from '../lib/prisma';
import { createUserSchema, updateUserSchema } from '../schemas/userSchema';
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

  async findById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!user) throw new Error('User not found');
    return user;
  }

  async create(data: z.infer<typeof createUserSchema>) {
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existing) throw new Error('Email already in use');

    const hashed = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: { ...data, password: hashed },
    });

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async update(
    id: string,
    data: z.infer<typeof updateUserSchema>,
    requesterId: string
  ) {
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) throw new Error('User not found');

    // Bloqueia que o admin altere o próprio role para evitar lockout
    if (id === requesterId && data.role && data.role !== existing.role) {
      throw new Error('You cannot change your own role');
    }

    
    if (data.email && data.email !== existing.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: data.email },
      });
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

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    const { password, ...userWithoutPassword } = updated;
    return userWithoutPassword;
  }

  async delete(id: string, requesterId: string) {
    if (id === requesterId) {
      throw new Error('You cannot delete your own account');
    }

    const existing = await prisma.user.findUnique({
      where: { id },
      include: {
        reimbursements: { take: 1 },
        actions: { take: 1 },
      },
    });
    if (!existing) throw new Error('User not found');

   
    if (existing.reimbursements.length > 0 || existing.actions.length > 0) {
      throw new Error('Cannot delete user with existing reimbursements or history');
    }

    await prisma.user.delete({ where: { id } });
    return { success: true };
  }
}
