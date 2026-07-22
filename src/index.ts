import express from 'express';
import cors from 'cors';
import { config } from './config/env';

const app = express();

// Middleware — runs on every request
app.use(cors());                    // allow frontend to connect
app.use(express.json());            // parse JSON request bodies
app.use(express.urlencoded({ extended: true }));

// Health check route — lets you verify server is running
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'CRM backend is running',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler — for any route that doesn't exist
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.url} not found` });
});

// Start the server
app.listen(config.port, () => {
  console.log(`✅ Server running on http://localhost:${config.port}`);
  console.log(`📋 Environment: ${config.nodeEnv}`);
});

export default app;