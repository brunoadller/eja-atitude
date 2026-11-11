import { NextFunction, Request, Response } from 'express';
import { ForbiddenError } from '@/shared/errors/ForbiddenError';
import { authMiddleware } from './auth.middleware';

export function adminMiddleware(req: Request, res: Response, next: NextFunction) {
  authMiddleware(req, res, (err?: unknown) => {
    if (err) return next(err);
    if (req.session?.type !== 'admin') return next(new ForbiddenError('acesso restrito à secretaria'));
    next();
  });
}
