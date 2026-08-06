import { Router } from 'express';
import {
  createFollowUp,
  getAllFollowUps,
  getFollowUpById,
  updateFollowUp,
  deleteFollowUp,
  getDashboardStats,
} from '../controllers/followup.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.use(protect);

router.get('/stats', getDashboardStats);
router.post('/', createFollowUp);
router.get('/', getAllFollowUps);
router.get('/:id', getFollowUpById);
router.patch('/:id', updateFollowUp);
router.delete('/:id', deleteFollowUp);

export default router;