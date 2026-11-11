import { Router } from 'express';
import { adminMiddleware } from '@/shared/middlewares/admin.middleware';
import { authMiddleware, requireActiveStudent } from '@/shared/middlewares/auth.middleware';
import { validate } from '@/shared/middlewares/validate.middleware';
import { InvoicesController } from './invoices.controller';
import { createInstallmentsSchema } from './invoices.schema';

const router = Router();

// secretaria: carnê (3 vias por parcela) e PDF avulso — o aluno não imprime boletos
router.get('/student/:studentId/carne', adminMiddleware, InvoicesController.carne);
router.get('/:id/pdf', adminMiddleware, InvoicesController.pdf);
router.post('/installments', adminMiddleware, validate(createInstallmentsSchema), InvoicesController.createInstallments);
router.post('/:id/pay', adminMiddleware, InvoicesController.pay);
router.post('/:id/reopen', adminMiddleware, InvoicesController.reopen);

// aluno (apenas as próprias parcelas) e secretaria
router.get('/:studentId', authMiddleware, requireActiveStudent, InvoicesController.listByStudent);

export default router;
