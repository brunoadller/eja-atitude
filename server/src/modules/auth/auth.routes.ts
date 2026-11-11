import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { adminMiddleware } from '@/shared/middlewares/admin.middleware';
import { authMiddleware } from '@/shared/middlewares/auth.middleware';
import { validate } from '@/shared/middlewares/validate.middleware';
import { AuthController } from './auth.controller';
import {
  adminChangePasswordSchema,
  forgotRequestSchema,
  forgotResetSchema,
  forgotVerifySchema,
  loginSchema,
} from './auth.schema';

const router = Router();

const limiter = (windowMin: number, max: number, message: string) =>
  rateLimit({
    windowMs: windowMin * 60 * 1000,
    limit: max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: message },
  });

const loginLimiter = limiter(15, 10, 'muitas tentativas de login, aguarde alguns minutos');
const forgotLimiter = limiter(60, 8, 'muitas tentativas, tente novamente mais tarde');
const changePasswordLimiter = limiter(15, 5, 'muitas tentativas de troca de senha, aguarde alguns minutos');

router.post('/login', loginLimiter, validate(loginSchema), AuthController.login);
router.post('/logout', AuthController.logout);
router.get('/me', authMiddleware, AuthController.me);

// Secretaria logada troca a própria senha.
router.post(
  '/admin/change-password',
  changePasswordLimiter,
  adminMiddleware,
  validate(adminChangePasswordSchema),
  AuthController.changeAdminPassword,
);

router.post('/forgot-password/request', forgotLimiter, validate(forgotRequestSchema), AuthController.forgotRequest);
router.post('/forgot-password/verify', forgotLimiter, validate(forgotVerifySchema), AuthController.forgotVerify);
router.post('/forgot-password/reset', forgotLimiter, validate(forgotResetSchema), AuthController.forgotReset);

export default router;
