import { Prisma } from '@prisma/client';
import { prisma } from '@/config/database';

export const GradesRepository = {
  findByStudent(studentId: string) {
    return prisma.grade.findMany({
      where: { studentId },
      orderBy: [{ examNumber: 'asc' }, { subject: 'asc' }, { attempt: 'asc' }],
    });
  },
  findAttempts(studentId: string, subject: string, componentModule: number) {
    return prisma.grade.findMany({ where: { studentId, subject, componentModule }, orderBy: { attempt: 'asc' } });
  },
  findById(id: string) {
    return prisma.grade.findUnique({ where: { id } });
  },
  create(data: Prisma.GradeCreateInput) {
    return prisma.grade.create({ data });
  },
  updateScore(id: string, score: number) {
    return prisma.grade.update({ where: { id }, data: { score } });
  },
  remove(id: string) {
    return prisma.grade.delete({ where: { id } });
  },
};
