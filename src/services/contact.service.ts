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

  // Create contact — CHANGED
  async create(data: CreateContactInput) {
    // Email duplicate check — KEPT
    if (data.email) {
      const existing = await prisma.contact.findUnique({
        where: { email: data.email },
      });
      if (existing) throw new AppError('Email already exists', 400);
    }

    // ── NEW: find or create company from typed name ───────────
    let companyId = data.companyId;

    if (data.companyName && !companyId) {
      const trimmedName = data.companyName.trim();

      const existingCompany = await prisma.company.findFirst({
        where: {
          name: { equals: trimmedName, mode: 'insensitive' },
          deletedAt: null,
        },
      });

      companyId = existingCompany
        ? existingCompany.id
        : (await prisma.company.create({ data: { name: trimmedName } })).id;
    }
    // ─────────────────────────────────────────────────────────

    // Explicit fields instead of spreading data (companyName must be excluded)
    return prisma.contact.create({
      data: {
        firstName: data.firstName,
        lastName:  data.lastName,
        email:     data.email,
        phone:     data.phone,
        companyId,
      },
      include: { company: true },
    });
  }

  // Update contact — CHANGED
  async update(id: string, data: UpdateContactInput) {
    await this.getById(id);

    // ── NEW: find or create company from typed name ───────────
    let companyId = data.companyId;

    if (data.companyName && !companyId) {
      const trimmedName = data.companyName.trim();

      const existingCompany = await prisma.company.findFirst({
        where: {
          name: { equals: trimmedName, mode: 'insensitive' },
          deletedAt: null,
        },
      });

      companyId = existingCompany
        ? existingCompany.id
        : (await prisma.company.create({ data: { name: trimmedName } })).id;
    }
    // ─────────────────────────────────────────────────────────

    return prisma.contact.update({
      where: { id },
      data: {
        firstName: data.firstName,
        lastName:  data.lastName,
        email:     data.email,
        phone:     data.phone,
        companyId,
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