import { Prisma } from '@prisma/client';
import { prisma } from '@/config/database';

export const ScheduleRepository = {
  sessions: (classGroup: string) =>
    prisma.classSession.findMany({ where: { classGroup }, orderBy: [{ date: 'asc' }, { createdAt: 'asc' }] }),
  rounds: (classGroup: string) =>
    prisma.examRound.findMany({
      where: { classGroup },
      orderBy: { roundNumber: 'asc' },
      include: { items: { orderBy: [{ subject: 'asc' }, { componentModule: 'asc' }] } },
    }),
  findRound: (classGroup: string, roundNumber: number) =>
    prisma.examRound.findUnique({
      where: { classGroup_roundNumber: { classGroup, roundNumber } },
      include: { items: true },
    }),
  createSessions: (data: Prisma.ClassSessionCreateManyInput[]) => prisma.classSession.createMany({ data }),
  removeSession: (id: string) => prisma.classSession.delete({ where: { id } }),
  createRound: (data: Prisma.ExamRoundCreateInput) => prisma.examRound.create({ data, include: { items: true } }),
  removeRound: (id: string) => prisma.examRound.delete({ where: { id } }),
};
