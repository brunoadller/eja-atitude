import { Student } from '@prisma/client';

// Remove campos sensíveis antes de enviar ao navegador.
export function toStudentResponse(student: Student) {
  const { passwordHash, contractIp, tokenVersion, ...safe } = student;
  return safe;
}

export function toStudentListResponse(students: Student[]) {
  return students.map(toStudentResponse);
}
