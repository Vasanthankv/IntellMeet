import React, { useState } from 'react';
import { X, Send, Type, Sparkles } from 'lucide-react';

export default function ManualCaptionModal({
  isOpen,
  onClose,
  onSubmitCaption,
  speakerName = 'Captioner',
}) {
  const [captionText, setCaptionText] = useState('');

  if (!isOpen) return null;

  const handleSend = (e) => {
    e?.preventDefault();
    if (!captionText.trim()) return;
    onSubmitCaption?.(captionText.trim());
    setCaptionText('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 bg-[#1A1A1A] border border-[#333] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#222] border-b border-[#333]">
        <div className="flex items-center gap-2">
          <Type className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-bold text-white">Manual Captioner Entry</span>
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Body / Input Form */}
      <form onSubmit={handleSend} className="p-3 space-y-2">
        <p className="text-[11px] text-gray-400">
          Type captions as participants speak. Press <kbd className="bg-[#333] px-1 rounded text-gray-200">Enter</kbd> to broadcast live.
        </p>
        <textarea
          autoFocus
          rows={2}
          value={captionText}
          onChange={(e) => setCaptionText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type live spoken captions..."
          className="w-full bg-[#252525] border border-[#3A3A3A] rounded-xl p-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 resize-none"
        />
        <div className="flex items-center justify-between pt-1">
          <span className="text-[10px] text-gray-500">Broadcasting as: {speakerName}</span>
          <button
            type="submit"
            disabled={!captionText.trim()}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Send className="w-3 h-3" />
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
