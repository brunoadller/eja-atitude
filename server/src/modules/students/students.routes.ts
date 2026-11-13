import { Router } from 'express';
import { adminMiddleware } from '@/shared/middlewares/admin.middleware';
import { authMiddleware } from '@/shared/middlewares/auth.middleware';
import { validate } from '@/shared/middlewares/validate.middleware';
import { StudentsController } from './students.controller';
import { advanceModuleSchema, createStudentSchema, listStudentsSchema, updateStudentSchema } from './students.schema';

const router = Router();

router.get('/', adminMiddleware, validate(listStudentsSchema), StudentsController.list);
router.get('/summary', adminMiddleware, StudentsController.summary); // antes de /:id, senão "summary" viraria um id
router.get('/:id', authMiddleware, StudentsController.getById); // aluno só vê a própria ficha (checado no service)
router.post('/', adminMiddleware, validate(createStudentSchema), StudentsController.create);
router.put('/:id', adminMiddleware, validate(updateStudentSchema), StudentsController.update);
router.post('/:id/advance-module', adminMiddleware, validate(advanceModuleSchema), StudentsController.advanceModule);
router.delete('/:id', adminMiddleware, StudentsController.remove);

export default router;
