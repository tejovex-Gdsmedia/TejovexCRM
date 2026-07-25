import { Router } from 'express';
import { leadController } from '../controllers/lead.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.use(protect);

router.get('/', (req, res, next) => leadController.getAll(req as any, res, next));
router.get('/:id', (req, res, next) => leadController.getById(req as any, res, next));
router.post('/', (req, res, next) => leadController.create(req as any, res, next));
router.put('/:id', (req, res, next) => leadController.update(req as any, res, next));
router.patch('/:id/status', (req, res, next) => leadController.updateStatus(req as any, res, next));
router.patch('/:id/assign', (req, res, next) => leadController.assignTo(req as any, res, next));
router.delete('/:id', (req, res, next) => leadController.delete(req as any, res, next));

export default router;