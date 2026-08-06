import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendEmail = async (
  to: string,
  subject: string,
  body: string
): Promise<void> => {
  await transporter.sendMail({
    from: `"${process.env.SMTP_FROM_NAME || 'TejovexCRM'}" <${process.env.SMTP_FROM_EMAIL}>`,
    to,
    subject,
    html: body,
  });
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