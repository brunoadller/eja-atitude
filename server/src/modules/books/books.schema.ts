import { z } from 'zod';

export const createBookSchema = z.object({
  body: z.strictObject({
    title: z.string().trim().min(2, 'Informe o título'),
    subject: z.string().trim().min(2, 'Escolha a disciplina'),
    moduleNumber: z.union([z.literal(1), z.literal(2)], { error: 'Escolha o módulo' }),
    description: z.string().trim().optional(),
    // arquivo já copiado para server/uploads/apostilas
    fileUrl: z.string().regex(/^\/uploads\/apostilas\/[\w.\-]+\.pdf$/, 'use o formato /uploads/apostilas/arquivo.pdf'),
  }),
});
