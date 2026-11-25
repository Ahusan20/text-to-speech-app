/**
 * API Service for communicating with the Text-to-Speech backend
 */

export async function getVoices(language) {
  const query = language ? `?language=${encodeURIComponent(language)}` : '';
  const response = await fetch(`/api/voices${query}`);
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Failed to fetch available voices.');
  }
  return data.voices;
}

export async function convertTextToSpeech({ text, language, voice, speed = 1 }) {
  const response = await fetch('/api/tts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text, language, voice, speed }),
  });
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Failed to generate speech.');
  }
  return data;
}

export async function checkHealth() {
  const response = await fetch('/api/health');
  const data = await response.json();
  return data;
}

export function getBrowserVoices() {
  if (!('speechSynthesis' in window)) return [];

  return window.speechSynthesis.getVoices().map((voice, index) => ({
    id: `browser-${index}`,
    name: voice.name,
    language: voice.lang,
    gender: 'Browser',
    nativeVoice: voice,
  }));
}
