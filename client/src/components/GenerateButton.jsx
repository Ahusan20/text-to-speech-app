import { LoaderCircle, Waves } from 'lucide-react';

export default function GenerateButton({ onClick, loading }) {
  return (
    <button
      className="generate-button"
      type="button"
      onClick={onClick}
      disabled={loading}
    >
      {loading ? (
        <LoaderCircle className="spinner" size={18} />
      ) : (
        <Waves size={18} />
      )}
      {loading ? 'Generating...' : 'Generate Speech'}
    </button>
  );
}
