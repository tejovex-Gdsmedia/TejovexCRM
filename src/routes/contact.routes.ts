import { Router, Request, Response, NextFunction } from 'express';
import { contactController } from '../controllers/contact.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.use(protect);
router.post('/import', (req: Request, res: Response, next: NextFunction) => contactController.importContacts(req as any, res, next));
router.get('/', (req: Request, res: Response, next: NextFunction) => contactController.getAll(req as any, res, next));
router.get('/:id', (req: Request, res: Response, next: NextFunction) => contactController.getById(req as any, res, next));
router.post('/', (req: Request, res: Response, next: NextFunction) => contactController.create(req as any, res, next));
router.put('/:id', (req: Request, res: Response, next: NextFunction) => contactController.update(req as any, res, next));
router.delete('/:id', (req: Request, res: Response, next: NextFunction) => contactController.delete(req as any, res, next));

export default router;