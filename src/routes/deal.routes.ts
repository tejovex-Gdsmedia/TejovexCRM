import { Router } from 'express';
import { dealController } from '../controllers/deal.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.use(protect);

// Pipeline stage routes
router.get('/stages', (req, res, next) => dealController.getAllStages(req as any, res, next));
router.post('/stages', (req, res, next) => dealController.createStage(req as any, res, next));
router.delete('/stages/:id', (req, res, next) => dealController.deleteStage(req as any, res, next));

// Deal routes
router.get('/', (req, res, next) => dealController.getAll(req as any, res, next));
router.get('/:id', (req, res, next) => dealController.getById(req as any, res, next));
router.post('/', (req, res, next) => dealController.create(req as any, res, next));
router.put('/:id', (req, res, next) => dealController.update(req as any, res, next));
router.patch('/:id/status', (req, res, next) => dealController.updateStatus(req as any, res, next));
router.patch('/:id/move-stage', (req, res, next) => dealController.moveStage(req as any, res, next));
router.delete('/:id', (req, res, next) => dealController.delete(req as any, res, next));

export default router;