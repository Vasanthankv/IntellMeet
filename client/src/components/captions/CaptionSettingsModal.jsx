import React, { useState } from 'react';
import { 
  X, Settings, Shield, Globe, Type, Palette, User, Check, 
  AlertCircle, Key, Users, Sliders, Volume2, Sparkles 
} from 'lucide-react';

const SUPPORTED_LANGUAGES = [
  { code: 'en-US', name: 'English (US)' },
  { code: 'en-GB', name: 'English (UK)' },
  { code: 'hi-IN', name: 'Hindi (हिंदी)' },
  { code: 'ta-IN', name: 'Tamil (தமிழ்)' },
  { code: 'te-IN', name: 'Telugu (తెలుగు)' },
  { code: 'es-ES', name: 'Spanish (Español)' },
  { code: 'fr-FR', name: 'French (Français)' },
  { code: 'de-DE', name: 'German (Deutsch)' },
  { code: 'zh-CN', name: 'Chinese (Mandarin)' },
  { code: 'ja-JP', name: 'Japanese (日本語)' },
];

const TRANSLATION_LANGUAGES = [
  { code: 'none', name: 'Off (No Translation)' },
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'Hindi (हिंदी)' },
  { code: 'ta', name: 'Tamil (தமிழ்)' },
  { code: 'te', name: 'Telugu (తెలుగు)' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' },
];

