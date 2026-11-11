import { NextFunction, Request, Response } from 'express';
import { classGroupFor, ModuleNumber } from '@/shared/constants/curriculum';
import { ScheduleService } from './schedule.service';
import { renderSchedulePdf } from './schedule.pdf';

const groupOf = (req: Request) => classGroupFor(Number(req.query.year), Number(req.query.module) as ModuleNumber);

export const ScheduleController = {
  subjects(req: Request, res: Response) {
    const m = Number(req.query.module) === 1 ? 1 : 2;
    res.json(ScheduleService.subjects(m as ModuleNumber));
  },

  async group(req: Request, res: Response, next: NextFunction) {
    try { res.json(await ScheduleService.getGroup(groupOf(req))); } catch (err) { next(err); }
  },
  async groupPdf(req: Request, res: Response, next: NextFunction) {
    try {
      const g = await ScheduleService.getGroup(groupOf(req));
      renderSchedulePdf(res, g.classGroup, g.sessions, g.rounds);
    } catch (err) { next(err); }
  },

  async mine(req: Request, res: Response, next: NextFunction) {
    try { res.json(await ScheduleService.getForStudent(req.session!.userId)); } catch (err) { next(err); }
  },
  async minePdf(req: Request, res: Response, next: NextFunction) {
    try {
      const g = await ScheduleService.getForStudent(req.session!.userId);
      renderSchedulePdf(res, g.classGroup ?? 'EJA', g.sessions, g.rounds);
    } catch (err) { next(err); }
  },

  async addClassDay(req: Request, res: Response, next: NextFunction) {
    try {
      const { moduleNumber, year, date, items } = req.body;
      res.status(201).json(await ScheduleService.addClassDay(moduleNumber, year, date, items));
    } catch (err) { next(err); }
  },
  async removeClassSession(req: Request, res: Response, next: NextFunction) {
    try { await ScheduleService.removeClassSession(req.params.id); res.status(204).send(); } catch (err) { next(err); }
  },
  async addExamRound(req: Request, res: Response, next: NextFunction) {
    try {
      const { moduleNumber, year, roundNumber, examDate, items } = req.body;
      res.status(201).json(await ScheduleService.addExamRound(moduleNumber, year, roundNumber, examDate, items));
    } catch (err) { next(err); }
  },
  async removeExamRound(req: Request, res: Response, next: NextFunction) {
    try { await ScheduleService.removeExamRound(req.params.id); res.status(204).send(); } catch (err) { next(err); }
  },
  async importTemplate(req: Request, res: Response, next: NextFunction) {
    try { res.status(201).json(await ScheduleService.importTemplate(req.body.moduleNumber, req.body.year)); } catch (err) { next(err); }
  },
};
