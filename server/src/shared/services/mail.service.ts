import { env } from '@/config/env';
import { logger } from '@/config/logger';
import nodemailer, { Transporter } from 'nodemailer';

let transporter: Transporter | null = null;

const escapeHtml = (s: string) => {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
};
function getTransporter(): Transporter | null {
  if (!env.SMTP_HOST) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
    });
  }
  return transporter;
}

export const MailService = {
  async sendResetCode(to: string, name: string, code: string) {
    const first = name.split(' ')[0];
    const text =
      `Olá, ${escapeHtml(first)}!\n\nSeu código para redefinir a senha da plataforma EJA Atitude é: ${code}\n` +
      `Ele vale por 10 minutos. Se você não pediu a redefinição, ignore este e-mail.\n`;
    const html =
      `<p>Olá, ${first}!</p><p>Seu código para redefinir a senha da plataforma <b>EJA Atitude</b> é:</p>` +
      `<p style="font-size:28px;letter-spacing:6px"><b>${code}</b></p>` +
      `<p>Ele vale por 10 minutos. Se você não pediu a redefinição, ignore este e-mail.</p>`;

    const t = getTransporter();
    if (!t) {
      // Só chega aqui em desenvolvimento (em produção o SMTP é obrigatório).
      logger.warn(`[DEV] SMTP não configurado. Código de redefinição para ${to}: ${code}`);
      return;
    }
    await t.sendMail({ from: env.MAIL_FROM, to, subject: `${code} é o seu código para redefinir a senha`, text, html });
  },
};
