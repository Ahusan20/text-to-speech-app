import { enhanceTextWithGemini } from '../services/aiService.js';

export async function handleAiEnhance(req, res) {
  const { text, mode } = req.body || {};

  if (typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Text is required for AI enhancement.',
    });
  }

  if (text.length > 3000) {
    return res.status(400).json({
      success: false,
      message: 'Text exceeds the 3000-character limit for AI processing.',
    });
  }

  const validModes = ['summarize', 'grammar', 'conversational', 'rewrite'];
  const selectedMode = validModes.includes(mode) ? mode : 'conversational';

  try {
    const enhanced = await enhanceTextWithGemini(text, selectedMode);
    return res.status(200).json({
      success: true,
      enhancedText: enhanced,
      mode: selectedMode,
    });
  } catch (err) {
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || 'AI text enhancement failed.',
    });
  }
}
