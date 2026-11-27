/**
 * API Service for communicating with the Text-to-Speech backend
 */

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');

function apiUrl(path) {
  return `${API_BASE_URL}${path}`;
}

export async function getVoices(language) {
  const query = language ? `?language=${encodeURIComponent(language)}` : '';
  const response = await fetch(apiUrl(`/api/voices${query}`));
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Failed to fetch available voices.');
  }
  return data.voices;
}

export async function convertTextToSpeech({ text, language, voice, speed = 1 }) {
  const response = await fetch(apiUrl('/api/tts'), {
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
  return {
    ...data,
    audioUrl: API_BASE_URL && data.audioUrl
      ? new URL(data.audioUrl, `${API_BASE_URL}/`).toString()
      : data.audioUrl,
  };
}

export async function checkHealth() {
  const response = await fetch(apiUrl('/api/health'));
  const data = await response.json();
  return data;
}

export async function enhanceTextWithAi({ text, mode = 'conversational' }) {
  const response = await fetch(apiUrl('/api/ai/enhance'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text, mode }),
  });
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Failed to enhance text with AI.');
  }
  return data.enhancedText;
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
