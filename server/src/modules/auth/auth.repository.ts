import { prisma } from '@/config/database';

export const AuthRepository = {
  findAdminByUsername: (username: string) => prisma.admin.findUnique({ where: { username } }),
  findStudentByEnrollment: (enrollment: string) => prisma.student.findUnique({ where: { enrollment } }),
  findStudentByCpf: (cpf: string) => prisma.student.findUnique({ where: { cpf } }),
};
