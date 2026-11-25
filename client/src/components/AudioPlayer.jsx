import { useEffect, useRef, useState } from 'react';
import { Check, Pause, Play, Volume2, VolumeX } from 'lucide-react';
import DownloadButton from './DownloadButton.jsx';
import { getAudioFilename } from '../utils/audioFormat.js';

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return '0:00';
  const minutes = Math.floor(seconds / 60);
  const remaining = Math.floor(seconds % 60);
  return `${minutes}:${remaining.toString().padStart(2, '0')}`;
}

export default function AudioPlayer({ audioUrl, audioFormat, speechMode = false, text = '', voice }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [lastVolume, setLastVolume] = useState(0.8);
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const audioRef = useRef(null);
  const utteranceRef = useRef(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => () => {
    if (speechMode) window.speechSynthesis?.cancel();
  }, [speechMode, audioUrl]);

  async function togglePlayback() {
    if (speechMode) {
      if (isPlaying) {
        window.speechSynthesis.pause();
        setIsPlaying(false);
      } else if (window.speechSynthesis.paused && utteranceRef.current) {
        window.speechSynthesis.resume();
        setIsPlaying(true);
      } else {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = voice?.language || 'en-US';
        if (voice?.nativeVoice) utterance.voice = voice.nativeVoice;
        utterance.rate = rate;
        utterance.pitch = pitch;
        utterance.volume = volume;
        utterance.onstart = () => setIsPlaying(true);
        utterance.onend = () => setIsPlaying(false);
        utterance.onerror = () => setIsPlaying(false);
        utteranceRef.current = utterance;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
      }
      return;
    }
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      await audioRef.current.play();
    }
  }

  function seek(event) {
    if (speechMode) return;
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
        <span>{speechMode ? 'Browser speech ready' : 'Generated audio'}</span>
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

        {speechMode ? (
          <div className="speech-controls">
            <label>Speed
              <select value={rate} onChange={(event) => setRate(Number(event.target.value))} aria-label="Speech speed">
                {[0.75, 1, 1.25, 1.5, 2].map((value) => <option key={value} value={value}>{value}x</option>)}
              </select>
            </label>
            <label>Pitch
              <select value={pitch} onChange={(event) => setPitch(Number(event.target.value))} aria-label="Speech pitch">
                {[0.75, 1, 1.25, 1.5].map((value) => <option key={value} value={value}>{value}x</option>)}
              </select>
            </label>
            <label className="speech-volume">Volume
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={(event) => setVolume(Number(event.target.value))}
                aria-label="Speech volume"
                style={{ '--progress': `${volume * 100}%` }}
              />
            </label>
            <span className="browser-playback-note">Playback uses a voice installed in your browser. Audio download is unavailable in browser speech mode.</span>
          </div>
        ) : (
          <>
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
          </>
        )}

        {!speechMode && <button
          className="mute-button"
          type="button"
          onClick={toggleMute}
          aria-label="Toggle mute"
        >
          {volume === 0 ? <VolumeX size={17} /> : <Volume2 size={17} />}
        </button>}

        {!speechMode && <input
          className="volume"
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={volume}
          onChange={(event) => setVolume(Number(event.target.value))}
          aria-label="Volume"
          style={{ '--progress': `${volume * 100}%` }}
        />}

        {!speechMode && <DownloadButton audioUrl={audioUrl} filename={getAudioFilename(audioFormat)} />}
      </div>

      {!speechMode && <audio
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
      />}
    </div>
  );
}
