import React from 'react';
import { MessageSquare, X, Megaphone } from 'lucide-react';

export default function BreakoutBroadcastToast({
  broadcast = null,
  onDismiss = () => {}
}) {
  if (!broadcast) return null;

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg p-2 font-sans select-none animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="bg-indigo-950/95 border-2 border-indigo-500 text-indigo-100 rounded-2xl shadow-2xl p-4 flex items-start justify-between backdrop-blur-md">
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-lg">
            <Megaphone className="w-4 h-4 animate-bounce" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-xs uppercase tracking-wider text-indigo-300">
                Broadcast from Host ({broadcast.senderName || 'Host'})
              </span>
              <span className="text-[10px] text-indigo-400">18.13</span>
            </div>
            <p className="text-sm font-semibold text-white mt-1 leading-snug">
              {broadcast.message}
            </p>
          </div>
        </div>

        <button
          onClick={onDismiss}
          className="text-indigo-300 hover:text-white p-1 rounded-lg hover:bg-indigo-900/50 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
