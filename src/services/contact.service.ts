import prisma from '../config/database';
import { AppError } from '../middleware/errorhandler';
import { CreateContactInput, UpdateContactInput } from '../validators/contact.validator';

export class ContactService {

  // Get all contacts — UNCHANGED
  async getAll(search?: string) {
    return prisma.contact.findMany({
      where: {
        deletedAt: null,
        ...(search && {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName:  { contains: search, mode: 'insensitive' } },
            { email:     { contains: search, mode: 'insensitive' } },
            { phone:     { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      include: { company: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Get single contact — UNCHANGED
  async getById(id: string) {
    const contact = await prisma.contact.findFirst({
      where: { id, deletedAt: null },
      include: {
        company: true,
        leads:   true,
        deals:   true,
        notes:   true,
      },
    });

    if (!contact) throw new AppError('Contact not found', 404);
    return contact;
  }

  // ── NEW: private helper — replaces duplicate company logic in create() and update()
  private async resolveCompanyId(
    data: CreateContactInput | UpdateContactInput
  ): Promise<string | undefined> {
    if (data.companyId) return data.companyId;

    if (data.companyName) {
      const trimmedName = data.companyName.trim();
      const existing = await prisma.company.findFirst({
        where: {
          name: { equals: trimmedName, mode: 'insensitive' },
          deletedAt: null,
        },
      });
      return existing
        ? existing.id
        : (await prisma.company.create({ data: { name: trimmedName } })).id;
    }

    return undefined;
  }

  // Create contact — CHANGED
  async create(data: CreateContactInput) {
    if (data.email) {
      // CHANGED: findUnique → findFirst with deletedAt: null (only checks active contacts)
      const activeContact = await prisma.contact.findFirst({
        where: { email: data.email, deletedAt: null },
      });
      if (activeContact) throw new AppError('Email already exists', 400);

      // NEW: if soft-deleted contact exists with same email → restore it
      const deletedContact = await prisma.contact.findFirst({
        where: { email: data.email, deletedAt: { not: null } },
      });

      if (deletedContact) {
        return prisma.contact.update({
          where: { id: deletedContact.id },
          data: {
            firstName: data.firstName,
            lastName:  data.lastName,
            phone:     data.phone,
            companyId: await this.resolveCompanyId(data),
            deletedAt: null,         // brings it back
            updatedAt: new Date(),
          },
          include: { company: true },
        });
      }
    }

    // Normal create — no conflict at all
    // CHANGED: inline company logic replaced with resolveCompanyId helper
    return prisma.contact.create({
      data: {
        firstName: data.firstName,
        lastName:  data.lastName,
        email:     data.email,
        phone:     data.phone,
        companyId: await this.resolveCompanyId(data),
      },
      include: { company: true },
    });
  }

  // Update contact — CHANGED: inline company logic replaced with resolveCompanyId helper
  async update(id: string, data: UpdateContactInput) {
    await this.getById(id);

    return prisma.contact.update({
      where: { id },
      data: {
        firstName: data.firstName,
        lastName:  data.lastName,
        email:     data.email,
        phone:     data.phone,
        companyId: await this.resolveCompanyId(data),
      },
      include: { company: true },
    });
  }

  // Soft delete — UNCHANGED
  async delete(id: string) {
    await this.getById(id);

    return prisma.contact.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}

export const contactService = new ContactService();