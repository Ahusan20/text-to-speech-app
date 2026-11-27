import { useEffect, useMemo, useState } from 'react';
import { History, LogIn, LogOut, Sparkles, Upload, User, Waves } from 'lucide-react';
import TextInput from '../components/TextInput.jsx';
import LanguageSelector from '../components/LanguageSelector.jsx';
import VoiceSelector from '../components/VoiceSelector.jsx';
import GenerateButton from '../components/GenerateButton.jsx';
import AudioPlayer from '../components/AudioPlayer.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import AuthModal from '../components/AuthModal.jsx';
import {
  getVoices,
  convertTextToSpeech,
  getBrowserVoices,
  enhanceTextWithAi,
  checkHealth,
} from '../services/api.js';
import { extractTextFromFile } from '../utils/documentParser.js';
import {
  getCurrentUser,
  signOutUser,
  fetchCloudHistory,
  saveCloudHistory,
  fetchCloudFavorites,
  addCloudFavorite,
  removeCloudFavorite,
  isSupabaseConfigured,
} from '../services/supabase.js';

const MAX_CHARACTERS = 500;
const hostname = window.location.hostname;
const hasConfiguredApi = Boolean(import.meta.env.VITE_API_BASE_URL);
const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1';
const isGitHubPages = hostname.endsWith('github.io');
const hasBackend = !isGitHubPages && (isLocalHost || hasConfiguredApi);

