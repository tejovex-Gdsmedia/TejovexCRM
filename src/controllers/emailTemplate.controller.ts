import { Request, Response } from 'express';
import { z } from 'zod';
import { EmailTemplateService } from '../services/emailTemplate.service';
import { createEmailTemplateSchema, updateEmailTemplateSchema } from '../validators/emailTemplate.validator';

export const createEmailTemplate = async (req: Request, res: Response) => {
  try {
    const data = createEmailTemplateSchema.parse(req.body);
    const userId = (req as any).user?.userId;
    const template = await EmailTemplateService.create(data, userId);
    res.status(201).json({ success: true, message: 'Template created', data: template });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, errors: err.issues });
    }
    res.status(500).json({ success: false, message: (err as Error).message });
  }
};

export const getAllEmailTemplates = async (req: Request, res: Response) => {
  try {
    const { stage } = req.query as { stage?: string };
    const templates = await EmailTemplateService.getAll(stage);
    res.json({ success: true, data: templates });
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
  }
};

export const getEmailTemplatesByStage = async (req: Request, res: Response) => {
  try {
    const templates = await EmailTemplateService.getByStage(req.params.stage as string);
    res.json({ success: true, data: templates });
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
  }
};

export const getEmailTemplateById = async (req: Request, res: Response) => {
  try {
    const template = await EmailTemplateService.getById(req.params.id as string);
    if (!template) return res.status(404).json({ success: false, message: 'Template not found' });
    res.json({ success: true, data: template });
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
  }
};

export const updateEmailTemplate = async (req: Request, res: Response) => {
  try {
    const data = updateEmailTemplateSchema.parse(req.body);
    const template = await EmailTemplateService.update(req.params.id as string, data);
    res.json({ success: true, message: 'Template updated', data: template });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, errors: err.issues });
    }
    res.status(500).json({ success: false, message: (err as Error).message });
  }
};

export const deleteEmailTemplate = async (req: Request, res: Response) => {
  try {
    await EmailTemplateService.delete(req.params.id as string);
    res.json({ success: true, message: 'Template deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
  }
};