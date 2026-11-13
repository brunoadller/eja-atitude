import { NextFunction, Request, Response } from 'express';
import { NotificationsService } from './notifications.service';

export const NotificationsController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try { res.json(await NotificationsService.list(req.session!)); } catch (err) { next(err); }
  },
  async unreadCount(req: Request, res: Response, next: NextFunction) {
    try { res.json(await NotificationsService.unreadCount(req.session!)); } catch (err) { next(err); }
  },
  async markRead(req: Request, res: Response, next: NextFunction) {
    try { res.json(await NotificationsService.markRead(req.session!, req.params.id)); } catch (err) { next(err); }
  },
  async markAllRead(req: Request, res: Response, next: NextFunction) {
    try { res.json(await NotificationsService.markAllRead(req.session!)); } catch (err) { next(err); }
  },
};
