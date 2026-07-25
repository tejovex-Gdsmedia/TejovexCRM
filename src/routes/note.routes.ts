import { Router } from 'express';
import { noteController } from '../controllers/note.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.use(protect);

router.get('/', (req, res, next) => noteController.getAll(req as any, res, next));
router.get('/:id', (req, res, next) => noteController.getById(req as any, res, next));
router.post('/', (req, res, next) => noteController.create(req as any, res, next));
router.put('/:id', (req, res, next) => noteController.update(req as any, res, next));
router.delete('/:id', (req, res, next) => noteController.delete(req as any, res, next));

export default router;