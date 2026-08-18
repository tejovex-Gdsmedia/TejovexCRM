import { Router } from 'express';
import {
  listPredictions,
  getPredictions,
  triggerDealPrediction,
  triggerLeadPrediction,
  triggerRevenueForecast
} from '../controllers/predictions.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.get('/', protect, listPredictions);
router.get('/:entityType/:entityId', protect, getPredictions);
router.post('/deal', protect, triggerDealPrediction);
router.post('/lead', protect, triggerLeadPrediction);
router.post('/revenue', protect, triggerRevenueForecast);

export default router;