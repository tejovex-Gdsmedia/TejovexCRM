import { Router } from 'express';
import { taskController } from '../controllers/task.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.use(protect);

router.get('/my-tasks', (req, res, next) => taskController.getMyTasks(req as any, res, next));
router.get('/', (req, res, next) => taskController.getAll(req as any, res, next));
router.get('/:id', (req, res, next) => taskController.getById(req as any, res, next));
router.post('/', (req, res, next) => taskController.create(req as any, res, next));
router.put('/:id', (req, res, next) => taskController.update(req as any, res, next));
router.patch('/:id/status', (req, res, next) => taskController.updateStatus(req as any, res, next));
router.delete('/:id', (req, res, next) => taskController.delete(req as any, res, next));

export default router;