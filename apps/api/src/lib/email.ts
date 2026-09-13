import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST || 'localhost';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '1025', 10);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || 'noreply@origo.local';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3456';

let transporter: Transporter | null = null;

/**
 * Get or create SMTP transporter (Mailhog for local dev)
 */
function getTransporter(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: false,
      auth:
        SMTP_USER && SMTP_PASS
          ? {
              user: SMTP_USER,
              pass: SMTP_PASS,
            }
          : undefined,
    });
  }
  return transporter;
}

/**
 * Send password reset email (D2: generic template, no leak)
 * D7: Always send a generic message, never reveal if email exists
 */
export async function sendPasswordResetEmail(
  email: string,
  resetToken: string
): Promise<void> {
  const resetUrl = `${FRONTEND_URL}/reset-password#token=${resetToken}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Redefinir Senha - Origo</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #2c3e50;">Redefinir Senha</h1>
    <p>Você solicitou a redefinição de senha da sua conta Origo.</p>
    <p>Clique no link abaixo para redefinir sua senha:</p>
    <p style="margin: 30px 0;">
      <a href="${resetUrl}" 
         style="background-color: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
        Redefinir Senha
      </a>
    </p>
    <p><strong>Este link expira em 30 minutos.</strong></p>
    <p style="color: #7f8c8d; font-size: 14px;">
      Se você não solicitou esta redefinição, ignore este email.
    </p>
    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
    <p style="color: #95a5a6; font-size: 12px;">
      Equipe Origo<br>
      Este é um email automático, não responda.
    </p>
  </div>
</body>
</html>
  `.trim();

  const text = `
Você solicitou a redefinição de senha da sua conta Origo.

Clique no link abaixo para redefinir sua senha:
${resetUrl}

Este link expira em 30 minutos.

Se você não solicitou esta redefinição, ignore este email.

---
Equipe Origo
Este é um email automático, não responda.
  `.trim();

  await getTransporter().sendMail({
    from: SMTP_FROM,
    to: email,
    subject: 'Redefinir Senha - Origo',
    text,
    html,
  });
}
