import { CookieOptions, NextFunction, Request, Response } from 'express';
import { prisma } from '@/config/database';
import { env } from '@/config/env';
import { AUTH_COOKIE } from '@/shared/middlewares/auth.middleware';
import { AuthService } from './auth.service';
import { PasswordResetService } from './password-reset.service';

const cookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: env.NODE_ENV === 'production',
  path: '/',
};

export const AuthController = {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, ...info } = await AuthService.login(req.body);
      // JWT em cookie httpOnly (o JavaScript do navegador não consegue ler) — também é aceito via "Authorization: Bearer".
      res.cookie(AUTH_COOKIE, token, cookieOptions);
      res.json({ ok: true, ...info });
    } catch (err) { next(err); }
  },

  logout(_req: Request, res: Response) {
    res.clearCookie(AUTH_COOKIE, { ...cookieOptions, maxAge: undefined });
    res.json({ ok: true });
  },

  async me(req: Request, res: Response, next: NextFunction) {
    try {
      const s = req.session!;
      if (s.type === 'admin') {
        const admin = await prisma.admin.findUnique({ where: { id: s.userId } });
        if (!admin) return res.status(401).json({ error: 'não autenticado' });
        const { passwordHash, tokenVersion, ...safeAdmin } = admin;
        return res.json({ type: 'admin', user: safeAdmin });
      }
      const student = await prisma.student.findUnique({ where: { id: s.userId } });
      if (!student) return res.status(401).json({ error: 'não autenticado' });
      const { passwordHash, contractIp, tokenVersion, ...safe } = student;
      return res.json({ type: 'student', user: safe });
    } catch (err) { next(err); }
  },

  async changeAdminPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const token = await AuthService.changeAdminPassword(req.session!.userId, req.body);
      // Cookie novo para a sessão atual continuar logada (o token antigo deixou de valer).
      res.cookie(AUTH_COOKIE, token, cookieOptions);
      res.json({ ok: true, message: 'Senha alterada com sucesso.' });
    } catch (err) { next(err); }
  },

  async updateAdminEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = await AuthService.updateAdminEmail(req.session!.userId, req.body.email, req.body.currentPassword);
      res.json({ ok: true, email, message: 'E-mail de recuperação salvo.' });
    } catch (err) { next(err); }
  },

  async forgotRequest(req: Request, res: Response, next: NextFunction) {
    try {
      await PasswordResetService.request(req.body.cpf);
      res.json({ ok: true, message: 'Se o CPF estiver cadastrado, enviamos um código para o e-mail do aluno.' });
    } catch (err) { next(err); }
  },

  async forgotVerify(req: Request, res: Response, next: NextFunction) {
    try { res.json(await PasswordResetService.verify(req.body.cpf, req.body.code)); } catch (err) { next(err); }
  },

  async forgotReset(req: Request, res: Response, next: NextFunction) {
    try {
      await PasswordResetService.reset(req.body.resetToken, req.body.password, req.body.passwordConfirm);
      res.json({ ok: true });
    } catch (err) { next(err); }
  },
};
