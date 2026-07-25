import { Response, NextFunction } from 'express';
import { leadService } from '../services/lead.service';
import { createLeadSchema, updateLeadSchema, updateLeadStatusSchema } from '../validators/lead.validator';
import { AuthRequest } from '../middleware/auth.middleware';
import { AppError } from '../middleware/errorhandler';

export class LeadController {

  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const search = req.query.search as string | undefined;
      const status = req.query.status as string | undefined;
      const leads = await leadService.getAll(search, status);

      res.status(200).json({
        success: true,
        data: leads,
        total: leads.length,
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const lead = await leadService.getById(req.params.id as string);

      res.status(200).json({
        success: true,
        data: lead,
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError('Not authorized', 401);

      const validatedData = createLeadSchema.parse(req.body);
      const lead = await leadService.create(validatedData, req.user.userId);

      res.status(201).json({
        success: true,
        message: 'Lead created successfully',
        data: lead,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const validatedData = updateLeadSchema.parse(req.body);
      const lead = await leadService.update(req.params.id as string, validatedData);

      res.status(200).json({
        success: true,
        message: 'Lead updated successfully',
        data: lead,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const validatedData = updateLeadStatusSchema.parse(req.body);
      const lead = await leadService.updateStatus(req.params.id as string, validatedData);

      res.status(200).json({
        success: true,
        message: 'Lead status updated successfully',
        data: lead,
      });
    } catch (error) {
      next(error);
    }
  }

  async assignTo(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { assignedToId } = req.body;
      if (!assignedToId) throw new AppError('assignedToId is required', 400);

      const lead = await leadService.assignTo(req.params.id as string, assignedToId);

      res.status(200).json({
        success: true,
        message: 'Lead assigned successfully',
        data: lead,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await leadService.delete(req.params.id as string);

      res.status(200).json({
        success: true,
        message: 'Lead deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const leadController = new LeadController();