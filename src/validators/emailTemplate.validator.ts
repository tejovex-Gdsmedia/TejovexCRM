import { z } from 'zod';

const stageEnum = z.enum([
  'INITIAL_OUTREACH', 'FOLLOWUP_1', 'FOLLOWUP_2', 'FOLLOWUP_3',
  'REENGAGEMENT', 'POST_MEETING', 'PROPOSAL_SENT', 'CLOSING', 'CUSTOM',
]);

export const createEmailTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  stage: stageEnum,
  subject: z.string().min(1, 'Subject is required'),
  body: z.string().min(1, 'Body is required'),
  isActive: z.boolean().default(true),
});

export const updateEmailTemplateSchema = z.object({
  name: z.string().optional(),
  stage: stageEnum.optional(),
  subject: z.string().optional(),
  body: z.string().optional(),
  isActive: z.boolean().optional(),
});