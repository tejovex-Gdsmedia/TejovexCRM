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

// PATCH /reorder — update order of stages
router.patch('/reorder', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { stages } = req.body;
    // stages = [{ id: "uuid1", order: 1 }, { id: "uuid2", order: 2 }]

    if (!Array.isArray(stages)) {
      res.status(400).json({ success: false, message: 'stages must be an array' });
      return;
    }

    // Update order for each stage
    for (const stage of stages) {
      await prisma.pipelineStage.update({
        where: { id: stage.id },
        data: { order: stage.order },
      });
    }

    const updated = await prisma.pipelineStage.findMany({
      orderBy: { order: 'asc' },
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

// POST /sync — wipes all stages and replaces with what frontend sends
router.post('/sync', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { stages } = req.body;
    // stages = ["Prospecting", "Demo", "Closed"] — array of strings from frontend

    if (!Array.isArray(stages)) {
     res.status(400).json({ success: false, message: 'stages must be an array' });
  return;
}
// Check if any stage being removed has deals linked to it
    const existingStages = await prisma.pipelineStage.findMany();
    const removedStages = existingStages.filter(s => !stages.includes(s.name));
    
    for (const stage of removedStages) {
      const dealCount = await prisma.deal.count({ where: { stageId: stage.id, deletedAt: null } });
      if (dealCount > 0) {  
        res.status(400).json({ success: false, message: `Stage "${stage.name}" has ${dealCount} deal(s). Move or delete them first.` });
        return;
      }
    }

// Only delete stages that are being removed
    for (const stage of removedStages) {
      // Unlink soft deleted deals from this stage
      await prisma.deal.updateMany({
        where: { stageId: stage.id, deletedAt: { not: null } },
        data: { stageId: null },
      });
      await prisma.pipelineStage.delete({ where: { id: stage.id } });
    }

    // Add new stages that don't exist yet
    const existingNames = existingStages.map(s => s.name);
    const newStages = stages.filter((name: string) => !existingNames.includes(name));
    if (newStages.length > 0) {
      await prisma.pipelineStage.createMany({
        data: newStages.map((name: string, index: number) => ({
          name,
          order: existingStages.length + index + 1,
        })),
      });
    }

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