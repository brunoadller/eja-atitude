import { Router } from 'express';
import { adminMiddleware } from '@/shared/middlewares/admin.middleware';
import { authMiddleware, requireActiveStudent } from '@/shared/middlewares/auth.middleware';
import { validate } from '@/shared/middlewares/validate.middleware';
import { ScheduleController } from './schedule.controller';
import { addClassDaySchema, addExamRoundSchema, groupQuerySchema, importTemplateSchema } from './schedule.schema';

const router = Router();

// catálogo de disciplinas do módulo (para os selects)
router.get('/subjects', authMiddleware, ScheduleController.subjects);

// aluno: somente o cronograma da própria turma, e só depois do aceite do contrato
router.get('/me', authMiddleware, requireActiveStudent, ScheduleController.mine);
router.get('/me/pdf', authMiddleware, requireActiveStudent, ScheduleController.minePdf);

// secretaria
router.get('/group', adminMiddleware, validate(groupQuerySchema), ScheduleController.group);
router.get('/group/pdf', adminMiddleware, validate(groupQuerySchema), ScheduleController.groupPdf);
router.post('/class-days', adminMiddleware, validate(addClassDaySchema), ScheduleController.addClassDay);
router.delete('/class-sessions/:id', adminMiddleware, ScheduleController.removeClassSession);
router.post('/exam-rounds', adminMiddleware, validate(addExamRoundSchema), ScheduleController.addExamRound);
router.delete('/exam-rounds/:id', adminMiddleware, ScheduleController.removeExamRound);
router.post('/import-template', adminMiddleware, validate(importTemplateSchema), ScheduleController.importTemplate);

export default router;
