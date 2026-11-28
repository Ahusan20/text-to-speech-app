const events = [];
const MAX_EVENTS = 5000;

export function recordAnalyticsEvent(event) {
  events.push({
    at: new Date().toISOString(),
    ...event,
  });
  if (events.length > MAX_EVENTS) {
    events.splice(0, events.length - MAX_EVENTS);
  }
}

export function getAnalyticsSnapshot() {
  const successful = events.filter((event) => event.success);
  const failed = events.filter((event) => !event.success);
  const characters = successful.reduce((total, event) => total + (event.characterCount || 0), 0);
  const byLanguage = {};
  const byProvider = {};

  for (const event of successful) {
    byLanguage[event.language] = (byLanguage[event.language] || 0) + 1;
    byProvider[event.provider] = (byProvider[event.provider] || 0) + 1;
  }

  return {
    success: true,
    totalRequests: events.length,
    successfulRequests: successful.length,
    failedRequests: failed.length,
    charactersGenerated: characters,
    byLanguage,
    byProvider,
  };
}
