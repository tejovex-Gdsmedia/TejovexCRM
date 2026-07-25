import { Response, NextFunction } from 'express';
import { dealService } from '../services/deal.service';
import {
  createDealSchema,
  updateDealSchema,
  updateDealStatusSchema,
  createPipelineStageSchema,
} from '../validators/deal.validator';
import { AuthRequest } from '../middleware/auth.middleware';
import { AppError } from '../middleware/errorhandler';

export class DealController {

  // ─── Pipeline Stages ───────────────────────

  async getAllStages(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const stages = await dealService.getAllStages();
      res.status(200).json({ success: true, data: stages });
    } catch (error) {
      next(error);
    }
  }

  async createStage(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const validatedData = createPipelineStageSchema.parse(req.body);
      const stage = await dealService.createStage(validatedData);

      res.status(201).json({
        success: true,
        message: 'Pipeline stage created successfully',
        data: stage,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteStage(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await dealService.deleteStage(req.params.id as string);
      res.status(200).json({
        success: true,
        message: 'Stage deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  // ─── Deals ─────────────────────────────────

  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const search = req.query.search as string | undefined;
      const status = req.query.status as string | undefined;
      const stageId = req.query.stageId as string | undefined;
      const deals = await dealService.getAll(search, status, stageId);

      res.status(200).json({
        success: true,
        data: deals,
        total: deals.length,
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const deal = await dealService.getById(req.params.id as string);
      res.status(200).json({ success: true, data: deal });
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError('Not authorized', 401);

      const validatedData = createDealSchema.parse(req.body);
      const deal = await dealService.create(validatedData);

      res.status(201).json({
        success: true,
        message: 'Deal created successfully',
        data: deal,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const validatedData = updateDealSchema.parse(req.body);
      const deal = await dealService.update(req.params.id as string, validatedData);

      res.status(200).json({
        success: true,
        message: 'Deal updated successfully',
        data: deal,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const validatedData = updateDealStatusSchema.parse(req.body);
      const deal = await dealService.updateStatus(req.params.id as string, validatedData);

      res.status(200).json({
        success: true,
        message: 'Deal status updated',
        data: deal,
      });
    } catch (error) {
      next(error);
    }
  }

  async moveStage(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { stageId } = req.body;
      if (!stageId) throw new AppError('stageId is required', 400);

      const deal = await dealService.moveStage(req.params.id as string, stageId);

      res.status(200).json({
        success: true,
        message: 'Deal moved to new stage',
        data: deal,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await dealService.delete(req.params.id as string);
      res.status(200).json({
        success: true,
        message: 'Deal deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const dealController = new DealController();