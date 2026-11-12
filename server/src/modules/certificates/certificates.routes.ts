import { Router } from 'express';
import { z } from 'zod';
import { adminMiddleware } from '@/shared/middlewares/admin.middleware';
import { authMiddleware, requireActiveStudent } from '@/shared/middlewares/auth.middleware';
import { validate } from '@/shared/middlewares/validate.middleware';
import { CertificatesController } from './certificates.controller';

const router = Router();

const requestSchema = z.object({ body: z.strictObject({ type: z.enum(['attestation', 'certificate'], 'tipo de documento inválido') }) });

const listSchema = z.object({
  query: z.object({
    type: z.enum(['attestation', 'certificate'], 'tipo de documento inválido').optional(),
    status: z.enum(['awaiting_payment', 'ready', 'issued'], 'situação inválida').optional(),
  }),
});

const idSchema = z.object({ params: z.object({ id: z.string().min(1) }) });

// aluno
router.get('/status', authMiddleware, requireActiveStudent, CertificatesController.status);
router.post('/requests', authMiddleware, requireActiveStudent, validate(requestSchema), CertificatesController.request);
// só atestado: o certificado é emitido pela secretaria (o service recusa)
router.get('/requests/:id/download', authMiddleware, requireActiveStudent, CertificatesController.download);

// secretaria
router.get('/requests', adminMiddleware, validate(listSchema), CertificatesController.listRequests);
router.get('/requests/:id/pdf', adminMiddleware, validate(idSchema), CertificatesController.adminRequestPdf);
router.put('/requests/:id/issue', adminMiddleware, validate(idSchema), CertificatesController.issue);
router.get('/enrollment/:studentId', adminMiddleware, CertificatesController.adminAttestation);
router.get('/completion/:studentId', adminMiddleware, CertificatesController.adminCertificate);

export default router;
