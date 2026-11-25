import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import test, { before, after } from 'node:test';
import { buildSapiVoiceSelectionScript } from '../services/ttsService.js';

const baseUrl = 'http://127.0.0.1:5124';
let server;

before(async () => {
  server = spawn(process.execPath, ['server.js'], {
    cwd: process.cwd(),
    env: { ...process.env, PORT: '5124', CORS_ORIGIN: '*' },
    stdio: 'ignore',
  });

  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/api/health`);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('Test server did not start');
});

after(() => server?.kill());

test('Windows SAPI selection matches the requested culture and gender', () => {
  const script = buildSapiVoiceSelectionScript({
    language: 'hi-IN',
    gender: 'Female',
  });

  assert.match(script, /\$cultureName = 'hi-IN'/);
  assert.match(script, /VoiceInfo\.Culture\.Name -eq \$cultureName/);
  assert.match(script, /TwoLetterISOLanguageName -eq \$languageCode/);
  assert.match(script, /VoiceInfo\.Gender -eq \$desiredGender/);
  assert.match(script, /TTS_VOICE_UNAVAILABLE/);
});

test('GET /api/health returns healthy status', async () => {
  const response = await fetch(`${baseUrl}/api/health`);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).success, true);
});

test('GET /api/voices filters voices by language', async () => {
  const response = await fetch(`${baseUrl}/api/voices?language=en-US`);
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.success, true);
  assert.ok(body.voices.every((voice) => voice.language === 'en-US'));
});

test('POST /api/tts rejects empty text', async () => {
  const response = await fetch(`${baseUrl}/api/tts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: '', language: 'en-US', voice: 'sapi-female' }),
  });
  assert.equal(response.status, 400);
  assert.match((await response.json()).message, /Text is required/i);
});

test('POST /api/tts rejects oversized text', async () => {
  const response = await fetch(`${baseUrl}/api/tts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: 'x'.repeat(501), language: 'en-US', voice: 'sapi-female' }),
  });
  assert.equal(response.status, 400);
  assert.match((await response.json()).message, /500 characters/i);
});

test('POST /api/tts rejects invalid language', async () => {
  const response = await fetch(`${baseUrl}/api/tts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: 'Hello', language: 'xx-XX', voice: 'bad' }),
  });
  assert.equal(response.status, 400);
  assert.match((await response.json()).message, /Unsupported language/i);
});
