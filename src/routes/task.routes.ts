import { Router, Request, Response, NextFunction } from 'express';
import { taskController } from '../controllers/task.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.use(protect);

router.get('/my-tasks', (req: Request, res: Response, next: NextFunction) => taskController.getMyTasks(req as any, res, next));
router.get('/', (req: Request, res: Response, next: NextFunction) => taskController.getAll(req as any, res, next));
router.get('/:id', (req: Request, res: Response, next: NextFunction) => taskController.getById(req as any, res, next));
router.post('/', (req: Request, res: Response, next: NextFunction) => taskController.create(req as any, res, next));
router.put('/:id', (req: Request, res: Response, next: NextFunction) => taskController.update(req as any, res, next));
router.patch('/:id/status', (req: Request, res: Response, next: NextFunction) => taskController.updateStatus(req as any, res, next));
router.delete('/:id', (req: Request, res: Response, next: NextFunction) => taskController.delete(req as any, res, next));

export default router;