import { Router } from 'express';
import { z } from 'zod';
import { adminMiddleware } from '@/shared/middlewares/admin.middleware';
import { authMiddleware, requireActiveStudent } from '@/shared/middlewares/auth.middleware';
import { validate } from '@/shared/middlewares/validate.middleware';
import { CertificatesController } from './certificates.controller';

const router = Router();

const requestSchema = z.object({ body: z.strictObject({ type: z.enum(['attestation', 'certificate']) }) });

// aluno
router.get('/status', authMiddleware, requireActiveStudent, CertificatesController.status);
router.post('/requests', authMiddleware, requireActiveStudent, validate(requestSchema), CertificatesController.request);
router.get('/requests/:id/download', authMiddleware, requireActiveStudent, CertificatesController.download);

// secretaria
router.get('/enrollment/:studentId', adminMiddleware, CertificatesController.adminAttestation);
router.get('/completion/:studentId', adminMiddleware, CertificatesController.adminCertificate);

export default router;
