import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// Hash descartável usado para gastar o mesmo tempo quando o usuário não existe (evita descobrir matrículas por tempo de resposta).
export const DUMMY_HASH = bcrypt.hashSync('dummy-password-for-timing', SALT_ROUNDS);
