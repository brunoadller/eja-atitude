export type StudentStatus = 'pending' | 'active' | 'completed' | 'locked';

export interface Student {
  id: string;
  enrollment: string;
  name: string;
  cpf?: string;
  rg?: string;
  birthDate?: string;
  birthplace?: string;
  nationality?: string;
  gender?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  motherName?: string;
  fatherName?: string;
  educationLevel?: string;
  priorStudies?: string | null;
  modality?: string;
  moduleNumber: 1 | 2;
  startModuleNumber: 1 | 2;
  classGroup?: string;
  enrollmentDate?: string;
  monthlyFee?: number;
  status: StudentStatus;
  contractAccepted?: boolean;
  contractAcceptedAt?: string | null;
  contractVersion?: string | null;
  createdAt?: string;
}

export interface Grade {
  id: string;
  studentId: string;
  subject: string;
  componentModule: number | null;
  examNumber: number;
  attempt: number;
  score: number | null;
  scheduledDate: string | null;
  feeCharged: boolean;
  year: number;
}

export interface Invoice {
  id: string;
  studentId: string;
  kind: 'installment' | 'fee';
  reference: string;
  installmentNumber: number | null;
  installmentTotal: number | null;
  amount: number;
  dueDate: string;
  status: 'open' | 'paid';
  paidAt?: string | null;
}

export interface Book {
  id: string;
  title: string;
  subject: string;
  module?: string;
  moduleNumber?: number | null;
  description?: string;
  fileUrl?: string;
}

export interface AdminUser {
  id: string;
  username: string;
  name: string;
  /** E-mail para recuperação de senha da secretaria. */
  email?: string | null;
}

export type Me = { type: 'admin'; user: AdminUser } | { type: 'student'; user: Student };

export interface StudentDocument {
  id: string;
  type: string;
  originalName: string;
  status: 'pending' | 'approved' | 'rejected';
  /** Motivo da recusa (o aluno vê). */
  note?: string | null;
  uploadedAt: string;
  /** Quem anexou: o próprio aluno ou a secretaria. */
  uploadedBy: 'student' | 'admin';
  reviewedAt?: string | null;
  /** Só na visão da secretaria: nome de quem anexou / analisou. */
  uploadedByAdminName?: string | null;
  reviewedByAdminName?: string | null;
}

/** Tipo de documento como vem de GET /api/documents/types. */
export interface DocumentTypeInfo {
  type: string;
  label: string;
}

export interface ClassSession {
  id: string;
  classGroup: string;
  date: string;
  subject: string;
  componentModule: number | null;
}

export interface ExamRoundItem {
  id: string;
  subject: string;
  componentModule: number | null;
}

export interface ExamRound {
  id: string;
  classGroup: string;
  roundNumber: number;
  examDate: string;
  items: ExamRoundItem[];
}

export interface ScheduleData {
  classGroup: string | null;
  sessions: ClassSession[];
  rounds: ExamRound[];
}

export interface DocRequest {
  id: string;
  via: number;
  status: 'awaiting_payment' | 'ready' | 'issued';
  feeAmount: number;
  requestedAt: string;
  issuedAt?: string | null;
  invoice: { id: string; dueDate: string; status: 'open' | 'paid'; amount: number } | null;
}

/** Uma das três condições do certificado (notas, parcelas, documentos). */
export interface CompletionCheck {
  ok: boolean;
  missing: string[];
}

export interface CertificateChecks {
  grades: CompletionCheck;
  installments: CompletionCheck;
  documents: CompletionCheck & { approved: number; total: number };
}

export interface DocStatus {
  type: 'attestation' | 'certificate';
  label: string;
  nextVia: number;
  fee: number;
  eligible: boolean;
  reasons: string[];
  /** Só no certificado: as três condições separadas. */
  checks?: CertificateChecks | null;
  canRequest: boolean;
  requests: DocRequest[];
}

export const MODULE_NAMES: Record<number, string> = { 1: 'Módulo 1 (início do ano · 1º semestre)', 2: 'Módulo 2 (final do ano · 2º semestre)' };

export const STATUS_LABEL: Record<StudentStatus, string> = {
  pending: 'Aguardando contrato',
  active: 'Ativo',
  completed: 'Concluído',
  locked: 'Trancado',
};
