import { RotateCcw } from 'lucide-react';

export default function TextInput({ text, onChange, onClear, maxLength = 500 }) {
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const isNearLimit = text.length >= maxLength;
  const percentage = Math.min(100, (text.length / maxLength) * 100);

  return (
    <div className="editor-card">
      <div className="editor-header">
        <label htmlFor="text-input">Text content</label>
        <button
          className="clear-button"
          type="button"
          onClick={onClear}
          aria-label="Clear text input"
        >
          <RotateCcw size={15} />
          Clear
        </button>
      </div>

      <textarea
        id="text-input"
        value={text}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength}
        placeholder="Type or paste the text you want to hear..."
      />

      <div className="char-progress-track" aria-hidden="true">
        <div
          className={`char-progress-fill ${percentage >= 100 ? 'maxed' : percentage >= 85 ? 'warning' : ''}`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="text-meta">
        <span>{wordCount} {wordCount === 1 ? 'word' : 'words'}</span>
        <span className={isNearLimit ? 'limit near-limit' : 'limit'}>
          {text.length} / {maxLength} characters
        </span>
      </div>
    </div>
  );
}
