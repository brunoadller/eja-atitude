import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { adminMiddleware } from '@/shared/middlewares/admin.middleware';
import { authMiddleware } from '@/shared/middlewares/auth.middleware';
import { validate } from '@/shared/middlewares/validate.middleware';
import { AuthController } from './auth.controller';
import {
  adminChangePasswordSchema,
  adminForgotRequestSchema,
  adminForgotResetSchema,
  adminForgotVerifySchema,
  adminUpdateEmailSchema,
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
const updateEmailLimiter = limiter(15, 5, 'muitas tentativas de alterar o e-mail, aguarde alguns minutos');
const adminForgotLimiter = limiter(60, 8, 'muitas tentativas, tente novamente mais tarde');

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

// Secretaria logada cadastra/troca o e-mail de recuperação de senha.
router.put(
  '/admin/email',
  updateEmailLimiter,
  adminMiddleware,
  validate(adminUpdateEmailSchema),
  AuthController.updateAdminEmail,
);

router.post('/forgot-password/request', forgotLimiter, validate(forgotRequestSchema), AuthController.forgotRequest);
router.post('/forgot-password/verify', forgotLimiter, validate(forgotVerifySchema), AuthController.forgotVerify);
router.post('/forgot-password/reset', forgotLimiter, validate(forgotResetSchema), AuthController.forgotReset);

// "Esqueci a senha" da secretaria (sem login; identifica pelo usuário).
router.post('/admin/forgot-password/request', adminForgotLimiter, validate(adminForgotRequestSchema), AuthController.adminForgotRequest);
router.post('/admin/forgot-password/verify', adminForgotLimiter, validate(adminForgotVerifySchema), AuthController.adminForgotVerify);
router.post('/admin/forgot-password/reset', adminForgotLimiter, validate(adminForgotResetSchema), AuthController.adminForgotReset);

export default router;
