import { prisma } from '../lib/prisma';
import { z } from 'zod';
import { createCategorySchema, updateCategorySchema } from '../schemas/categorySchema';

export class CategoryService {
  async getAll() {
    return prisma.category.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async getActive() {
    return prisma.category.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async create(data: z.infer<typeof createCategorySchema>) {
    return prisma.category.create({
      data: {
        name: data.name,
      },
    });
  }

  async update(id: string, data: z.infer<typeof updateCategorySchema>) {
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) {
      throw new Error('Category not found');
    }

    return prisma.category.update({
      where: { id },
      data,
    });
  }
}
