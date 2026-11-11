import { Request } from 'express';

/** Usa req.ip (respeita o "trust proxy" configurado) em vez de confiar cegamente no X-Forwarded-For. */
export function getClientIp(req: Request): string {
  return req.ip || req.socket.remoteAddress || '';
}
