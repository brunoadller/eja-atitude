import { MailService } from '../src/shared/services/mail.service'; // ajuste o caminho

const to = process.argv[2];
if (!to) {
  console.error('Uso: npx tsx prisma/test-mail.ts seuemail@exemplo.com');
  process.exit(1);
}

MailService.sendResetCode(to, 'Teste Sistema', '123456')
  .then(() => console.log('Enviado (ou exibido no terminal, se não houver SMTP).'))
  .catch((e) => { console.error('Falhou:', e.message); process.exit(1); });