import cron from 'node-cron';
import { FollowUpService } from '../services/followup.service';

export const startFollowUpCron = () => {

  // Runs every day at midnight — marks overdue follow-ups
  cron.schedule('0 0 * * *', async () => {  
    try {
      const result = await FollowUpService.markOverdue();
      console.log(`[CRON] Overdue check complete. Marked: ${result.count}`);
    } catch (err) {
      console.error('[CRON] Overdue check failed:', err);
    }
  });

  // Runs every hour — sends scheduled emails
  cron.schedule('0 * * * *', async () => {
    try {
      await FollowUpService.sendScheduledEmails();
      console.log('[CRON] Scheduled email check complete');
    } catch (err) {
      console.error('[CRON] Scheduled email send failed:', err);
    }
  });

  console.log('[CRON] Follow-up cron jobs started');
};