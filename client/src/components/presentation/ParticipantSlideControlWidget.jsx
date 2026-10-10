import React, { useEffect, useState } from 'react';
import { 
  ChevronLeft, ChevronRight, Presentation, CheckCircle2, 
  Command, Sparkles, X, Minimize2, Maximize2 
} from 'lucide-react';

export default function ParticipantSlideControlWidget({
  currentSlide = 1,
  totalSlides = 12,
  presentationName = 'Presentation',
  onNavigate, // (action: 'PREVIOUS' | 'NEXT') => void
  onRelinquishControl
}) {
  const [isMinimized, setIsMinimized] = useState(false);

  // Global Keyboard Navigation (Section 16.3: Keyboard ← →)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't intercept if user is typing in an input or textarea
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
        return;
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (currentSlide > 1) {
          onNavigate('PREVIOUS');
        }
      } else if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        if (currentSlide < totalSlides) {
          onNavigate('NEXT');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlide, totalSlides, onNavigate]);

  if (isMinimized) {
    return (
      <div className="fixed bottom-20 left-6 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
        <button
          onClick={() => setIsMinimized(false)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-xl shadow-2xl flex items-center gap-2 border border-emerald-400/40 text-xs font-bold transition-all hover:scale-105"
          title="Expand Slide Control"
        >
          <Presentation className="w-4 h-4" />
          <span>Slide Control Active ({currentSlide}/{totalSlides})</span>
          <Maximize2 className="w-3 h-3 ml-1 opacity-70" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-20 left-6 z-50 bg-[#16171B]/95 border-2 border-emerald-500/80 rounded-2xl shadow-2xl p-4 w-72 backdrop-blur-md text-white animate-in fade-in slide-in-from-bottom-4 duration-200 ring-4 ring-emerald-500/10">
      {/* Top Banner (Section 16.3 & 16.12) */}
      <div className="flex items-start justify-between pb-2 border-b border-[#2C2E38] mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white leading-tight">Slide Control Granted</h4>
            <span className="text-[10px] text-emerald-400 font-medium">You can control this presentation</span>
          </div>
        </div>
        <button
          onClick={() => setIsMinimized(true)}
          className="text-gray-400 hover:text-white p-1 rounded hover:bg-white/10 transition-colors"
          title="Minimize Widget"
        >
          <Minimize2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Slide Status & Title */}
      <div className="mb-3 px-1">
        <div className="text-[11px] text-gray-300 font-medium truncate">
          {presentationName}
        </div>
        <div className="text-xs font-mono font-bold text-emerald-300 mt-0.5">
          Slide {currentSlide} of {totalSlides}
        </div>
      </div>

      {/* Previous / Next Buttons (Section 16.3 & 16.12) */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <button
          onClick={() => onNavigate('PREVIOUS')}
          disabled={currentSlide <= 1}
          className="py-2.5 px-3 bg-[#242630] hover:bg-[#303340] disabled:opacity-40 disabled:cursor-not-allowed border border-[#3A3D4D] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 text-gray-100"
          title="Previous Slide (or Left Arrow)"
        >
          <ChevronLeft className="w-4 h-4 text-emerald-400" />
          <span>Previous</span>
        </button>

        <button
          onClick={() => onNavigate('NEXT')}
          disabled={currentSlide >= totalSlides}
          className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-emerald-600/30 active:scale-95"
          title="Next Slide (or Right Arrow)"
        >
          <span>Next</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Keyboard Shortcut Hint (Section 16.3 & 16.12) */}
      <div className="flex items-center justify-between text-[10px] text-gray-400 bg-[#1D1F27] px-2.5 py-1.5 rounded-lg border border-[#2B2D38]">
        <div className="flex items-center gap-1.5 font-mono">
          <span className="bg-[#2B2D38] px-1.5 py-0.5 rounded text-gray-200">←</span>
          <span className="bg-[#2B2D38] px-1.5 py-0.5 rounded text-gray-200">→</span>
          <span>Keyboard Navigation</span>
        </div>
        {onRelinquishControl && (
          <button
            onClick={onRelinquishControl}
            className="text-gray-400 hover:text-red-400 underline font-medium"
          >
            Release
          </button>
        )}
      </div>
    </div>
  );
}
