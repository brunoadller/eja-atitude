import { Router } from 'express';
import { SCHOOL } from '@/config/school';

const router = Router();

// Pública (usada no login antes de entrar): só dados de exibição, nada sigiloso. Fonte: config/school.ts
router.get('/', (_req, res) => {
  res.json({ name: SCHOOL.name, legalName: SCHOOL.legalName });
});

export default router;