export default function CaptionSettingsModal({
  isOpen,
  onClose,
  isHost,
  captionsEnabled,
  onToggleCaptions,
  speakingLanguage,
  onChangeSpeakingLanguage,
  translationLanguage,
  onChangeTranslationLanguage,
  fontSize,
  onChangeFontSize,
  contrast,
  onChangeContrast,
  position,
  onChangePosition,
  hostSettings = {},
  onUpdateHostSettings,
  captionRequests = [],
  onResolveRequest,
  onRequestCaptions,
  participants = [],
  assignedCaptionerId,
  onAssignCaptioner,
  onOpenManualCaptioner,
}) {
  const [activeTab, setActiveTab] = useState('participant'); // 'participant' | 'host'
  const [requestSent, setRequestSent] = useState(false);
  const [showApiToken, setShowApiToken] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#181818] border border-[#2D2D2D] rounded-2xl shadow-2xl w-full max-w-xl flex flex-col overflow-hidden text-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2A2A2A] bg-[#1E1E1E]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/20 flex items-center justify-center text-indigo-400">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Live Caption Settings</h3>
              <p className="text-[11px] text-gray-400">Configure speech recognition & subtitle appearance</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#2A2A2A] px-5 bg-[#151515]">
          <button
            onClick={() => setActiveTab('participant')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'participant'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            Participant Controls
          </button>
          {isHost && (
            <button
              onClick={() => setActiveTab('host')}
              className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'host'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              Host Controls
              {captionRequests.filter(r => r.status === 'PENDING').length > 0 && (
                <span className="w-4 h-4 rounded-full bg-amber-500 text-black text-[10px] font-bold flex items-center justify-center">
                  {captionRequests.filter(r => r.status === 'PENDING').length}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-5 max-h-[70vh] overflow-y-auto space-y-5">
          {activeTab === 'participant' && (
            <>
              {/* Show/Hide Live Captions */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#202020] border border-[#2A2A2A]">
                <div>
                  <h4 className="text-sm font-semibold text-white">Live Captions Display</h4>
                  <p className="text-xs text-gray-400">Display spoken words as real-time subtitles on your screen</p>
                </div>
                <button
                  onClick={onToggleCaptions}
                  className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-1 ${
                    captionsEnabled ? 'bg-indigo-600' : 'bg-gray-700'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      captionsEnabled ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Speaking Language */}
              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1.5 flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                  Your Speaking Language
                </label>
                <select
                  value={speakingLanguage}
                  onChange={(e) => onChangeSpeakingLanguage(e.target.value)}
                  className="w-full bg-[#242424] border border-[#333] rounded-xl px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-indigo-500"
                >
                  {SUPPORTED_LANGUAGES.map(lang => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-gray-400 mt-1">
                  Speech recognition will adapt to your chosen speaking language.
                </p>
              </div>

              {/* Translated Captions (20.7) */}
              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1.5 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-purple-400" />
                  Translated Captions Language
                </label>
                <select
                  value={translationLanguage || 'none'}
                  onChange={(e) => onChangeTranslationLanguage(e.target.value === 'none' ? null : e.target.value)}
                  className="w-full bg-[#242424] border border-[#333] rounded-xl px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-purple-500"
                >
                  {TRANSLATION_LANGUAGES.map(lang => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-gray-400 mt-1">
                  Translate incoming spoken captions into your preferred language in real time.
                </p>
              </div>

              {/* Appearance Controls */}
              <div className="border-t border-[#2A2A2A] pt-4 space-y-4">
                <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                  Appearance Preferences
                </h4>

                {/* Font Size */}
                <div>
                  <label className="text-xs text-gray-400 block mb-1.5 flex items-center gap-1">
                    <Type className="w-3 h-3 text-gray-400" /> Text Size
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['small', 'medium', 'large'].map((size) => (
                      <button
                        key={size}
                        onClick={() => onChangeFontSize(size)}
                        className={`py-2 px-3 rounded-lg text-xs font-medium capitalize border transition-all ${
                          fontSize === size
                            ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 font-bold'
                            : 'bg-[#222] border-[#333] text-gray-400 hover:text-white'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Contrast / Theme */}
                <div>
                  <label className="text-xs text-gray-400 block mb-1.5 flex items-center gap-1">
                    <Palette className="w-3 h-3 text-gray-400" /> Contrast & Theme
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'dark', label: 'Dark Semi' },
                      { id: 'high-contrast', label: 'High Contrast' },
                      { id: 'light', label: 'Light' },
                    ].map((th) => (
                      <button
                        key={th.id}
                        onClick={() => onChangeContrast(th.id)}
                        className={`py-2 px-3 rounded-lg text-xs font-medium border transition-all ${
                          contrast === th.id
                            ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 font-bold'
                            : 'bg-[#222] border-[#333] text-gray-400 hover:text-white'
                        }`}
                      >
                        {th.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Position */}
                <div>
                  <label className="text-xs text-gray-400 block mb-1.5">Position on Screen</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['bottom', 'top'].map((pos) => (
                      <button
                        key={pos}
                        onClick={() => onChangePosition(pos)}
                        className={`py-2 px-3 rounded-lg text-xs font-medium capitalize border transition-all ${
                          position === pos
                            ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 font-bold'
                            : 'bg-[#222] border-[#333] text-gray-400 hover:text-white'
                        }`}
                      >
                        {pos === 'bottom' ? 'Bottom of Screen' : 'Top of Screen'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Request Captions from Host (if disabled) */}
              {!isHost && hostSettings.hostOnlyControl && !captionsEnabled && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="text-xs text-amber-200">
                      Captions restricted to host. Request permission?
                    </span>
                  </div>
                  <button
                    disabled={requestSent}
                    onClick={() => {
                      onRequestCaptions?.();
                      setRequestSent(true);
                    }}
                    className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-black text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
                  >
                    {requestSent ? 'Requested' : 'Request'}
                  </button>
                </div>
              )}
            </>
          )}

          {activeTab === 'host' && isHost && (
            <div className="space-y-4">
              {/* Allow Captions for this Meeting (20.4) */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#202020] border border-[#2A2A2A]">
                <div>
                  <h4 className="text-sm font-semibold text-white">Allow Closed Captions</h4>
                  <p className="text-xs text-gray-400">Allow participants to see automated or manual captions</p>
                </div>
                <input
                  type="checkbox"
                  checked={hostSettings.captionsEnabled !== false}
                  onChange={(e) => onUpdateHostSettings?.({ captionsEnabled: e.target.checked })}
                  className="w-4 h-4 rounded text-indigo-600"
                />
              </div>

              {/* Restrict to Host/Co-host Only (20.4) */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#202020] border border-[#2A2A2A]">
                <div>
                  <h4 className="text-sm font-semibold text-white">Restrict Activation</h4>
                  <p className="text-xs text-gray-400">Only host and co-hosts can enable or configure captions</p>
                </div>
                <input
                  type="checkbox"
                  checked={!!hostSettings.hostOnlyControl}
                  onChange={(e) => onUpdateHostSettings?.({ hostOnlyControl: e.target.checked })}
                  className="w-4 h-4 rounded text-indigo-600"
                />
              </div>

              {/* Allow Participant Requests */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#202020] border border-[#2A2A2A]">
                <div>
                  <h4 className="text-sm font-semibold text-white">Participant Requests</h4>
                  <p className="text-xs text-gray-400">Allow participants to request caption enablement</p>
                </div>
                <input
                  type="checkbox"
                  checked={hostSettings.participantRequestsAllowed !== false}
                  onChange={(e) => onUpdateHostSettings?.({ participantRequestsAllowed: e.target.checked })}
                  className="w-4 h-4 rounded text-indigo-600"
                />
              </div>

              {/* Pending Participant Requests */}
              {captionRequests && captionRequests.length > 0 && (
                <div className="border border-amber-500/30 bg-amber-500/5 rounded-xl p-3 space-y-2">
                  <h4 className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    Pending Participant Caption Requests
                  </h4>
                  {captionRequests.filter(r => r.status === 'PENDING').map(req => (
                    <div key={req.requestId} className="flex items-center justify-between bg-black/40 p-2 rounded-lg text-xs">
                      <span>{req.participantName} requested captions</span>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => onResolveRequest?.(req.requestId, 'APPROVE')}
                          className="px-2 py-0.5 bg-emerald-600 text-white rounded text-[11px] font-medium hover:bg-emerald-500"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => onResolveRequest?.(req.requestId, 'DECLINE')}
                          className="px-2 py-0.5 bg-red-600/80 text-white rounded text-[11px] font-medium hover:bg-red-500"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                  {captionRequests.filter(r => r.status === 'PENDING').length === 0 && (
                    <p className="text-[11px] text-gray-400">No pending requests</p>
                  )}
                </div>
              )}

              {/* Manual Captioner Setup (20.6) */}
              <div className="border-t border-[#2A2A2A] pt-3 space-y-3">
                <h4 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                  <Type className="w-3.5 h-3.5" /> Set Up Manual Captioner (20.6)
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      onOpenManualCaptioner?.();
                      onClose();
                    }}
                    className="p-2.5 rounded-xl bg-[#242424] hover:bg-[#2C2C2C] border border-[#333] text-left text-xs transition-colors"
                  >
                    <span className="font-semibold block text-white">I Will Type</span>
                    <span className="text-[10px] text-gray-400">Type captions manually</span>
                  </button>
                  <button
                    onClick={() => setShowApiToken(!showApiToken)}
                    className="p-2.5 rounded-xl bg-[#242424] hover:bg-[#2C2C2C] border border-[#333] text-left text-xs transition-colors"
                  >
                    <span className="font-semibold block text-white">3rd-Party API</span>
                    <span className="text-[10px] text-gray-400">Copy integration token</span>
                  </button>
                </div>

                {/* Assign participant as captioner */}
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Assign a Participant to Type</label>
                  <select
                    value={assignedCaptionerId || ''}
                    onChange={(e) => {
                      const selId = e.target.value;
                      const selPart = participants.find(p => (p.id || p._id) === selId);
                      onAssignCaptioner?.(selId, selPart ? (selPart.name || 'Participant') : null);
                    }}
                    className="w-full bg-[#242424] border border-[#333] rounded-xl px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">None (Automated / Host)</option>
                    {participants.map(p => (
                      <option key={p.id || p._id} value={p.id || p._id}>
                        {p.name || 'Participant'} {p.isSelf ? '(You)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {showApiToken && (
                  <div className="p-3 bg-black/50 border border-white/10 rounded-xl space-y-1 text-xs">
                    <span className="font-semibold text-gray-300">Third-Party Caption Token</span>
                    <div className="flex items-center gap-2">
                      <input
                        readOnly
                        value={`intellmeet-cc-${Math.random().toString(36).substring(2, 12)}`}
                        className="bg-[#181818] border border-[#333] rounded px-2 py-1 flex-1 text-[11px] text-emerald-400 font-mono"
                      />
                      <button
                        onClick={() => alert('API Token copied to clipboard')}
                        className="px-2 py-1 bg-indigo-600 rounded text-[11px] font-medium"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-5 py-3 border-t border-[#2A2A2A] bg-[#1E1E1E]">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
