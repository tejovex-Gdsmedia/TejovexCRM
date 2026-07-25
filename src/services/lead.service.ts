import prisma from '../config/database';
import { AppError } from '../middleware/errorhandler';
import { CreateLeadInput, UpdateLeadInput, UpdateLeadStatusInput } from '../validators/lead.validator';

export class LeadService {

  async getAll(search?: string, status?: string) {
    return prisma.lead.findMany({
      where: {
        deletedAt: null,
        ...(status && { status: status as any }),
        ...(search && {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      include: {
        contact: true,
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            tasks: true,
            notes: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getById(id: string) {
    const lead = await prisma.lead.findFirst({
      where: { id, deletedAt: null },
      include: {
        contact: true,
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        tasks: {
          where: { deletedAt: null },
        },
        notes: true,
      },
    });

    if (!lead) throw new AppError('Lead not found', 404);
    return lead;
  }

  async create(data: CreateLeadInput, createdById: string) {
    return prisma.lead.create({
      data: {
        ...data,
        createdById,
      },
      include: {
        contact: true,
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  async update(id: string, data: UpdateLeadInput) {
    await this.getById(id);

    return prisma.lead.update({
      where: { id },
      data,
      include: {
        contact: true,
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  async updateStatus(id: string, data: UpdateLeadStatusInput) {
    await this.getById(id);

    return prisma.lead.update({
      where: { id },
      data: { status: data.status },
    });
  }

  async assignTo(id: string, assignedToId: string) {
    await this.getById(id);

    return prisma.lead.update({
      where: { id },
      data: { assignedToId },
      include: {
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  async delete(id: string) {
    await this.getById(id);

    return prisma.lead.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}

export const leadService = new LeadService();