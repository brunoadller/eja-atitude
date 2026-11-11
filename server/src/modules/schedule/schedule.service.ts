import { prisma } from '@/config/database';
import { classGroupFor, CURRICULUM, ModuleNumber, subjectsOfModule } from '@/shared/constants/curriculum';
import { ConflictError } from '@/shared/errors/ConflictError';
import { NotFoundError } from '@/shared/errors/NotFoundError';
import { ValidationError } from '@/shared/errors/ValidationError';
import { ScheduleRepository } from './schedule.repository';
import { TEMPLATE_2026_2 } from './schedule.template';

export interface ItemInput { subject: string; componentModule: number }

function assertSubjects(moduleNumber: ModuleNumber, items: ItemInput[]) {
  const allowed = new Set(subjectsOfModule(moduleNumber));
  for (const i of items) {
    if (!allowed.has(i.subject)) {
      throw new ValidationError(`"${i.subject}" não faz parte das disciplinas do módulo ${moduleNumber}`);
    }
  }
}

const dedupe = (items: ItemInput[]): ItemInput[] => {
  const seen = new Set<string>();
  return items.filter((i) => {
    const k = `${i.subject}|${i.componentModule}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
};

export const ScheduleService = {
  subjects: (m: ModuleNumber) => CURRICULUM[m].map((c) => c.subject),

  async getGroup(classGroup: string) {
    const [sessions, rounds] = await Promise.all([ScheduleRepository.sessions(classGroup), ScheduleRepository.rounds(classGroup)]);
    return { classGroup, sessions, rounds };
  },

  async addClassDay(moduleNumber: ModuleNumber, year: number, date: Date, items: ItemInput[]) {
    assertSubjects(moduleNumber, items);
    const classGroup = classGroupFor(year, moduleNumber);
    await ScheduleRepository.createSessions(
      items.map((i) => ({ classGroup, date, subject: i.subject, componentModule: i.componentModule })),
    );
    return ScheduleService.getGroup(classGroup);
  },

  removeClassSession: (id: string) => ScheduleRepository.removeSession(id),

  /** Se `items` vier vazio, usa as disciplinas das aulas dadas desde a prova anterior. */
  async addExamRound(moduleNumber: ModuleNumber, year: number, roundNumber: number, examDate: Date, items?: ItemInput[]) {
    const classGroup = classGroupFor(year, moduleNumber);
    if (await ScheduleRepository.findRound(classGroup, roundNumber)) {
      throw new ConflictError(`a prova ${roundNumber} já está cadastrada para esta turma`);
    }

    let finalItems = items ?? [];
    if (!finalItems.length) {
      const [sessions, rounds] = await Promise.all([ScheduleRepository.sessions(classGroup), ScheduleRepository.rounds(classGroup)]);
      const previous = rounds.filter((r) => r.examDate < examDate).sort((a, b) => +b.examDate - +a.examDate)[0];
      finalItems = sessions
        .filter((s) => s.date <= examDate && (!previous || s.date > previous.examDate) && s.componentModule)
        .map((s) => ({ subject: s.subject, componentModule: s.componentModule as number }));
      if (!finalItems.length) {
        throw new ValidationError('não há aulas cadastradas antes desta data; adicione as disciplinas manualmente');
      }
    }
    finalItems = dedupe(finalItems);
    assertSubjects(moduleNumber, finalItems);

    return ScheduleRepository.createRound({
      classGroup,
      roundNumber,
      examDate,
      items: { create: finalItems.map((i) => ({ subject: i.subject, componentModule: i.componentModule })) },
    });
  },

  removeExamRound: (id: string) => ScheduleRepository.removeRound(id),

  /** Importa o cronograma modelo da escola (módulo 2, 2026/2): aulas + as 7 provas. */
  async importTemplate(moduleNumber: ModuleNumber, year: number) {
    if (moduleNumber !== 2 || year !== 2026) {
      throw new ValidationError('só existe modelo pronto para o Módulo 2 de 2026 (2026/2)');
    }
    const classGroup = classGroupFor(year, moduleNumber);
    const existing = (await ScheduleRepository.sessions(classGroup)).length + (await ScheduleRepository.rounds(classGroup)).length;
    if (existing) throw new ConflictError('esta turma já possui cronograma; remova os itens antes de importar o modelo');

    await prisma.$transaction(async (tx) => {
      let roundNumber = 0;
      const pending: ItemInput[] = [];
      for (const day of TEMPLATE_2026_2) {
        const date = new Date(`${day.date}T00:00:00.000Z`);
        if (day.exam) {
          roundNumber += 1;
          await tx.examRound.create({
            data: {
              classGroup, roundNumber, examDate: date,
              items: { create: dedupe(pending).map((i) => ({ subject: i.subject, componentModule: i.componentModule })) },
            },
          });
          pending.length = 0;
        } else {
          await tx.classSession.createMany({
            data: day.items!.map(([subject, componentModule]) => ({ classGroup, date, subject, componentModule })),
          });
          pending.push(...day.items!.map(([subject, componentModule]) => ({ subject, componentModule })));
        }
      }
    });
    return ScheduleService.getGroup(classGroup);
  },

  /** Cronograma do próprio aluno (a turma vem do cadastro, nunca de parâmetro da requisição). */
  async getForStudent(studentId: string) {
    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student) throw new NotFoundError('aluno não encontrado');
    if (!student.classGroup) return { classGroup: null, sessions: [], rounds: [] };
    return ScheduleService.getGroup(student.classGroup);
  },

  /** Confere se (disciplina + módulo) faz parte da prova daquela turma. */
  async validateItemInRound(classGroup: string, roundNumber: number, subject: string, componentModule: number) {
    const round = await ScheduleRepository.findRound(classGroup, roundNumber);
    if (!round) throw new ValidationError(`a prova ${roundNumber} não está cadastrada para a turma do aluno`);
    const ok = round.items.some((i) => i.subject === subject && i.componentModule === componentModule);
    if (!ok) throw new ValidationError(`${subject} (módulo ${componentModule}) não faz parte da prova ${roundNumber}`);
    return round;
  },
};
