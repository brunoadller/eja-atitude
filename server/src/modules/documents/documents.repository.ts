import { prisma } from '@/config/database';
import { Prisma } from '@prisma/client';

export const DocumentsRepository = {
  findByStudent(studentId: string) {
    return prisma.studentDocument.findMany({ where: { studentId }, orderBy: { uploadedAt: 'desc' } });
  },
  findByStudentAndType(studentId: string, type: string) {
    return prisma.studentDocument.findMany({ where: { studentId, type } });
  },
  deleteByStudentAndType(studentId: string, type: string) {
    return prisma.studentDocument.deleteMany({ where: { studentId, type } });
  },
  create(data: Prisma.StudentDocumentCreateInput) {
    return prisma.studentDocument.create({ data });
  },
  updateStatus(id: string, status: string, note?: string) {
    return prisma.studentDocument.update({ where: { id }, data: { status, note, reviewedAt: new Date() } });
  },
};
