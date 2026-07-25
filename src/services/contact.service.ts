import prisma from '../config/database';
import { AppError } from '../middleware/errorhandler';
import { CreateContactInput, UpdateContactInput } from '../validators/contact.validator';

export class ContactService {

  // Get all contacts
  async getAll(search?: string) {
    return prisma.contact.findMany({
      where: {
        deletedAt: null,
        ...(search && {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      include: { company: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Get single contact
  async getById(id: string) {
    const contact = await prisma.contact.findFirst({
      where: { id, deletedAt: null },
      include: {
        company: true,
        leads: true,
        deals: true,
        notes: true,
      },
    });

    if (!contact) throw new AppError('Contact not found', 404);
    return contact;
  }

  // Create contact
  async create(data: CreateContactInput) {
    if (data.email) {
      const existing = await prisma.contact.findUnique({
        where: { email: data.email },
      });
      if (existing) throw new AppError('Email already exists', 400);
    }

    return prisma.contact.create({
      data,
      include: { company: true },
    });
  }

  // Update contact
  async update(id: string, data: UpdateContactInput) {
    await this.getById(id);

    return prisma.contact.update({
      where: { id },
      data,
      include: { company: true },
    });
  }

  // Soft delete contact
  async delete(id: string) {
    await this.getById(id);

    return prisma.contact.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}

export const contactService = new ContactService();