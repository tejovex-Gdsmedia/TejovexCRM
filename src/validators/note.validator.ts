import { z } from 'zod';

export const createNoteSchema = z.object({
  content: z.string().min(1, 'Note content is required'),
  contactId: z.string().optional(),
  leadId: z.string().optional(),
  dealId: z.string().optional(),
}).refine(
  (data) => data.contactId || data.leadId || data.dealId,
  {
    message: 'Note must be linked to at least one of: contact, lead, or deal',
  }
);

export const updateNoteSchema = z.object({
  content: z.string().min(1, 'Note content is required'),
});

export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;