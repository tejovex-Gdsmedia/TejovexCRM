import prisma from '../config/database';
import { sendEmail, substituteVariables } from './email.service';

const buildVariables = async (
  leadId?: string | null,
  contactId?: string | null,
  dealId?: string | null,
  userId?: string
): Promise<Record<string, string>> => {
  const vars: Record<string, string> = {};

  if (leadId) {
    const lead = await prisma.lead.findFirst({ where: { id: leadId } });
    if (lead) {
      const parts = (lead.contactName || lead.title || '').split(' ');
      vars['lead.firstName'] = parts[0] || '';
      vars['lead.lastName'] = parts.slice(1).join(' ') || '';
      vars['lead.name'] = lead.contactName || lead.title || '';
      vars['lead.title'] = lead.title || '';
      vars['lead.email'] = lead.email || '';
      vars['lead.phone'] = lead.phone || '';
      vars['lead.company'] = '';
    }
  }

  if (contactId) {
    const contact = await prisma.contact.findFirst({ where: { id: contactId } });
    if (contact) {
      vars['contact.firstName'] = contact.firstName || '';
      vars['contact.lastName'] = contact.lastName || '';
      vars['contact.name'] = `${contact.firstName} ${contact.lastName}`.trim();
      vars['contact.email'] = contact.email || '';
      vars['contact.phone'] = contact.phone || '';
      vars['contact.company'] = '';
    }
  }

  if (dealId) {
    const deal = await prisma.deal.findFirst({ where: { id: dealId } });
    if (deal) {
      vars['deal.name'] = deal.title || '';
      vars['deal.value'] = String(deal.value || '');
    }
  }

  if (userId) {
    const user = await prisma.user.findFirst({ where: { id: userId } });
    if (user) {
      vars['user.firstName'] = user.firstName || '';
      vars['user.lastName'] = user.lastName || '';
      vars['user.name'] = `${user.firstName} ${user.lastName}`.trim();
      vars['user.email'] = user.email || '';
    }
  }

  return vars;
};

export const FollowUpService = {

  async create(data: any, userId: string) {
    let emailSubject = data.emailSubject || null;
    let emailBody = data.emailBody || null;

    if (data.type === 'EMAIL' && (emailSubject || emailBody)) {
      const vars = await buildVariables(data.leadId, data.contactId, data.dealId, userId);
      if (emailSubject) emailSubject = substituteVariables(emailSubject, vars);
      if (emailBody) emailBody = substituteVariables(emailBody, vars);
    }

    return await prisma.followUp.create({
      data: {
        title: data.title,
        type: data.type,
        priority: data.priority || 'MEDIUM',
        dueDate: new Date(data.dueDate),
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
        emailStage: data.emailStage || null,
        emailTemplateId: data.emailTemplateId || null,
        emailSubject,
        emailBody,
        leadId: data.leadId || null,
        contactId: data.contactId || null,
        dealId: data.dealId || null,
        assignedToId: data.assignedToId || null,
        createdById: userId,
      },
      include: {
        lead: { select: { id: true, title: true, contactName: true } },
        contact: { select: { id: true, firstName: true, lastName: true } },
        deal: { select: { id: true, title: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        emailTemplate: { select: { id: true, name: true, stage: true } },
      },
    });
  },

  async getAll(filters: {
    status?: string;
    type?: string;
    leadId?: string;
    contactId?: string;
    dealId?: string;
  } = {}) {
    const where: any = { deletedAt: null };
    if (filters.status) where.status = filters.status;
    if (filters.type) where.type = filters.type;
    if (filters.leadId) where.leadId = filters.leadId;
    if (filters.contactId) where.contactId = filters.contactId;
    if (filters.dealId) where.dealId = filters.dealId;

    return await prisma.followUp.findMany({
      where,
      include: {
        lead: { select: { id: true, title: true, contactName: true } },
        contact: { select: { id: true, firstName: true, lastName: true } },
        deal: { select: { id: true, title: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        emailTemplate: { select: { id: true, name: true, stage: true } },
      },
      orderBy: { dueDate: 'asc' },
    });
  },

  async getById(id: string) {
    return await prisma.followUp.findFirst({
      where: { id, deletedAt: null },
      include: {
        lead: { select: { id: true, title: true, contactName: true } },
        contact: { select: { id: true, firstName: true, lastName: true } },
        deal: { select: { id: true, title: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        emailTemplate: true,
      },
    });
  },

  async update(id: string, data: any) {
    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.dueDate !== undefined) updateData.dueDate = new Date(data.dueDate);
    if (data.scheduledAt !== undefined) updateData.scheduledAt = data.scheduledAt ? new Date(data.scheduledAt) : null;
    if (data.completionNote !== undefined) updateData.completionNote = data.completionNote;
    if (data.emailSubject !== undefined) updateData.emailSubject = data.emailSubject;
    if (data.emailBody !== undefined) updateData.emailBody = data.emailBody;
    if (data.assignedToId !== undefined) updateData.assignedToId = data.assignedToId;

    if (data.status === 'COMPLETED') {
      updateData.completedAt = new Date();
    }

    return await prisma.followUp.update({
      where: { id },
      data: updateData,
      include: {
        lead: { select: { id: true, title: true, contactName: true } },
        contact: { select: { id: true, firstName: true, lastName: true } },
        deal: { select: { id: true, title: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
        emailTemplate: { select: { id: true, name: true } },
      },
    });
  },

  async delete(id: string) {
    return await prisma.followUp.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  },

  async markOverdue() {
    const now = new Date();
    return await prisma.followUp.updateMany({
      where: {
        status: 'PENDING',
        dueDate: { lt: now },
        deletedAt: null,
      },
      data: { status: 'OVERDUE' },
    });
  },

  async sendScheduledEmails() {
    const now = new Date();
    const scheduled = await prisma.followUp.findMany({
      where: {
        type: 'EMAIL',
        status: 'PENDING',
        scheduledAt: { lte: now },
        emailSentAt: null,
        deletedAt: null,
      },
      include: {
        lead: true,
        contact: true,
      },
    });

    for (const followUp of scheduled) {
      try {
        const toEmail =
          followUp.lead?.email ||
          followUp.contact?.email;

        if (toEmail && followUp.emailSubject && followUp.emailBody) {
          await sendEmail(toEmail, followUp.emailSubject, followUp.emailBody);
          await prisma.followUp.update({
            where: { id: followUp.id },
            data: {
              emailSentAt: new Date(),
              status: 'COMPLETED',
              completedAt: new Date(),
            },
          });
        }
      } catch (err) {
        console.error(`Failed to send scheduled email for followup ${followUp.id}:`, err);
      }
    }
  },

  async getTodayCount() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return await prisma.followUp.count({
      where: {
        status: 'PENDING',
        dueDate: { gte: today, lt: tomorrow },
        deletedAt: null,
      },
    });
  },

  async getOverdueCount() {
    return await prisma.followUp.count({
      where: { status: 'OVERDUE', deletedAt: null },
    });
  },
};