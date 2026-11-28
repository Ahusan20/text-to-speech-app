import { useState } from 'react';
import { Download, LoaderCircle } from 'lucide-react';

export default function DownloadButton({
  audioUrl,
  filename = 'speech.mp3',
  onGenerateDownload,
  label = 'Download',
  className = '',
}) {
  const [downloading, setDownloading] = useState(false);

  async function handleDownload(e) {
    e.preventDefault();
    e.stopPropagation();
    if (downloading) return;

    setDownloading(true);
    try {
      let targetUrl = audioUrl;

      // If in browser speech mode without an audioUrl, trigger on-demand audio generation
      if ((!targetUrl || targetUrl === 'browser-speech') && onGenerateDownload) {
        targetUrl = await onGenerateDownload();
      }

      if (!targetUrl || targetUrl === 'browser-speech') {
        throw new Error('No downloadable audio stream is available.');
      }

      let blobUrl = targetUrl;
      let shouldRevoke = false;

      // Handle data URIs or remote CDN / server URLs via Blob
      if (targetUrl.startsWith('data:')) {
        const response = await fetch(targetUrl);
        const blob = await response.blob();
        blobUrl = URL.createObjectURL(blob);
        shouldRevoke = true;
      } else if (!targetUrl.startsWith('blob:')) {
        try {
          const response = await fetch(targetUrl);
          if (response.ok) {
            const blob = await response.blob();
            blobUrl = URL.createObjectURL(blob);
            shouldRevoke = true;
          }
        } catch {
          // If CORS prevents fetch, fallback to direct targetUrl
          blobUrl = targetUrl;
        }
      }

      // Trigger standard browser download
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      if (shouldRevoke) {
        setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
      }
    } catch (err) {
      console.error('Audio download failed:', err);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <button
      className={`download-button ${className}`.trim()}
      type="button"
      onClick={handleDownload}
      disabled={downloading}
      title="Download generated audio file"
      aria-label="Download generated audio"
    >
      {downloading ? <LoaderCircle className="spinner" size={15} /> : <Download size={15} />}
      <span>{downloading ? 'Downloading...' : label}</span>
    </button>
  );
}
