import { prisma } from '@/config/database';
import { env } from '@/config/env';
import { FEES, PASSING_SCORE, RECOVERY_FEE_FROM_ATTEMPT } from '@/shared/constants/fees';
import { ConflictError } from '@/shared/errors/ConflictError';
import { ForbiddenError } from '@/shared/errors/ForbiddenError';
import { NotFoundError } from '@/shared/errors/NotFoundError';
import { ValidationError } from '@/shared/errors/ValidationError';
import { Session } from '@/shared/types/session';
import { endOfMonthUTC, fmtDate } from '@/shared/utils/dates';
import { ScheduleService } from '@/modules/schedule/schedule.service';
import { syncCompletedStatus } from './completion.service';
import { GradesRepository } from './grades.repository';

/** Regra das orientações: para realizar provas o aluno precisa estar em dia com a mensalidade do mês corrente. */
async function assertUpToDateForExams(studentId: string) {
  if (!env.ENFORCE_PAYMENT_FOR_EXAMS) return;
  const overdue = await prisma.invoice.findFirst({
    where: { studentId, kind: 'installment', status: { not: 'paid' }, dueDate: { lte: endOfMonthUTC(new Date()) } },
    orderBy: { dueDate: 'asc' },
  });
  if (overdue) {
    throw new ValidationError(
      `aluno com mensalidade em aberto (parcela ${overdue.installmentNumber}, venc. ${fmtDate(overdue.dueDate)}). ` +
        'Regularize o pagamento para realizar a prova.',
    );
  }
}

export const GradesService = {
  async listByStudent(studentId: string, session: Session) {
    if (session.type === 'student' && session.userId !== studentId) throw new ForbiddenError('acesso negado');
    return GradesRepository.findByStudent(studentId);
  },

  async registerRegularExam(studentId: string, examNumber: number, subject: string, componentModule: number, score: number) {
    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student) throw new NotFoundError('aluno não encontrado');
    if (!student.classGroup) throw new ValidationError('aluno sem turma definida');
    if (student.status === 'pending') throw new ValidationError('o aluno ainda não aceitou o contrato');

    await ScheduleService.validateItemInRound(student.classGroup, examNumber, subject, componentModule);
    if ((await GradesRepository.findAttempts(studentId, subject, componentModule)).length) {
      throw new ConflictError('já existe nota lançada para esta disciplina/módulo; remova o lançamento para corrigir');
    }
    await assertUpToDateForExams(studentId);

    const created = await GradesRepository.create({
      subject,
      componentModule,
      examNumber,
      attempt: 1,
      score,
      year: (student.enrollmentDate ?? new Date()).getUTCFullYear(),
      student: { connect: { id: studentId } },
    });
    await syncCompletedStatus(studentId); // notas + documentos em dia → Concluído
    return created;
  },

  /** Agenda a recuperação; da 2ª recuperação em diante gera a taxa (R$ 30) como boleto avulso. */
  async scheduleRecovery(studentId: string, subject: string, componentModule: number, scheduledDate: Date) {
    const attempts = await GradesRepository.findAttempts(studentId, subject, componentModule);
    if (!attempts.length) throw new ValidationError('lance a prova regular antes de agendar a recuperação');

    const last = attempts[attempts.length - 1];
    if (last.score === null) throw new ValidationError('a recuperação anterior ainda está sem nota');
    if (attempts.some((a) => a.score !== null && Number(a.score) >= PASSING_SCORE)) {
      throw new ValidationError('o aluno já está aprovado nesta disciplina');
    }
    await assertUpToDateForExams(studentId);

    const nextAttempt = attempts.length + 1;
    const hasFee = nextAttempt >= RECOVERY_FEE_FROM_ATTEMPT;

    return prisma.$transaction(async (tx) => {
      let feeInvoiceId: string | undefined;
      if (hasFee) {
        const inv = await tx.invoice.create({
          data: {
            studentId, kind: 'fee', amount: FEES.recovery, dueDate: scheduledDate, status: 'open',
            reference: `Taxa de recuperação — ${subject} (M${componentModule})`,
          },
        });
        feeInvoiceId = inv.id;
      }
      return tx.grade.create({
        data: {
          studentId, subject, componentModule, examNumber: last.examNumber, attempt: nextAttempt,
          scheduledDate, feeCharged: hasFee, feeInvoiceId, year: last.year,
        },
      });
    });
  },

  async recordRecoveryScore(gradeId: string, score: number) {
    const grade = await GradesRepository.findById(gradeId);
    if (!grade) throw new NotFoundError('lançamento não encontrado');
    if (grade.attempt < 2) throw new ValidationError('use "lançar prova" para a prova regular');
    const updated = await GradesRepository.updateScore(gradeId, score);
    await syncCompletedStatus(grade.studentId); // notas + documentos em dia → Concluído
    return updated;
  },

  remove: (id: string) => GradesRepository.remove(id),
};
