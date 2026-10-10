import React, { useState } from 'react';
import { 
  X, Share2, Copy, Check, Lock, Globe, 
  Download, Eye, Shield, Calendar, Sparkles 
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ShareRecordingModal({
  isOpen,
  onClose,
  recording = {},
  onUpdateShareSettings
}) {
  const shareSettings = recording.shareSettings || {};
  const [accessType, setAccessType] = useState(shareSettings.accessType || 'public');
  const [passcode, setPasscode] = useState(shareSettings.passcode || '');
  const [allowDownload, setAllowDownload] = useState(shareSettings.allowDownload !== false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const shareToken = shareSettings.shareToken || 'demo_token';
  const shareUrl = `${window.location.origin}/recordings/share/${shareToken}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success('Share link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    onUpdateShareSettings?.(recording.recordingId, {
      isPublic: accessType !== 'internal',
      accessType,
      passcode: accessType === 'passcode' ? passcode : '',
      allowDownload
    });
    toast.success('Share configuration saved');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#1C1C1C] border border-[#333] rounded-3xl w-full max-w-lg text-gray-200 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Share Cloud Recording (23.11)</h3>
              <p className="text-xs text-gray-400">{recording.meetingTitle || 'Meeting Recording'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-xs">
          {/* Link Copy Box */}
          <div className="space-y-1.5">
            <label className="font-semibold text-gray-300 block">Recording Link</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 bg-[#242424] border border-[#3A3A3A] rounded-xl px-3 py-2 text-white font-mono text-xs select-all focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-purple-600/20"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Access Permission (23.11) */}
          <div className="space-y-2 pt-2 border-t border-white/10">
            <span className="font-semibold text-gray-300 block">Who can access this recording?</span>
            <div className="space-y-2">
              <label className="flex items-start gap-3 p-3 bg-[#242424] hover:bg-[#282828] border border-white/5 rounded-2xl cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="accessType"
                  value="public"
                  checked={accessType === 'public'}
                  onChange={() => setAccessType('public')}
                  className="mt-0.5 accent-purple-600"
                />
                <div>
                  <span className="font-semibold text-white block">Public Access</span>
                  <span className="text-[11px] text-gray-400">Anyone with the link can view this recording</span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 bg-[#242424] hover:bg-[#282828] border border-white/5 rounded-2xl cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="accessType"
                  value="passcode"
                  checked={accessType === 'passcode'}
                  onChange={() => setAccessType('passcode')}
                  className="mt-0.5 accent-purple-600"
                />
                <div className="flex-1">
                  <span className="font-semibold text-white block">Passcode Protected</span>
                  <span className="text-[11px] text-gray-400">Only viewers with the required passcode can watch</span>
                  
                  {accessType === 'passcode' && (
                    <input
                      type="text"
                      value={passcode}
                      onChange={(e) => setPasscode(e.target.value)}
                      placeholder="Enter access passcode (e.g. 849201)"
                      className="mt-2 w-full bg-[#1C1C1C] border border-[#444] rounded-xl px-3 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-purple-500"
                    />
                  )}
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 bg-[#242424] hover:bg-[#282828] border border-white/5 rounded-2xl cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="accessType"
                  value="internal"
                  checked={accessType === 'internal'}
                  onChange={() => setAccessType('internal')}
                  className="mt-0.5 accent-purple-600"
                />
                <div>
                  <span className="font-semibold text-white block">Internal (Signed-in Users Only)</span>
                  <span className="text-[11px] text-gray-400">Restricted to members of your organization</span>
                </div>
              </label>
            </div>
          </div>

          {/* Download permissions & Analytics */}
          <div className="space-y-3 pt-2 border-t border-white/10">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-gray-300">Allow viewers to download recording files</span>
              <input
                type="checkbox"
                checked={allowDownload}
                onChange={(e) => setAllowDownload(e.target.checked)}
                className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
              />
            </label>

            <div className="flex items-center justify-between bg-[#222] p-2.5 rounded-xl border border-white/5 text-gray-400 text-[11px]">
              <span className="flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-blue-400" /> Views: {shareSettings.viewsCount || 0}
              </span>
              <span className="flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5 text-emerald-400" /> Downloads: {shareSettings.downloadsCount || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/10 bg-[#161616]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-gray-300 hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold shadow-lg shadow-purple-600/30 transition-all"
          >
            Save Sharing Settings
          </button>
        </div>
      </div>
    </div>
  );
}
