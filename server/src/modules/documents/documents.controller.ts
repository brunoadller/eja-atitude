import { NextFunction, Request, Response } from 'express';
import path from 'path';
import { UPLOAD_DIR } from '@/config/upload';
import { ForbiddenError } from '@/shared/errors/ForbiddenError';
import { NotFoundError } from '@/shared/errors/NotFoundError';
import { DocumentsRepository } from './documents.repository';
import { DocumentsService } from './documents.service';

export const DocumentsController = {
  async listOwn(req: Request, res: Response, next: NextFunction) {
    try { res.json(await DocumentsService.listOwn(req.session!)); } catch (err) { next(err); }
  },
  async listByStudent(req: Request, res: Response, next: NextFunction) {
    try { res.json(await DocumentsService.listByStudent(req.params.studentId, req.session!)); } catch (err) { next(err); }
  },
  async upload(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) throw new NotFoundError('arquivo não enviado');
      res.status(201).json(await DocumentsService.upload(req.session!.userId, req.body.type, req.file));
    } catch (err) { next(err); }
  },
  async download(req: Request, res: Response, next: NextFunction) {
    try {
      // aluno só baixa os próprios documentos; secretaria baixa de qualquer aluno
      if (req.session!.type === 'student' && req.session!.userId !== req.params.studentId) {
        throw new ForbiddenError('acesso negado');
      }
      const docs = await DocumentsRepository.findByStudent(req.params.studentId);
      const doc = docs.find((d) => d.id === req.params.id);
      if (!doc) throw new NotFoundError('documento não encontrado');
      res.download(path.join(UPLOAD_DIR, path.basename(doc.fileName)), doc.originalName);
    } catch (err) { next(err); }
  },
  async review(req: Request, res: Response, next: NextFunction) {
    try { res.json(await DocumentsService.review(req.params.id, req.body.status, req.body.note)); } catch (err) { next(err); }
  },
};
