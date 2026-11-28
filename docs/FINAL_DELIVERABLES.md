# Vox Studio - Final Project Deliverables

This checklist maps the project submission to the requirements in
[the project specification](./Web%20-%20Text-to-Speech%20Application.pdf).

## Submission Checklist

- [X] Source code is maintained in this repository.
- [X] GitHub repository is public: https://github.com/Ahusan20/text-to-speech-app
- [X] README documents setup, configuration, API endpoints, testing, and deployment.
- [X] Database schema is provided in `supabase/schema.sql` for optional Supabase auth,
  history, favorites, and audio storage.
- [X] API documentation is included in `README.md`.
- [X] Postman collection is provided in `postman_collection.json`.
- [X] UI screenshots are included for desktop, mobile, generated audio, and browser-speech modes.
- [X] Deployment guide is provided in `DEPLOYMENT.md`.
- [X] Project presentation is provided in `docs/project-presentation.pptx`.
- [X] Frontend and backend deployments are configured.
- [X] Ten-generation-per-day usage limits and protected analytics reporting are implemented.
- [X] Short project demonstration is provided in
  `docs/project-demonstration.mp4`.

## Live Deployments

- GitHub Pages: https://ahusan20.github.io/text-to-speech-app/
- Vercel frontend: https://text-to-speech-app-pi.vercel.app/
- Vercel backend API: https://vox-studio-api.vercel.app/
- API health: https://vox-studio-api.vercel.app/api/health

## UI Evidence

- Desktop UI: `docs/ui-desktop.png`
- Mobile UI: `docs/ui-mobile.png`
- Generated audio UI: `docs/ui-generated.png`
- Browser speech UI: `docs/ui-browser-speech.png`

## Presentation

- PowerPoint: `docs/project-presentation.pptx`
- Presentation generator: `scripts/create-presentation.js`
- Project demonstration: `docs/project-demonstration.mp4`

## API and Testing Evidence

- Postman collection: `postman_collection.json`
- Frontend tests: `client/tests`
- Backend tests: `server/tests`
- API, voice discovery, validation, TTS, AI, and document parsing behavior is covered
  by the repository test suites.

## UI/UX & Download Capabilities

- **Direct & On-Demand Audio Downloads:**
  - Standard mode downloads generated audio files (`.wav` / `.mp3`) directly via programmatic Blobs to prevent browser navigation issues and bypass cross-origin CDN download restrictions.
  - In browser speech mode, users can click **Download Audio** to generate and download an audio file on-demand.
  - Dynamic MIME detection names files properly according to the returned audio format.
- **Enhanced Workspace UX:**
  - Visual character budget progress bar (transitions smoothly from normal to warning and capped states).
  - One-click sample prompt pills (Greeting announcement, Security OTP, Customer support).
  - Speed selection (0.75x, 1x, 1.25x, 1.5x, 2x) available for both server-rendered and browser audio.
  - Audio format badge (`MP3`, `WAV`, `Browser`) displayed in the player header.

## Final Submission Before Hand-in

1. Run frontend tests and build.
2. Run backend tests.
3. Verify the GitHub Pages and Vercel URLs.
4. Import `postman_collection.json` and set `baseUrl` to the deployed API.
5. Submit the presentation and project demonstration from `docs/`.
