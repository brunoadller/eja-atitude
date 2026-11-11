import { NextFunction, Request, Response } from 'express';
import { InvoicesService } from './invoices.service';
import { renderInvoicePdf, renderStudentCarne } from './invoices.pdf';

export const InvoicesController = {
  async listByStudent(req: Request, res: Response, next: NextFunction) {
    try { res.json(await InvoicesService.listByStudent(req.params.studentId, req.session!)); } catch (err) { next(err); }
  },
  async createInstallments(req: Request, res: Response, next: NextFunction) {
    try {
      const { studentId, amount, installments, firstDueDate } = req.body;
      res.status(201).json(await InvoicesService.createInstallments(studentId, amount, installments, firstDueDate));
    } catch (err) { next(err); }
  },
  async pay(req: Request, res: Response, next: NextFunction) {
    try { res.json(await InvoicesService.markAsPaid(req.params.id)); } catch (err) { next(err); }
  },
  async reopen(req: Request, res: Response, next: NextFunction) {
    try { res.json(await InvoicesService.markAsOpen(req.params.id)); } catch (err) { next(err); }
  },
  async pdf(req: Request, res: Response, next: NextFunction) {
    try { await renderInvoicePdf(req.params.id, res); } catch (err) { next(err); }
  },
  async carne(req: Request, res: Response, next: NextFunction) {
    try { await renderStudentCarne(req.params.studentId, res, req.query.onlyOpen === '1'); } catch (err) { next(err); }
  },
};
