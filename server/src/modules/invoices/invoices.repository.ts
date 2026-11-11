import { Prisma } from '@prisma/client';
import { prisma } from '@/config/database';

export const InvoicesRepository = {
  findByStudent(studentId: string) {
    return prisma.invoice.findMany({
      where: { studentId },
      orderBy: [{ dueDate: 'asc' }, { installmentNumber: 'asc' }],
    });
  },
  findById(id: string) {
    return prisma.invoice.findUnique({ where: { id } });
  },
  findByIdWithStudent(id: string) {
    return prisma.invoice.findUnique({ where: { id }, include: { student: true } });
  },
  countInstallments(studentId: string) {
    return prisma.invoice.count({ where: { studentId, kind: 'installment' } });
  },
  createMany(data: Prisma.InvoiceCreateManyInput[]) {
    return prisma.invoice.createMany({ data });
  },
  create(data: Prisma.InvoiceCreateInput) {
    return prisma.invoice.create({ data });
  },
};
