import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'node:path';
import ttsRoutes from './routes/ttsRoutes.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { audioDirectory, cleanupExpiredAudio } from './services/ttsService.js';

dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

const app = express();
const PORT = process.env.PORT || 5000;

app.disable('x-powered-by');

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  methods: ['GET', 'POST'],
}));

app.set('trust proxy', 1);
app.use(express.json({ limit: '100kb' }));

if (!process.env.VERCEL) {
  app.use('/audio', express.static(audioDirectory, {
    setHeaders(res) {
      res.setHeader('Cache-Control', 'no-store');
    },
  }));
}

// Apply rate limiting to all /api routes
app.use('/api', apiLimiter);

// Main TTS & voices routes
app.use('/api', ttsRoutes);

// Global Error Handler
app.use((error, _req, res, _next) => {
  if (error instanceof SyntaxError && 'body' in error) {
    return res.status(400).json({
      success: false,
      message: 'Request body contains invalid JSON.',
    });
  }
  if (error.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      message: 'Request body is too large.',
    });
  }
  console.error('Unhandled server error:', error);
  return res.status(500).json({
    success: false,
    message: 'An unexpected server error occurred.',
  });
});

if (!process.env.VERCEL) {
  setInterval(() => {
    cleanupExpiredAudio(30);
  }, 10 * 60 * 1000).unref();

  app.listen(PORT, () => {
    console.log(`Text-to-Speech API listening on http://localhost:${PORT}`);
  });
}

export default app;
