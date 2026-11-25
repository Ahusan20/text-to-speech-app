export const MAX_CHARACTERS = 500;

export const voices = [
  { id: 'sapi-female', name: 'English Female', language: 'en-US', gender: 'Female' },
  { id: 'sapi-male', name: 'English Male', language: 'en-US', gender: 'Male' },
  { id: 'en-us-female', name: 'English Female', language: 'en-US', gender: 'Female' },
  { id: 'en-us-male', name: 'English Male', language: 'en-US', gender: 'Male' },
  { id: 'hi-in-female', name: 'Hindi Female', language: 'hi-IN', gender: 'Female' },
  { id: 'hi-in-male', name: 'Hindi Male', language: 'hi-IN', gender: 'Male' },
  { id: 'gu-in-female', name: 'Gujarati Female', language: 'gu-IN', gender: 'Female' },
  { id: 'mr-in-female', name: 'Marathi Female', language: 'mr-IN', gender: 'Female' },
  { id: 'es-es-female', name: 'Spanish Female', language: 'es-ES', gender: 'Female' },
  { id: 'fr-fr-female', name: 'French Female', language: 'fr-FR', gender: 'Female' },
  { id: 'de-de-female', name: 'German Female', language: 'de-DE', gender: 'Female' },
];

export const supportedLanguages = [...new Set(voices.map((voice) => voice.language))];
