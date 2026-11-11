import { Router } from 'express';
import { ContractsController } from './contracts.controller';
import { authMiddleware } from '@/shared/middlewares/auth.middleware';

const router = Router();

router.get('/', authMiddleware, ContractsController.getCurrent);
router.post('/accept', authMiddleware, ContractsController.accept);

export default router;
