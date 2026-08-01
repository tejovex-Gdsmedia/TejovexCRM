import prisma from '../config/database';
import { AppError } from '../middleware/errorhandler';
import { CreateNoteInput, UpdateNoteInput } from '../validators/note.validator';

export class NoteService {

  async getAll(contactId?: string, leadId?: string, dealId?: string) {
    return prisma.note.findMany({
      where: {
        ...(contactId && { contactId }),
        ...(leadId && { leadId }),
        ...(dealId && { dealId }),
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        lead: {
          select: {
            id: true,
            title: true,
          },
        },
        deal: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getById(id: string) {
    const note = await prisma.note.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        lead: {
          select: { id: true, title: true },
        },
        deal: {
          select: { id: true, title: true },
        },
      },
    });

    if (!note) throw new AppError('Note not found', 404);
    return note;
  }

  async create(data: CreateNoteInput, createdById: string) {
    return prisma.note.create({
      data: {
        ...data,
        createdById,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async update(id: string, data: UpdateNoteInput, userId: string) {
    const note = await this.getById(id);

    // Only the person who created the note can edit it
    if (note.createdById !== userId) {
      throw new AppError('You can only edit your own notes', 403);
    }

    return prisma.note.update({
      where: { id },
      data: { content: data.content },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

async delete(id: string, userId: string) {
  const note = await this.getById(id);
  return prisma.note.delete({ where: { id } });
}
}

export const noteService = new NoteService();