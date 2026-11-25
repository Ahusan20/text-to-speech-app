import { ChevronDown } from 'lucide-react';

const languageLabels = {
  'en-US': 'English',
  'hi-IN': 'Hindi',
  'gu-IN': 'Gujarati',
  'mr-IN': 'Marathi',
  'es-ES': 'Spanish',
  'fr-FR': 'French',
  'de-DE': 'German',
};

export default function LanguageSelector({ languages, selectedLanguage, onChange }) {
  return (
    <div className="select-group">
      <label htmlFor="language">Language</label>
      <div className="select-wrap">
        <select
          id="language"
          value={selectedLanguage}
          onChange={(e) => onChange(e.target.value)}
        >
          {languages.map((code) => (
            <option key={code} value={code}>
              {languageLabels[code] || code}
            </option>
          ))}
        </select>
        <ChevronDown size={16} />
      </div>
    </div>
  );
}
