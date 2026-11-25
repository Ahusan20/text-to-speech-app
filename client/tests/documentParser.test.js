import test from 'node:test';
import assert from 'node:assert/strict';
import { extractTextFromFile } from '../src/utils/documentParser.js';

test('rejects unsupported file extensions', async () => {
  const fakeFile = { name: 'image.png' };
  await assert.rejects(
    () => extractTextFromFile(fakeFile),
    /Unsupported file format/
  );
});

test('extracts text from plain text file', async () => {
  const fakeFile = {
    name: 'sample.txt',
    text: async () => 'Hello from TXT file test'
  };
  const extracted = await extractTextFromFile(fakeFile);
  assert.equal(extracted, 'Hello from TXT file test');
});
