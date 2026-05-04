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
  // Aceita tanto URL externa (http/https) quanto data URL base64
  // (usada pelo frontend para "upload simulado" do arquivo)
  url: z
    .string()
    .min(1, 'URL is required')
    .refine(
      (val) => /^(https?:|data:)/.test(val),
      { message: 'URL must start with http(s):// or data:' }
    ),
  fileType: z.enum(['PDF', 'JPG', 'PNG'], {
    error: () => ({ message: 'File type must be PDF, JPG or PNG' }),
  }),
});

export const updateReimbursementSchema = z.object({
  description: z.string().min(5, 'Description must have at least 5 characters').optional(),
  amount: z.number().positive('Amount must be greater than zero').optional(),
  expenseDate: z.string().datetime({ message: 'Invalid expense date' }).optional(),
  categoryId: z.string().uuid('Invalid category ID').optional(),
});
