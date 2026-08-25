import prisma from '../config/database';
import { UpdateSettingsInput } from '../validators/settings.validator';

export class SettingsService {
  async getSettings(userId: string) {
    return prisma.crmSettings.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });
  }

  async updateSettings(userId: string, data: UpdateSettingsInput) {
    return prisma.crmSettings.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });
  }
}

export const settingsService = new SettingsService();