import { Prisma } from '@prisma/client';
import { prisma } from '@/config/database';

export const StudentsRepository = {
  findAll() {
    return prisma.student.findMany({ orderBy: { createdAt: 'desc' } });
  },
  findById(id: string) {
    return prisma.student.findUnique({ where: { id } });
  },
  findByCpf(cpf: string) {
    return prisma.student.findUnique({ where: { cpf } });
  },
  update(id: string, data: Prisma.StudentUpdateInput) {
    return prisma.student.update({ where: { id }, data });
  },
  remove(id: string) {
    return prisma.student.delete({ where: { id } }); // onDelete: Cascade cuida de notas/boletos/documentos
  },
  /** Cria o aluno e as parcelas na mesma transação (ou tudo, ou nada). */
  createWithInstallments(
    student: Prisma.StudentCreateInput,
    buildInvoices: (studentId: string) => Prisma.InvoiceCreateManyInput[],
  ) {
    return prisma.$transaction(async (tx) => {
      const created = await tx.student.create({ data: student });
      await tx.invoice.createMany({ data: buildInvoices(created.id) });
      return created;
    });
  },
};
