import { prisma } from '../src/config/database';
import { hashPassword } from '../src/shared/utils/hash';

// Cria o usuário da secretaria. Em produção a senha vem OBRIGATORIAMENTE de ADMIN_PASSWORD.
async function main() {
  const username = process.env.ADMIN_USERNAME || 'admin';
  let password = process.env.ADMIN_PASSWORD;

  if (!password) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Defina ADMIN_PASSWORD para criar o usuário da secretaria em produção.');
    }
    password = 'admin123';
    console.warn('ADMIN_PASSWORD não definido: usando "admin123" (SOMENTE desenvolvimento).');
  }

  const admin = await prisma.admin.findUnique({ where: { username } });
  if (admin) {
    console.log(`Admin "${username}" já existe, nada foi criado.`);
    return;
  }
  await prisma.admin.create({
    data: { username, passwordHash: await hashPassword(password), name: 'Secretaria' },
  });
  console.log(`Admin "${username}" criado.`);
}

main()
  .then(() => console.log('Seed finished successfully'))
  .catch((err) => {
    console.error('Seed error:', err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
