import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '@/config/env';
import { UnauthorizedError } from '@/shared/errors/UnauthorizedError';

const ISSUER = 'eja-atitude';

export interface AuthPayload {
  sub: string;
  role: 'admin' | 'student';
  /** tokenVersion do aluno: trocar a senha invalida os tokens antigos. */
  tv: number;
}

export function signAuthToken(p: { userId: string; role: 'admin' | 'student'; tokenVersion?: number }): string {
  return jwt.sign({ role: p.role, tv: p.tokenVersion ?? 0 }, env.JWT_SECRET, {
    subject: p.userId,
    issuer: ISSUER,
    algorithm: 'HS256',
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
  });
}

export function verifyAuthToken(token: string): AuthPayload {
  try {
    const d = jwt.verify(token, env.JWT_SECRET, { issuer: ISSUER, algorithms: ['HS256'] });
    if (typeof d === 'string' || !d.sub || (d.role !== 'admin' && d.role !== 'student')) {
      throw new Error('payload inválido');
    }
    return { sub: d.sub, role: d.role, tv: typeof d.tv === 'number' ? d.tv : 0 };
  } catch {
    throw new UnauthorizedError('sessão inválida ou expirada');
  }
}

/** Token curto usado entre "confirmar código" e "cadastrar nova senha". */
export function signResetToken(studentId: string, resetId: string): string {
  return jwt.sign({ purpose: 'pwd-reset', rid: resetId }, env.JWT_SECRET, {
    subject: studentId,
    issuer: ISSUER,
    algorithm: 'HS256',
    expiresIn: '10m',
  });
}

export function verifyResetToken(token: string): { studentId: string; resetId: string } {
  try {
    const d = jwt.verify(token, env.JWT_SECRET, { issuer: ISSUER, algorithms: ['HS256'] });
    if (typeof d === 'string' || d.purpose !== 'pwd-reset' || !d.sub || typeof d.rid !== 'string') {
      throw new Error('token de redefinição inválido');
    }
    return { studentId: d.sub, resetId: d.rid };
  } catch {
    throw new UnauthorizedError('o link de redefinição expirou, recomece o processo');
  }
}

// Mesma ideia para a secretaria, com "purpose" diferente: um token de aluno não serve na rota do admin (e vice-versa).
export function signAdminResetToken(adminId: string, resetId: string): string {
  return jwt.sign({ purpose: 'admin-pwd-reset', rid: resetId }, env.JWT_SECRET, {
    subject: adminId,
    issuer: ISSUER,
    algorithm: 'HS256',
    expiresIn: '10m',
  });
}

export function verifyAdminResetToken(token: string): { adminId: string; resetId: string } {
  try {
    const d = jwt.verify(token, env.JWT_SECRET, { issuer: ISSUER, algorithms: ['HS256'] });
    if (typeof d === 'string' || d.purpose !== 'admin-pwd-reset' || !d.sub || typeof d.rid !== 'string') {
      throw new Error('token de redefinição inválido');
    }
    return { adminId: d.sub, resetId: d.rid };
  } catch {
    throw new UnauthorizedError('o link de redefinição expirou, recomece o processo');
  }
}
