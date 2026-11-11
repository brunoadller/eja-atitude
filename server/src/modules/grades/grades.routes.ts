import { Router } from 'express';
import { adminMiddleware } from '@/shared/middlewares/admin.middleware';
import { authMiddleware, requireActiveStudent } from '@/shared/middlewares/auth.middleware';
import { validate } from '@/shared/middlewares/validate.middleware';
import { GradesController } from './grades.controller';
import { recordRecoveryScoreSchema, registerRegularExamSchema, scheduleRecoverySchema } from './grades.schema';

const router = Router();

router.get('/:studentId', authMiddleware, requireActiveStudent, GradesController.listByStudent);
router.post('/regular', adminMiddleware, validate(registerRegularExamSchema), GradesController.registerRegularExam);
router.post('/recovery/schedule', adminMiddleware, validate(scheduleRecoverySchema), GradesController.scheduleRecovery);
router.put('/recovery/:id/score', adminMiddleware, validate(recordRecoveryScoreSchema), GradesController.recordRecoveryScore);
router.delete('/:id', adminMiddleware, GradesController.remove);

export default router;
