import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  maxAmount: z.number().positive('Max amount must be greater than zero').nullable().optional(),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  isActive: z.boolean().optional(),
  maxAmount: z.number().positive('Max amount must be greater than zero').nullable().optional(),
});
