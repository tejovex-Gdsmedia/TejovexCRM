import { Request, Response, NextFunction } from 'express';
import { settingsService } from '../services/settings.service';
import { UpdateSettingsSchema } from '../validators/settings.validator';

export class SettingsController {
  async getSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.userId;
      const settings = await settingsService.getSettings(userId);
      res.json({ success: true, data: settings });
    } catch (error) {
      next(error);
    }
  }

  async updateSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.userId;
      const data = UpdateSettingsSchema.parse(req.body);
      const settings = await settingsService.updateSettings(userId, data);
      res.json({ success: true, data: settings });
    } catch (error) {
      next(error);
    }
  }
}

export const settingsController = new SettingsController();