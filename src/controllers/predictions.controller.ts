import { Request, Response } from 'express';
import { getAllPredictions, getPredictionsByEntity } from '../services/predictions.service';
import { predictDeal, predictLead, predictRevenue } from '../services/chat.service';
import prisma from '../config/database';

interface MLResult {
  score?: number;
  label?: string;
  reasoning?: string;
  [key: string]: any;
}

export const listPredictions = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const predictions = await getAllPredictions(userId);
    return res.status(200).json({ success: true, data: predictions });
  } catch (error: any) {
    console.error('Predictions error:', error.message);
    return res.status(500).json({ success: false, error: 'Failed to fetch predictions' });
  }
};

export const getPredictions = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const entityType = req.params.entityType as string;
    const entityId = req.params.entityId as string;
    const predictions = await getPredictionsByEntity(entityType, entityId, userId);
    return res.status(200).json({ success: true, data: predictions });
  } catch (error: any) {
    console.error('Predictions error:', error.message);
    return res.status(500).json({ success: false, error: 'Failed to fetch predictions' });
  }
};

export const triggerDealPrediction = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { id, title, value, probability, stage,
            follow_up_count, days_in_stage,
            has_note, has_task, assigned } = req.body;

    if (!id || !title || !value || !stage) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const result = await predictDeal({
      id, title, value, probability, stage,
      follow_up_count, days_in_stage,
      has_note, has_task, assigned
    }) as MLResult;

    // Save to DB
    await prisma.prediction.upsert({
      where: { id: `${id}_WIN_PROBABILITY` },
      update: {
        score: result.score,
        label: result.label,
        reasoning: result.reasoning,
        updatedAt: new Date(),
      },
      create: {
        id: `${id}_WIN_PROBABILITY`,
        entityType: 'DEAL',
        entityId: id,
        type: 'WIN_PROBABILITY',
        score: result.score,
        label: result.label,
        reasoning: result.reasoning,
        userId,
      },
    });

    return res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    console.error('Deal prediction error:', error.message);
    return res.status(500).json({ success: false, error: 'Prediction failed' });
  }
};

export const triggerLeadPrediction = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { id, title, value, source,
            follow_up_count, days_since_created, assigned } = req.body;

    if (!id || !title || !value || !source) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const result = await predictLead({
      id, title, value, source,
      follow_up_count, days_since_created, assigned
    }) as MLResult;

    // Save to DB
    await prisma.prediction.upsert({
      where: { id: `${id}_CONVERSION_SCORE` },
      update: {
        score: result.score,
        label: result.label,
        reasoning: result.reasoning,
        updatedAt: new Date(),
      },
      create: {
        id: `${id}_CONVERSION_SCORE`,
        entityType: 'LEAD',
        entityId: id,
        type: 'CONVERSION_SCORE',
        score: result.score,
        label: result.label,
        reasoning: result.reasoning,
        userId,
      },
    });

    return res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    console.error('Lead prediction error:', error.message);
    return res.status(500).json({ success: false, error: 'Prediction failed' });
  }
};

export const triggerRevenueForecast = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const result = await predictRevenue() as MLResult;

    // Save to DB
    await prisma.prediction.upsert({
      where: { id: `${userId}_REVENUE_FORECAST` },
      update: {
        metadata: result as any,
        updatedAt: new Date(),
      },
      create: {
        id: `${userId}_REVENUE_FORECAST`,
        entityType: 'GLOBAL',
        entityId: userId,
        type: 'REVENUE_FORECAST',
        metadata: result as any ,
        userId,
      },
    });

    return res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    console.error('Revenue forecast error:', error.message);
    return res.status(500).json({ success: false, error: 'Forecast failed' });
  }
};