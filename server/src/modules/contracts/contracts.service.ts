import { Request } from 'express';
import { prisma } from '@/config/database';
import { getClientIp } from '@/shared/utils/request-ip';
import { CONTRACT_TEXT, CONTRACT_VERSION } from './contract.constants';

export const ContractsService = {
  getCurrent: () => ({ version: CONTRACT_VERSION, text: CONTRACT_TEXT }),

  /** Registra o aceite e ATIVA o aluno (pending -> active). */
  async accept(studentId: string, req: Request) {
    const student = await prisma.student.findUniqueOrThrow({ where: { id: studentId }, select: { status: true } });
    return prisma.student.update({
      where: { id: studentId },
      data: {
        contractAccepted: true,
        contractAcceptedAt: new Date(),
        contractVersion: CONTRACT_VERSION,
        contractIp: getClientIp(req),
        status: student.status === 'pending' ? 'active' : student.status,
      },
    });
  },
};
