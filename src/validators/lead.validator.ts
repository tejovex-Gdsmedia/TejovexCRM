import { z } from 'zod';

export const createLeadSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  status: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'UNQUALIFIED', 'CONVERTED']).optional(),
  source: z.enum(['WEBSITE', 'REFERRAL', 'INDIAMART', 'WHATSAPP', 'EMAIL', 'COLD_CALL', 'OTHER']).optional(),
  value: z.number().optional(),
  contactId: z.string().optional(),
  assignedToId: z.string().optional(),
  contactName: z.string().optional(),
  assignedToName: z.string().optional(),
});

export const updateLeadSchema = createLeadSchema.partial();

export const updateLeadStatusSchema = z.object({
  status: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'UNQUALIFIED', 'CONVERTED']),
});

export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;
export type UpdateLeadStatusInput = z.infer<typeof updateLeadStatusSchema>;