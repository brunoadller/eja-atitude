import fs from 'fs';
import path from 'path';
import { DocumentsRepository } from './documents.repository';
import { UPLOAD_DIR } from '@/config/upload';
import { DOCUMENT_TYPES } from '@/shared/constants/document-types';
import { ValidationError } from '@/shared/errors/ValidationError';
import { ForbiddenError } from '@/shared/errors/ForbiddenError';
import { Session } from '@/shared/types/session';

export const DocumentsService = {
  // admin: GET /documents/:studentId
  async listByStudent(studentId: string, session: Session) {
    if (session.type === 'student' && session.userId !== studentId) {
      throw new ForbiddenError('access denied');
    }
    return DocumentsRepository.findByStudent(studentId);
  },

  // student: GET /documents (own, uses session)
  listOwn(session: Session) {
    return DocumentsRepository.findByStudent(session.userId);
  },

  async upload(studentId: string, type: string, file: Express.Multer.File) {
    if (!DOCUMENT_TYPES.includes(type as any)) {
      throw new ValidationError('invalid document type');
    }

    const existing = await DocumentsRepository.findByStudentAndType(studentId, type);
    for (const doc of existing) {
      const filePath = path.join(UPLOAD_DIR, doc.fileName);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    await DocumentsRepository.deleteByStudentAndType(studentId, type);

    return DocumentsRepository.create({
      type,
      originalName: file.originalname,
      fileName: file.filename,
      mimetype: file.mimetype,
      size: file.size,
      student: { connect: { id: studentId } },
    });
  },

  review: (id: string, status: 'approved' | 'rejected', note?: string) =>
    DocumentsRepository.updateStatus(id, status, note),
};
