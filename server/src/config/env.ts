import 'dotenv/config';
import { z } from 'zod';

const bool = (def: 'true' | 'false') =>
  z.enum(['true', 'false']).default(def).transform((v) => v === 'true');

const envSchema = z
  .object({
    PORT: z.coerce.number().default(3000),
    DATABASE_URL: z.string().min(1),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    CLIENT_ORIGIN: z.string().default('http://localhost:5173'),
    TRUST_PROXY: z.coerce.number().int().min(0).default(0),

    JWT_SECRET: z.string().min(32, 'JWT_SECRET precisa ter no mínimo 32 caracteres'),
    JWT_EXPIRES_IN: z.string().default('8h'),

    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.coerce.number().default(587),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),
    MAIL_FROM: z.string().default('EJA Atitude <nao-responder@localhost>'),

    FIRST_VIA_FREE: bool('true'),
    ENFORCE_PAYMENT_FOR_EXAMS: bool('true'),
  })
  .superRefine((v, ctx) => {
    if (v.NODE_ENV === 'production' && !v.SMTP_HOST) {
      ctx.addIssue({
        code: 'custom',
        path: ['SMTP_HOST'],
        message: 'SMTP_HOST é obrigatório em produção (recuperação de senha por e-mail)',
      });
    }
  });

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('Variáveis de ambiente inválidas:');
  for (const i of parsed.error.issues) console.error(` - ${i.path.join('.')}: ${i.message}`);
  process.exit(1);
}

export const env = parsed.data;
