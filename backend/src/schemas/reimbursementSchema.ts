import { z } from 'zod';

export const createReimbursementSchema = z.object({
  description: z.string().min(5, 'Description must have at least 5 characters'),
  amount: z.number().positive('Amount must be greater than zero'),
  expenseDate: z.string().datetime({ message: 'Invalid expense date' }),
  categoryId: z.string().uuid('Invalid category ID'),
});

export const rejectReimbursementSchema = z.object({
  reason: z.string().min(5, 'Rejection reason must have at least 5 characters'),
});

export const createAttachmentSchema = z.object({
  fileName: z.string().min(1, 'File name is required'),
  url: z.string().url('Invalid URL'),
  fileType: z.enum(['PDF', 'JPG', 'PNG'], {
    error: () => ({ message: 'File type must be PDF, JPG or PNG' }),
  }),
});
