import prisma from '../config/database';
import { AppError } from '../middleware/errorhandler';
import { CreateLeadInput, UpdateLeadInput, UpdateLeadStatusInput } from '../validators/lead.validator';
import { whatsAppService } from './whatsapp.service';
import { settingsService } from './settings.service';

export class LeadService {

async getAll(userId: string, search?: string, status?: string) {   
   return prisma.lead.findMany({
where: {
  deletedAt: null,
  createdById: userId,
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

async getById(id: string, userId: string) {
      const lead = await prisma.lead.findFirst({
where: { id, deletedAt: null, createdById: userId },
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
    const lead = await prisma.lead.create({
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

    // WhatsApp auto-send — runs after lead is safely created
    try {
      const settings = await settingsService.getSettings();
      if (settings.whatsappEnabled && lead.phone) {
        await whatsAppService.sendTemplateMessage(
          lead.phone,
          lead.contactName || lead.title
        );
        await prisma.lead.update({
          where: { id: lead.id },
          data: { whatsappSentAt: new Date() },
        });
      }
    } catch (err) {
      // Never block lead creation if WhatsApp fails
      console.error('⚠️ WhatsApp send failed (lead still created):', err);
    }

    return lead;
  }

async update(id: string, userId: string, data: UpdateLeadInput) {
  await this.getById(id, userId);

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

async updateStatus(id: string, userId: string, data: UpdateLeadStatusInput) {
  await this.getById(id, userId);

    return prisma.lead.update({
      where: { id },
      data: { status: data.status },
    });
  }

async assignTo(id: string, userId: string, assignedToId?: string, assignedToName?: string) {
  await this.getById(id, userId);

  return prisma.lead.update({
    where: { id },
    data: {
      ...(assignedToId && { assignedToId }),
      ...(assignedToName !== undefined && { assignedToName }),
    },
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

async delete(id: string, userId: string) {
  await this.getById(id, userId);

    return prisma.lead.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}

export const leadService = new LeadService();