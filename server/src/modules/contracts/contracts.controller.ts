import { Request, Response, NextFunction } from 'express';
import { ContractsService } from './contracts.service';

export const ContractsController = {
  getCurrent(req: Request, res: Response) {
    res.json(ContractsService.getCurrent());
  },
  async accept(req: Request, res: Response, next: NextFunction) {
    try {
      const student = await ContractsService.accept(req.session!.userId, req);
      res.json({ ok: true, contractAccepted: student.contractAccepted });
    } catch (err) { next(err); }
  },
};
