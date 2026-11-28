import { Router } from 'express';
import { getHealth, getVoices, createTts } from '../controllers/ttsController.js';
import { handleAiEnhance } from '../controllers/aiController.js';
import { validateJsonContentType, validateTtsRequest } from '../middleware/validator.js';
import { ttsDailyLimiter } from '../middleware/rateLimiter.js';
import { getAnalyticsSnapshot } from '../services/analyticsService.js';

const router = Router();

router.get('/health', getHealth);
router.get('/voices', getVoices);
router.post('/tts', ttsDailyLimiter, validateJsonContentType, validateTtsRequest, createTts);
router.post('/ai/enhance', validateJsonContentType, handleAiEnhance);
router.get('/admin/analytics', (req, res) => {
  const adminKey = process.env.ADMIN_API_KEY;
  if (!adminKey || req.get('X-Admin-Key') !== adminKey) {
    return res.status(403).json({
      success: false,
      message: 'Administrator API key required.',
    });
  }
  return res.status(200).json(getAnalyticsSnapshot());
});

export default router;
