import { useEffect, useMemo, useState } from 'react';
import { History, Upload, Waves } from 'lucide-react';
import TextInput from '../components/TextInput.jsx';
import LanguageSelector from '../components/LanguageSelector.jsx';
import VoiceSelector from '../components/VoiceSelector.jsx';
import GenerateButton from '../components/GenerateButton.jsx';
import AudioPlayer from '../components/AudioPlayer.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import { getVoices, convertTextToSpeech, getBrowserVoices } from '../services/api.js';

const MAX_CHARACTERS = 500;

export default function Home() {
  const [text, setText] = useState('Hello! Welcome to the Text-to-Speech App.');
  const [language, setLanguage] = useState('en-US');
  const [voices, setVoices] = useState([]);
  const [voice, setVoice] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [browserMode, setBrowserMode] = useState(() => window.location.hostname.endsWith('github.io'));
  const [history, setHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('vox-history') || '[]');
    } catch {
      return [];
    }
  });
  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('vox-favorites') || '[]');
    } catch {
      return [];
    }
  });
  const favorite = favorites.includes(text);

  function toggleFavorite() {
    const updated = favorite ? favorites.filter((item) => item !== text) : [text, ...favorites].slice(0, 20);
    setFavorites(updated);
    localStorage.setItem('vox-favorites', JSON.stringify(updated));
  }

  useEffect(() => {
    const hasBackend = !window.location.hostname.endsWith('github.io');
    let active = true;
    const loadBrowserVoices = () => {
      const available = getBrowserVoices();
      if (!active) return;
      setVoices(available);
      const defaultVoice = available.find((item) => item.language.toLowerCase().startsWith('en'));
      setVoice(defaultVoice?.id || available[0]?.id || '');
    };

    if (hasBackend) {
      getVoices()
        .then((data) => {
          if (!active) return;
          setVoices(data);
          const defaultVoice = data.find((item) => item.language === 'en-US');
          setVoice(defaultVoice?.id || '');
        })
        .catch(() => {
          setBrowserMode(true);
          loadBrowserVoices();
        });
    } else {
      loadBrowserVoices();
    }
    window.speechSynthesis?.addEventListener('voiceschanged', loadBrowserVoices);
    return () => {
      active = false;
      window.speechSynthesis?.removeEventListener('voiceschanged', loadBrowserVoices);
    };
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
      if (window.location.hostname.endsWith('github.io') || browserMode) {
        if (!('speechSynthesis' in window)) {
          throw new Error('This browser does not support speech synthesis.');
        }
        window.speechSynthesis.cancel();
        setAudioUrl('browser-speech');
      } else {
        const data = await convertTextToSpeech({ text, language, voice });
        setAudioUrl(data.audioUrl);
      }
      const nextHistory = [{ text, language, createdAt: Date.now() }, ...history].slice(0, 10);
      setHistory(nextHistory);
      localStorage.setItem('vox-history', JSON.stringify(nextHistory));
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

  async function handleFileUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.txt')) {
      setError('For free browser mode, upload a plain text (.txt) file.');
      return;
    }
    const content = await file.text();
    setText(content.slice(0, MAX_CHARACTERS));
    setError(content.length > MAX_CHARACTERS ? 'Only the first 500 characters were loaded.' : '');
    event.target.value = '';
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href={import.meta.env.BASE_URL} aria-label="Vox Studio home">
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
        <div className="utility-row">
          <label className="upload-button">
            <Upload size={15} /> Upload TXT
            <input type="file" accept=".txt,text/plain" onChange={handleFileUpload} />
          </label>
          <label className="browser-mode-toggle">
            <input type="checkbox" checked={browserMode} onChange={(event) => setBrowserMode(event.target.checked)} />
            Free browser speech
          </label>
          <button className={`favorite-button${favorite ? ' active' : ''}`} type="button" onClick={toggleFavorite} disabled={!text.trim()}>
            {favorite ? '★ Saved' : '☆ Favorite'}
          </button>
        </div>

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

        <AudioPlayer
          key={audioUrl}
          audioUrl={audioUrl}
          speechMode={audioUrl === 'browser-speech'}
          text={text}
          voice={languageVoices.find((item) => item.id === voice)}
        />
        {history.length > 0 && (
          <section className="history-card" aria-label="Recent speech history">
            <div className="history-title"><History size={15} /> Recent texts <span>Stored on this device</span></div>
            {history.slice(0, 5).map((item) => (
              <button type="button" className="history-item" key={item.createdAt} onClick={() => { setText(item.text); setLanguage(item.language); }}>
                {item.text}
              </button>
            ))}
          </section>
        )}
        {favorites.length > 0 && (
          <section className="history-card" aria-label="Favorite texts">
            <div className="history-title">★ Favorites <span>Stored on this device</span></div>
            {favorites.slice(0, 5).map((item) => (
              <button type="button" className="history-item" key={item} onClick={() => setText(item)}>
                {item}
              </button>
            ))}
          </section>
        )}
      </section>
    </main>
  );
}
