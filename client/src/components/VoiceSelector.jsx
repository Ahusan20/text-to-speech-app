import { ChevronDown } from 'lucide-react';

export default function VoiceSelector({ voices, selectedVoice, onChange }) {
  return (
    <div className="select-group">
      <label htmlFor="voice">Voice</label>
      <div className="select-wrap">
        <select
          id="voice"
          value={selectedVoice}
          onChange={(e) => onChange(e.target.value)}
        >
          {voices.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name} ({item.gender})
            </option>
          ))}
        </select>
        <ChevronDown size={16} />
      </div>
    </div>
  );
}
