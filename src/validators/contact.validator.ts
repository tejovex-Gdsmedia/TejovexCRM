import { z } from 'zod';

export const createContactSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.email('Invalid email').optional(),
  phone: z.string().optional(),
  companyId: z.string().optional(),
  companyName: z.string().optional(),
});

export const updateContactSchema = createContactSchema.partial();

export type CreateContactInput = z.infer<typeof createContactSchema>;
export type UpdateContactInput = z.infer<typeof updateContactSchema>;


export const bulkImportContactsSchema = z.object({
  contacts: z
    .array(
      z.object({
        firstName: z.string().min(1, 'First name is required'),
        lastName:  z.string().optional(),
        email:     z.string().optional(),
        phone:     z.string().optional(),
      })
    )
    .min(1, 'At least one contact is required')
    .max(500, 'Maximum 500 contacts per import'),
});

export type BulkImportContactsInput = z.infer<typeof bulkImportContactsSchema>;