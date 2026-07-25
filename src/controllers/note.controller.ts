import { Response, NextFunction } from 'express';
import { noteService } from '../services/note.service';
import { createNoteSchema, updateNoteSchema } from '../validators/note.validator';
import { AuthRequest } from '../middleware/auth.middleware';
import { AppError } from '../middleware/errorhandler';

export class NoteController {

  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const contactId = req.query.contactId as string | undefined;
      const leadId = req.query.leadId as string | undefined;
      const dealId = req.query.dealId as string | undefined;

      const notes = await noteService.getAll(contactId, leadId, dealId);

      res.status(200).json({
        success: true,
        data: notes,
        total: notes.length,
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const note = await noteService.getById(req.params.id as string);

      res.status(200).json({
        success: true,
        data: note,
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError('Not authorized', 401);

      const validatedData = createNoteSchema.parse(req.body);
      const note = await noteService.create(validatedData, req.user.userId);

      res.status(201).json({
        success: true,
        message: 'Note created successfully',
        data: note,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError('Not authorized', 401);

      const validatedData = updateNoteSchema.parse(req.body);
      const note = await noteService.update(
        req.params.id as string,
        validatedData,
        req.user.userId
      );

      res.status(200).json({
        success: true,
        message: 'Note updated successfully',
        data: note,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError('Not authorized', 401);

      await noteService.delete(req.params.id as string, req.user.userId);

      res.status(200).json({
        success: true,
        message: 'Note deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const noteController = new NoteController();