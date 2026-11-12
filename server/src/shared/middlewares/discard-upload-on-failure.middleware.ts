import fs from 'fs';
import path from 'path';
import { NextFunction, Request, Response } from 'express';
import { UPLOAD_DIR } from '@/config/upload';

/**
 * Coloque ANTES do multer. Se a requisição terminar com erro (validação, permissão, regra de negócio),
 * apaga o arquivo que o multer já tinha gravado em disco, para não sobrar arquivo sem dono em uploads/.
 */
export function discardUploadOnFailure(req: Request, res: Response, next: NextFunction) {
  res.on('finish', () => {
    if (res.statusCode < 400 || !req.file) return;
    fs.unlink(path.join(UPLOAD_DIR, path.basename(req.file.filename)), () => {});
  });
  next();
}
