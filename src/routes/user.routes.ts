import { Router, Request, Response, NextFunction } from 'express';
import { userController } from '../controllers/user.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.use(protect);

router.get('/', (req: Request, res: Response, next: NextFunction) => userController.getAll(req as any, res, next));

export default router;