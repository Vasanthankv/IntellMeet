import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, ChevronRight, Presentation, Maximize2, Minimize2, 
  Layers, User, Clock, CheckCircle, ShieldCheck, Sparkles, 
  Layout, Cpu, Activity, BarChart3, HelpCircle, FileText, Share2
} from 'lucide-react';

export default function PresentationViewer({
  session,
  isPresenter = false,
  isController = false,
  onNavigate,
  onOpenSlideControlModal,
  onEndPresentation
}) {
  const [showThumbnails, setShowThumbnails] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [lastActivityNotice, setLastActivityNotice] = useState(null);

  if (!session) return null;

  const currentSlideIndex = (session.currentSlide || 1) - 1;
  const slides = session.slides || [];
  const currentSlide = slides[currentSlideIndex] || slides[0] || {
    slideNumber: session.currentSlide || 1,
    title: session.presentationName || 'Presentation Deck',
    subtitle: 'IntellMeet Real-Time Presentation',
    category: 'General Overview',
    bullets: ['Slide content synchronized in real-time.'],
    visualType: 'card'
  };

  // Detect when another participant changed the slide
  useEffect(() => {
    if (session.lastChangedBy && session.lastChangedBy.userName) {
      setLastActivityNotice({
        userName: session.lastChangedBy.userName,
        action: session.lastChangedBy.action,
        slide: session.currentSlide,
        time: Date.now()
      });

      const timer = setTimeout(() => {
        setLastActivityNotice(null);
      }, 3500);

      return () => clearTimeout(timer);
    }
  }, [session.currentSlide, session.lastChangedBy]);

  return (
    <div className="w-full h-full relative flex flex-col justify-between bg-gradient-to-br from-[#121318] via-[#161822] to-[#0D0E13] text-white select-none overflow-hidden">
      {/* Top Presentation Bar */}
      <div className="h-14 px-6 border-b border-white/10 bg-black/40 backdrop-blur-md flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center border border-orange-500/30">
            <Presentation className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white tracking-wide truncate max-w-md">
                {session.presentationName}
              </span>
              <span className="text-[10px] bg-orange-500/20 text-orange-300 font-semibold px-2 py-0.5 rounded-full border border-orange-500/30">
                {session.presentationType}
              </span>
            </div>
            <p className="text-[10px] text-gray-400">
              Presented by <span className="text-gray-200 font-medium">{session.presenterName}</span>
              {session.controllers?.filter(c => c.status === 'ACTIVE').length > 0 && (
                <span className="text-emerald-400 ml-2">
                  • {session.controllers.filter(c => c.status === 'ACTIVE').length} co-controller(s)
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Right Header Badges & Actions */}
        <div className="flex items-center gap-2">
          {/* Last Activity Toast Notice (Section 16.15) */}
          {lastActivityNotice && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-200 flex items-center gap-1.5 px-3 py-1 bg-emerald-950/80 border border-emerald-500/40 rounded-full text-xs text-emerald-300 shadow-lg">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>
                <b>{lastActivityNotice.userName}</b> changed to Slide {lastActivityNotice.slide}
              </span>
            </div>
          )}

          {/* Slide Indicator Badge */}
          <div className="text-xs font-mono font-bold bg-white/10 px-3 py-1 rounded-full border border-white/10 text-gray-200">
            Slide {session.currentSlide} of {session.totalSlides}
          </div>

          {/* Presenter Slide Control Modal Trigger Button */}
          {isPresenter && onOpenSlideControlModal && (
            <button
              onClick={onOpenSlideControlModal}
              className="px-3 py-1 bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/40 text-blue-300 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Manage Slide Control Permissions"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Slide Control 👥</span>
            </button>
          )}

          {/* Toggle Slide Thumbnail Drawer */}
          <button
            onClick={() => setShowThumbnails(!showThumbnails)}
            className={`p-1.5 rounded-lg border transition-colors ${
              showThumbnails 
                ? 'bg-blue-600 text-white border-blue-500' 
                : 'bg-white/5 border-white/10 text-gray-300 hover:text-white'
            }`}
            title="Toggle Slide Thumbnails"
          >
            <Layers className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Slide Stage Area */}
      <div className="flex-1 flex items-center justify-center p-8 relative overflow-hidden">
        <div className="w-full max-w-4xl bg-gradient-to-b from-[#1C1E26] to-[#151720] border border-white/10 rounded-3xl p-8 shadow-2xl relative min-h-[420px] flex flex-col justify-between">
          
          {/* Slide Top Category */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <span className="text-[11px] font-bold uppercase tracking-wider text-orange-400 bg-orange-950/40 px-3 py-1 rounded-full border border-orange-500/20">
              {currentSlide.category || 'Architecture Overview'}
            </span>
            <span className="text-xs font-mono text-gray-400">
              #{currentSlide.slideNumber} / {session.totalSlides}
            </span>
          </div>

          {/* Slide Header: Title & Subtitle */}
          <div className="mt-4 mb-6">
            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-snug">
              {currentSlide.title}
            </h2>
            {currentSlide.subtitle && (
              <p className="text-sm md:text-base text-gray-400 mt-1 font-medium">
                {currentSlide.subtitle}
              </p>
            )}
          </div>

          {/* Visual Presentation Element based on visualType */}
          <div className="my-auto py-2">
            {currentSlide.visualType === 'architecture' ? (
              <div className="grid grid-cols-4 gap-3 p-4 bg-black/30 rounded-2xl border border-white/10 mb-4">
                {[
                  { name: 'Presenter Client', desc: 'React 18 Display Engine', color: 'border-orange-500/40 bg-orange-950/20 text-orange-300' },
                  { name: 'WebSocket Gateway', desc: 'Real-time Event Broker', color: 'border-blue-500/40 bg-blue-950/20 text-blue-300' },
                  { name: 'Meeting Server', desc: 'Role Validation & State', color: 'border-purple-500/40 bg-purple-950/20 text-purple-300' },
                  { name: 'Attendee Viewers', desc: 'Instant Slide Sync (<30ms)', color: 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300' }
                ].map((node, i) => (
                  <div key={i} className={`p-3 rounded-xl border ${node.color} text-center`}>
                    <div className="text-xs font-bold">{node.name}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">{node.desc}</div>
                  </div>
                ))}
              </div>
            ) : currentSlide.visualType === 'metrics' ? (
              <div className="grid grid-cols-3 gap-3 p-4 bg-black/30 rounded-2xl border border-white/10 mb-4">
                <div className="p-3 bg-[#1F212C] rounded-xl border border-emerald-500/30 text-center">
                  <div className="text-2xl font-black text-emerald-400">&lt; 28 ms</div>
                  <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mt-1">Median Sync Latency</div>
                </div>
                <div className="p-3 bg-[#1F212C] rounded-xl border border-blue-500/30 text-center">
                  <div className="text-2xl font-black text-blue-400">1,200/sec</div>
                  <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mt-1">Socket Throughput</div>
                </div>
                <div className="p-3 bg-[#1F212C] rounded-xl border border-amber-500/30 text-center">
                  <div className="text-2xl font-black text-amber-400">60 FPS</div>
                  <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mt-1">Canvas Refresh</div>
                </div>
              </div>
            ) : null}

            {/* Bullets List */}
            <div className="space-y-2.5">
              {(currentSlide.bullets || []).map((bullet, idx) => (
                <div key={idx} className="flex items-start gap-3 p-2.5 bg-black/20 rounded-xl border border-white/5">
                  <div className="w-5 h-5 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                    ✓
                  </div>
                  <p className="text-xs md:text-sm text-gray-200 leading-relaxed font-normal">
                    {bullet}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Slide Footer */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs text-gray-400 mt-4">
            <span className="font-semibold text-gray-300">IntellMeet Enterprise Deck</span>
            <span>Slide Control Parity (Zoom Section 16) • Confidential</span>
          </div>
        </div>
      </div>

      {/* Thumbnail Drawer (Collapsible bottom filmstrip) */}
      {showThumbnails && (
        <div className="p-3 bg-[#0E0F14] border-t border-white/10 flex gap-2.5 overflow-x-auto z-30 shrink-0">
          {slides.map((s, idx) => {
            const isSelected = s.slideNumber === session.currentSlide;
            return (
              <button
                key={s.slideNumber || idx}
                onClick={() => (isPresenter || isController) && onNavigate('GOTO', s.slideNumber)}
                disabled={!isPresenter && !isController}
                className={`w-32 h-20 rounded-xl p-2 text-left border flex flex-col justify-between shrink-0 transition-all ${
                  isSelected
                    ? 'bg-orange-500/20 border-orange-500 ring-2 ring-orange-500/40 text-white'
                    : 'bg-[#181920] border-[#2A2B33] text-gray-400 hover:text-white hover:bg-[#20222B]'
                }`}
              >
                <div className="flex justify-between items-center text-[10px]">
                  <span className="font-mono font-bold">Slide {s.slideNumber}</span>
                  {isSelected && <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />}
                </div>
                <div className="text-[10px] font-semibold text-gray-200 line-clamp-2 leading-tight">
                  {s.title}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Bottom Presenter Navigation Bar */}
      <div className="h-14 px-6 border-t border-white/10 bg-black/60 backdrop-blur-md flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-2">
          {/* Notes Toggle */}
          {currentSlide.notes && (
            <button
              onClick={() => setShowNotes(!showNotes)}
              className="text-xs text-gray-400 hover:text-white px-2.5 py-1 rounded-lg border border-white/10 flex items-center gap-1.5 transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-orange-400" />
              <span>{showNotes ? 'Hide Speaker Notes' : 'Speaker Notes'}</span>
            </button>
          )}

          {showNotes && currentSlide.notes && (
            <span className="text-xs text-amber-300 italic bg-amber-950/40 px-3 py-1 rounded-lg border border-amber-500/30 truncate max-w-md">
              📝 {currentSlide.notes}
            </span>
          )}
        </div>

        {/* Previous / Next Navigation Buttons (Accessible to Presenter or Authorized Controller) */}
        {(isPresenter || isController) ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('PREVIOUS')}
              disabled={session.currentSlide <= 1}
              className="px-3.5 py-1.5 bg-[#252835] hover:bg-[#323646] disabled:opacity-40 disabled:cursor-not-allowed border border-white/10 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-all active:scale-95"
              title="Previous Slide (or Left Arrow)"
            >
              <ChevronLeft className="w-4 h-4 text-orange-400" />
              <span>Previous</span>
            </button>

            <span className="text-xs font-mono font-bold text-gray-300 px-2">
              {session.currentSlide} / {session.totalSlides}
            </span>

            <button
              onClick={() => onNavigate('NEXT')}
              disabled={session.currentSlide >= session.totalSlides}
              className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-all shadow-md shadow-orange-600/30 active:scale-95"
              title="Next Slide (or Right Arrow)"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="text-xs text-gray-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-gray-500" />
            <span>Presentation controlled by presenter & authorized co-presenters</span>
          </div>
        )}
      </div>
    </div>
  );
}
