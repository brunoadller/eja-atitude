import { prisma } from '@/config/database';
import { Prisma } from '@prisma/client';

// Para a secretaria: inclui nome/usuário de quem anexou e de quem analisou.
const withAdmins = {
  uploadedByAdmin: { select: { name: true, username: true } },
  reviewedByAdmin: { select: { name: true, username: true } },
} satisfies Prisma.StudentDocumentInclude;

type NewDocument = Omit<Prisma.StudentDocumentUncheckedCreateInput, 'studentId' | 'type'>;

export const DocumentsRepository = {
  findByStudent(studentId: string) {
    return prisma.studentDocument.findMany({ where: { studentId }, orderBy: { uploadedAt: 'desc' } });
  },
  findByStudentWithAdmins(studentId: string) {
    return prisma.studentDocument.findMany({ where: { studentId }, include: withAdmins, orderBy: { uploadedAt: 'desc' } });
  },
  findCurrent(studentId: string, type: string) {
    return prisma.studentDocument.findFirst({ where: { studentId, type }, orderBy: { uploadedAt: 'desc' } });
  },
  findById(id: string) {
    return prisma.studentDocument.findUnique({ where: { id } });
  },
  findByIdWithAdmins(id: string) {
    return prisma.studentDocument.findUniqueOrThrow({ where: { id }, include: withAdmins });
  },
  studentExists(studentId: string) {
    return prisma.student.count({ where: { id: studentId } }).then((n) => n > 0);
  },

  /**
   * Um documento atual por tipo: apaga o registro anterior e cria o novo na mesma transação.
   * Devolve os nomes dos arquivos antigos para o service apagar do disco DEPOIS que o banco deu certo.
   */
  replaceCurrent(studentId: string, type: string, data: NewDocument) {
    return prisma.$transaction(async (tx) => {
      const old = await tx.studentDocument.findMany({ where: { studentId, type }, select: { fileName: true } });
      await tx.studentDocument.deleteMany({ where: { studentId, type } });
      const created = await tx.studentDocument.create({ data: { ...data, studentId, type } });
      return { created, oldFileNames: old.map((o) => o.fileName) };
    });
  },

  review(id: string, status: 'approved' | 'rejected', note: string | null, adminId: string) {
    return prisma.studentDocument.update({
      where: { id },
      data: { status, note, reviewedByAdminId: adminId, reviewedAt: new Date() },
      include: withAdmins,
    });
  },
};

export type DocumentWithAdmins = Prisma.StudentDocumentGetPayload<{ include: typeof withAdmins }>;
