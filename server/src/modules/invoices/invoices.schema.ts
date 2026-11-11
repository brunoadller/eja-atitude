import { z } from 'zod';

export const createInstallmentsSchema = z.object({
  body: z.strictObject({
    studentId: z.string().min(1),
    amount: z.number().positive('Valor da parcela inválido').max(100000),
    installments: z.number().int().min(1).max(24),
    firstDueDate: z.coerce.date({ error: 'Informe o primeiro vencimento' }),
  }),
});
