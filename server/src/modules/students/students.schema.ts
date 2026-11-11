import { z } from 'zod';
import { isValidCpf, onlyDigits } from '@/shared/utils/cpf';
import { passwordPolicyError } from '@/shared/utils/password';

const text = (label: string, min = 2) =>
  z.string({ error: `${label} é obrigatório` }).trim().min(min, `${label} é obrigatório`);

const cpf = z
  .string({ error: 'CPF é obrigatório' })
  .refine(isValidCpf, 'CPF inválido')
  .transform(onlyDigits);

const phone = z
  .string({ error: 'Telefone é obrigatório' })
  .transform(onlyDigits)
  .refine((v) => v.length === 10 || v.length === 11, 'Telefone inválido (DDD + número)');

const zip = z
  .string({ error: 'CEP é obrigatório' })
  .transform(onlyDigits)
  .refine((v) => v.length === 8, 'CEP inválido (8 dígitos)');

const birthDate = z.coerce
  .date({ error: 'Data de nascimento é obrigatória' })
  .refine((d) => d < new Date(), 'Data de nascimento no futuro')
  .refine((d) => d.getUTCFullYear() > 1900, 'Data de nascimento inválida');

const personalFields = {
  name: text('Nome completo', 5).refine((v) => v.split(/\s+/).length >= 2, 'informe nome e sobrenome'),
  cpf,
  rg: text('RG', 5),
  birthDate,
  birthplace: text('Naturalidade', 3),
  nationality: text('Nacionalidade', 3).default('Brasileiro'),
  gender: z.enum(['Masculino', 'Feminino', 'Outro'], { error: 'Gênero é obrigatório' }),
  email: z.string({ error: 'E-mail é obrigatório' }).trim().toLowerCase().pipe(z.email('E-mail inválido')),
  phone,
  address: text('Endereço', 5),
  city: text('Cidade', 2),
  state: z.string({ error: 'Estado (UF) é obrigatório' }).trim().toUpperCase().length(2, 'UF com 2 letras'),
  zipCode: zip,
  motherName: text('Nome da mãe', 5),
  // se não houver pai declarado, a secretaria digita "Não declarado"
  fatherName: text('Nome do pai', 3),
  educationLevel: text('Nível escolar', 2),
  priorStudies: z.string().trim().optional(),
};

export const createStudentSchema = z.object({
  body: z.strictObject({
    ...personalFields,
    moduleNumber: z.union([z.literal(1), z.literal(2)], { error: 'Escolha o módulo (1 ou 2)' }),
    enrollmentDate: z.coerce.date().optional(),
    monthlyFee: z.number({ error: 'Informe o valor da parcela' }).positive('Valor da parcela inválido').max(100000),
    installments: z.number({ error: 'Informe o número de parcelas' }).int().min(1, 'mínimo 1 parcela').max(24, 'máximo 24 parcelas'),
    firstDueDate: z.coerce.date({ error: 'Informe o primeiro vencimento' }),
    // opcional: se vazio, o sistema gera uma senha provisória
    password: z
      .string()
      .optional()
      .refine((v) => !v || !passwordPolicyError(v), 'a senha precisa ter 8+ caracteres, com letras e números'),
  }),
});

export const updateStudentSchema = z.object({
  body: z
    .strictObject({
      ...personalFields,
      status: z.enum(['pending', 'active', 'completed', 'locked']),
    })
    .partial(),
});

export const advanceModuleSchema = z.object({
  body: z.strictObject({
    monthlyFee: z.number().positive('Valor da parcela inválido').max(100000),
    installments: z.number().int().min(1).max(24),
    firstDueDate: z.coerce.date({ error: 'Informe o primeiro vencimento' }),
  }),
});
