import { z } from 'zod';

const base = {
  studentId: z.string().min(1),
  subject: z.string().min(2, 'Escolha a disciplina'),
  componentModule: z.number({ error: 'Informe o módulo da disciplina' }).int().min(1).max(10),
};

export const registerRegularExamSchema = z.object({
  body: z.strictObject({
    ...base,
    examNumber: z.number({ error: 'Escolha a prova' }).int().min(1).max(7),
    score: z.number({ error: 'Informe a nota' }).min(0, 'Nota mínima 0').max(10, 'Nota máxima 10'),
  }),
});

export const scheduleRecoverySchema = z.object({
  body: z.strictObject({ ...base, scheduledDate: z.coerce.date({ error: 'Informe a data' }) }),
});

export const recordRecoveryScoreSchema = z.object({
  body: z.strictObject({ score: z.number({ error: 'Informe a nota' }).min(0).max(10) }),
});
