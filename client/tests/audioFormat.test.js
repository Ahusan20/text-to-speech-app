import assert from 'node:assert/strict';
import test from 'node:test';
import { getAudioFilename } from '../src/utils/audioFormat.js';

test('download filename matches the generated audio format', () => {
  assert.equal(getAudioFilename('audio/wav'), 'speech.wav');
  assert.equal(getAudioFilename('audio/mpeg'), 'speech.mp3');
});

test('unsupported audio formats are reported', () => {
  assert.throws(() => getAudioFilename('audio/ogg'), /Unsupported audio format/);
});
