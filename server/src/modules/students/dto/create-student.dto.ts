export interface CreateStudentDto {
  name: string;
  cpf: string;
  rg: string;
  birthDate: Date;
  birthplace: string;
  nationality: string;
  gender: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  motherName: string;
  fatherName: string;
  educationLevel: string;
  priorStudies?: string;
  moduleNumber: 1 | 2;
  enrollmentDate?: Date;
  monthlyFee: number;
  installments: number;
  firstDueDate: Date;
  password?: string;
}
