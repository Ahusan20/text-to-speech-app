import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests. Please try again in a minute.',
  },
});

export function createDailyTtsLimiter(limit = 10) {
  const usageByClient = new Map();

  return function dailyTtsLimiter(req, res, next) {
    const today = new Date().toISOString().slice(0, 10);
    const key = `${req.ip}:${today}`;
    const count = usageByClient.get(key) || 0;

    for (const storedKey of usageByClient.keys()) {
      if (!storedKey.endsWith(`:${today}`)) {
        usageByClient.delete(storedKey);
      }
    }

    if (count >= limit) {
      res.setHeader('Retry-After', '86400');
      return res.status(429).json({
        success: false,
        message: `Daily TTS limit reached. Maximum ${limit} generations per day.`,
      });
    }

    usageByClient.set(key, count + 1);
    res.setHeader('X-Daily-Limit', String(limit));
    res.setHeader('X-Daily-Remaining', String(Math.max(0, limit - count - 1)));
    return next();
  };
}

export const ttsDailyLimiter = createDailyTtsLimiter(
  Number(process.env.DAILY_TTS_LIMIT) || 10,
);
