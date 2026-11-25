import { Download } from 'lucide-react';

export default function DownloadButton({ audioUrl, filename }) {
  if (!audioUrl) return null;

  return (
    <a
      className="download-button"
      href={audioUrl}
      download={filename}
      aria-label="Download generated audio"
    >
      <Download size={16} />
      Download
    </a>
  );
}
