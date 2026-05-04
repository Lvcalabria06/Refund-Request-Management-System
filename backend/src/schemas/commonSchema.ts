import { z } from 'zod';

export const idParamSchema = z.object({
  id: z.string().uuid('Invalid ID format'),
});

// EXTRA
export const reimbursementQuerySchema = z.object({
  status: z
    .enum(['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'PAID', 'CANCELED'])
    .optional(),
  categoryId: z.string().uuid('Invalid category ID').optional(),
  orderBy: z
    .enum(['createdAt', 'expenseDate', 'amount'])
    .optional()
    .default('createdAt'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const reimbursementAttachmentParamsSchema = z.object({
  id: z.string().uuid('Invalid reimbursement ID'),
  attachmentId: z.string().uuid('Invalid attachment ID'),
});
