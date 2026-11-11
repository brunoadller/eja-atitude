import { z } from 'zod';
import { DOCUMENT_TYPES } from '@/shared/constants/document-types';

export const uploadDocumentSchema = z.object({
  body: z.object({ type: z.enum(DOCUMENT_TYPES) }),
});

export const reviewDocumentSchema = z.object({
  body: z.object({
    status: z.enum(['approved', 'rejected']),
    note: z.string().optional(),
  }),
});
