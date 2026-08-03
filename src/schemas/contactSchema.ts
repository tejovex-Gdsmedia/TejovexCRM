import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().min(10, "Enter valid phone number"),
  company: z.string().optional(),
  deals: z.coerce.number().min(0).default(0),
});