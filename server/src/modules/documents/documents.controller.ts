import { NextFunction, Request, Response } from 'express';
import path from 'path';
import { UPLOAD_DIR } from '@/config/upload';
import { ForbiddenError } from '@/shared/errors/ForbiddenError';
import { NotFoundError } from '@/shared/errors/NotFoundError';
import { ValidationError } from '@/shared/errors/ValidationError';
import { DocumentsRepository } from './documents.repository';
import { DocumentsService } from './documents.service';

export const DocumentsController = {
  types(_req: Request, res: Response) {
    res.json(DocumentsService.listTypes());
  },
  async listOwn(req: Request, res: Response, next: NextFunction) {
    try { res.json(await DocumentsService.listOwn(req.session!.userId)); } catch (err) { next(err); }
  },
  async listByStudent(req: Request, res: Response, next: NextFunction) {
    try { res.json(await DocumentsService.listByStudent(req.params.studentId)); } catch (err) { next(err); }
  },
  async upload(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) throw new ValidationError('selecione um arquivo');
      res.status(201).json(await DocumentsService.uploadByStudent(req.session!.userId, req.body.type, req.file));
    } catch (err) { next(err); }
  },
  async uploadByAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) throw new ValidationError('selecione um arquivo');
      const { type, approve } = req.body as { type: string; approve: boolean };
      res.status(201).json(
        await DocumentsService.uploadByAdmin(req.session!.userId, req.params.studentId, type, approve, req.file),
      );
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
    try {
      res.json(await DocumentsService.review(req.session!.userId, req.params.id, req.body.status, req.body.note));
    } catch (err) { next(err); }
  },
};
