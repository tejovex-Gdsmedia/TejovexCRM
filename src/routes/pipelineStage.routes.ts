import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { protect } from '../middleware/auth.middleware';

const router = Router();
router.use(protect);

// GET all stages — already existed
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stages = await prisma.pipelineStage.findMany({
      orderBy: { order: 'asc' },
    });
    res.json({ success: true, data: stages });
  } catch (err) {
    next(err);
  }
});

// POST /sync — wipes all stages and replaces with what frontend sends
router.post('/sync', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { stages } = req.body;
    // stages = ["Prospecting", "Demo", "Closed"] — array of strings from frontend

    if (!Array.isArray(stages) || stages.length === 0) {
      res.status(400).json({ success: false, message: 'stages array is required and cannot be empty' });
      return;
    }

    // Delete all existing stages
    await prisma.pipelineStage.deleteMany({});

    // Re-insert only what frontend sent
    await prisma.pipelineStage.createMany({
      data: stages.map((name: string, index: number) => ({
        name,
        order: index + 1,
      })),
    });

    const updated = await prisma.pipelineStage.findMany({
      orderBy: { order: 'asc' },
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

// DELETE /:id — delete a single stage by id
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    await prisma.pipelineStage.delete({
      where: { id },
    });

    res.json({ success: true, message: 'Stage deleted' });
  } catch (err) {
    next(err);
  }
});

export default router;