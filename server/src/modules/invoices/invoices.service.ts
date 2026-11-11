import { prisma } from '@/config/database';
import { ConflictError } from '@/shared/errors/ConflictError';
import { ForbiddenError } from '@/shared/errors/ForbiddenError';
import { NotFoundError } from '@/shared/errors/NotFoundError';
import { ValidationError } from '@/shared/errors/ValidationError';
import { Session } from '@/shared/types/session';
import { buildInstallments } from './installments';
import { InvoicesRepository } from './invoices.repository';

export const InvoicesService = {
  async listByStudent(studentId: string, session: Session) {
    if (session.type === 'student' && session.userId !== studentId) throw new ForbiddenError('acesso negado');
    return InvoicesRepository.findByStudent(studentId);
  },

  /** Para alunos antigos (cadastrados antes das parcelas existirem). */
  async createInstallments(studentId: string, amount: number, count: number, firstDueDate: Date) {
    const student = await prisma.student.findUnique({ where: { id: studentId }, select: { id: true } });
    if (!student) throw new NotFoundError('aluno não encontrado');
    if ((await InvoicesRepository.countInstallments(studentId)) > 0) {
      throw new ConflictError('este aluno já possui parcelas geradas');
    }
    await InvoicesRepository.createMany(buildInstallments(studentId, amount, count, firstDueDate));
    await prisma.student.update({ where: { id: studentId }, data: { monthlyFee: amount } });
    return InvoicesRepository.findByStudent(studentId);
  },

  async markAsPaid(id: string) {
    const invoice = await InvoicesRepository.findById(id);
    if (!invoice) throw new NotFoundError('boleto não encontrado');
    if (invoice.status === 'paid') return invoice;

    return prisma.$transaction(async (tx) => {
      const paid = await tx.invoice.update({ where: { id }, data: { status: 'paid', paidAt: new Date() } });
      // taxa de 2ª via paga -> libera o documento para o aluno baixar
      await tx.documentRequest.updateMany({
        where: { invoiceId: id, status: 'awaiting_payment' },
        data: { status: 'ready' },
      });
      return paid;
    });
  },

  /** Corrige um "marcar pago" feito por engano. */
  async markAsOpen(id: string) {
    const invoice = await InvoicesRepository.findById(id);
    if (!invoice) throw new NotFoundError('boleto não encontrado');
    const issued = await prisma.documentRequest.count({ where: { invoiceId: id, status: 'issued' } });
    if (issued) throw new ValidationError('a taxa já liberou um documento emitido, não é possível reabrir');

    return prisma.$transaction(async (tx) => {
      await tx.documentRequest.updateMany({
        where: { invoiceId: id, status: 'ready' },
        data: { status: 'awaiting_payment' },
      });
      return tx.invoice.update({ where: { id }, data: { status: 'open', paidAt: null } });
    });
  },
};
