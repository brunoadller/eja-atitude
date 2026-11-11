import { adminMiddleware } from '@/shared/middlewares/admin.middleware';
import { authMiddleware, requireActiveStudent } from '@/shared/middlewares/auth.middleware';
import { validate } from '@/shared/middlewares/validate.middleware';
import { Router } from 'express';
import { BooksController } from './books.controller';
import { createBookSchema } from './books.schema';

const router = Router();

router.get('/', authMiddleware, requireActiveStudent, BooksController.list);
router.get('/:id/download', authMiddleware, requireActiveStudent, BooksController.download);
router.post('/', adminMiddleware, validate(createBookSchema), BooksController.create);
router.delete('/:id', adminMiddleware, BooksController.remove);

export default router;