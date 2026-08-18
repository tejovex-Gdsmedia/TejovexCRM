import { Request, Response, NextFunction } from 'express';
import { settingsService } from '../services/settings.service';
import { UpdateSettingsSchema } from '../validators/settings.validator';

export class SettingsController {
  async getSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const settings = await settingsService.getSettings();
      res.json({ success: true, data: settings });
    } catch (error) {
      next(error);
    }
  }

  async updateSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const data = UpdateSettingsSchema.parse(req.body);
      const settings = await settingsService.updateSettings(data);
      res.json({ success: true, data: settings });
    } catch (error) {
      next(error);
    }
  }
}

export const settingsController = new SettingsController();