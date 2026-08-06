import { Router } from 'express';
import {
  createEmailTemplate,
  getAllEmailTemplates,
  getEmailTemplatesByStage,
  getEmailTemplateById,
  updateEmailTemplate,
  deleteEmailTemplate,
} from '../controllers/emailTemplate.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.use(protect);

router.get('/by-stage/:stage', getEmailTemplatesByStage);
router.post('/', createEmailTemplate);
router.get('/', getAllEmailTemplates);
router.get('/:id', getEmailTemplateById);
router.patch('/:id', updateEmailTemplate);
router.delete('/:id', deleteEmailTemplate);

export default router;