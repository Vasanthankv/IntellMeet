import React, { useState } from 'react';
import { X, Shield, Users, Monitor, Check } from 'lucide-react';

export default function AdvancedSharingOptionsModal({
  isOpen,
  onClose,
  sharingSettings = {
    whoCanShare: 'all',
    mode: 'oneParticipant',
    whoCanStartWhenSharing: 'hostOnly'
  },
  onSaveSettings
}) {
  const [whoCanShare, setWhoCanShare] = useState(sharingSettings.whoCanShare || 'all');
  const [mode, setMode] = useState(sharingSettings.mode || 'oneParticipant');
  const [whoCanStartWhenSharing, setWhoCanStartWhenSharing] = useState(sharingSettings.whoCanStartWhenSharing || 'hostOnly');

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveSettings({
      whoCanShare,
      mode,
      whoCanStartWhenSharing
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#1F1F1F] border border-[#3A3A3A] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2F2F2F] bg-[#242424]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Advanced Sharing Options</h3>
              <p className="text-[11px] text-gray-400">Host permissions for in-meeting screen sharing</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-5 text-xs text-gray-200">
          {/* Question 1: How many participants can share at a time? (Section 13.10) */}
          <div className="space-y-2">
            <div className="font-semibold text-white flex items-center gap-1.5">
              <Monitor className="w-3.5 h-3.5 text-blue-400" />
              <span>How many participants can share at a time?</span>
            </div>
            <div className="space-y-1.5 pl-5">
              <label className="flex items-center gap-2 cursor-pointer hover:text-white">
                <input
                  type="radio"
                  name="mode"
                  value="oneParticipant"
                  checked={mode === 'oneParticipant'}
                  onChange={() => setMode('oneParticipant')}
                  className="accent-blue-600"
                />
                <span>One participant can share at a time</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer hover:text-white">
                <input
                  type="radio"
                  name="mode"
                  value="multiple"
                  checked={mode === 'multiple'}
                  onChange={() => setMode('multiple')}
                  className="accent-blue-600"
                />
                <span>Multiple participants can share simultaneously (dual monitors recommended)</span>
              </label>
            </div>
          </div>

          <div className="border-t border-[#333]"></div>

          {/* Question 2: Who can share? (Section 13.11) */}
          <div className="space-y-2">
            <div className="font-semibold text-white flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              <span>Who can share?</span>
            </div>
            <div className="space-y-1.5 pl-5">
              <label className="flex items-center gap-2 cursor-pointer hover:text-white">
                <input
                  type="radio"
                  name="whoCanShare"
                  value="hostOnly"
                  checked={whoCanShare === 'hostOnly'}
                  onChange={() => setWhoCanShare('hostOnly')}
                  className="accent-blue-600"
                />
                <span>Host Only</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer hover:text-white">
                <input
                  type="radio"
                  name="whoCanShare"
                  value="all"
                  checked={whoCanShare === 'all'}
                  onChange={() => setWhoCanShare('all')}
                  className="accent-blue-600"
                />
                <span>All Participants</span>
              </label>
            </div>
          </div>

          <div className="border-t border-[#333]"></div>

          {/* Question 3: Who can start sharing when someone else is sharing? (Section 13.11) */}
          <div className="space-y-2">
            <div className="font-semibold text-white flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              <span>Who can start sharing when someone else is sharing?</span>
            </div>
            <div className="space-y-1.5 pl-5">
              <label className="flex items-center gap-2 cursor-pointer hover:text-white">
                <input
                  type="radio"
                  name="whoCanStartWhenSharing"
                  value="hostOnly"
                  checked={whoCanStartWhenSharing === 'hostOnly'}
                  onChange={() => setWhoCanStartWhenSharing('hostOnly')}
                  className="accent-blue-600"
                />
                <span>Host Only</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer hover:text-white">
                <input
                  type="radio"
                  name="whoCanStartWhenSharing"
                  value="all"
                  checked={whoCanStartWhenSharing === 'all'}
                  onChange={() => setWhoCanStartWhenSharing('all')}
                  className="accent-blue-600"
                />
                <span>All Participants</span>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-[#181818] border-t border-[#2F2F2F] flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#2B2B2B] hover:bg-[#333] text-gray-300 text-xs font-semibold rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition-colors shadow-lg shadow-blue-600/30 flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Apply Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
}
