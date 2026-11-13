import fs from 'fs';
import path from 'path';
import { UPLOAD_DIR } from '@/config/upload';
import { logger } from '@/config/logger';
import { DOCUMENT_TYPE_LIST } from '@/shared/constants/document-types';
import { ForbiddenError } from '@/shared/errors/ForbiddenError';
import { NotFoundError } from '@/shared/errors/NotFoundError';
import { syncCompletedStatus } from '@/modules/grades/completion.service';
import { NotificationsService } from '@/modules/notifications/notifications.service';
import { DocumentsRepository } from './documents.repository';
import { toAdminDocumentView, toStudentDocumentView } from './dto/document-response.dto';

/** Apaga do disco os arquivos substituídos (o registro no banco já foi trocado). */
function removeFiles(fileNames: string[]) {
  for (const name of fileNames) {
    fs.unlink(path.join(UPLOAD_DIR, path.basename(name)), (err) => {
      if (err && err.code !== 'ENOENT') logger.warn({ err: err.message }, 'não foi possível apagar arquivo antigo de documento');
    });
  }
}

const fileData = (file: Express.Multer.File) => ({
  originalName: file.originalname,
  fileName: file.filename,
  mimetype: file.mimetype,
  size: file.size,
});

export const DocumentsService = {
  listTypes: () => DOCUMENT_TYPE_LIST,

  // aluno: GET /documents (o id vem da sessão, nunca da URL)
  async listOwn(studentId: string) {
    return (await DocumentsRepository.findByStudent(studentId)).map(toStudentDocumentView);
  },

  // secretaria: GET /documents/:studentId
  async listByStudent(studentId: string) {
    return (await DocumentsRepository.findByStudentWithAdmins(studentId)).map(toAdminDocumentView);
  },

  /** Aluno envia ou reenvia. Pode quando não enviou, está pendente ou foi recusado; aprovado fica bloqueado. */
  async uploadByStudent(studentId: string, type: string, file: Express.Multer.File) {
    const current = await DocumentsRepository.findCurrent(studentId, type);
    if (current?.status === 'approved') {
      throw new ForbiddenError('este documento já foi aprovado; para trocar, procure a secretaria');
    }
    const { created, oldFileNames } = await DocumentsRepository.replaceCurrent(studentId, type, {
      ...fileData(file),
      status: 'pending',
      uploadedBy: 'student',
    });
    removeFiles(oldFileNames);
    await NotificationsService.notifyDocumentsSubmitted(studentId); // um aviso por aluno, com a lista do que falta verificar
    return toStudentDocumentView(created);
  },

  /**
   * Secretaria anexa para um aluno (ex.: documento entregue em papel).
   * Com approve=true o documento já nasce aprovado, com quem aprovou e quando — o aluno vê ao abrir a página.
   */
  async uploadByAdmin(adminId: string, studentId: string, type: string, approve: boolean, file: Express.Multer.File) {
    if (!(await DocumentsRepository.studentExists(studentId))) throw new NotFoundError('aluno não encontrado');

    const now = new Date();
    const { created, oldFileNames } = await DocumentsRepository.replaceCurrent(studentId, type, {
      ...fileData(file),
      uploadedBy: 'admin',
      uploadedByAdminId: adminId,
      status: approve ? 'approved' : 'pending',
      reviewedByAdminId: approve ? adminId : null,
      reviewedAt: approve ? now : null,
    });
    removeFiles(oldFileNames);
    if (approve) {
      await syncCompletedStatus(studentId); // notas + documentos em dia → Concluído
      await NotificationsService.notifyDocumentReviewed(studentId, type, 'approved'); // anexou e aprovou = aprovação para o aluno
    }

    return toAdminDocumentView(await DocumentsRepository.findByIdWithAdmins(created.id));
  },

  /** Só a secretaria. Recusa exige motivo (validado no Zod); ao aprovar, o motivo antigo é limpo. */
  async review(adminId: string, id: string, status: 'approved' | 'rejected', note?: string) {
    const doc = await DocumentsRepository.findById(id);
    if (!doc) throw new NotFoundError('documento não encontrado');
    const updated = await DocumentsRepository.review(id, status, status === 'rejected' ? note ?? null : null, adminId);
    if (status === 'approved') await syncCompletedStatus(doc.studentId); // notas + documentos em dia → Concluído
    await NotificationsService.notifyDocumentReviewed(doc.studentId, doc.type, status, updated.note);
    return toAdminDocumentView(updated);
  },
};
