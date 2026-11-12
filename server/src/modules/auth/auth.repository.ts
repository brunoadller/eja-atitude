import { prisma } from '@/config/database';

export const AuthRepository = {
  findAdminByUsername: (username: string) => prisma.admin.findUnique({ where: { username } }),
  findAdminById: (id: string) => prisma.admin.findUnique({ where: { id } }),
  // ===== códigos de "esqueci a senha" da secretaria =====
  findLatestAdminReset: (adminId: string) =>
    prisma.adminPasswordReset.findFirst({ where: { adminId }, orderBy: { createdAt: 'desc' } }),
  findLatestUnusedAdminReset: (adminId: string) =>
    prisma.adminPasswordReset.findFirst({ where: { adminId, usedAt: null }, orderBy: { createdAt: 'desc' } }),
  findAdminResetById: (id: string) => prisma.adminPasswordReset.findUnique({ where: { id } }),
  /** Apaga códigos antigos e cria um novo (só um código válido por vez). */
  replaceAdminReset: (adminId: string, codeHash: string, expiresAt: Date) =>
    prisma.$transaction([
      prisma.adminPasswordReset.deleteMany({ where: { adminId } }),
      prisma.adminPasswordReset.create({ data: { adminId, codeHash, expiresAt } }),
    ]),
  incrementAdminResetAttempts: (id: string) =>
    prisma.adminPasswordReset.update({ where: { id }, data: { attempts: { increment: 1 } } }),
  markAdminResetVerified: (id: string) =>
    prisma.adminPasswordReset.update({ where: { id }, data: { verifiedAt: new Date() } }),
  /**
   * Marca o código como usado (só se ainda não foi), grava a senha, derruba as sessões e apaga os códigos.
   * Tudo numa transação: se o código já tiver sido usado, nada é gravado.
   */
  resetAdminPasswordWithCode: (adminId: string, resetId: string, passwordHash: string) =>
    prisma.$transaction(async (tx) => {
      const used = await tx.adminPasswordReset.updateMany({
        where: { id: resetId, adminId, usedAt: null },
        data: { usedAt: new Date() },
      });
      if (used.count !== 1) return false;
      await tx.admin.update({ where: { id: adminId }, data: { passwordHash, tokenVersion: { increment: 1 } } });
      await tx.adminPasswordReset.deleteMany({ where: { adminId } });
      return true;
    }),

  updateAdminEmail: (id: string, email: string) =>
    prisma.admin.update({ where: { id }, data: { email }, select: { email: true } }),
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
