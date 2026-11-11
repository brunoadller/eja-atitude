import { prisma } from '@/config/database';
import { classGroupFor, ModuleNumber } from '@/shared/constants/curriculum';
import { PASSING_SCORE } from '@/shared/constants/fees';
import { NotFoundError } from '@/shared/errors/NotFoundError';
import { fmtDate } from '@/shared/utils/dates';

export interface RequiredItem {
  subject: string;
  componentModule: number | null;
  roundNumber: number;
  finalScore: number | null;
  state: 'passed' | 'failed' | 'missing';
}

export interface Completion {
  eligible: boolean;
  reasons: string[];
  required: RequiredItem[];
  /** disciplina -> módulo -> melhor nota (para o histórico) */
  matrix: Record<string, Record<number, number>>;
}

/**
 * Regras do certificado (arquivo de orientações):
 *  - nota mínima 5,0 em CADA disciplina/módulo das provas do aluno (a recuperação conta; se ela ainda está pendente, continua bloqueado)
 *  - todas as provas concluídas
 *  - todas as parcelas quitadas
 */
export async function evaluateCompletion(studentId: string): Promise<Completion> {
  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) throw new NotFoundError('aluno não encontrado');

  const year = (student.enrollmentDate ?? new Date()).getUTCFullYear();
  const groups: string[] = [];
  for (let m = student.startModuleNumber; m <= student.moduleNumber; m++) groups.push(classGroupFor(year, m as ModuleNumber));

  const [rounds, grades, openInstallments] = await Promise.all([
    prisma.examRound.findMany({ where: { classGroup: { in: groups } }, include: { items: true }, orderBy: { roundNumber: 'asc' } }),
    prisma.grade.findMany({ where: { studentId } }),
    prisma.invoice.findMany({ where: { studentId, kind: 'installment', status: { not: 'paid' } }, orderBy: { dueDate: 'asc' } }),
  ]);

  const bestScore = (subject: string, m: number | null): number | null => {
    const scores = grades
      .filter((g) => g.subject === subject && g.componentModule === m && g.score !== null)
      .map((g) => Number(g.score));
    return scores.length ? Math.max(...scores) : null;
  };

  const required: RequiredItem[] = rounds.flatMap((r) =>
    r.items.map((i) => {
      const finalScore = bestScore(i.subject, i.componentModule);
      const state: RequiredItem['state'] =
        finalScore === null ? 'missing' : finalScore >= PASSING_SCORE ? 'passed' : 'failed';
      return { subject: i.subject, componentModule: i.componentModule, roundNumber: r.roundNumber, finalScore, state };
    }),
  );

  const reasons: string[] = [];
  if (!rounds.length) reasons.push('o cronograma de provas ainda não foi cadastrado');
  const label = (i: RequiredItem) => `${i.subject}${i.componentModule ? ` (módulo ${i.componentModule})` : ''}`;
  for (const i of required.filter((x) => x.state === 'missing')) reasons.push(`prova pendente: ${label(i)} — prova ${i.roundNumber}`);
  for (const i of required.filter((x) => x.state === 'failed')) {
    reasons.push(`média abaixo de ${PASSING_SCORE.toFixed(1).replace('.', ',')} em ${label(i)} — recuperação necessária`);
  }
  if (openInstallments.length) {
    reasons.push(`${openInstallments.length} parcela(s) em aberto (próxima: ${fmtDate(openInstallments[0].dueDate)})`);
  }

  const matrix: Completion['matrix'] = {};
  for (const g of grades) {
    if (g.score === null || g.componentModule === null) continue;
    const row = (matrix[g.subject] ??= {});
    row[g.componentModule] = Math.max(row[g.componentModule] ?? 0, Number(g.score));
  }

  return { eligible: reasons.length === 0, reasons, required, matrix };
}
