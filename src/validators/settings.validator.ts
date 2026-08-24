import { z } from 'zod';

export const UpdateSettingsSchema = z.object({
  whatsappEnabled: z.boolean().optional(),
  whatsappPhoneNumberId: z.string().optional(),
  whatsappAccessToken: z.string().optional(),
  whatsappTemplateName: z.string().optional(),
  emailEnabled: z.boolean().optional(),
  smtpFromEmail: z.string().optional(),});

export type UpdateSettingsInput = z.infer<typeof UpdateSettingsSchema>;