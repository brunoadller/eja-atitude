import { z } from 'zod';

export const loginSchema = z.object({
  body: z.strictObject({
    type: z.enum(['admin', 'student']),
    username: z.string().trim().min(1, 'informe o usuário'),
    password: z.string().min(1, 'informe a senha'),
  }),
});

const cpf = z.string().transform((v) => v.replace(/\D/g, '')).refine((v) => v.length === 11, 'CPF inválido');

export const forgotRequestSchema = z.object({ body: z.strictObject({ cpf }) });

export const forgotVerifySchema = z.object({
  body: z.strictObject({ cpf, code: z.string().regex(/^\d{6}$/, 'o código tem 6 dígitos') }),
});

export const forgotResetSchema = z.object({
  body: z.strictObject({
    resetToken: z.string().min(10),
    password: z.string().min(1, 'informe a nova senha'),
    passwordConfirm: z.string().min(1, 'repita a nova senha'),
  }),
});
