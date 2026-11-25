import { voices, supportedLanguages } from '../utils/constants.js';
import { generateSpeech } from '../services/ttsService.js';

export function getHealth(_req, res) {
  return res.status(200).json({
    success: true,
    status: 'healthy',
    provider: process.env.TTS_API_KEY ? 'elevenlabs' : 'windows-sapi',
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

    return res.status(503).json({
      success: false,
      message: 'The text-to-speech service is unavailable. Please try again.',
    });
  }
}
