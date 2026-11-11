import { ForbiddenError } from '@/shared/errors/ForbiddenError';
import { UnauthorizedError } from '@/shared/errors/UnauthorizedError';
import { DUMMY_HASH, verifyPassword } from '@/shared/utils/hash';
import { signAuthToken } from '@/shared/utils/jwt';
import { AuthRepository } from './auth.repository';
import { LoginDto } from './dto/login.dto';

const INVALID = 'usuário ou senha inválidos';

export const AuthService = {
  async login({ type, username, password }: LoginDto) {
    if (type === 'admin') {
      const admin = await AuthRepository.findAdminByUsername(username);
      const ok = await verifyPassword(password, admin?.passwordHash ?? DUMMY_HASH);
      if (!admin || !ok) throw new UnauthorizedError(INVALID);
      return { token: signAuthToken({ userId: admin.id, role: 'admin' }), type: 'admin' as const, name: admin.name };
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
};
