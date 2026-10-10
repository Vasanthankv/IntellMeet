import React from 'react';
import { AlertTriangle, ShieldAlert, X, Check, Lock } from 'lucide-react';

export default function E2EEWarningModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  isSubmitting = false 
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#1C1A1A] border border-amber-500/50 rounded-3xl w-full max-w-lg shadow-2xl p-6 text-white space-y-5 animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-gray-100 flex items-center gap-2">
                <span>Enable End-to-End Encryption?</span>
              </h3>
              <p className="text-[11px] text-amber-400">Section 31.8 & 31.9: Feature Compatibility Notice</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-3 text-xs leading-relaxed text-gray-300">
          <p>
            <strong>End-to-End Encryption (E2EE)</strong> provides maximum cryptographic privacy: encryption keys are generated directly on participants' devices, and IntellMeet servers cannot decrypt audio, video, or content in transit.
          </p>

          <div className="p-4 bg-amber-950/30 border border-amber-600/40 rounded-2xl space-y-2">
            <div className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Unavailable Features under E2EE Policy:</span>
            </div>
            <p className="text-[11px] text-gray-300">
              Because servers cannot decrypt meeting streams, the following features will be automatically restricted:
            </p>
            <ul className="grid grid-cols-2 gap-1.5 pt-1 text-[11px] text-amber-200">
              <li className="flex items-center gap-1.5">
                <span className="text-red-400 font-bold">✕</span> AI Meeting Summary
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-red-400 font-bold">✕</span> AI Meeting Questions
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-red-400 font-bold">✕</span> Live Transcription
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-red-400 font-bold">✕</span> Cloud & Smart Recording
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-red-400 font-bold">✕</span> AI My Notes
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-red-400 font-bold">✕</span> Interactive Whiteboard
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-red-400 font-bold">✕</span> Pre-Meeting Polls & Quizzes
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-red-400 font-bold">✕</span> Web Browser Endpoints
              </li>
            </ul>
          </div>

          <div className="text-[11px] text-gray-400 bg-black/30 p-3 rounded-xl border border-white/5">
            <strong>Client Requirement (31.7):</strong> Attendees must join using the IntellMeet Desktop, Mobile app, or Rooms client. Web browser and telephony connections are restricted.
          </div>
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
            className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-black font-bold rounded-xl text-xs shadow-lg shadow-amber-600/30 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <ShieldAlert className="w-4 h-4 text-black" />
            {isSubmitting ? 'Enabling...' : 'Enable End-to-End Encryption'}
          </button>
        </div>

      </div>
    </div>
  );
}
