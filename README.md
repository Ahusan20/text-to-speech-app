# Vox Studio - Text-to-Speech Application

A full-stack React and Express text-to-speech application.

## Features

- Text input with character and word counts
- Language and voice selection
- Text validation and API error handling
- Browser audio playback, seeking, volume, and download
- ElevenLabs integration or Windows SAPI fallback
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

## Environment

Copy `.env.example` to `.env` for optional ElevenLabs configuration:

```text
TTS_API_KEY=your_elevenlabs_api_key
ELEVENLABS_VOICE_ID=your_voice_id
ELEVENLABS_MODEL_ID=eleven_multilingual_v2
PORT=5000
CORS_ORIGIN=http://localhost:5173
```

Without API credentials, the server uses Windows Speech SAPI on Windows.

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

## Postman

Import `postman_collection.json` to test health, voice discovery, speech generation, and validation errors.

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
