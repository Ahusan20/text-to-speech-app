import { useState } from 'react';
import { X, Lock, Mail, LoaderCircle } from 'lucide-react';
import { signInWithEmail, signUpWithEmail } from '../services/supabase.js';

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
          <h3>{isSignUp ? 'Create your account' : 'Sign in to Vox Studio'}</h3>
          <button className="modal-close" type="button" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

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
      </div>
    </div>
  );
}
