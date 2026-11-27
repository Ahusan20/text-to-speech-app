import { voices, supportedLanguages } from '../utils/constants.js';
import { generateSpeech, isSupabaseStorageConfigured } from '../services/ttsService.js';

export function getHealth(_req, res) {
  let provider = 'google-tts-cloud';
  if (process.env.TTS_API_KEY) {
    provider = 'elevenlabs';
  } else if (process.platform === 'win32') {
    provider = 'windows-sapi';
  }
  return res.status(200).json({
    success: true,
    status: 'healthy',
    provider,
    platform: process.platform,
    aiEnhancementAvailable: Boolean(process.env.GEMINI_API_KEY),
    durableStorage: isSupabaseStorageConfigured(),
  });
}

export function getVoices(req, res) {
  const { language } = req.query;
  if (language && !supportedLanguages.includes(language)) {
    return res.status(400).json({
      success: false,
      message: 'Unsupported language.',
    });
  }

  const result = language
    ? voices.filter((voice) => voice.language === language)
    : voices;

  return res.status(200).json({
    success: true,
    voices: result,
  });
}

export async function createTts(req, res) {
  const { text, speed } = req.body;
  const selectedVoice = req.selectedVoice;

  try {
    const result = await generateSpeech(text, selectedVoice, speed);

    return res.status(200).json({
      success: true,
      audioUrl: result.audioUrl,
      format: result.format,
    });
  } catch (error) {
    console.error('TTS generation failed:', error.message);

    if (error.status === 401) {
      return res.status(401).json({
        success: false,
        message: 'The text-to-speech provider authentication failed.',
      });
    }

    if (error.status === 429) {
      return res.status(429).json({
        success: false,
        message: 'The text-to-speech provider rate limit was reached.',
      });
    }

    if (error.code === 'VOICE_UNAVAILABLE') {
      return res.status(422).json({
        success: false,
        message: 'No installed Windows voice matches the selected language and gender.',
      });
    }

    return res.status(503).json({
      success: false,
      message: 'The text-to-speech service is unavailable. Please try again.',
    });
  }
}
