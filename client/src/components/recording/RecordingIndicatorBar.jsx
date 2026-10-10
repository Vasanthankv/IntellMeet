import React, { useState, useEffect } from 'react';
import { Play, Pause, Square, Cloud, Laptop, AlertCircle } from 'lucide-react';

export default function RecordingIndicatorBar({
  isRecording = false,
  isPaused = false,
  mode = 'CLOUD',
  startedAt = null,
  canControl = true,
  onPause,
  onResume,
  onStop,
}) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!isRecording) {
      setSeconds(0);
      return;
    }

    if (isPaused) return;

    const interval = setInterval(() => {
      setSeconds(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isRecording, isPaused]);

  if (!isRecording) return null;

  const formatTime = (totalSecs) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    if (hrs > 0) {
      return `${String(hrs).padStart(2, '0')}:${String(remMins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const isLocal = mode.toUpperCase() === 'LOCAL';

  return (
    <div className="fixed top-4 left-6 z-40 animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="bg-[#181818]/90 backdrop-blur-md border border-[#333] shadow-2xl rounded-full px-3.5 py-1.5 flex items-center gap-3 text-xs text-white">
        {/* Blinking REC Status Indicator (23.3 & 23.7) */}
        <div className="flex items-center gap-1.5">
          <span className={`w-2.5 h-2.5 rounded-full ${
            isPaused ? 'bg-amber-400' : 'bg-red-500 animate-pulse'
          }`} />
          <span className="font-extrabold tracking-wider text-[11px] text-red-400 uppercase">
            {isPaused ? 'PAUSED' : 'REC'}
          </span>
        </div>

        {/* Mode Tag */}
        <div className={`flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
          isLocal 
            ? 'bg-blue-950/80 text-blue-300 border-blue-800/40' 
            : 'bg-purple-950/80 text-purple-300 border-purple-800/40'
        }`}>
          {isLocal ? <Laptop className="w-3 h-3" /> : <Cloud className="w-3 h-3" />}
          <span>{isLocal ? 'Computer' : 'Cloud'}</span>
        </div>

        {/* Elapsed Timer */}
        <span className="font-mono text-gray-200 text-xs font-semibold">
          {formatTime(seconds)}
        </span>

        {/* Control Buttons (23.3 & 23.8) */}
        {canControl && (
          <div className="flex items-center gap-1 pl-2 border-l border-white/10">
            {isPaused ? (
              <button
                onClick={onResume}
                className="p-1 rounded-full hover:bg-emerald-500/20 text-emerald-400 transition-colors"
                title="Resume Recording"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
              </button>
            ) : (
              <button
                onClick={onPause}
                className="p-1 rounded-full hover:bg-amber-500/20 text-amber-400 transition-colors"
                title="Pause Recording"
              >
                <Pause className="w-3.5 h-3.5 fill-current" />
              </button>
            )}

            <button
              onClick={onStop}
              className="p-1 rounded-full hover:bg-red-500/20 text-red-400 transition-colors"
              title="Stop Recording"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
