import prisma from '../config/database';
export const sendEmail = async (
  to: string,
  subject: string,
  body: string
): Promise<void> => {
    const settings = await prisma.crmSettings.findUnique({ where: { id: 'global' } });
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': process.env.BREVO_API_KEY || '',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      sender: {
        name: process.env.SMTP_FROM_NAME || 'TejovexCRM',
        email: settings?.smtpFromEmail || process.env.SMTP_FROM_EMAIL || 'techgdsmedia@gmail.com',
      },
      to: [{ email: to }],
      subject,
      htmlContent: body,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Brevo error: ${JSON.stringify(errorData)}`);
  }

  console.log(`[EMAIL] Successfully sent to: ${to}`);
};

export const substituteVariables = (
  template: string,
  vars: Record<string, string>
): string => {
  return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
    const trimmed = key.trim();
    return vars[trimmed] ?? match;
  });
};









// import nodemailer from 'nodemailer';

// const transporter = nodemailer.createTransport({
//   host: process.env.SMTP_HOST || 'smtp.gmail.com',
//   port: Number(process.env.SMTP_PORT) || 465,
//   secure: false,
//   auth: {
//     user: process.env.SMTP_USER,
//     pass: process.env.SMTP_PASS,
//   },
// });

// export const sendEmail = async (
//   to: string,
//   subject: string,
//   body: string
// ): Promise<void> => {
//   await transporter.sendMail({
//     from: `"${process.env.SMTP_FROM_NAME || 'TejovexCRM'}" <${process.env.SMTP_FROM_EMAIL}>`,
//     to,
//     subject,
//     html: body,
//   });
// };

// export const substituteVariables = (
//   template: string,
//   vars: Record<string, string>
// ): string => {
//   return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
//     const trimmed = key.trim();
//     return vars[trimmed] ?? match;
//   });
// };