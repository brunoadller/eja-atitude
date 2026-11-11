import { NextFunction, Request, Response } from 'express';
import { CertificatesService } from './certificates.service';

export const CertificatesController = {
  async status(req: Request, res: Response, next: NextFunction) {
    try { res.json(await CertificatesService.status(req.session!.userId)); } catch (err) { next(err); }
  },
  async request(req: Request, res: Response, next: NextFunction) {
    try { res.status(201).json(await CertificatesService.request(req.session!.userId, req.body.type)); } catch (err) { next(err); }
  },
  async download(req: Request, res: Response, next: NextFunction) {
    try { await CertificatesService.download(req.params.id, req.session!, res); } catch (err) { next(err); }
  },
  async adminAttestation(req: Request, res: Response, next: NextFunction) {
    try { await CertificatesService.adminAttestation(req.params.studentId, res); } catch (err) { next(err); }
  },
  async adminCertificate(req: Request, res: Response, next: NextFunction) {
    try { await CertificatesService.adminCertificate(req.params.studentId, req.query.force === '1', res); } catch (err) { next(err); }
  },
};
