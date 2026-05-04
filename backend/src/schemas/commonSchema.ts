import { z } from 'zod';

// Schema usado para validar o parâmetro :id presente nas URLs.
// Como o Prisma usa @default(uuid()), validamos formato UUID.
export const idParamSchema = z.object({
  id: z.string().uuid('Invalid ID format'),
});
