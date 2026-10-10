import React, { useState } from 'react';
import { X, Minimize2, Maximize2, User, Eye } from 'lucide-react';

export default function SignLanguagePiP({
  isOpen,
  onClose,
  interpreterName = 'Sign Language Interpreter',
  stream = null,
}) {
  const [minimized, setMinimized] = useState(false);

  if (!isOpen) return null;

  return (
    <div className={`fixed bottom-24 right-6 z-50 transition-all duration-300 ${
      minimized ? 'w-48 h-28' : 'w-72 h-48 sm:w-80 sm:h-56'
    } bg-black/90 rounded-2xl border-2 border-indigo-500/70 shadow-2xl overflow-hidden flex flex-col`}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#1C1C1C] border-b border-white/10 text-xs text-gray-200">
        <div className="flex items-center gap-1.5 truncate">
          <Eye className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span className="font-semibold truncate text-[11px]">{interpreterName}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMinimized(!minimized)}
            className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white"
            title={minimized ? 'Expand' : 'Minimize'}
          >
            {minimized ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white"
            title="Close Sign Language PIP"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Video Content / Placeholder */}
      <div className="flex-1 relative bg-[#121212] flex items-center justify-center overflow-hidden">
        {stream ? (
          <video
            autoPlay
            playsInline
            muted
            ref={video => { if (video) video.srcObject = stream; }}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-3 text-indigo-300">
            <div className="w-12 h-12 rounded-full bg-indigo-950/60 border border-indigo-500/40 flex items-center justify-center mb-1.5">
              <User className="w-6 h-6 text-indigo-400" />
            </div>
            <span className="text-xs font-semibold text-white">Sign Interpreter Live</span>
            <span className="text-[10px] text-gray-400 mt-0.5">Gestural signing in view</span>
          </div>
        )}

        <div className="absolute top-2 left-2 bg-indigo-600/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow">
          SIGN PIP
        </div>
      </div>
    </div>
  );
}
