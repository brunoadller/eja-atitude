import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '@/config/database';
import { logger } from '@/config/logger';
import { UnauthorizedError } from '@/shared/errors/UnauthorizedError';
import { ValidationError } from '@/shared/errors/ValidationError';
import { MailService } from '@/shared/services/mail.service';
import { hashPassword } from '@/shared/utils/hash';
import { signResetToken, verifyResetToken } from '@/shared/utils/jwt';
import { passwordPolicyError } from '@/shared/utils/password';
import { AuthRepository } from './auth.repository';

const CODE_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;
const BAD_CODE = 'código inválido ou expirado';

export const PasswordResetService = {
  /** Sempre responde igual (exista ou não o CPF) para não revelar quem é aluno. */
  async request(cpf: string) {
    const student = await AuthRepository.findStudentByCpf(cpf);
    if (!student || !student.email || !student.passwordHash) return;

    const last = await prisma.passwordReset.findFirst({
      where: { studentId: student.id },
      orderBy: { createdAt: 'desc' },
    });
    if (last && Date.now() - last.createdAt.getTime() < RESEND_COOLDOWN_MS) return;

    const code = crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');
    await prisma.passwordReset.deleteMany({ where: { studentId: student.id } });
    await prisma.passwordReset.create({
      data: {
        studentId: student.id,
        codeHash: await bcrypt.hash(code, 10),
        expiresAt: new Date(Date.now() + CODE_TTL_MS),
      },
    });

    try {
      await MailService.sendResetCode(student.email, student.name, code);
    } catch (err) {
      logger.error({ err }, 'falha ao enviar e-mail de redefinição de senha');
    }
  },

  async verify(cpf: string, code: string) {
    const student = await AuthRepository.findStudentByCpf(cpf);
    if (!student) throw new ValidationError(BAD_CODE);

    const reset = await prisma.passwordReset.findFirst({
      where: { studentId: student.id, usedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    if (!reset || reset.expiresAt < new Date() || reset.attempts >= MAX_ATTEMPTS) {
      throw new ValidationError(BAD_CODE);
    }

    const ok = await bcrypt.compare(code, reset.codeHash);
    if (!ok) {
      await prisma.passwordReset.update({ where: { id: reset.id }, data: { attempts: { increment: 1 } } });
      throw new ValidationError(BAD_CODE);
    }

    await prisma.passwordReset.update({ where: { id: reset.id }, data: { verifiedAt: new Date() } });
    return { resetToken: signResetToken(student.id, reset.id) };
  },

  async reset(resetToken: string, password: string, passwordConfirm: string) {
    const { studentId, resetId } = verifyResetToken(resetToken);
    if (password !== passwordConfirm) throw new ValidationError('as senhas não conferem');
    const policy = passwordPolicyError(password);
    if (policy) throw new ValidationError(policy);

    const reset = await prisma.passwordReset.findUnique({ where: { id: resetId } });
    if (!reset || reset.studentId !== studentId || !reset.verifiedAt || reset.usedAt || reset.expiresAt < new Date()) {
      throw new UnauthorizedError('o link de redefinição expirou, recomece o processo');
    }

    const passwordHash = await hashPassword(password);
    await prisma.$transaction([
      prisma.student.update({
        where: { id: studentId },
        data: { passwordHash, tokenVersion: { increment: 1 } }, // derruba sessões antigas
      }),
      prisma.passwordReset.deleteMany({ where: { studentId } }),
    ]);
  },
};
