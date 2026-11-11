import { prisma } from '@/config/database';

export const AuthRepository = {
  findAdminByUsername: (username: string) => prisma.admin.findUnique({ where: { username } }),
  findAdminById: (id: string) => prisma.admin.findUnique({ where: { id } }),
  /** Grava a nova senha e incrementa tokenVersion (derruba as sessões antigas). */
  updateAdminPassword: (id: string, passwordHash: string) =>
    prisma.admin.update({
      where: { id },
      data: { passwordHash, tokenVersion: { increment: 1 } },
      select: { id: true, tokenVersion: true },
    }),
  findStudentByEnrollment: (enrollment: string) => prisma.student.findUnique({ where: { enrollment } }),
  findStudentByCpf: (cpf: string) => prisma.student.findUnique({ where: { cpf } }),
};
