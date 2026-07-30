import { z } from 'zod';

export const createDealSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  value: z.number().optional(),
  probability: z.number().min(0).max(100).optional(),
  expectedCloseDate: z.string().optional(),
  status: z.enum(['OPEN', 'WON', 'LOST']).optional(),
  stageId: z.string().min(1, 'Stage is required'),
  contactName: z.string().optional(),
  contactId: z.string().optional(),
  companyId: z.string().optional(),
  assignedToId: z.string().optional(),
});

export const updateDealSchema = createDealSchema.partial();

export const updateDealStatusSchema = z.object({
  status: z.enum(['OPEN', 'WON', 'LOST']),
});

export const createPipelineStageSchema = z.object({
  name: z.string().min(1, 'Stage name is required'),
  order: z.number().min(1, 'Order is required'),
});

export type CreateDealInput = z.infer<typeof createDealSchema>;
export type UpdateDealInput = z.infer<typeof updateDealSchema>;
export type UpdateDealStatusInput = z.infer<typeof updateDealStatusSchema>;
export type CreatePipelineStageInput = z.infer<typeof createPipelineStageSchema>;