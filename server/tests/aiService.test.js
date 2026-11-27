import assert from 'node:assert/strict';
import test from 'node:test';
import { enhanceTextWithGemini } from '../services/aiService.js';

const originalFetch = globalThis.fetch;
const originalApiKey = process.env.GEMINI_API_KEY;

function restoreEnvironment() {
  globalThis.fetch = originalFetch;
  if (originalApiKey === undefined) {
    delete process.env.GEMINI_API_KEY;
  } else {
    process.env.GEMINI_API_KEY = originalApiKey;
  }
}

test('Gemini enhancement sends each supported mode and returns generated text', async () => {
  const modes = ['summarize', 'grammar', 'conversational', 'rewrite'];
  const seenPrompts = [];
  process.env.GEMINI_API_KEY = 'test-key';
  globalThis.fetch = async (url, options) => {
    assert.match(url, /key=test-key/);
    assert.equal(options.method, 'POST');
    const requestBody = JSON.parse(options.body);
    seenPrompts.push(requestBody.contents[0].parts[0].text);
    return new Response(JSON.stringify({
      candidates: [{ content: { parts: [{ text: `result-${seenPrompts.length}` }] } }],
    }), { status: 200 });
  };

  try {
    for (let index = 0; index < modes.length; index += 1) {
      assert.equal(await enhanceTextWithGemini('sample text', modes[index]), `result-${index + 1}`);
    }
    assert.match(seenPrompts[0], /Summarize/);
    assert.match(seenPrompts[1], /Correct all grammatical errors/);
    assert.match(seenPrompts[2], /conversational spoken speech/);
    assert.match(seenPrompts[3], /Rewrite and polish/);
  } finally {
    restoreEnvironment();
  }
});

test('Gemini enhancement reports missing server credentials', async () => {
  delete process.env.GEMINI_API_KEY;
  try {
    await assert.rejects(
      () => enhanceTextWithGemini('sample text'),
      (error) => error.status === 503 && /GEMINI_API_KEY/.test(error.message),
    );
  } finally {
    restoreEnvironment();
  }
});

test('Gemini rate limits are surfaced with HTTP 429 status', async () => {
  process.env.GEMINI_API_KEY = 'test-key';
  globalThis.fetch = async () => new Response('{}', { status: 429 });
  try {
    await assert.rejects(
      () => enhanceTextWithGemini('sample text'),
      (error) => error.status === 429 && /rate limited/i.test(error.message),
    );
  } finally {
    restoreEnvironment();
  }
});
