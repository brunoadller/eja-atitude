import { NextFunction, Request, Response } from 'express';
import { prisma } from '@/config/database';
import { ForbiddenError } from '@/shared/errors/ForbiddenError';
import { UnauthorizedError } from '@/shared/errors/UnauthorizedError';
import { verifyAuthToken } from '@/shared/utils/jwt';

export const AUTH_COOKIE = 'token';

function extractToken(req: Request): string | undefined {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice(7).trim();
  return req.cookies?.[AUTH_COOKIE] as string | undefined;
}

/** Valida o JWT e carrega a situação atual do usuário no banco. */
export async function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = extractToken(req);
    if (!token) throw new UnauthorizedError('não autenticado');
    const payload = verifyAuthToken(token);

    if (payload.role === 'admin') {
      const admin = await prisma.admin.findUnique({ where: { id: payload.sub }, select: { id: true } });
      if (!admin) throw new UnauthorizedError('sessão inválida ou expirada');
      req.session = { userId: admin.id, type: 'admin' };
      return next();
    }

    const student = await prisma.student.findUnique({
      where: { id: payload.sub },
      select: { id: true, status: true, tokenVersion: true, contractAccepted: true },
    });
    if (!student || student.tokenVersion !== payload.tv) {
      throw new UnauthorizedError('sessão inválida ou expirada');
    }
    if (student.status === 'locked') throw new ForbiddenError('matrícula trancada, procure a secretaria');

    req.session = {
      userId: student.id,
      type: 'student',
      status: student.status,
      contractAccepted: student.contractAccepted,
    };
    next();
  } catch (err) {
    next(err);
  }
}

/** Para rotas da área do aluno: só libera depois do aceite do contrato (aluno "ativo"). */
export function requireActiveStudent(req: Request, _res: Response, next: NextFunction) {
  const s = req.session;
  if (s?.type === 'student' && (!s.contractAccepted || s.status === 'pending')) {
    return next(new ForbiddenError('aceite o contrato para liberar o acesso à plataforma'));
  }
  next();
}
