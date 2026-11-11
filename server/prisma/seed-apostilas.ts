// Cadastra as apostilas dos DOIS módulos (Livro 1 = 11 disciplinas, Livro 2 = 14 disciplinas).
// Rodar de dentro de server/:   npm run seed:apostilas
//
// Pré-requisito: os PDFs já devem estar em server/uploads/apostilas/
//   Módulo 1: modulo1_artes.pdf, modulo1_biologia.pdf ...   Módulo 2: artes.pdf, biologia.pdf ...
// É seguro rodar de novo: atualiza as apostilas existentes em vez de duplicar.

import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { CURRICULUM, MODULE_LABEL, MODULE_NUMBERS } from '../src/shared/constants/curriculum';

const prisma = new PrismaClient();
const DIR = path.resolve(__dirname, '../uploads/apostilas');

async function main() {
  for (const moduleNumber of MODULE_NUMBERS) {
    for (const item of CURRICULUM[moduleNumber]) {
      if (!fs.existsSync(path.join(DIR, item.file))) {
        console.warn(`⚠ arquivo ausente (cadastrando mesmo assim): uploads/apostilas/${item.file}`);
      }
      const data = {
        title: item.subject,
        subject: item.subject,
        module: MODULE_LABEL[moduleNumber],
        moduleNumber,
        description: item.description,
        fileUrl: `/uploads/apostilas/${item.file}`,
        modality: 'EJA',
      };
      const existing = await prisma.book.findFirst({ where: { subject: item.subject, moduleNumber } });
      if (existing) {
        await prisma.book.update({ where: { id: existing.id }, data });
        console.log(`Atualizado: M${moduleNumber} ${item.subject}`);
      } else {
        await prisma.book.create({ data });
        console.log(`Criado:     M${moduleNumber} ${item.subject}`);
      }
    }
  }
}

main()
  .then(() => console.log('\nPronto — apostilas do módulo 1 (11) e do módulo 2 (14) cadastradas.'))
  .catch((err) => {
    console.error('Erro ao cadastrar apostilas:', err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
