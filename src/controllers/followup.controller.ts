import { Request, Response } from 'express';
import { z } from 'zod';
import { FollowUpService } from '../services/followup.service';
import { createFollowUpSchema, updateFollowUpSchema } from '../validators/followup.validator';

export const createFollowUp = async (req: Request, res: Response) => {
  try {
    const data = createFollowUpSchema.parse(req.body);
    const userId = (req as any).user?.id;
    const followUp = await FollowUpService.create(data, userId);
    res.status(201).json({ success: true, message: 'Follow-up created', data: followUp });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, errors: err.issues });
    }
    res.status(500).json({ success: false, message: (err as Error).message });
  }
};

export const getAllFollowUps = async (req: Request, res: Response) => {
  try {
    const { status, type, leadId, contactId, dealId } = req.query as Record<string, string>;
    const followUps = await FollowUpService.getAll({ status, type, leadId, contactId, dealId });
    res.json({ success: true, data: followUps });
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
  }
};

export const getFollowUpById = async (req: Request, res: Response) => {
  try {
    const followUp = await FollowUpService.getById(req.params.id as string);
    if (!followUp) return res.status(404).json({ success: false, message: 'Follow-up not found' });
    res.json({ success: true, data: followUp });
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
  }
};

export const updateFollowUp = async (req: Request, res: Response) => {
  try {
    const data = updateFollowUpSchema.parse(req.body);
    const followUp = await FollowUpService.update(req.params.id as string, data);
    res.json({ success: true, message: 'Follow-up updated', data: followUp });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, errors: err.issues });
    }
    res.status(500).json({ success: false, message: (err as Error).message });
  }
};

export const deleteFollowUp = async (req: Request, res: Response) => {
  try {
    await FollowUpService.delete(req.params.id as string);
    res.json({ success: true, message: 'Follow-up deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
  }
};

export const getDashboardStats = async (_req: Request, res: Response) => {
  try {
    const todayCount = await FollowUpService.getTodayCount();
    const overdueCount = await FollowUpService.getOverdueCount();
    res.json({ success: true, data: { todayCount, overdueCount } });
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
  }
};