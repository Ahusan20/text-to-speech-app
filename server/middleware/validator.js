import { MAX_CHARACTERS, supportedLanguages, voices } from '../utils/constants.js';

export function validateJsonContentType(req, res, next) {
  if (!req.is('application/json')) {
    return res.status(415).json({
      success: false,
      message: 'Content-Type must be application/json.',
    });
  }
  return next();
}

export function validateTtsRequest(req, res, next) {
  const { text, language, voice } = req.body || {};

  if (typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Text is required.',
    });
  }

  if (text.length > MAX_CHARACTERS) {
    return res.status(400).json({
      success: false,
      message: `Text must not exceed ${MAX_CHARACTERS} characters.`,
    });
  }

  if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/u.test(text)) {
    return res.status(400).json({
      success: false,
      message: 'Text contains unsupported control characters.',
    });
  }

  if (!supportedLanguages.includes(language)) {
    return res.status(400).json({
      success: false,
      message: 'Unsupported language.',
    });
  }

  const selectedVoice = voices.find((item) => item.id === voice);
  if (!selectedVoice || selectedVoice.language !== language) {
    return res.status(400).json({
      success: false,
      message: 'The selected voice does not belong to this language.',
    });
  }

  req.selectedVoice = selectedVoice;
  return next();
}
