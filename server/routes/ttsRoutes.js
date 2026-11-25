import { Router } from 'express';
import { getHealth, getVoices, createTts } from '../controllers/ttsController.js';
import { validateJsonContentType, validateTtsRequest } from '../middleware/validator.js';

const router = Router();

router.get('/health', getHealth);
router.get('/voices', getVoices);
router.post('/tts', validateJsonContentType, validateTtsRequest, createTts);

export default router;
