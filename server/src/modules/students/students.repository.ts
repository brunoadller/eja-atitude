import { Prisma } from '@prisma/client';
import { prisma } from '@/config/database';
import type { ListStudentsQuery } from './students.schema';

const DAY_MS = 24 * 60 * 60 * 1000;

/** Monta o "where" do Prisma a partir dos filtros da tela (busca por nome, matrícula ou CPF). */
function buildWhere(q: ListStudentsQuery): Prisma.StudentWhereInput {
  const where: Prisma.StudentWhereInput = {};
  if (q.search) {
    const digits = q.search.replace(/\D/g, '');
    where.OR = [
      { name: { contains: q.search, mode: 'insensitive' } },
      { enrollment: { contains: q.search, mode: 'insensitive' } },
      ...(digits ? [{ cpf: { contains: digits } }] : []), // CPF é guardado só com dígitos
    ];
  }
  if (q.status) where.status = q.status;
  if (q.moduleNumber) where.moduleNumber = q.moduleNumber;
  if (q.classGroup) where.classGroup = q.classGroup;
  if (q.enrolledFrom || q.enrolledTo) {
    where.enrollmentDate = {
      ...(q.enrolledFrom && { gte: q.enrolledFrom }),
      // "até" inclui o dia inteiro escolhido
      ...(q.enrolledTo && { lt: new Date(q.enrolledTo.getTime() + DAY_MS) }),
    };
  }
  return where;
}

export const StudentsRepository = {
  /** Uma página de alunos (mais recentes primeiro) + total para a paginação. */
  async search(q: ListStudentsQuery) {
    const where = buildWhere(q);
    const [items, total] = await prisma.$transaction([
      prisma.student.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
      }),
      prisma.student.count({ where }),
    ]);
    return { items, total, page: q.page, pageSize: q.pageSize };
  },
  /** Totais por situação e turmas existentes (Dashboard e filtro de turma). */
  async summary() {
    const [byStatus, groups] = await Promise.all([
      prisma.student.groupBy({ by: ['status'], _count: { _all: true } }),
      prisma.student.groupBy({ by: ['classGroup'], where: { classGroup: { not: null } }, orderBy: { classGroup: 'asc' } }),
    ]);
    return {
      total: byStatus.reduce((sum, r) => sum + r._count._all, 0),
      byStatus: Object.fromEntries(byStatus.map((r) => [r.status, r._count._all])) as Record<string, number>,
      classGroups: groups.map((g) => g.classGroup as string),
    };
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
