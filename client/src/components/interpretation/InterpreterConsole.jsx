import React, { useState } from 'react';
import { Mic, MicOff, Volume2, Headphones, Radio, X, ArrowRightLeft } from 'lucide-react';

export default function InterpreterConsole({
  isOpen,
  languageName = 'Tamil',
  languageCode = 'ta',
  isSpeaking = false,
  onToggleMic,
  isMuted = false,
  onLeaveInterpretation,
}) {
  const [minimized, setMinimized] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-24 left-6 z-50 transition-all duration-200">
      <div className="bg-[#181818]/95 backdrop-blur-md border border-emerald-500/40 rounded-2xl shadow-2xl p-4 w-72 text-gray-200 flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h4 className="text-xs font-bold text-white tracking-wide">
              Interpreter Console
            </h4>
          </div>
          <span className="text-[10px] bg-emerald-950 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-700/50 uppercase">
            {languageName} ({languageCode})
          </span>
        </div>

        {/* Status Indicators (22.16) */}
        <div className="space-y-1.5 text-xs bg-[#202020] p-2.5 rounded-xl border border-[#2B2B2B]">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 flex items-center gap-1.5">
              <Headphones className="w-3.5 h-3.5 text-blue-400" /> Original Audio:
            </span>
            <span className="text-blue-300 font-semibold text-[11px] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" /> Listening
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-400 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-emerald-400" /> Channel Broadcast:
            </span>
            <span className={`font-semibold text-[11px] flex items-center gap-1 ${
              isMuted ? 'text-red-400' : 'text-emerald-400'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isMuted ? 'bg-red-500' : 'bg-emerald-400 animate-ping'}`} />
              {isMuted ? 'Muted' : 'Transmitting Live'}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleMic}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
              isMuted
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            {isMuted ? 'Unmute Mic' : 'Mute Mic'}
          </button>

          <button
            onClick={onLeaveInterpretation}
            className="p-2 rounded-xl bg-[#282828] hover:bg-[#333] text-gray-400 hover:text-white transition-colors"
            title="Leave Interpreter Role"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
