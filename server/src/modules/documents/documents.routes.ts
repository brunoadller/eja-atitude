import { Router } from 'express';
import { DocumentsController } from './documents.controller';
import { authMiddleware, requireActiveStudent } from '@/shared/middlewares/auth.middleware';
import { adminMiddleware } from '@/shared/middlewares/admin.middleware';
import { validate } from '@/shared/middlewares/validate.middleware';
import { upload } from '@/shared/middlewares/upload.middleware';
import { uploadDocumentSchema, reviewDocumentSchema } from './documents.schema';

const router = Router();

// student: own documents (no id in URL, comes from session)
router.get('/', authMiddleware, requireActiveStudent, DocumentsController.listOwn);
router.post('/', authMiddleware, requireActiveStudent, upload.single('file'), validate(uploadDocumentSchema), DocumentsController.upload);

// admin: a specific student's documents
router.get('/:studentId', adminMiddleware, DocumentsController.listByStudent);
router.get('/:studentId/:id/download', authMiddleware, requireActiveStudent, DocumentsController.download);

router.put('/:id/review', adminMiddleware, validate(reviewDocumentSchema), DocumentsController.review);

export default router;
