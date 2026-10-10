import React, { useState } from 'react';
import { 
  Square, Pause, Play, Edit3, Layout, Volume2, VolumeX, 
  DoorClosed, MoreHorizontal, ChevronDown, Check, ShieldCheck,
  Presentation
} from 'lucide-react';

export default function ScreenShareFloatingBar({
  isSharing,
  isPaused,
  sourceName = 'Entire Screen',
  onPauseToggle,
  onStopShare,
  onToggleAnnotate,
  isAnnotating = false,
  presenterLayout = 'side-by-side', // 'side-by-side' | 'overlay' | 'content-only'
  onChangePresenterLayout,
  isAudioShared = true,
  onToggleAudioShare,
  onShareToBreakoutRooms,
  onOpenSlideControl,
  hasActivePresentation = false,
  activeControllersCount = 0
}) {
  const [showLayoutMenu, setShowLayoutMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  if (!isSharing) return null;

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-40 flex items-center bg-[#1A1A1A]/95 border border-[#333] rounded-2xl shadow-2xl px-3 py-1.5 backdrop-blur-md animate-in slide-in-from-top-4 duration-200 divide-x divide-[#333]">
      {/* Green Badge Status (Section 13.14) */}
      <div className="flex items-center gap-2 pr-3">
        <div className={`w-3 h-3 rounded-full ${isPaused ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'}`} />
        <div className="text-left">
          <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 inline" />
            <span>{isPaused ? 'Sharing Paused' : 'You are screen sharing'}</span>
          </div>
          <div className="text-[11px] font-medium text-gray-200 truncate max-w-[140px]">
            {sourceName}
          </div>
        </div>
      </div>

      {/* Main Controls: Pause / Annotate / Stop (Section 13.14) */}
      <div className="flex items-center gap-1 px-2">
        {/* Pause / Resume */}
        <button
          onClick={onPauseToggle}
          className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
            isPaused
              ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
              : 'hover:bg-white/10 text-gray-300 hover:text-white'
          }`}
          title={isPaused ? 'Resume Screen Share' : 'Pause Screen Share'}
        >
          {isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5" />}
          <span>{isPaused ? 'Resume' : 'Pause'}</span>
        </button>

        {/* Annotate Tool */}
        <button
          onClick={onToggleAnnotate}
          className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
            isAnnotating
              ? 'bg-purple-600/30 border border-purple-500 text-purple-300'
              : 'hover:bg-white/10 text-gray-300 hover:text-white'
          }`}
          title="Annotate over shared screen"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>Annotate</span>
        </button>

        {/* Part 16: Slide Control Option (Section 16.2 & 16.11) */}
        {hasActivePresentation && (
          <button
            onClick={onOpenSlideControl}
            className="px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all hover:bg-white/10 text-orange-400 hover:text-orange-300 border border-orange-500/20"
            title="Slide Control: Select participants to navigate presentation slides"
          >
            <Presentation className="w-3.5 h-3.5" />
            <span>Slide Control</span>
            {activeControllersCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-emerald-500 text-black text-[9px] font-bold flex items-center justify-center">
                {activeControllersCount}
              </span>
            )}
          </button>
        )}

        {/* Presenter Layout Dropdown (Section 13.15) */}
        <div className="relative">
          <button
            onClick={() => setShowLayoutMenu(!showLayoutMenu)}
            className="px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 hover:bg-white/10 text-gray-300 hover:text-white transition-all"
            title="Presenter Layout"
          >
            <Layout className="w-3.5 h-3.5 text-blue-400" />
            <span>Layout</span>
            <ChevronDown className="w-3 h-3 text-gray-400" />
          </button>

          {showLayoutMenu && (
            <div className="absolute top-full left-0 mt-2 w-56 bg-[#222] border border-[#3A3A3A] rounded-xl shadow-2xl p-1.5 z-50 text-xs space-y-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 py-0.5 block">
                Presenter Layout
              </span>
              {[
                { id: 'side-by-side', label: 'Side-by-side (Presenter + Content)' },
                { id: 'overlay', label: 'Presenter Overlay (PiP Camera)' },
                { id: 'content-only', label: 'Content Focus (Hide Videos)' },
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => {
                    onChangePresenterLayout(opt.id);
                    setShowLayoutMenu(false);
                  }}
                  className={`w-full text-left px-2 py-1.5 rounded-lg flex items-center justify-between transition-colors ${
                    presenterLayout === opt.id ? 'bg-blue-600/30 text-blue-300 font-semibold' : 'text-gray-300 hover:bg-white/5'
                  }`}
                >
                  <span>{opt.label}</span>
                  {presenterLayout === opt.id && <Check className="w-3.5 h-3.5 text-blue-400" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Computer Audio Toggle (Section 13.5) */}
        <button
          onClick={onToggleAudioShare}
          className={`p-1.5 rounded-xl transition-all ${
            isAudioShared ? 'text-emerald-400 hover:bg-emerald-950/40' : 'text-gray-400 hover:bg-white/10'
          }`}
          title={isAudioShared ? 'Computer sound is being shared' : 'Computer sound is muted'}
        >
          {isAudioShared ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-red-400" />}
        </button>

        {/* Share to Breakout Rooms (Section 13.16) */}
        <button
          onClick={onShareToBreakoutRooms}
          className="p-1.5 text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
          title="Share to all Breakout Rooms"
        >
          <DoorClosed className="w-4 h-4 text-amber-400" />
        </button>
      </div>

      {/* Stop Share (Prominent Red Button) */}
      <div className="pl-3">
        <button
          onClick={onStopShare}
          className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-red-600/30 flex items-center gap-1.5"
        >
          <Square className="w-3 h-3 fill-current" />
          <span>Stop Share</span>
        </button>
      </div>
    </div>
  );
}
