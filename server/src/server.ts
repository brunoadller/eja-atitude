import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { env } from '@/config/env';
import routes from '@/routes';
import { errorHandler } from '@/shared/middlewares/error-handler.middleware';

const app = express();

// Atrás de proxy (Render, Railway, Nginx...): necessário para req.ip e rate-limit funcionarem corretamente.
if (env.TRUST_PROXY > 0) app.set('trust proxy', env.TRUST_PROXY);
app.disable('x-powered-by');

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

if (env.NODE_ENV !== 'production') {
  app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));
}

// IMPORTANTE: /uploads NÃO é mais servido como arquivo estático público.
// Apostilas e documentos dos alunos só saem por rotas autenticadas (/api/books/:id/download, /api/documents/...).
app.use('/api', routes);
app.use('/api', (_req, res) => res.status(404).json({ error: 'rota não encontrada' }));

const clientDist = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => res.sendFile(path.join(clientDist, 'index.html')));
}

app.use(errorHandler);

app.listen(env.PORT, '0.0.0.0', () => console.log(`EJA running on :${env.PORT}`));
