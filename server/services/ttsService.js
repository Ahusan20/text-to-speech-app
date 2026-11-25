import { randomUUID } from 'node:crypto';
import { execFile } from 'node:child_process';
import { mkdir, writeFile, unlink, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as googleTTS from 'google-tts-api';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const audioDirectory = path.join(__dirname, '..', 'audio');

await mkdir(audioDirectory, { recursive: true });

/**
 * Stores audio buffer to Supabase Storage if configured, or falls back to local storage
 */
export async function storeAudioBuffer(buffer, mimeType, extension = 'mp3') {
  const filename = `${randomUUID()}.${extension}`;

  // 1. Durable Cloud Storage: Supabase Storage if configured
  if (process.env.SUPABASE_URL && (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY)) {
    try {
      const supabaseUrl = process.env.SUPABASE_URL.replace(/\/+$/, '');
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
      const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'speech-audio';
      const uploadUrl = `${supabaseUrl}/storage/v1/object/${bucket}/${filename}`;

      const res = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': mimeType,
          'x-upsert': 'true',
        },
        body: buffer,
      });

      if (res.ok) {
        const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${filename}`;
        return { audioUrl: publicUrl, format: mimeType, storage: 'supabase' };
      }
    } catch (err) {
      console.warn('Supabase storage upload failed, falling back to local file storage:', err.message);
    }
  }

  // 2. Local File Storage Fallback (for local development)
  const filePath = path.join(audioDirectory, filename);
  await writeFile(filePath, buffer);
  return { audioUrl: `/audio/${filename}`, format: mimeType, storage: 'local' };
}

export async function generateSpeech(text, selectedVoice, speed = 1) {
  // 1. ElevenLabs if API key configured
  if (process.env.TTS_API_KEY) {
    return generateWithElevenLabs(text, selectedVoice);
  }

  // 2. Windows SAPI if on Windows and requested
  if (process.platform === 'win32' && selectedVoice.id.startsWith('sapi-')) {
    try {
      return await generateWithWindowsSapi(text, selectedVoice, speed);
    } catch (err) {
      if (err.code !== 'VOICE_UNAVAILABLE') throw err;
      // If voice is unavailable on Windows, fall through to universal Google TTS
    }
  }

  // 3. Universal cloud / Linux TTS fallback (runs on Linux, Render, Windows without API keys)
  return generateWithGoogleTts(text, selectedVoice, speed);
}

export async function generateWithGoogleTts(text, selectedVoice, speed = 1) {
  const langCode = selectedVoice.language.split('-')[0] || 'en';
  const base64 = await googleTTS.getAudioBase64(text, {
    lang: langCode,
    slow: speed < 0.9,
    host: 'https://translate.google.com',
    timeout: 15000,
  });

  const buffer = Buffer.from(base64, 'base64');
  return storeAudioBuffer(buffer, 'audio/mpeg', 'mp3');
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

  const buffer = Buffer.from(await response.arrayBuffer());
  return storeAudioBuffer(buffer, 'audio/mpeg', 'mp3');
}

export async function generateWithWindowsSapi(text, selectedVoice, speed = 1) {
  if (process.platform !== 'win32') {
    throw new Error('Windows SAPI fallback is only available on Windows');
  }

  const id = randomUUID();
  const filename = `${id}.wav`;
  const outputPath = path.join(audioDirectory, filename);
  const textEncoded = Buffer.from(text, 'utf16le').toString('base64');

  // Convert speed (0.5x - 2x) to SAPI Rate (-10 to 10, default 0)
  const rate = Math.max(-10, Math.min(10, Math.round((speed - 1) * 10)));

  const script = `
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Speech
$text = [Text.Encoding]::Unicode.GetString([Convert]::FromBase64String('${textEncoded.replaceAll("'", "''")}'))
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
${buildSapiVoiceSelectionScript(selectedVoice)}
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
        if (error) {
          const message = stderr || error.message;
          const generationError = new Error(message);
          if (message.includes('TTS_VOICE_UNAVAILABLE')) {
            generationError.code = 'VOICE_UNAVAILABLE';
          }
          return reject(generationError);
        }
        return resolve();
      },
    );
  });

  return { audioUrl: `/audio/${filename}`, format: 'audio/wav', storage: 'local' };
}

export function buildSapiVoiceSelectionScript(selectedVoice) {
  const cultureName = selectedVoice.language.replaceAll("'", "''");
  const gender = selectedVoice.gender.toLowerCase();

  return `
$cultureName = '${cultureName}'
$genderName = '${gender}'
$desiredGender = if ($genderName -eq 'male') {
  [System.Speech.Synthesis.VoiceGender]::Male
} else {
  [System.Speech.Synthesis.VoiceGender]::Female
}
$installedVoices = $synth.GetInstalledVoices() | Where-Object {
  $_.Enabled -and $_.VoiceInfo.Gender -eq $desiredGender
}
$matchingVoice = $installedVoices | Where-Object {
  $_.VoiceInfo.Culture.Name -eq $cultureName
} | Select-Object -First 1
if (-not $matchingVoice) {
  $languageCode = [System.Globalization.CultureInfo]::GetCultureInfo($cultureName).TwoLetterISOLanguageName
  $matchingVoice = $installedVoices | Where-Object {
    $_.VoiceInfo.Culture.TwoLetterISOLanguageName -eq $languageCode
  } | Select-Object -First 1
}
if (-not $matchingVoice) {
  throw 'TTS_VOICE_UNAVAILABLE'
}
$synth.SelectVoice($matchingVoice.VoiceInfo.Name)
`;
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
