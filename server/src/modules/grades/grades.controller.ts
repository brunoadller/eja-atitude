import { NextFunction, Request, Response } from 'express';
import { GradesService } from './grades.service';

export const GradesController = {
  async listByStudent(req: Request, res: Response, next: NextFunction) {
    try { res.json(await GradesService.listByStudent(req.params.studentId, req.session!)); } catch (err) { next(err); }
  },
  async registerRegularExam(req: Request, res: Response, next: NextFunction) {
    try {
      const { studentId, examNumber, subject, componentModule, score } = req.body;
      res.status(201).json(await GradesService.registerRegularExam(studentId, examNumber, subject, componentModule, score));
    } catch (err) { next(err); }
  },
  async scheduleRecovery(req: Request, res: Response, next: NextFunction) {
    try {
      const { studentId, subject, componentModule, scheduledDate } = req.body;
      res.status(201).json(await GradesService.scheduleRecovery(studentId, subject, componentModule, scheduledDate));
    } catch (err) { next(err); }
  },
  async recordRecoveryScore(req: Request, res: Response, next: NextFunction) {
    try { res.json(await GradesService.recordRecoveryScore(req.params.id, req.body.score)); } catch (err) { next(err); }
  },
  async remove(req: Request, res: Response, next: NextFunction) {
    try { await GradesService.remove(req.params.id); res.status(204).send(); } catch (err) { next(err); }
  },
};
