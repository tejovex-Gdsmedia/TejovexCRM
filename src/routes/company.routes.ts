// import { Router } from 'express';
// import { companyController } from '../controllers/company.controller';
// import { protect } from '../middleware/auth.middleware';


// const router = Router();

// router.use(protect);

// router.get('/', (req, res, next) => companyController.getAll(req as any, res, next));
// router.get('/:id', (req, res, next) => companyController.getById(req as any, res, next));
// router.post('/', (req, res, next) => companyController.create(req as any, res, next));
// router.put('/:id', (req, res, next) => companyController.update(req as any, res, next));
// router.delete('/:id', (req, res, next) => companyController.delete(req as any, res, next));

// export default router;


import { Router, Request, Response, NextFunction } from 'express';
import { companyController } from '../controllers/company.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.use(protect);

router.get('/', (req: Request, res: Response, next: NextFunction) => companyController.getAll(req as any, res, next));
router.get('/:id', (req: Request, res: Response, next: NextFunction) => companyController.getById(req as any, res, next));
router.post('/', (req: Request, res: Response, next: NextFunction) => companyController.create(req as any, res, next));
router.put('/:id', (req: Request, res: Response, next: NextFunction) => companyController.update(req as any, res, next));
router.delete('/:id', (req: Request, res: Response, next: NextFunction) => companyController.delete(req as any, res, next));

export default router;