import { Student } from '@prisma/client';

// Remove campos sensíveis antes de enviar ao navegador.
export function toStudentResponse(student: Student) {
  const { passwordHash, contractIp, tokenVersion, ...safe } = student;
  return safe;
}

export function toStudentListResponse(page: { items: Student[]; total: number; page: number; pageSize: number }) {
  return { ...page, items: page.items.map(toStudentResponse) };
}
