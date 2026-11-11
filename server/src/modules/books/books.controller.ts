import { NextFunction, Request, Response } from 'express';
import { BooksService } from './books.service';

export const BooksController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const m = Number(req.query.module);
      res.json(await BooksService.list(req.session!, m === 1 || m === 2 ? m : undefined));
    } catch (err) { next(err); }
  },
  async download(req: Request, res: Response, next: NextFunction) {
    try { await BooksService.download(req.params.id, req.session!, res); } catch (err) { next(err); }
  },
  async create(req: Request, res: Response, next: NextFunction) {
    try { res.status(201).json(await BooksService.create(req.body)); } catch (err) { next(err); }
  },
  async remove(req: Request, res: Response, next: NextFunction) {
    try { await BooksService.remove(req.params.id); res.status(204).send(); } catch (err) { next(err); }
  },
};
