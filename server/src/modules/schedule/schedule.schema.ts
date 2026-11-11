import { z } from 'zod';

const moduleNumber = z.union([z.literal(1), z.literal(2)], { error: 'Escolha o módulo' });
const year = z.number().int().min(2024).max(2100);
const item = z.strictObject({
  subject: z.string().min(2, 'Escolha a disciplina'),
  componentModule: z.number({ error: 'Informe o módulo da disciplina' }).int().min(1).max(10),
});

export const groupQuerySchema = z.object({
  query: z.object({
    module: z.coerce.number().pipe(moduleNumber),
    year: z.coerce.number().pipe(year),
  }),
});

export const addClassDaySchema = z.object({
  body: z.strictObject({
    moduleNumber,
    year,
    date: z.coerce.date({ error: 'Informe a data' }),
    items: z.array(item).min(1, 'Adicione ao menos uma disciplina').max(8),
  }),
});

export const addExamRoundSchema = z.object({
  body: z.strictObject({
    moduleNumber,
    year,
    roundNumber: z.number({ error: 'Escolha o número da prova' }).int().min(1).max(7),
    examDate: z.coerce.date({ error: 'Informe a data da prova' }),
    // vazio = usa as disciplinas das aulas desde a prova anterior
    items: z.array(item).max(30).optional(),
  }),
});

export const importTemplateSchema = z.object({
  body: z.strictObject({ moduleNumber, year }),
});
