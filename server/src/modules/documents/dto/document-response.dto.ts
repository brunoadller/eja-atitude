import { StudentDocument } from '@prisma/client';
import type { DocumentWithAdmins } from '../documents.repository';

/** O que o ALUNO recebe: sem nome do arquivo no disco e sem identificar o funcionário da secretaria. */
export function toStudentDocumentView(d: StudentDocument) {
  return {
    id: d.id,
    type: d.type,
    originalName: d.originalName,
    status: d.status,
    note: d.status === 'rejected' ? d.note : null, // motivo só faz sentido quando recusado
    uploadedAt: d.uploadedAt,
    uploadedBy: d.uploadedBy, // 'student' | 'admin' → a tela mostra "Anexado pela secretaria"
    reviewedAt: d.reviewedAt,
  };
}

/** O que a SECRETARIA recebe: inclui quem anexou e quem analisou. */
export function toAdminDocumentView(d: DocumentWithAdmins) {
  const who = (a: { name: string | null; username: string } | null) => (a ? a.name || a.username : null);
  return {
    ...toStudentDocumentView(d),
    note: d.note,
    mimetype: d.mimetype,
    size: d.size,
    uploadedByAdminName: who(d.uploadedByAdmin),
    reviewedByAdminName: who(d.reviewedByAdmin),
  };
}
