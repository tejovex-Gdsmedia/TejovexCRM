import { z } from 'zod';

export const createFollowUpSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  type: z.enum(['CALL', 'EMAIL', 'MEETING', 'WHATSAPP', 'SMS']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
  dueDate: z.string().min(1, 'Due date is required'),
  scheduledAt: z.string().optional(),

  emailStage: z.enum([
    'INITIAL_OUTREACH', 'FOLLOWUP_1', 'FOLLOWUP_2', 'FOLLOWUP_3',
    'REENGAGEMENT', 'POST_MEETING', 'PROPOSAL_SENT', 'CLOSING', 'CUSTOM',
  ]).optional(),
  emailTemplateId: z.string().optional(),
  emailSubject: z.string().optional(),
  emailBody: z.string().optional(),

  leadId: z.string().optional(),
  contactId: z.string().optional(),
  dealId: z.string().optional(),

  assignedToId: z.string().optional(),
}).refine(
  (data) => data.leadId || data.contactId || data.dealId,
  { message: 'At least one of leadId, contactId, or dealId is required' }
);

export const updateFollowUpSchema = z.object({
  title: z.string().optional(),
  status: z.enum(['PENDING', 'COMPLETED', 'OVERDUE', 'SKIPPED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  dueDate: z.string().optional(),
  scheduledAt: z.string().nullable().optional(),
  completionNote: z.string().optional(),
  emailSubject: z.string().optional(),
  emailBody: z.string().optional(),
  assignedToId: z.string().nullable().optional(),
});