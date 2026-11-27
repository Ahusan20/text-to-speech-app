# Deployment

## Free frontend - GitHub Pages

The public, zero-cost demo deploys automatically from `main` through GitHub Actions:

https://ahusan20.github.io/text-to-speech-app/

It uses the browser's built-in speech voices and local browser storage. The browser
does not provide an audio file for download in this mode.

## Frontend - Vercel

1. Import this repository in Vercel.
2. Keep the repository root as the project root so Vercel can use the root `vercel.json`.
3. Configure the `VITE_API_BASE_URL` environment variable to the deployed API
   origin (for example, `https://vox-studio-api.vercel.app`).
4. Configure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` only when enabling
   Supabase Auth and cloud sync.
5. Deploy. The Vercel build reads the repository config and produces `client/dist`.

The public GitHub Pages site does not need these variables; it uses browser speech
and local browser storage. Never put service-role, Gemini, or TTS provider secrets
in frontend environment variables.

## Backend - Render

Render's Free web service plan is available, but this account requires a card
verification step with a temporary $1 authorization. Use the Vercel backend below
when avoiding payment details is a requirement.

## Backend - Vercel Hobby

Create a separate Vercel project from this repository with `server` as its project
root. Vercel detects the Express app in `server.js`; deploy it on the Hobby plan,
which is $0/month and has included function usage limits. Exceeding Hobby limits can
pause deployments until the next billing cycle rather than creating usage charges.

Set `CORS_ORIGIN` to the deployed frontend origin (without a trailing slash), then
set `VITE_API_BASE_URL` in the frontend Vercel project to this backend's origin and
redeploy the frontend. The backend returns audio as a data URL when Supabase Storage
is not configured, so audio playback and download do not depend on serverless local
files. Configure Supabase Storage for durable public audio URLs if desired.

Optionally add `TTS_API_KEY` and `ELEVENLABS_VOICE_ID` if using ElevenLabs; this
provider may incur charges under its own pricing. Add `GEMINI_API_KEY` only after
confirming its current terms and billing; AI enhancement controls stay disabled
until this key is configured. Add `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, and
`SUPABASE_STORAGE_BUCKET` for durable audio storage. The backend still accepts
legacy `SUPABASE_SERVICE_ROLE_KEY` values. Keep all backend credentials exclusively
in Vercel's backend environment settings. Windows Speech SAPI is only available for
local Windows development. The deployed backend uses Google TTS unless ElevenLabs is
configured.

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
4. For durable audio uploads, add `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, and
   `SUPABASE_STORAGE_BUCKET=speech-audio` to the backend deployment. Do not expose
   the secret key to the browser. The legacy `SUPABASE_SERVICE_ROLE_KEY` is also supported.
