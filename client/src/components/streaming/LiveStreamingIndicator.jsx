import React, { useEffect, useState } from 'react';
import { Radio, Users, Copy, Square, Check, ExternalLink, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * 33.11 Live Streaming In-Meeting Status Bar
 * Displays live streaming status, elapsed duration, audience size,
 * destination platform badges, and quick stop button.
 */
const LiveStreamingIndicator = ({
  session,
  isHostOrCoHost = false,
  onStopStreaming,
  onOpenStreamingModal
}) => {
  const [copied, setCopied] = useState(false);
  const [elapsed, setElapsed] = useState('00:00:00');

  const isLive = session?.status === 'LIVE';
  const isConnecting = session?.status === 'CONNECTING';

  useEffect(() => {
    if (!isLive || !session?.startedAt) {
      setElapsed('00:00:00');
      return;
    }

    const updateTimer = () => {
      const startMs = new Date(session.startedAt).getTime();
      const nowMs = Date.now();
      const diffSec = Math.max(0, Math.floor((nowMs - startMs) / 1000));

      const hrs = Math.floor(diffSec / 3600);
      const mins = Math.floor((diffSec % 3600) / 60);
      const secs = diffSec % 60;

      const pad = (n) => String(n).padStart(2, '0');
      setElapsed(`${pad(hrs)}:${pad(mins)}:${pad(secs)}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [isLive, session?.startedAt]);

  if (!isLive && !isConnecting) return null;

  const handleCopyLink = () => {
    const firstPageUrl = session?.destinations?.find(d => d.streamPageUrl)?.streamPageUrl;
    if (firstPageUrl) {
      navigator.clipboard.writeText(firstPageUrl);
      setCopied(true);
      toast.success('Public livestream watch link copied to clipboard!');
      setTimeout(() => setCopied(false), 2500);
    } else {
      toast.error('No public stream page URL configured for this broadcast');
    }
  };

  const platformBadgeStyles = {
    YOUTUBE: 'bg-red-500/20 text-red-400 border-red-500/40',
    FACEBOOK: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
    TWITCH: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
    CUSTOM_RTMP: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
  };

  return (
    <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 pointer-events-auto animate-fade-in">
      <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-[#1C1C1E]/95 backdrop-blur-md border border-red-500/40 shadow-2xl text-xs text-white">
        {/* Status indicator */}
        <div className="flex items-center gap-2">
          {isLive ? (
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
            </span>
          ) : (
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400 animate-pulse"></span>
          )}
          <span className="font-bold text-red-400 tracking-wider">
            {isLive ? '● LIVE' : 'CONNECTING...'}
          </span>
        </div>

        {/* Platform tags */}
        <div className="flex items-center gap-1.5 border-l border-white/10 pl-3">
          {(session?.destinations || []).map((dest, idx) => (
            <span
              key={idx}
              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${platformBadgeStyles[dest.platform] || 'bg-gray-800 text-gray-300'}`}
              title={dest.name || dest.platform}
            >
              {dest.platform}
            </span>
          ))}
        </div>

        {/* Real-time viewer count (33.11) */}
        {isLive && (
          <div className="flex items-center gap-1.5 border-l border-white/10 pl-3 text-gray-300" title="Total active external viewers">
            <Users className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-bold text-white">
              {(session?.viewerCount || 0).toLocaleString()}
            </span>
            <span className="text-[10px] text-gray-400">viewers</span>
          </div>
        )}

        {/* Elapsed Timer */}
        {isLive && (
          <div className="border-l border-white/10 pl-3 text-gray-400 font-mono text-[11px]" title="Stream duration">
            {elapsed}
          </div>
        )}

        {/* Copy Public Watch Page Link */}
        {session?.destinations?.some(d => d.streamPageUrl) && (
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors text-[11px] text-gray-300 hover:text-white"
            title="Copy public watch URL for viewers"
          >
            {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Copied' : 'Share Link'}</span>
          </button>
        )}

        {/* Open Settings / Details */}
        <button
          onClick={onOpenStreamingModal}
          className="text-gray-400 hover:text-gray-200 text-[11px] underline underline-offset-2 px-1"
        >
          Details
        </button>

        {/* Host Stop Button (33.10) */}
        {isHostOrCoHost && isLive && (
          <button
            onClick={onStopStreaming}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition-all shadow-md active:scale-95 text-[11px]"
            title="Stop external live broadcast (Zoom meeting continues normally)"
          >
            <Square className="w-3 h-3 fill-current" />
            <span>Stop Stream</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default LiveStreamingIndicator;
