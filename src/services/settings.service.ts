import prisma from '../config/database';
import { UpdateSettingsInput } from '../validators/settings.validator';

export class SettingsService {
  async getSettings() {
    return prisma.crmSettings.upsert({
      where: { id: 'global' },
      create: { id: 'global' },
      update: {},
    });
  }

  async updateSettings(data: UpdateSettingsInput) {
    return prisma.crmSettings.upsert({
      where: { id: 'global' },
      create: { id: 'global', ...data },
      update: data,
    });
  }
}

export const settingsService = new SettingsService();