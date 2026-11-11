import { Response } from 'express';
import fs from 'fs';
import path from 'path';
import { prisma } from '@/config/database';
import { UPLOAD_DIR } from '@/config/upload';
import { MODULE_LABEL } from '@/shared/constants/curriculum';
import { ForbiddenError } from '@/shared/errors/ForbiddenError';
import { NotFoundError } from '@/shared/errors/NotFoundError';
import { Session } from '@/shared/types/session';
import { BooksRepository } from './books.repository';
import { CreateBookDto } from './dto/create-book.dto';

const APOSTILAS_DIR = path.join(UPLOAD_DIR, 'apostilas');

async function moduleOf(session: Session): Promise<number | undefined> {
  if (session.type === 'admin') return undefined;
  const s = await prisma.student.findUnique({ where: { id: session.userId }, select: { moduleNumber: true } });
  return s?.moduleNumber;
}

export const BooksService = {
  /** Aluno recebe só as apostilas do módulo ativo dele; a secretaria vê todas (e pode filtrar). */
  async list(session: Session, moduleFilter?: number) {
    const own = await moduleOf(session);
    return BooksRepository.findAll(own ?? moduleFilter);
  },

  create: (dto: CreateBookDto) =>
    BooksRepository.create({
      title: dto.title,
      subject: dto.subject,
      module: MODULE_LABEL[dto.moduleNumber],
      moduleNumber: dto.moduleNumber,
      description: dto.description,
      fileUrl: dto.fileUrl,
      modality: 'EJA',
    }),

  remove: (id: string) => BooksRepository.remove(id),

  async download(id: string, session: Session, res: Response) {
    const book = await BooksRepository.findById(id);
    if (!book || !book.fileUrl) throw new NotFoundError('apostila não encontrada');

    const own = await moduleOf(session);
    if (own !== undefined && book.moduleNumber !== own) throw new ForbiddenError('apostila de outro módulo');

    const filePath = path.join(APOSTILAS_DIR, path.basename(book.fileUrl));
    if (!filePath.startsWith(APOSTILAS_DIR) || !fs.existsSync(filePath)) {
      throw new NotFoundError('arquivo da apostila não encontrado no servidor');
    }
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename*=UTF-8''${encodeURIComponent(book.title)}.pdf`);
    res.sendFile(filePath);
  },
};
