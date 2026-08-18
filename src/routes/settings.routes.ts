import { Router, Request, Response, NextFunction } from 'express';
import { settingsController } from '../controllers/settings.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.use(protect);

router.get('/', (req: Request, res: Response, next: NextFunction) =>
  settingsController.getSettings(req, res, next)
);
router.patch('/', (req: Request, res: Response, next: NextFunction) =>
  settingsController.updateSettings(req, res, next)
);

export default router;