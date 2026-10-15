import React from 'react';
import { 
  Laptop, Cloud, Settings, HardDrive, Check, 
  Layout, Users, Monitor, Sparkles, AlertCircle 
} from 'lucide-react';

export default function RecordingMenuPopover({
  isOpen,
  onClose,
  onStartRecording,
  onOpenSettings,
  isRecording,
  recordingMode,
  recordingLayout = 'SPEAKER',
  onChangeLayout,
  canRecordLocal = true,
  canRecordCloud = true,
  storageStats = { usedBytes: 1258291200, quotaBytes: 5368709120, usedPercentage: 24 }
}) {
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[90]" onClick={onClose} />
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-80 bg-[#1A1A1A] border border-[#333] rounded-2xl shadow-2xl p-3 z-[100] text-gray-200 space-y-3 animate-in fade-in zoom-in-95 duration-150">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
          <h4 className="text-xs font-bold text-white tracking-wider uppercase">
            Record Meeting
          </h4>
        </div>
        <button
          onClick={onOpenSettings}
          className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          title="Recording Settings"
        >
          <Settings className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Recording Options (23.2 & 23.6) */}
      <div className="space-y-1.5">
        <button
          onClick={() => {
            if (canRecordLocal) onStartRecording('LOCAL', recordingLayout);
          }}
          disabled={!canRecordLocal}
          className={`w-full text-left p-2.5 rounded-xl border flex items-start gap-3 transition-all ${
            canRecordLocal 
              ? 'bg-[#222] hover:bg-[#282828] border-white/10 hover:border-blue-500/50' 
              : 'bg-[#181818] border-white/5 opacity-50 cursor-not-allowed'
          }`}
        >
          <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400 shrink-0">
            <Laptop className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white">Record on this Computer</span>
              <span className="text-[10px] text-blue-400 bg-blue-950/80 px-1.5 py-0.5 rounded border border-blue-800/40">Local</span>
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5 leading-snug">
              Saves video directly to your hard drive. No cloud storage used.
            </p>
          </div>
        </button>

        <button
          onClick={() => {
            if (canRecordCloud) onStartRecording('CLOUD', recordingLayout);
          }}
          disabled={!canRecordCloud}
          className={`w-full text-left p-2.5 rounded-xl border flex items-start gap-3 transition-all ${
            canRecordCloud 
              ? 'bg-[#222] hover:bg-[#282828] border-white/10 hover:border-purple-500/50' 
              : 'bg-[#181818] border-white/5 opacity-50 cursor-not-allowed'
          }`}
        >
          <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400 shrink-0">
            <Cloud className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white">Record to the Cloud</span>
              <span className="text-[10px] text-purple-400 bg-purple-950/80 px-1.5 py-0.5 rounded border border-purple-800/40">Cloud + AI</span>
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5 leading-snug">
              Streams to cloud with instant sharing, AI summary & transcript.
            </p>
          </div>
        </button>
      </div>

      {/* Recording Layout (23.14) */}
      <div className="pt-2 border-t border-white/10">
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5 block">
          Recording Layout
        </span>
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { id: 'SPEAKER', label: 'Speaker', icon: Layout },
            { id: 'GALLERY', label: 'Gallery', icon: Users },
            { id: 'SHARED_SCREEN', label: 'Screen', icon: Monitor }
          ].map(opt => {
            const Icon = opt.icon;
            const isSel = recordingLayout === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => onChangeLayout?.(opt.id)}
                className={`flex flex-col items-center justify-center p-1.5 rounded-lg border text-[10px] font-medium transition-all ${
                  isSel 
                    ? 'bg-purple-900/40 border-purple-500 text-purple-300' 
                    : 'bg-[#202020] border-transparent text-gray-400 hover:text-white hover:bg-[#262626]'
                }`}
              >
                <Icon className="w-3.5 h-3.5 mb-1" />
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Cloud Storage Usage (23.15) */}
      <div className="pt-2 border-t border-white/10 text-xs">
        <div className="flex items-center justify-between text-gray-400 text-[11px] mb-1">
          <span className="flex items-center gap-1">
            <HardDrive className="w-3 h-3 text-gray-400" /> Cloud Storage
          </span>
          <span className="text-gray-300 font-medium">
            {(storageStats.usedBytes / (1024 * 1024 * 1024)).toFixed(1)} GB / {(storageStats.quotaBytes / (1024 * 1024 * 1024)).toFixed(1)} GB
          </span>
        </div>
        <div className="w-full h-1.5 bg-[#333] rounded-full overflow-hidden">
          <div 
            className="h-full bg-purple-500 rounded-full transition-all"
            style={{ width: `${Math.min(100, storageStats.usedPercentage || 24)}%` }}
          />
        </div>
      </div>
    </div>
  </>
);
}
