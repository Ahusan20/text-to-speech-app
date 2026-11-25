import { randomUUID } from 'node:crypto';
import { execFile } from 'node:child_process';
import { mkdir, writeFile, unlink, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const audioDirectory = path.join(__dirname, '..', 'audio');

await mkdir(audioDirectory, { recursive: true });

export async function generateSpeech(text, selectedVoice, speed = 1) {
  if (process.env.TTS_API_KEY) {
    return generateWithElevenLabs(text, selectedVoice);
  }
  return generateWithWindowsSapi(text, selectedVoice, speed);
}

export async function generateWithElevenLabs(text, selectedVoice) {
  const voiceId = process.env.ELEVENLABS_VOICE_ID ||
    (selectedVoice.gender === 'Male'
      ? process.env.ELEVENLABS_MALE_VOICE_ID
      : process.env.ELEVENLABS_FEMALE_VOICE_ID);

  if (!voiceId) {
    throw new Error('No ElevenLabs voice ID configured');
  }

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': process.env.TTS_API_KEY,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        model_id: process.env.ELEVENLABS_MODEL_ID || 'eleven_multilingual_v2',
      }),
    },
  );

  if (!response.ok) {
    const providerError = new Error(`ElevenLabs returned ${response.status}`);
    providerError.status = [401, 403, 429].includes(response.status)
      ? response.status
      : 503;
    throw providerError;
  }

  const id = randomUUID();
  const filename = `${id}.mp3`;
  await writeFile(path.join(audioDirectory, filename), Buffer.from(await response.arrayBuffer()));
  return { audioUrl: `/audio/${filename}`, format: 'audio/mpeg' };
}

export async function generateWithWindowsSapi(text, selectedVoice, speed = 1) {
  if (process.platform !== 'win32') {
    throw new Error('Windows SAPI fallback is only available on Windows');
  }

  const id = randomUUID();
  const filename = `${id}.wav`;
  const outputPath = path.join(audioDirectory, filename);
  const textEncoded = Buffer.from(text, 'utf16le').toString('base64');
  const gender = selectedVoice.gender.toLowerCase();

  // Convert speed (0.5x - 2x) to SAPI Rate (-10 to 10, default 0)
  const rate = Math.max(-10, Math.min(10, Math.round((speed - 1) * 10)));

  const script = `
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Speech
$text = [Text.Encoding]::Unicode.GetString([Convert]::FromBase64String('${textEncoded.replaceAll("'", "''")}'))
$genderName = '${gender}'
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
if ($genderName -eq 'male') {
  $synth.SelectVoiceByHints([System.Speech.Synthesis.VoiceGender]::Male)
} else {
  $synth.SelectVoiceByHints([System.Speech.Synthesis.VoiceGender]::Female)
}
$synth.Rate = ${rate}
$synth.Volume = 100
$synth.SetOutputToWaveFile('${outputPath.replaceAll("'", "''")}')
$synth.Speak($text)
$synth.Dispose()
`;

  await new Promise((resolve, reject) => {
    execFile(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', script],
      { windowsHide: true, timeout: 120000 },
      (error, _stdout, stderr) => {
        if (error) return reject(new Error(stderr || error.message));
        return resolve();
      },
    );
  });

  return { audioUrl: `/audio/${filename}`, format: 'audio/wav' };
}

export async function cleanupExpiredAudio(maxAgeMinutes = 30) {
  try {
    const cutoff = Date.now() - maxAgeMinutes * 60 * 1000;
    const files = await readdir(audioDirectory);
    for (const filename of files) {
      const filePath = path.join(audioDirectory, filename);
      const details = await stat(filePath).catch(() => null);
      if (details && details.isFile() && details.mtimeMs < cutoff) {
        await unlink(filePath).catch(() => {});
      }
    }
  } catch (error) {
    console.error('Audio cleanup error:', error.message);
  }
}
