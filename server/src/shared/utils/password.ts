import crypto from 'crypto';

/** Política de senha: mínimo 8 caracteres, com letra e número. */
export function passwordPolicyError(password: string): string | null {
  if (password.length < 8) return 'a senha precisa ter no mínimo 8 caracteres';
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return 'a senha precisa ter letras e números';
  return null;
}

/** Senha provisória legível (sem 0/O/1/l/I), ex.: "Kp7x-Mw4q". */
export function generateTempPassword(): string {
  const alphabet = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const pick = (n: number) =>
    Array.from({ length: n }, () => alphabet[crypto.randomInt(alphabet.length)]).join('');
  // garante ao menos uma letra e um número
  return `${pick(3)}${crypto.randomInt(2, 10)}-${pick(4)}`;
}
