# GitHub Copilot Instructions - Vox Studio Text-to-Speech

## 1. Project Overview & Architecture
Vox Studio is a full-stack Text-to-Speech (TTS) web application built according to the internship specification in `Web - Text-to-Speech Application.pdf`.

- **Frontend**: React 19 + Vite (`client/`)
- **Backend**: Node.js + Express.js (`server/`)
- **Multi-TTS Engine**:
  1. **ElevenLabs**: Used when `TTS_API_KEY` is present.
  2. **Universal Cloud TTS (`google-tts-api`)**: Cross-platform fallback that works on Linux/Render containers without requiring API keys.
  3. **Windows SAPI**: Offline local fallback for Windows development (`System.Speech.Synthesis`).
  4. **Browser Web Speech API**: Client-side fallback for static deployments (GitHub Pages).

## 2. Directory & Component Structure
Maintain the clean modular architecture:

```text
├── client/
│   ├── src/
│   │   ├── components/     # Modular UI units (TextInput, AudioPlayer, etc.)
│   │   ├── pages/          # Full page views (Home.jsx)
│   │   ├── services/       # Network API calls (api.js)
│   │   └── utils/          # Client utilities (documentParser.js, audioFormat.js)
│   └── tests/              # Node test runner unit tests
├── server/
│   ├── controllers/        # Request handlers (ttsController.js, aiController.js)
│   ├── middleware/         # Validation and rate limiting
│   ├── routes/             # Express routing
│   ├── services/           # TTS generation, Gemini AI, storage services
│   ├── utils/              # Constants and voice definitions
│   └── tests/              # Backend integration tests
```

## 3. Key Rules & Coding Standards
1. **Never Expose Secrets in Client**:
   - `TTS_API_KEY`, `GEMINI_API_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` must remain strictly on the Express backend (`server/.env`).
   - The frontend only ever receives the public Supabase Anon Key (`VITE_SUPABASE_ANON_KEY`).
2. **Input Validation**:
   - Max 500 characters for speech synthesis.
   - Validate Content-Type `application/json` (HTTP 415 on mismatch).
   - Reject unprintable control characters.
3. **Document Extraction**:
   - Client-side parser in `client/src/utils/documentParser.js` parses `.txt`, `.docx` (via `mammoth`), and `.pdf` (via `pdfjs-dist`).
4. **AI Text Enhancement**:
   - Route `POST /api/ai/enhance` supports modes: `summarize`, `grammar`, `conversational`, and `rewrite`.
5. **Testing**:
   - Run tests using `cd client; npm test` and `cd server; npm test`.
   - Maintain 100% test pass rates when modifying routes or parsing utilities.
