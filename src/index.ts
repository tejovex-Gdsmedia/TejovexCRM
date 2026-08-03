import express from 'express';
import cors from 'cors';
import { config } from './config/env';
import prisma from './config/database';
import { errorHandler } from './middleware/errorhandler';
import authRoutes from './routes/auth.routes';
import contactRoutes from './routes/contact.routes';
import companyRoutes from './routes/company.routes';
import leadRoutes from './routes/lead.routes';
import dealRoutes from './routes/deal.routes';
import taskRoutes from './routes/task.routes';
import noteRoutes from './routes/note.routes';
import pipelineStageRoutes from './routes/pipelineStage.routes';
import userRoutes from './routes/user.routes';


const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/contacts', contactRoutes);
app.use('/api/v1/companies', companyRoutes);
app.use('/api/v1/leads', leadRoutes);
app.use('/api/v1/deals', dealRoutes);
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/notes', noteRoutes);
app.use('/api/v1/pipeline-stages', pipelineStageRoutes);
app.use('/api/v1/users', userRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'CRM backend is running',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.url} not found` });
});

// Error handler
app.use(errorHandler);

async function main() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    app.listen(config.port, () => {
      console.log(`✅ Server running on http://localhost:${config.port}`);
      console.log(`📋 Environment: ${config.nodeEnv}`);
    });
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

main();

export default app;