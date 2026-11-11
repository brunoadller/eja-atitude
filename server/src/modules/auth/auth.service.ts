import { ForbiddenError } from '@/shared/errors/ForbiddenError';
import { UnauthorizedError } from '@/shared/errors/UnauthorizedError';
import { ValidationError } from '@/shared/errors/ValidationError';
import { DUMMY_HASH, hashPassword, verifyPassword } from '@/shared/utils/hash';
import { signAuthToken } from '@/shared/utils/jwt';
import { AuthRepository } from './auth.repository';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';

const INVALID = 'usuário ou senha inválidos';

export const AuthService = {
  async login({ type, username, password }: LoginDto) {
    if (type === 'admin') {
      const admin = await AuthRepository.findAdminByUsername(username);
      const ok = await verifyPassword(password, admin?.passwordHash ?? DUMMY_HASH);
      if (!admin || !ok) throw new UnauthorizedError(INVALID);
      return {
        token: signAuthToken({ userId: admin.id, role: 'admin', tokenVersion: admin.tokenVersion }),
        type: 'admin' as const,
        name: admin.name,
      };
    }

    const student = await AuthRepository.findStudentByEnrollment(username.toUpperCase());
    const ok = await verifyPassword(password, student?.passwordHash ?? DUMMY_HASH);
    if (!student || !student.passwordHash || !ok) throw new UnauthorizedError(INVALID);
    if (student.status === 'locked') throw new ForbiddenError('matrícula trancada, procure a secretaria');

    return {
      token: signAuthToken({ userId: student.id, role: 'student', tokenVersion: student.tokenVersion }),
      type: 'student' as const,
      name: student.name,
      enrollment: student.enrollment,
    };
  },

  /**
   * Troca a senha da secretaria logada. Regra da senha e confirmação já foram validadas pelo Zod.
   * Devolve um token novo: a sessão atual continua, as outras caem (tokenVersion + 1).
   */
  async changeAdminPassword(adminId: string, { currentPassword, newPassword }: ChangePasswordDto) {
    const admin = await AuthRepository.findAdminById(adminId);
    if (!admin) throw new UnauthorizedError('sessão inválida ou expirada');

    if (!(await verifyPassword(currentPassword, admin.passwordHash))) {
      throw new ValidationError('a senha atual está incorreta');
    }
    if (await verifyPassword(newPassword, admin.passwordHash)) {
      throw new ValidationError('a nova senha precisa ser diferente da atual');
    }

    const updated = await AuthRepository.updateAdminPassword(admin.id, await hashPassword(newPassword));
    return signAuthToken({ userId: updated.id, role: 'admin', tokenVersion: updated.tokenVersion });
  },

  /** Salva o e-mail para onde vai o código de "esqueci a senha" da secretaria. */
  async updateAdminEmail(adminId: string, email: string, currentPassword: string) {
    const admin = await AuthRepository.findAdminById(adminId);
    if (!admin) throw new UnauthorizedError('sessão inválida ou expirada');
    if (!(await verifyPassword(currentPassword, admin.passwordHash))) {
      throw new ValidationError('a senha atual está incorreta');
    }
    return AuthRepository.updateAdminEmail(admin.id, email);
  },
};
