import { Router } from 'express';
import { DocumentsController } from './documents.controller';
import { authMiddleware, requireActiveStudent } from '@/shared/middlewares/auth.middleware';
import { adminMiddleware } from '@/shared/middlewares/admin.middleware';
import { discardUploadOnFailure } from '@/shared/middlewares/discard-upload-on-failure.middleware';
import { validate } from '@/shared/middlewares/validate.middleware';
import { upload } from '@/shared/middlewares/upload.middleware';
import { adminUploadDocumentSchema, reviewDocumentSchema, uploadDocumentSchema } from './documents.schema';

const router = Router();

// Lista de tipos com nomes em português (aluno e secretaria). Precisa vir antes de "/:studentId".
router.get('/types', authMiddleware, DocumentsController.types);

// aluno: os próprios documentos (sem id na URL, vem da sessão)
router.get('/', authMiddleware, requireActiveStudent, DocumentsController.listOwn);
router.post(
  '/',
  authMiddleware,
  requireActiveStudent,
  discardUploadOnFailure,
  upload.single('file'),
  validate(uploadDocumentSchema),
  DocumentsController.upload,
);

// secretaria: documentos de um aluno
router.get('/:studentId', adminMiddleware, DocumentsController.listByStudent);
// secretaria anexa para o aluno. adminMiddleware ANTES do upload: quem não é admin nem chega a gravar arquivo.
router.post(
  '/:studentId',
  adminMiddleware,
  discardUploadOnFailure,
  upload.single('file'),
  validate(adminUploadDocumentSchema),
  DocumentsController.uploadByAdmin,
);

router.get('/:studentId/:id/download', authMiddleware, requireActiveStudent, DocumentsController.download);

router.put('/:id/review', adminMiddleware, validate(reviewDocumentSchema), DocumentsController.review);

export default router;
