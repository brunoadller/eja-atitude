import { prisma } from '@/config/database';
import { logger } from '@/config/logger';
import { classGroupFor, ModuleNumber } from '@/shared/constants/curriculum';
import { DOCUMENT_TYPE_LABELS, REQUIRED_DOCUMENT_TYPES } from '@/shared/constants/document-types';
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

/** Uma das três condições do certificado: cumprida (ok) ou a lista do que falta, em português. */
export interface CompletionCheck {
  ok: boolean;
  missing: string[];
}

export interface DocumentsCheck extends CompletionCheck {
  approved: number;
  total: number;
}

export interface Completion {
  /** true só quando as três condições estão cumpridas ao mesmo tempo. */
  eligible: boolean;
  /** Tudo o que falta, numa lista só (mesmo conteúdo de checks). */
  reasons: string[];
  checks: {
    grades: CompletionCheck;
    installments: CompletionCheck;
    documents: DocumentsCheck;
  };
  required: RequiredItem[];
  /** disciplina -> módulo -> melhor nota (para o histórico) */
  matrix: Record<string, Record<number, number>>;
}

/**
 * Regras do certificado (certificado = diploma). Só pode solicitar com as TRÊS cumpridas:
 *  (a) notas: nota mínima 5,0 em CADA disciplina/módulo das provas do aluno, todas concluídas
 *      (a recuperação conta; se ela ainda está pendente, continua bloqueado)
 *  (b) parcelas: todas quitadas
 *  (c) documentos: todos os obrigatórios (REQUIRED_DOCUMENT_TYPES) aprovados pela secretaria
 */
export async function evaluateCompletion(studentId: string): Promise<Completion> {
  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) throw new NotFoundError('aluno não encontrado');

  const year = (student.enrollmentDate ?? new Date()).getUTCFullYear();
  const groups: string[] = [];
  for (let m = student.startModuleNumber; m <= student.moduleNumber; m++) groups.push(classGroupFor(year, m as ModuleNumber));

  const [rounds, grades, openInstallments, documents] = await Promise.all([
    prisma.examRound.findMany({ where: { classGroup: { in: groups } }, include: { items: true }, orderBy: { roundNumber: 'asc' } }),
    prisma.grade.findMany({ where: { studentId } }),
    prisma.invoice.findMany({ where: { studentId, kind: 'installment', status: { not: 'paid' } }, orderBy: { dueDate: 'asc' } }),
    prisma.studentDocument.findMany({
      where: { studentId, type: { in: [...REQUIRED_DOCUMENT_TYPES] } },
      select: { type: true, status: true },
    }),
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

  // (a) notas
  const gradesMissing: string[] = [];
  if (!rounds.length) gradesMissing.push('o cronograma de provas ainda não foi cadastrado');
  const label = (i: RequiredItem) => `${i.subject}${i.componentModule ? ` (módulo ${i.componentModule})` : ''}`;
  for (const i of required.filter((x) => x.state === 'missing')) gradesMissing.push(`prova pendente: ${label(i)} — prova ${i.roundNumber}`);
  for (const i of required.filter((x) => x.state === 'failed')) {
    gradesMissing.push(`média abaixo de ${PASSING_SCORE.toFixed(1).replace('.', ',')} em ${label(i)} — recuperação necessária`);
  }

  // (b) parcelas
  const installmentsMissing: string[] = [];
  if (openInstallments.length) {
    installmentsMissing.push(`${openInstallments.length} parcela(s) em aberto (próxima: ${fmtDate(openInstallments[0].dueDate)})`);
  }

  // (c) documentos obrigatórios aprovados
  const documentsMissing: string[] = [];
  for (const type of REQUIRED_DOCUMENT_TYPES) {
    const doc = documents.find((d) => d.type === type);
    const name = DOCUMENT_TYPE_LABELS[type];
    if (!doc) documentsMissing.push(`${name}: não enviado`);
    else if (doc.status === 'pending') documentsMissing.push(`${name}: em análise pela secretaria`);
    else if (doc.status === 'rejected') documentsMissing.push(`${name}: recusado — reenvie`);
  }
  const approvedDocs = REQUIRED_DOCUMENT_TYPES.length - documentsMissing.length;

  const checks: Completion['checks'] = {
    grades: { ok: gradesMissing.length === 0, missing: gradesMissing },
    installments: { ok: installmentsMissing.length === 0, missing: installmentsMissing },
    documents: {
      ok: documentsMissing.length === 0,
      missing: documentsMissing,
      approved: approvedDocs,
      total: REQUIRED_DOCUMENT_TYPES.length,
    },
  };
  const reasons = [...gradesMissing, ...installmentsMissing, ...documentsMissing];

  const matrix: Completion['matrix'] = {};
  for (const g of grades) {
    if (g.score === null || g.componentModule === null) continue;
    const row = (matrix[g.subject] ??= {});
    row[g.componentModule] = Math.max(row[g.componentModule] ?? 0, Number(g.score));
  }

  return { eligible: reasons.length === 0, reasons, checks, required, matrix };
}

/**
 * "Concluído" automático: com NOTAS e DOCUMENTOS em dia, o aluno Ativo vira Concluído.
 * (As parcelas não contam aqui: elas só bloqueiam a solicitação do certificado.)
 *  - só sobe: nunca volta para Ativo sozinho (a secretaria ajusta no cadastro, se precisar);
 *  - não mexe em Trancado nem em Aguardando contrato;
 *  - nunca faz a ação principal falhar (lançar nota, aprovar documento): erro só vai para o log.
 */
export async function syncCompletedStatus(studentId: string, completion?: Completion): Promise<void> {
  try {
    const c = completion ?? (await evaluateCompletion(studentId));
    if (!c.checks.grades.ok || !c.checks.documents.ok) return;
    // o "where status: active" garante que só Ativo muda (atômico, sem ler antes)
    await prisma.student.updateMany({ where: { id: studentId, status: 'active' }, data: { status: 'completed' } });
  } catch (err) {
    logger.error({ err: (err as Error).message, studentId }, 'falha ao atualizar o aluno para concluído');
  }
}

/** Mensagem de erro em português dizendo qual condição falta (usada quando o servidor recusa o certificado). */
export function completionBlockMessage(c: Completion): string {
  const parts: string[] = [];
  if (!c.checks.grades.ok) parts.push(`notas — ${c.checks.grades.missing.join('; ')}`);
  if (!c.checks.installments.ok) parts.push(`parcelas — ${c.checks.installments.missing.join('; ')}`);
  if (!c.checks.documents.ok) parts.push(`documentos — ${c.checks.documents.missing.join('; ')}`);
  return `certificado ainda não liberado. Falta: ${parts.join(' | ')}`;
}
