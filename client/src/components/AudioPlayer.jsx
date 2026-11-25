import { useEffect, useRef, useState } from 'react';
import { Check, Pause, Play, Volume2, VolumeX } from 'lucide-react';
import DownloadButton from './DownloadButton.jsx';

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return '0:00';
  const minutes = Math.floor(seconds / 60);
  const remaining = Math.floor(seconds % 60);
  return `${minutes}:${remaining.toString().padStart(2, '0')}`;
}

export default function AudioPlayer({ audioUrl }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [lastVolume, setLastVolume] = useState(0.8);
  const audioRef = useRef(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  async function togglePlayback() {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      await audioRef.current.play();
    }
  }

  function seek(event) {
    const nextTime = Number(event.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = nextTime;
    }
    setCurrentTime(nextTime);
  }

  function toggleMute() {
    if (volume > 0) {
      setLastVolume(volume);
      setVolume(0);
    } else {
      setVolume(lastVolume || 0.8);
    }
  }

  if (!audioUrl) return null;

  return (
    <div className="audio-card">
      <div className="audio-success">
        <span className="success-icon">
          <Check size={13} strokeWidth={3} />
        </span>
        <span>Generated audio</span>
      </div>

      <div className="player">
        <button
          className="play-button"
          type="button"
          onClick={togglePlayback}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
        </button>

        <span className="time">{formatTime(currentTime)}</span>

        <input
          className="seek"
          type="range"
          min="0"
          max={duration || 0}
          step="0.01"
          value={Math.min(currentTime, duration || 0)}
          onChange={seek}
          aria-label="Seek audio"
          style={{ '--progress': `${duration ? (currentTime / duration) * 100 : 0}%` }}
        />

        <span className="time">{formatTime(duration)}</span>

        <button
          className="mute-button"
          type="button"
          onClick={toggleMute}
          aria-label="Toggle mute"
        >
          {volume === 0 ? <VolumeX size={17} /> : <Volume2 size={17} />}
        </button>

        <input
          className="volume"
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={volume}
          onChange={(event) => setVolume(Number(event.target.value))}
          aria-label="Volume"
          style={{ '--progress': `${volume * 100}%` }}
        />

        <DownloadButton audioUrl={audioUrl} />
      </div>

      <audio
        ref={audioRef}
        src={audioUrl}
        onLoadedMetadata={(event) => {
          setDuration(event.currentTarget.duration);
          setCurrentTime(0);
        }}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
      />
    </div>
  );
}
