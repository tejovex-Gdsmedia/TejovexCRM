import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.use(protect);

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

export default router;