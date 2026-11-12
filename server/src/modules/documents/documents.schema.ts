import { z } from 'zod';
import { DOCUMENT_TYPES } from '@/shared/constants/document-types';

const documentType = z.enum(DOCUMENT_TYPES, 'tipo de documento inválido');

// Aluno envia o próprio documento (multipart: campo "file" + "type").
export const uploadDocumentSchema = z.object({
  body: z.strictObject({ type: documentType }),
});

// Secretaria anexa para um aluno. "approve" vem como texto no formulário multipart ("true"/"false").
export const adminUploadDocumentSchema = z.object({
  params: z.object({ studentId: z.string().min(1) }),
  body: z.strictObject({
    type: documentType,
    approve: z
      .enum(['true', 'false'], 'valor inválido para "já aprovar"')
      .optional()
      .transform((v) => v === 'true'),
  }),
});

// Aprovar ou recusar. Recusar exige o motivo, que o aluno vai ver.
export const reviewDocumentSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z
    .strictObject({
      status: z.enum(['approved', 'rejected'], 'escolha aprovar ou recusar'),
      note: z.string().trim().max(500, 'o motivo pode ter no máximo 500 caracteres').optional(),
    })
    .superRefine((b, ctx) => {
      if (b.status === 'rejected' && (!b.note || b.note.length < 3)) {
        ctx.addIssue({ code: 'custom', path: ['note'], message: 'informe o motivo da recusa' });
      }
    }),
});
