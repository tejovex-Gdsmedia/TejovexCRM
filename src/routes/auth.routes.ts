// import { Router } from 'express';
// import { authController } from '../controllers/auth.controller';
// import { protect } from '../middleware/auth.middleware';

// const router = Router();

// router.post('/register', authController.register);
// router.post('/login', authController.login);
// router.get('/me', protect, authController.getMe);

// export default router;


import { Router, Request, Response, NextFunction } from 'express';
import { authController } from '../controllers/auth.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', (req: Request, res: Response, next: NextFunction) => authController.register(req, res, next));
router.post('/login', (req: Request, res: Response, next: NextFunction) => authController.login(req, res, next));
router.get('/me', protect, (req: Request, res: Response, next: NextFunction) => authController.getMe(req as any, res, next));

export default router;