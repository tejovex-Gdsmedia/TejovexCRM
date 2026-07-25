import { Router } from 'express';
import { contactController } from '../controllers/contact.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.use(protect);

router.get('/', (req, res, next) => contactController.getAll(req as any, res, next));
router.get('/:id', (req, res, next) => contactController.getById(req as any, res, next));
router.post('/', (req, res, next) => contactController.create(req as any, res, next));
router.put('/:id', (req, res, next) => contactController.update(req as any, res, next));
router.delete('/:id', (req, res, next) => contactController.delete(req as any, res, next));

export default router;