import crypto from 'crypto';
import multer from 'multer';
import { UPLOAD_DIR } from '@/config/upload';
import { ValidationError } from '@/shared/errors/ValidationError';

const EXT: Record<string, string> = { 'application/pdf': '.pdf', 'image/jpeg': '.jpg', 'image/png': '.png' };

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  // a extensão vem do tipo real aceito, nunca do nome enviado pelo usuário
  filename: (_req, file, cb) => cb(null, `${crypto.randomBytes(16).toString('hex')}${EXT[file.mimetype]}`),
});

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!EXT[file.mimetype]) return cb(new ValidationError('envie apenas PDF, JPG ou PNG'));
    cb(null, true);
  },
});
