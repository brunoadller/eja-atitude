import { z } from 'zod';
import { prisma } from '../src/config/database';
import { hashPassword } from '../src/shared/utils/hash';

// ADMIN_EMAIL é opcional; vazio = não usar. Mesma validação do env.ts.
function readAdminEmail(): string | undefined {
  const raw = process.env.ADMIN_EMAIL?.trim();
  if (!raw) return undefined;
  const parsed = z.email().safeParse(raw.toLowerCase());
  if (!parsed.success) throw new Error('ADMIN_EMAIL precisa ser um e-mail válido.');
  return parsed.data;
}

// Cria o usuário da secretaria. Em produção a senha vem OBRIGATORIAMENTE de ADMIN_PASSWORD.
async function main() {
  const username = process.env.ADMIN_USERNAME || 'admin';
  const email = readAdminEmail();

  const admin = await prisma.admin.findUnique({ where: { username } });
  if (admin) {
    // Admin existente: a senha NUNCA é alterada. Só preenche o e-mail se ele estiver vazio.
    if (email && !admin.email) {
      await prisma.admin.update({ where: { id: admin.id }, data: { email } });
      console.log(`Admin "${username}" já existe: e-mail de recuperação preenchido a partir de ADMIN_EMAIL.`);
    } else {
      console.log(`Admin "${username}" já existe, nada foi alterado.`);
    }
    return;
  }

  let password = process.env.ADMIN_PASSWORD;
  if (!password) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Defina ADMIN_PASSWORD para criar o usuário da secretaria em produção.');
    }
    password = 'admin123';
    console.warn('ADMIN_PASSWORD não definido: usando "admin123" (SOMENTE desenvolvimento).');
  }

  await prisma.admin.create({
    data: { username, passwordHash: await hashPassword(password), name: 'Secretaria', email: email ?? null },
  });
  console.log(`Admin "${username}" criado${email ? ' com e-mail de recuperação' : ''}.`);
}

main()
  .then(() => console.log('Seed finished successfully'))
  .catch((err) => {
    console.error('Seed error:', err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
