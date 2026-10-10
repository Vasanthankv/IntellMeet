import React, { useState, useEffect } from 'react';
import { Subtitles, ChevronUp, ChevronDown, X, Move, History, Globe } from 'lucide-react';

export default function LiveCaptionOverlay({
  currentSegment,
  recentSegments = [],
  fontSize = 'medium',       // 'small' | 'medium' | 'large'
  contrast = 'dark',         // 'dark' | 'high-contrast' | 'light'
  position = 'bottom',       // 'bottom' | 'top'
  onClose,
  onOpenSettings,
  onOpenTranscript,
  onOpenTranslation,
  translationLanguage = null,
  targetLanguageName = null,
  voiceTranslationEnabled = false,
}) {
  const [showRecent, setShowRecent] = useState(false);
  const [isFading, setIsFading] = useState(false);

  // Auto fade out when no new segment for 6 seconds
  useEffect(() => {
    if (!currentSegment) return;
    setIsFading(false);
    const timer = setTimeout(() => {
      setIsFading(true);
    }, 6000);
    return () => clearTimeout(timer);
  }, [currentSegment?.text, currentSegment?.timestamp]);

  if (!currentSegment && recentSegments.length === 0) return null;

  // Font size classes
  const fontClasses = {
    small: 'text-xs md:text-sm py-1.5 px-3',
    medium: 'text-sm md:text-base py-2.5 px-4',
    large: 'text-base md:text-lg py-3 px-5 font-semibold',
  }[fontSize] || 'text-sm md:text-base py-2.5 px-4';

  // Contrast theme classes
  const contrastClasses = {
    dark: 'bg-black/85 text-white border-white/10 shadow-2xl backdrop-blur-md',
    'high-contrast': 'bg-black text-amber-300 border-2 border-amber-400 font-bold shadow-2xl',
    light: 'bg-white/95 text-gray-900 border-gray-300 shadow-2xl backdrop-blur-md',
  }[contrast] || 'bg-black/85 text-white border-white/10 shadow-2xl backdrop-blur-md';

  const positionClasses = position === 'top'
    ? 'top-16 left-1/2 -translate-x-1/2'
    : 'bottom-20 left-1/2 -translate-x-1/2';

  const displaySegment = currentSegment || (recentSegments.length > 0 ? recentSegments[recentSegments.length - 1] : null);
  if (!displaySegment) return null;

  return (
    <div
      className={`fixed z-40 w-[92%] max-w-3xl transition-all duration-300 pointer-events-auto ${positionClasses} ${
        isFading ? 'opacity-35 hover:opacity-100' : 'opacity-100'
      }`}
    >
      <div className={`rounded-2xl border flex flex-col overflow-hidden transition-all ${contrastClasses}`}>
        {/* Caption Header / Quick Actions */}
        <div className="flex items-center justify-between px-3 py-1 border-b border-white/10 text-[11px] opacity-85 select-none">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 font-semibold text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Live Caption
            </span>
            <span className="text-gray-400">·</span>
            <span className="font-medium text-gray-300 truncate max-w-[140px]">
              {displaySegment.speakerName || 'Speaker'}
            </span>
            {displaySegment.isManual && (
              <span className="bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded text-[10px]">
                Manual
              </span>
            )}
            {translationLanguage && (
              <button
                onClick={onOpenTranslation}
                className="flex items-center gap-1 bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 px-2 py-0.5 rounded-full text-[10px] font-semibold transition-colors"
                title="Change Translation Language"
              >
                <Globe className="w-2.5 h-2.5" />
                {targetLanguageName || translationLanguage.toUpperCase()}
              </button>
            )}
            {voiceTranslationEnabled && (
              <span className="bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded text-[10px] flex items-center gap-1">
                Voice TTS
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowRecent(!showRecent)}
              className="px-1.5 py-0.5 rounded hover:bg-white/10 flex items-center gap-1 text-[10px] text-gray-300"
              title="Recent caption history"
            >
              <History className="w-3 h-3" />
              <span>History</span>
              {showRecent ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
            </button>
            <button
              onClick={onOpenTranslation}
              className="px-1.5 py-0.5 rounded hover:bg-white/10 text-[10px] text-purple-300 font-medium"
              title="Translation settings"
            >
              Translate
            </button>
            <button
              onClick={onOpenSettings}
              className="px-1.5 py-0.5 rounded hover:bg-white/10 text-[10px] text-gray-300"
              title="Caption settings"
            >
              Settings
            </button>
            <button
              onClick={onOpenTranscript}
              className="px-1.5 py-0.5 rounded hover:bg-white/10 text-[10px] text-indigo-300"
              title="View full transcript"
            >
              Transcript
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-white/15 text-gray-400 hover:text-white"
              title="Hide captions"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>


        {/* Recent History Drawer */}
        {showRecent && recentSegments.length > 0 && (
          <div className="max-h-48 overflow-y-auto px-4 py-2 bg-black/40 border-b border-white/10 space-y-1.5 text-xs text-gray-300">
            {recentSegments.slice(-6).map((seg, idx) => (
              <div key={idx} className="flex items-start gap-2 leading-relaxed">
                <span className="font-semibold text-indigo-300 shrink-0 text-[11px]">
                  {seg.speakerName}:
                </span>
                <span className="text-gray-200">{seg.text}</span>
                {seg.translatedText && (
                  <span className="text-purple-300 italic text-[11px] block">
                    ↳ {seg.translatedText}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Active Speech Segment */}
        <div className={`${fontClasses} leading-relaxed`}>
          <div className="flex items-baseline gap-2">
            <span className="font-bold text-indigo-400 shrink-0">
              {displaySegment.speakerName}:
            </span>
            <span className="tracking-wide">
              {displaySegment.text}
            </span>
          </div>

          {/* Translated subtitle if available */}
          {displaySegment.translatedText && (
            <div className="mt-1 text-purple-300 italic text-xs md:text-sm font-normal flex items-center gap-1.5 border-t border-white/10 pt-1">
              <Globe className="w-3 h-3 shrink-0" />
              <span>{displaySegment.translatedText}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
