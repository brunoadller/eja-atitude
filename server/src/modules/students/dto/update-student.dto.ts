import { CreateStudentDto } from './create-student.dto';

export type UpdateStudentDto = Partial<
  Omit<CreateStudentDto, 'moduleNumber' | 'monthlyFee' | 'installments' | 'firstDueDate' | 'password' | 'enrollmentDate'>
> & { status?: 'pending' | 'active' | 'completed' | 'locked' };
