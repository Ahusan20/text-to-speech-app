# Deployment

## Free frontend - GitHub Pages

The public, zero-cost demo deploys automatically from `main` through GitHub Actions:

https://ahusan20.github.io/text-to-speech-app/

It uses the browser's built-in speech voices and local browser storage. The browser
does not provide an audio file for download in this mode.

## Frontend - Vercel

1. Import this repository in Vercel.
2. Keep the repository root as the project root so Vercel can use the root `vercel.json`.
3. Configure the `VITE_API_BASE_URL` environment variable to the deployed Render API
   origin (for example, `https://your-service.onrender.com`).
4. Configure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` only when enabling
   Supabase Auth and cloud sync.
5. Deploy. The Vercel build reads the repository config and produces `client/dist`.

The public GitHub Pages site does not need these variables; it uses browser speech
and local browser storage. Never put service-role, Gemini, or TTS provider secrets
in frontend environment variables.

## Backend - Render

1. Import this repository in Render (the blueprint requests its free plan).
2. Render can use `render.yaml`.
3. Set `CORS_ORIGIN` to the deployed frontend origin (without a trailing slash).
4. Optionally add `TTS_API_KEY` and `ELEVENLABS_VOICE_ID` if using ElevenLabs;
   this provider may incur charges under its own pricing.
5. Optionally add `GEMINI_API_KEY` to enable AI text enhancement; check Google's
   current terms and billing before using the key.
6. Optionally add `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and
   `SUPABASE_STORAGE_BUCKET` for durable audio storage. Keep the service-role key
   exclusively on the backend.
7. Windows Speech SAPI is only available for local Windows development. The
   deployed backend uses Google TTS unless ElevenLabs is configured.

## Backend Environment Variables

```text
PORT=5000
CORS_ORIGIN=https://your-app.vercel.app
```

Only add optional provider credentials after confirming their pricing and terms.

## Supabase setup (optional)

1. In Supabase, enable Email sign-in under Authentication providers.
2. Run [`supabase/schema.sql`](./supabase/schema.sql) in the SQL Editor. It creates
   the history and favorites tables, their per-user RLS policies, and the public
   speech-audio bucket used for generated audio URLs.
3. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to the frontend deployment.
4. For durable audio uploads, add `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and
   `SUPABASE_STORAGE_BUCKET=speech-audio` to the backend deployment. Do not expose
   the service-role key to the browser.
