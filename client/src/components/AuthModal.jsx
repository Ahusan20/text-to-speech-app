import { useState } from 'react';
import { X, Lock, Mail, LoaderCircle, Database, Check } from 'lucide-react';
import { signInWithEmail, signUpWithEmail, isSupabaseConfigured } from '../services/supabase.js';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  if (!isOpen) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setNotice('');
    setLoading(true);

    try {
      if (isSignUp) {
        const user = await signUpWithEmail(email, password);
        setNotice('Account created! Please check your email for a confirmation link.');
        if (user && onAuthSuccess) onAuthSuccess(user);
      } else {
        const user = await signInWithEmail(email, password);
        if (onAuthSuccess) onAuthSuccess(user);
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div className="modal-content" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="modal-header">
          <h3>{isSupabaseConfigured ? (isSignUp ? 'Create your account' : 'Sign in to Vox Studio') : 'Storage & Sync Settings'}</h3>
          <button className="modal-close" type="button" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {!isSupabaseConfigured ? (
          <div className="local-storage-info">
            <div className="local-status-pill">
              <span className="local-dot" />
              <span>Local Storage Active</span>
            </div>
            <p className="modal-subtitle">
              All your generated speech recordings, favorite texts, and custom settings are automatically saved directly in your browser's local storage.
            </p>
            <div className="info-box">
              <div className="info-box-header">
                <Database size={15} />
                <strong>Optional Cloud Sync (Supabase)</strong>
              </div>
              <p>
                To sync your history across multiple devices, connect a free Supabase project by adding <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> to <code>client/.env</code>.
              </p>
              <p className="schema-note">
                <Check size={13} strokeWidth={2.5} /> The complete PostgreSQL database schema with Row Level Security is ready in <code>supabase/schema.sql</code>.
              </p>
            </div>
            <button className="auth-submit-button" type="button" onClick={onClose}>
              Continue with Local Storage
            </button>
          </div>
        ) : (
          <>
            <p className="modal-subtitle">
              {isSignUp
                ? 'Sign up to sync your generated speech history and favorites across devices.'
                : 'Log in to access your saved speech records and favorite voices.'}
            </p>

            {error && <div className="modal-alert error">{error}</div>}
            {notice && <div className="modal-alert notice">{notice}</div>}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="auth-field">
                <label htmlFor="auth-email">Email address</label>
                <div className="input-wrap">
                  <Mail size={16} />
                  <input
                    id="auth-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              <div className="auth-field">
                <label htmlFor="auth-password">Password</label>
                <div className="input-wrap">
                  <Lock size={16} />
                  <input
                    id="auth-password"
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button className="auth-submit-button" type="submit" disabled={loading}>
                {loading ? <LoaderCircle className="spinner" size={16} /> : null}
                {isSignUp ? 'Sign Up' : 'Log In'}
              </button>
            </form>

            <div className="modal-footer">
              {isSignUp ? (
                <span>
                  Already have an account?{' '}
                  <button type="button" onClick={() => { setIsSignUp(false); setError(''); }}>
                    Sign in
                  </button>
                </span>
              ) : (
                <span>
                  Don't have an account?{' '}
                  <button type="button" onClick={() => { setIsSignUp(true); setError(''); }}>
                    Create one
                  </button>
                </span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
