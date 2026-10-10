import React from 'react';
import { AlertOctagon, Check, ShieldAlert, X } from 'lucide-react';

export default function SuspendActivitiesModal({ isOpen, onClose, onConfirm, isSubmitting = false }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#1C1818] border border-red-700/60 rounded-3xl w-full max-w-md shadow-2xl p-6 text-white space-y-5 animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-red-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-500">
              <AlertOctagon className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-base text-red-300">Suspend Participant Activities?</h3>
              <p className="text-[11px] text-red-400/80">Emergency meeting lockdown (Section 30.7)</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Warning text & Checklist */}
        <div className="space-y-3 text-xs text-gray-300 leading-relaxed">
          <p className="text-gray-300">
            Use this emergency control if disruptive, unauthorized, or suspicious activity occurs during the meeting.
          </p>

          <div className="bg-red-950/40 border border-red-800/40 rounded-2xl p-3.5 space-y-2">
            <div className="text-[11px] font-bold text-red-200 uppercase tracking-wider mb-1">
              Executing this will immediately:
            </div>
            <div className="flex items-center gap-2 text-red-200">
              <Check className="w-3.5 h-3.5 text-red-400 shrink-0" />
              <span>Disable participant audio (mute everyone)</span>
            </div>
            <div className="flex items-center gap-2 text-red-200">
              <Check className="w-3.5 h-3.5 text-red-400 shrink-0" />
              <span>Disable participant video (stop camera streams)</span>
            </div>
            <div className="flex items-center gap-2 text-red-200">
              <Check className="w-3.5 h-3.5 text-red-400 shrink-0" />
              <span>Stop active screen sharing</span>
            </div>
            <div className="flex items-center gap-2 text-red-200">
              <Check className="w-3.5 h-3.5 text-red-400 shrink-0" />
              <span>Lock the meeting so no new participants can enter</span>
            </div>
            <div className="flex items-center gap-2 text-red-200">
              <Check className="w-3.5 h-3.5 text-red-400 shrink-0" />
              <span>Halt participant chat, whiteboard, and app activities</span>
            </div>
          </div>

          <p className="text-[11px] text-gray-400 italic">
            You can selectively restore or resume participant activities from the Security panel once the situation is resolved.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-red-600/40 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <ShieldAlert className="w-4 h-4" />
            {isSubmitting ? 'Suspending...' : 'Suspend Activities'}
          </button>
        </div>

      </div>
    </div>
  );
}
