import prisma from '../config/database';

export const EmailTemplateService = {

  async create(data: any, userId: string) {
    return await prisma.emailTemplate.create({
      data: {
        name: data.name,
        stage: data.stage,
        subject: data.subject,
        body: data.body,
        isActive: data.isActive ?? true,
        createdById: userId,
      },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  },

  async getAll(stage?: string) {
    const where: any = { deletedAt: null };
    if (stage) where.stage = stage;

    return await prisma.emailTemplate.findMany({
      where,
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: [{ stage: 'asc' }, { name: 'asc' }],
    });
  },

  async getByStage(stage: string) {
    return await prisma.emailTemplate.findMany({
      where: { stage: stage as any, isActive: true, deletedAt: null },
      orderBy: { name: 'asc' },
    });
  },

  async getById(id: string) {
    return await prisma.emailTemplate.findFirst({
      where: { id, deletedAt: null },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  },

  async update(id: string, data: any) {
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.stage !== undefined) updateData.stage = data.stage;
    if (data.subject !== undefined) updateData.subject = data.subject;
    if (data.body !== undefined) updateData.body = data.body;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    return await prisma.emailTemplate.update({
      where: { id },
      data: updateData,
    });
  },

  async delete(id: string) {
    return await prisma.emailTemplate.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  },
};