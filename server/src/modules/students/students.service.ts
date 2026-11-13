import { Prisma } from '@prisma/client';
import { prisma } from '@/config/database';
import { classGroupFor, ModuleNumber } from '@/shared/constants/curriculum';
import { ConflictError } from '@/shared/errors/ConflictError';
import { ForbiddenError } from '@/shared/errors/ForbiddenError';
import { NotFoundError } from '@/shared/errors/NotFoundError';
import { ValidationError } from '@/shared/errors/ValidationError';
import { Session } from '@/shared/types/session';
import { generateEnrollment } from '@/shared/utils/enrollment';
import { hashPassword } from '@/shared/utils/hash';
import { generateTempPassword } from '@/shared/utils/password';
import { buildInstallments } from '@/modules/invoices/installments';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { StudentsRepository } from './students.repository';
import type { ListStudentsQuery } from './students.schema';

function isUniqueViolation(err: unknown, field: string): boolean {
  return (
    err instanceof Prisma.PrismaClientKnownRequestError &&
    err.code === 'P2002' &&
    String(err.meta?.target ?? '').includes(field)
  );
}

export const StudentsService = {
  list: (query: ListStudentsQuery) => StudentsRepository.search(query),
  summary: () => StudentsRepository.summary(),

  /** Aluno só enxerga a própria ficha; a secretaria enxerga todas. */
  async getById(id: string, session: Session) {
    if (session.type === 'student' && session.userId !== id) throw new ForbiddenError('acesso negado');
    const student = await StudentsRepository.findById(id);
    if (!student) throw new NotFoundError('aluno não encontrado');
    return student;
  },

  async create(dto: CreateStudentDto) {
    if (await StudentsRepository.findByCpf(dto.cpf)) throw new ConflictError('CPF já cadastrado');

    const enrollmentDate = dto.enrollmentDate ?? new Date();
    const year = enrollmentDate.getUTCFullYear();
    const moduleNumber = dto.moduleNumber as ModuleNumber;
    const temporaryPassword = dto.password ? undefined : generateTempPassword();
    const passwordHash = await hashPassword(dto.password ?? temporaryPassword!);

    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        const student = await StudentsRepository.createWithInstallments(
          {
            enrollment: generateEnrollment(year),
            name: dto.name,
            cpf: dto.cpf,
            rg: dto.rg,
            birthDate: dto.birthDate,
            birthplace: dto.birthplace,
            nationality: dto.nationality,
            gender: dto.gender,
            email: dto.email,
            phone: dto.phone,
            address: dto.address,
            city: dto.city,
            state: dto.state,
            zipCode: dto.zipCode,
            motherName: dto.motherName,
            fatherName: dto.fatherName,
            educationLevel: dto.educationLevel,
            priorStudies: dto.priorStudies || null,
            modality: 'Ensino Médio',
            moduleNumber,
            startModuleNumber: moduleNumber,
            classGroup: classGroupFor(year, moduleNumber),
            enrollmentDate,
            monthlyFee: dto.monthlyFee,
            status: 'pending', // vira "active" quando aceitar o contrato
            passwordHash,
          },
          (studentId) => buildInstallments(studentId, dto.monthlyFee, dto.installments, dto.firstDueDate),
        );
        return { student, temporaryPassword };
      } catch (err) {
        if (isUniqueViolation(err, 'matricula')) continue; // número de matrícula repetido: sorteia outro
        if (isUniqueViolation(err, 'cpf')) throw new ConflictError('CPF já cadastrado');
        throw err;
      }
    }
    throw new ConflictError('não foi possível gerar um número de matrícula, tente novamente');
  },

  async update(id: string, dto: UpdateStudentDto) {
    await StudentsService.getById(id, { type: 'admin', userId: 'admin' });
    try {
      return await StudentsRepository.update(id, { ...dto, priorStudies: dto.priorStudies ?? undefined });
    } catch (err) {
      if (isUniqueViolation(err, 'cpf')) throw new ConflictError('CPF já cadastrado');
      throw err;
    }
  },

  /** "Ativar módulo 2" para quem começou no módulo 1: troca a turma/apostilas e gera as novas parcelas. */
  async advanceToModule2(id: string, input: { monthlyFee: number; installments: number; firstDueDate: Date }) {
    const student = await StudentsRepository.findById(id);
    if (!student) throw new NotFoundError('aluno não encontrado');
    if (student.moduleNumber !== 1) throw new ValidationError('o aluno já está no módulo 2');

    const year = (student.enrollmentDate ?? new Date()).getUTCFullYear();
    return prisma.$transaction(async (tx) => {
      const updated = await tx.student.update({
        where: { id },
        data: { moduleNumber: 2, classGroup: classGroupFor(year, 2), monthlyFee: input.monthlyFee },
      });
      const rows = buildInstallments(id, input.monthlyFee, input.installments, input.firstDueDate).map((r) => ({
        ...r,
        reference: `M2 · ${r.reference}`,
      }));
      await tx.invoice.createMany({ data: rows });
      return updated;
    });
  },

  remove: (id: string) => StudentsRepository.remove(id),
};
