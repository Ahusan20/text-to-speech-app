import assert from 'node:assert/strict';
import test from 'node:test';
import { storeAudioBuffer } from '../services/ttsService.js';

test('stores Vercel audio inline when durable storage is not configured', async () => {
  const previous = {
    VERCEL: process.env.VERCEL,
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    SUPABASE_KEY: process.env.SUPABASE_KEY,
  };
  process.env.VERCEL = '1';
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_SECRET_KEY;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  delete process.env.SUPABASE_KEY;

  try {
    const result = await storeAudioBuffer(Buffer.from('speech audio'), 'audio/mpeg');

    assert.equal(result.audioUrl, 'data:audio/mpeg;base64,c3BlZWNoIGF1ZGlv');
    assert.equal(result.format, 'audio/mpeg');
    assert.equal(result.storage, 'inline');
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
});

test('uploads to Supabase Storage with a secret API key in the apikey header', async () => {
  const previous = {
    VERCEL: process.env.VERCEL,
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    SUPABASE_KEY: process.env.SUPABASE_KEY,
  };
  const originalFetch = globalThis.fetch;
  let request;
  process.env.VERCEL = '1';
  process.env.SUPABASE_URL = 'https://project.supabase.co';
  process.env.SUPABASE_SECRET_KEY = 'sb_secret_test';
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  delete process.env.SUPABASE_KEY;
  globalThis.fetch = async (url, options) => {
    request = { url, options };
    return { ok: true, status: 200 };
  };

  try {
    const result = await storeAudioBuffer(Buffer.from('speech audio'), 'audio/mpeg');

    assert.equal(result.format, 'audio/mpeg');
    assert.equal(result.storage, 'supabase');
    assert.match(result.audioUrl, /^https:\/\/project\.supabase\.co\/storage\/v1\/object\/public\/speech-audio\/.+\.mp3$/);
    assert.equal(request.options.headers.apikey, 'sb_secret_test');
    assert.equal(request.options.headers.Authorization, undefined);
  } finally {
    globalThis.fetch = originalFetch;
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
});

test('keeps using bearer authentication with legacy Supabase service-role keys', async () => {
  const previous = {
    VERCEL: process.env.VERCEL,
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    SUPABASE_KEY: process.env.SUPABASE_KEY,
  };
  const originalFetch = globalThis.fetch;
  let request;
  process.env.VERCEL = '1';
  process.env.SUPABASE_URL = 'https://project.supabase.co';
  delete process.env.SUPABASE_SECRET_KEY;
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'legacy-service-role-key';
  delete process.env.SUPABASE_KEY;
  globalThis.fetch = async (url, options) => {
    request = { url, options };
    return { ok: true, status: 200 };
  };

  try {
    const result = await storeAudioBuffer(Buffer.from('speech audio'), 'audio/mpeg');

    assert.equal(result.storage, 'supabase');
    assert.equal(request.options.headers.Authorization, 'Bearer legacy-service-role-key');
    assert.equal(request.options.headers.apikey, undefined);
  } finally {
    globalThis.fetch = originalFetch;
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
});
