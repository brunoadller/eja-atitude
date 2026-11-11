import { NextFunction, Request, Response } from 'express';
import { logger } from '@/config/logger';
import { AppError } from '@/shared/errors/AppError';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message });
  }
  // multer (upload): arquivo grande demais / tipo inválido
  if ((err as { code?: string }).code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'arquivo maior que o limite permitido' });
  }
  logger.error(err);
  return res.status(500).json({ error: 'Erro interno do servidor' });
}
