import PptxGenJS from 'pptxgenjs';

const pptx = new PptxGenJS();
pptx.layout = 'LAYOUT_WIDE';
pptx.author = 'Vox Studio Project';
pptx.subject = 'Text-to-Speech Application';
pptx.title = 'Text-to-Speech Application';
pptx.company = 'Internship Project';

const slides = [
  ['Text-to-Speech Application', 'React + Node.js + Express', 'Vox Studio'],
  ['Problem', 'Converts large or difficult written text into accessible spoken audio.', 'Text Input'],
  ['Objectives', 'Learn React, REST APIs, backend validation, third-party TTS integration, and secure credential handling.', 'Learning'],
  ['System Architecture', 'Free public frontend: GitHub Pages + browser speech synthesis | Local backend: Express + Windows SAPI or optional ElevenLabs', 'Flow'],
  ['Implemented Features', 'Text and word counts | Language and voice selection | Browser speech | Playback rate and pitch | TXT import | Local history and favorites', 'Features'],
  ['API Endpoints', 'GET /api/health | GET /api/voices | POST /api/tts', 'Backend'],
  ['Security', 'Environment credentials | CORS | Rate limiting | Input validation | Temporary audio cleanup', 'Security'],
  ['Testing', '5 API tests pass | Local Windows SAPI generation tested | Frontend lint/build pass | GitHub Pages deployment verified', 'Quality'],
  ['Demo', 'Enter text -> Select an installed browser voice -> Generate -> Play -> Adjust speed or pitch', 'Walkthrough'],
  ['Conclusion', 'A complete Level 1 project demonstrating full-stack communication and TTS integration.', 'Summary'],
];

for (const [title, body, label] of slides) {
  const slide = pptx.addSlide();
  slide.background = { color: 'F5F6F1' };
  slide.addText(label.toUpperCase(), {
    x: 0.7, y: 0.55, w: 3.2, h: 0.28,
    fontFace: 'Aptos', fontSize: 11, bold: true,
    color: '7B887B', charSpacing: 1.8,
  });
  slide.addText(title, {
    x: 0.7, y: 1.25, w: 11.9, h: 0.8,
    fontFace: 'Aptos Display', fontSize: 32, bold: true,
    color: '192018',
  });
  slide.addText(body, {
    x: 0.7, y: 2.35, w: 11.8, h: 2.6,
    fontFace: 'Aptos', fontSize: 20,
    color: '4E5B50', breakLine: false,
  });
  slide.addShape(pptx.ShapeType.line, {
    x: 0.7, y: 6.9, w: 12.0, h: 0,
    line: { color: 'DDE2D8', width: 1 },
  });
}

await pptx.writeFile({ fileName: 'docs/project-presentation.pptx' });