export default function Home() {
  const [text, setText] = useState('Hello! Welcome to the Text-to-Speech App.');
  const [language, setLanguage] = useState('en-US');
  const [voices, setVoices] = useState([]);
  const [voice, setVoice] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [audioFormat, setAudioFormat] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAvailable, setAiAvailable] = useState(false);
  const [error, setError] = useState('');
  const [browserMode, setBrowserMode] = useState(() => (
    isGitHubPages || (!isLocalHost && !hasConfiguredApi)
  ));
  const [user, setUser] = useState(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
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
    const nextFavorite = !favorite;
    const updated = favorite ? favorites.filter((item) => item !== text) : [text, ...favorites].slice(0, 20);
    setFavorites(updated);
    localStorage.setItem('vox-favorites', JSON.stringify(updated));

    if (user) {
      const syncFavorite = nextFavorite
        ? addCloudFavorite(user.id, text, voice)
        : removeCloudFavorite(user.id, text);
      syncFavorite.catch((syncError) => {
        setError(`Favorite was updated locally, but cloud sync failed: ${syncError.message}`);
      });
    }
  }

  useEffect(() => {
    let active = true;
    const loadBrowserVoices = () => {
      const available = getBrowserVoices();
      if (!active) return;
      setVoices(available);
      const defaultVoice = available.find((item) => item.language.toLowerCase().startsWith('en'));
      setVoice(defaultVoice?.id || available[0]?.id || '');
    };

    if (hasBackend) {
      checkHealth()
        .then((health) => {
          if (active) setAiAvailable(Boolean(health.aiEnhancementAvailable));
        })
        .catch(() => {
          if (active) setAiAvailable(false);
        });

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

    getCurrentUser().then(async (currentUser) => {
      if (currentUser && active) {
        setUser(currentUser);
        try {
          const [cloudHistory, cloudFavs] = await Promise.all([
            fetchCloudHistory(currentUser.id),
            fetchCloudFavorites(currentUser.id),
          ]);
          if (cloudHistory.length > 0 && active) setHistory(cloudHistory);
          if (cloudFavs.length > 0 && active) setFavorites(cloudFavs);
        } catch (e) {
          if (active) setError(`Cloud sync failed: ${e.message}`);
        }
      }
    }).catch((syncError) => {
      if (active) setError(`Cloud sync failed: ${syncError.message}`);
    });

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
    setAudioFormat('');

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
        setAudioFormat(data.format);
        if (user && data.audioUrl) {
          try {
            await saveCloudHistory(user.id, { text, language, voice, audioUrl: data.audioUrl });
          } catch (syncError) {
            setError(`Speech was generated, but cloud history could not be saved: ${syncError.message}`);
          }
        }
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

  async function handleAiEnhance(mode) {
    if (!text.trim()) {
      setError('Please enter some text before using AI enhancement.');
      return;
    }
    setError('');
    setAiLoading(true);
    try {
      const enhanced = await enhanceTextWithAi({ text, mode });
      setText(enhanced.slice(0, MAX_CHARACTERS));
      if (enhanced.length > MAX_CHARACTERS) {
        setError('Enhanced text was trimmed to fit the 500-character limit.');
      }
    } catch (err) {
      setError(err.message || 'AI text enhancement failed.');
    } finally {
      setAiLoading(false);
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
    try {
      setError('');
      const content = await extractTextFromFile(file);
      const cleanContent = content.trim();
      if (!cleanContent) {
        setError('No readable text found in the file.');
        return;
      }
      setText(cleanContent.slice(0, MAX_CHARACTERS));
      if (cleanContent.length > MAX_CHARACTERS) {
        setError('Loaded the first 500 characters (maximum allowed limit).');
      }
    } catch (err) {
      setError(err.message || 'Failed to extract text from document.');
    } finally {
      event.target.value = '';
    }
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
        <div className="topbar-actions">
          <div className="status">
            <span /> System ready
          </div>
          {user ? (
            <div className="user-profile">
              <span className="user-badge" title={user.email}>
                <User size={13} /> {user.email?.split('@')[0] || 'User'}
              </span>
              <button
                className="auth-btn"
                type="button"
                onClick={async () => {
                  try {
                    await signOutUser();
                    setUser(null);
                  } catch (signOutError) {
                    setError(`Could not sign out: ${signOutError.message}`);
                  }
                }}
              >
                <LogOut size={13} /> Sign out
              </button>
            </div>
          ) : (
            <button
              className="auth-btn sign-in"
              type="button"
              onClick={() => setIsAuthOpen(true)}
              disabled={!isSupabaseConfigured}
              title={!isSupabaseConfigured ? 'Cloud sync is not configured for this deployment.' : undefined}
            >
              <LogIn size={13} /> {isSupabaseConfigured ? 'Sign in' : 'Cloud sync unavailable'}
            </button>
          )}
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
          <label className="upload-button" title="Upload TXT, PDF, or DOCX">
            <Upload size={15} /> Upload Doc
            <input type="file" accept=".txt,.pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain" onChange={handleFileUpload} />
          </label>
          <div
            className="ai-enhance-group"
            title={!aiAvailable ? 'AI enhancement is unavailable in this deployment.' : undefined}
          >
            <button
              className="ai-button"
              type="button"
              onClick={() => handleAiEnhance('conversational')}
              disabled={!aiAvailable || aiLoading || !text.trim()}
              title={aiAvailable ? 'Convert text into warm, conversational speech' : 'AI enhancement is unavailable in this deployment.'}
            >
              <Sparkles size={14} />
              {aiLoading ? 'Enhancing...' : 'Conversational'}
            </button>
            <button
              className="ai-sub-button"
              type="button"
              onClick={() => handleAiEnhance('summarize')}
              disabled={!aiAvailable || aiLoading || !text.trim()}
              title={aiAvailable ? 'Summarize text within limits' : 'AI enhancement is unavailable in this deployment.'}
            >
              Summarize
            </button>
            <button
              className="ai-sub-button"
              type="button"
              onClick={() => handleAiEnhance('grammar')}
              disabled={!aiAvailable || aiLoading || !text.trim()}
              title={aiAvailable ? 'Fix grammar and phrasing' : 'AI enhancement is unavailable in this deployment.'}
            >
              Fix Grammar
            </button>
            <button
              className="ai-sub-button"
              type="button"
              onClick={() => handleAiEnhance('rewrite')}
              disabled={!aiAvailable || aiLoading || !text.trim()}
              title={aiAvailable ? 'Rewrite text for clarity and spoken cadence' : 'AI enhancement is unavailable in this deployment.'}
            >
              Rewrite
            </button>
          </div>
          <label className="browser-mode-toggle">
            <input
              type="checkbox"
              checked={browserMode}
              onChange={(event) => setBrowserMode(event.target.checked)}
              disabled={!hasBackend}
              title={!hasBackend ? 'This deployment uses browser speech only.' : undefined}
            />
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
          audioFormat={audioFormat}
          speechMode={audioUrl === 'browser-speech'}
          text={text}
          voice={languageVoices.find((item) => item.id === voice)}
        />
        {history.length > 0 && (
          <section className="history-card" aria-label="Recent speech history">
            <div className="history-title">
              <History size={15} /> Recent texts{' '}
              <span>{user ? 'Synced with Supabase' : 'Stored locally on this device'}</span>
            </div>
            {history.slice(0, 5).map((item) => (
              <button type="button" className="history-item" key={item.createdAt} onClick={() => { setText(item.text); setLanguage(item.language); }}>
                {item.text}
              </button>
            ))}
          </section>
        )}
        {favorites.length > 0 && (
          <section className="history-card" aria-label="Favorite texts">
            <div className="history-title">
              ★ Favorites{' '}
              <span>{user ? 'Synced with Supabase' : 'Stored locally on this device'}</span>
            </div>
            {favorites.slice(0, 5).map((item) => (
              <button type="button" className="history-item" key={item} onClick={() => setText(item)}>
                {item}
              </button>
            ))}
          </section>
        )}
      </section>

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={(authenticatedUser) => setUser(authenticatedUser)}
      />
    </main>
  );
}
