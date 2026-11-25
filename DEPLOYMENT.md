# Deployment

## Free frontend - GitHub Pages

The public, zero-cost demo deploys automatically from `main` through GitHub Actions:

https://ahusan20.github.io/text-to-speech-app/

It uses the browser's built-in speech voices and local browser storage. The browser
does not provide an audio file for download in this mode.

## Frontend - Vercel

1. Import this repository in Vercel.
2. Set the project root to `client`.
3. Framework preset: Vite.
4. Build command: `npm run build`.
5. Output directory: `dist`.
6. Replace `YOUR_RENDER_SERVICE` in the root `vercel.json` rewrite URLs with the deployed Render API hostname.

## Backend - Render

1. Import this repository in Render (the blueprint requests its free plan).
2. Render can use `render.yaml`.
3. Set `CORS_ORIGIN` to the Vercel frontend URL.
4. Set ElevenLabs credentials for Linux-hosted file generation, if required.
5. Windows Speech SAPI is only available for local Windows development.

## Required Environment Variables

```text
PORT=5000
CORS_ORIGIN=https://your-app.vercel.app
TTS_API_KEY=elevenlabs_api_key
ELEVENLABS_VOICE_ID=elevenlabs_voice_id
ELEVENLABS_MODEL_ID=eleven_multilingual_v2
```
