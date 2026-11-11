import { NextFunction, Request, Response } from 'express';
import { toStudentListResponse, toStudentResponse } from './dto/student-response.dto';
import { StudentsService } from './students.service';

export const StudentsController = {
  async list(_req: Request, res: Response, next: NextFunction) {
    try { res.json(toStudentListResponse(await StudentsService.list())); } catch (err) { next(err); }
  },
  async getById(req: Request, res: Response, next: NextFunction) {
    try { res.json(toStudentResponse(await StudentsService.getById(req.params.id, req.session!))); } catch (err) { next(err); }
  },
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { student, temporaryPassword } = await StudentsService.create(req.body);
      // a senha provisória só aparece AQUI, uma única vez (no banco fica apenas o hash)
      res.status(201).json({ ...toStudentResponse(student), temporaryPassword });
    } catch (err) { next(err); }
  },
  async update(req: Request, res: Response, next: NextFunction) {
    try { res.json(toStudentResponse(await StudentsService.update(req.params.id, req.body))); } catch (err) { next(err); }
  },
  async advanceModule(req: Request, res: Response, next: NextFunction) {
    try { res.json(toStudentResponse(await StudentsService.advanceToModule2(req.params.id, req.body))); } catch (err) { next(err); }
  },
  async remove(req: Request, res: Response, next: NextFunction) {
    try { await StudentsService.remove(req.params.id); res.status(204).send(); } catch (err) { next(err); }
  },
};
