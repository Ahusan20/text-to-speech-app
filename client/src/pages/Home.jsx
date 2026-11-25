import { useEffect, useMemo, useState } from 'react';
import { Waves } from 'lucide-react';
import TextInput from '../components/TextInput.jsx';
import LanguageSelector from '../components/LanguageSelector.jsx';
import VoiceSelector from '../components/VoiceSelector.jsx';
import GenerateButton from '../components/GenerateButton.jsx';
import AudioPlayer from '../components/AudioPlayer.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import { getVoices, convertTextToSpeech } from '../services/api.js';

const MAX_CHARACTERS = 500;

export default function Home() {
  const [text, setText] = useState('Hello! Welcome to the Text-to-Speech App.');
  const [language, setLanguage] = useState('en-US');
  const [voices, setVoices] = useState([]);
  const [voice, setVoice] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getVoices()
      .then((data) => {
        setVoices(data);
        const defaultVoice = data.find((item) => item.language === 'en-US');
        setVoice(defaultVoice?.id || '');
      })
      .catch((err) => {
        setError(err.message || 'Could not load available voices.');
      });
  }, []);

  const languageVoices = useMemo(
    () => voices.filter((item) => item.language === language),
    [voices, language],
  );

  const availableLanguages = useMemo(
    () => [...new Set(voices.map((item) => item.language))],
    [voices],
  );

  async function handleGenerate() {
    setError('');

    if (!text.trim()) {
      setError('Please enter some text to convert.');
      return;
    }

    if (text.length > MAX_CHARACTERS) {
      setError(`Text must not exceed ${MAX_CHARACTERS} characters.`);
      return;
    }

    setLoading(true);
    setAudioUrl('');

    try {
      const data = await convertTextToSpeech({ text, language, voice });
      setAudioUrl(data.audioUrl);
    } catch (requestError) {
      setError(requestError.message || 'Failed to generate speech.');
    } finally {
      setLoading(false);
    }
  }

  function handleLanguageChange(nextLanguage) {
    setLanguage(nextLanguage);
    const nextVoice = voices.find((item) => item.language === nextLanguage);
    setVoice(nextVoice?.id || '');
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Vox Studio home">
          <span className="brand-mark">
            <Waves size={21} strokeWidth={2.4} />
          </span>
          <span>Vox Studio</span>
        </a>
        <div className="status">
          <span /> System ready
        </div>
      </header>

      <section className="workspace">
        <div className="heading">
          <p className="eyebrow">AI VOICE SYNTHESIS</p>
          <h1>Turn words into <em>speech.</em></h1>
        </div>

        <TextInput
          text={text}
          onChange={setText}
          onClear={() => {
            setText('');
            setError('');
          }}
          maxLength={MAX_CHARACTERS}
        />

        <ErrorMessage message={error} />

        <div className="controls-row">
          <LanguageSelector
            languages={availableLanguages}
            selectedLanguage={language}
            onChange={handleLanguageChange}
          />

          <VoiceSelector
            voices={languageVoices}
            selectedVoice={voice}
            onChange={setVoice}
          />

          <GenerateButton
            onClick={handleGenerate}
            loading={loading}
          />
        </div>

        <AudioPlayer key={audioUrl} audioUrl={audioUrl} />
      </section>
    </main>
  );
}
