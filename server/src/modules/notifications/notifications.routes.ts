import { Router } from 'express';
import { authMiddleware, requireActiveStudent } from '@/shared/middlewares/auth.middleware';
import { NotificationsController } from './notifications.controller';

const router = Router();

// Aluno e secretaria usam as mesmas rotas: cada um só enxerga e marca as PRÓPRIAS
// (o dono vem da sessão; nada de id de aluno/admin na URL ou no corpo).
router.get('/', authMiddleware, requireActiveStudent, NotificationsController.list);
router.get('/unread-count', authMiddleware, requireActiveStudent, NotificationsController.unreadCount);
// "read-all" antes de "/:id/read" não é obrigatório (caminhos diferentes), mas fica mais claro
router.put('/read-all', authMiddleware, requireActiveStudent, NotificationsController.markAllRead);
router.put('/:id/read', authMiddleware, requireActiveStudent, NotificationsController.markRead);

export default router;
