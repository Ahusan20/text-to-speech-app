# Vox Studio - Text-to-Speech Application

A full-stack React and Express text-to-speech application.

## Features

- Text input with character and word counts
- Language and voice selection
- Text validation and API error handling
- Browser audio playback, seeking, volume, and download
- Free browser speech mode, local history, and favorites
- TXT, DOCX, and PDF import
- Speech rate, pitch, and volume controls in browser mode
- ElevenLabs, Windows SAPI, and Google TTS provider options
- Optional Gemini enhancement: summarize, fix grammar, conversational, and rewrite
- Optional Supabase authentication, history/favorites sync, and durable audio storage
- Rate limiting and temporary audio-file cleanup

## Setup

### Frontend

```powershell
cd client
npm.cmd install
npm.cmd run dev
```

The frontend runs at `http://localhost:5173`.

### Backend

```powershell
cd server
npm.cmd install
npm.cmd run dev
```

The API runs at `http://localhost:5000`.

## Free public demo

Source: [GitHub repository](https://github.com/Ahusan20/text-to-speech-app).
Live frontend: [GitHub Pages](https://ahusan20.github.io/text-to-speech-app/).
It uses the browser's built-in speech synthesis and stores recent texts and favorites
locally on the current device. In this free mode, speech playback is available but
audio download and seeking are not; use the local Windows SAPI backend for downloadable WAV audio.

## Environment

Copy `.env.example` to `.env` for optional ElevenLabs configuration:

```text
TTS_API_KEY=your_elevenlabs_api_key
ELEVENLABS_VOICE_ID=your_voice_id
ELEVENLABS_MODEL_ID=eleven_multilingual_v2
PORT=5000
CORS_ORIGIN=http://localhost:5173
```

Without an ElevenLabs key, the server uses Windows Speech SAPI when a compatible
voice is installed, then falls back to Google TTS. The Google fallback requires an
internet connection. Gemini and Supabase are optional and require their own
configuration before those cloud features are available.

### Optional cloud configuration

- Copy `client/.env.example` to `client/.env` for local frontend configuration.
- Set `VITE_API_BASE_URL` to the backend origin when the frontend and API are hosted
  separately. Leave it empty for local development (the Vite proxy is used) or the
  browser-only GitHub Pages demo.
- Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the frontend only if
  enabling Supabase sign-in and cloud sync.
- Keep `GEMINI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `TTS_API_KEY` on the
  backend. Never put these secrets in a `VITE_` variable.
- To enable Supabase Auth/history/favorites, run [`supabase/schema.sql`](./supabase/schema.sql)
  in the Supabase SQL Editor. See [DEPLOYMENT.md](./DEPLOYMENT.md) for the full setup.

## API

### `GET /api/health`

Returns API health and the active provider.

### `GET /api/voices`

Returns available voices. Pass `?language=en-US` to filter by language.

### `POST /api/tts`

Request:

```json
{
  "text": "Hello, welcome.",
  "language": "en-US",
  "voice": "sapi-female"
}
```

Response:

```json
{
  "success": true,
  "audioUrl": "/audio/generated-file.wav",
  "format": "audio/wav"
}
```

### `POST /api/ai/enhance` (optional Gemini)

Request:

```json
{
  "text": "Text to improve",
  "mode": "rewrite"
}
```

Supported modes are `summarize`, `grammar`, `conversational`, and `rewrite`.
The server returns HTTP 503 when `GEMINI_API_KEY` is not configured.

Response:

```json
{
  "success": true,
  "enhancedText": "Polished speech-ready text",
  "mode": "rewrite"
}
```

## Postman

Import `postman_collection.json` to test health, voice discovery, speech generation, and validation errors.

### API Summary

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/health` | Returns server status and the active TTS provider |
| `GET` | `/api/voices` | Returns available voices, optionally filtered by language |
| `POST` | `/api/tts` | Validates text and voice configuration, then returns generated audio |
| `POST` | `/api/ai/enhance` | Optionally summarizes, fixes grammar, rewrites, or conversationalizes text |

The TTS endpoint requires JSON and accepts `text`, `language`, and `voice`.
The AI endpoint requires JSON and accepts `text` and one of `summarize`, `grammar`,
`conversational`, or `rewrite`. HTTP 503 is returned when Gemini is not configured.

## Final Project Deliverables

The submission package is documented in [docs/FINAL_DELIVERABLES.md](./docs/FINAL_DELIVERABLES.md).

| Deliverable | Location |
|---|---|
| Source code | [Repository](https://github.com/Ahusan20/text-to-speech-app) |
| Database schema | [supabase/schema.sql](./supabase/schema.sql) |
| API documentation | This README and [Postman collection](./postman_collection.json) |
| UI screenshots | [docs/ui-desktop.png](./docs/ui-desktop.png), [docs/ui-mobile.png](./docs/ui-mobile.png), [docs/ui-generated.png](./docs/ui-generated.png) |
| Deployment documentation | [DEPLOYMENT.md](./DEPLOYMENT.md) |
| Project presentation | [docs/project-presentation.pptx](./docs/project-presentation.pptx) |

### Deployment URLs

- GitHub Pages demo: https://ahusan20.github.io/text-to-speech-app/
- Vercel frontend: https://text-to-speech-app-pi.vercel.app/
- Vercel API: https://text-to-speech-app-pi.vercel.app/

The GitHub Pages deployment uses browser Web Speech and local browser storage.
The Vercel deployment connects to the backend API and optional Supabase configuration.

## Specification Coverage

- Core text input, character/word counts, 500-character limit, clear/edit workflow
- English, Hindi, Gujarati, Marathi, Spanish, French, and German language support
- Voice discovery and language/voice validation
- Browser playback, seek, volume, and download when a provider supplies downloadable audio
- TXT, PDF, and DOCX text extraction
- ElevenLabs, Windows SAPI, Google TTS, and browser Web Speech fallbacks
- Optional Gemini text enhancement
- Optional Supabase authentication, history, favorites, and audio storage
- Backend validation, rate limiting, CORS, credential protection, and temporary audio cleanup

## Testing

Run the smallest relevant suites from the repository root:

```powershell
cd client
npm.cmd test
npm.cmd run build
npm.cmd run lint

cd ..\server
npm.cmd test
```
## Project Structure

```text
text-to-speech/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AudioPlayer.jsx
│   │   │   ├── DownloadButton.jsx
│   │   │   ├── ErrorMessage.jsx
│   │   │   ├── GenerateButton.jsx
│   │   │   ├── LanguageSelector.jsx
│   │   │   ├── TextInput.jsx
│   │   │   └── VoiceSelector.jsx
│   │   ├── pages/
│   │   │   └── Home.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.css
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
├── server/
│   ├── controllers/
│   │   └── ttsController.js
│   ├── routes/
│   │   └── ttsRoutes.js
│   ├── services/
│   │   └── ttsService.js
│   ├── middleware/
│   │   ├── rateLimiter.js
│   │   └── validator.js
│   ├── utils/
│   │   └── constants.js
│   ├── server.js
│   └── package.json
├── .env.example
├── .gitignore
├── postman_collection.json
└── README.md
```

## Security

- Keep API credentials in `.env`
- `.env` and generated audio are excluded from Git
- Incoming text is limited to 500 characters
- API routes are rate limited
- Generated audio expires after 30 minutes
