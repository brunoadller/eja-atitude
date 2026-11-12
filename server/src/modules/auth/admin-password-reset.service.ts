import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { logger } from '@/config/logger';
import { UnauthorizedError } from '@/shared/errors/UnauthorizedError';
import { ValidationError } from '@/shared/errors/ValidationError';
import { MailService } from '@/shared/services/mail.service';
import { DUMMY_HASH, hashPassword } from '@/shared/utils/hash';
import { signAdminResetToken, verifyAdminResetToken } from '@/shared/utils/jwt';
import { AuthRepository } from './auth.repository';
import { BAD_CODE, CODE_TTL_MS, MAX_ATTEMPTS, RESEND_COOLDOWN_MS } from './password-reset.service';

const EXPIRED = 'o link de redefinição expirou, recomece o processo';

/**
 * "Esqueci a senha" da secretaria: mesmo funcionamento do aluno (PasswordResetService),
 * mas identifica pelo usuário e envia o código para o e-mail cadastrado em "Minha conta".
 * Código de 6 dígitos, uso único, vale 10 minutos, no máximo 5 tentativas.
 */
export const AdminPasswordResetService = {
  /** Sempre responde igual (exista ou não o usuário, tenha ou não e-mail) para não revelar nada. */
  async request(username: string) {
    const admin = await AuthRepository.findAdminByUsername(username);
    if (!admin || !admin.email) {
      await bcrypt.compare('000000', DUMMY_HASH); // gasta um tempo parecido com o caminho real
      return;
    }

    const last = await AuthRepository.findLatestAdminReset(admin.id);
    if (last && Date.now() - last.createdAt.getTime() < RESEND_COOLDOWN_MS) return;

    const code = crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');
    await AuthRepository.replaceAdminReset(admin.id, await bcrypt.hash(code, 10), new Date(Date.now() + CODE_TTL_MS));

    try {
      await MailService.sendResetCode(admin.email, admin.name || 'Secretaria', code);
    } catch (err) {
      // Só a mensagem do erro: nunca o código nem o conteúdo do e-mail.
      logger.error({ err: (err as Error).message }, 'falha ao enviar e-mail de redefinição de senha da secretaria');
    }
  },

  async verify(username: string, code: string) {
    const admin = await AuthRepository.findAdminByUsername(username);
    if (!admin) throw new ValidationError(BAD_CODE);

    const reset = await AuthRepository.findLatestUnusedAdminReset(admin.id);
    if (!reset || reset.expiresAt < new Date() || reset.attempts >= MAX_ATTEMPTS) {
      throw new ValidationError(BAD_CODE);
    }

    if (!(await bcrypt.compare(code, reset.codeHash))) {
      await AuthRepository.incrementAdminResetAttempts(reset.id);
      throw new ValidationError(BAD_CODE);
    }

    await AuthRepository.markAdminResetVerified(reset.id);
    return { resetToken: signAdminResetToken(admin.id, reset.id) };
  },

  /** Regra da senha e confirmação já validadas pelo Zod (adminForgotResetSchema). */
  async reset(resetToken: string, password: string) {
    const { adminId, resetId } = verifyAdminResetToken(resetToken);

    const reset = await AuthRepository.findAdminResetById(resetId);
    if (!reset || reset.adminId !== adminId || !reset.verifiedAt || reset.usedAt || reset.expiresAt < new Date()) {
      throw new UnauthorizedError(EXPIRED);
    }

    const ok = await AuthRepository.resetAdminPasswordWithCode(adminId, resetId, await hashPassword(password));
    if (!ok) throw new UnauthorizedError(EXPIRED); // código já usado por outra requisição
  },
};
