import React, { useState } from 'react';
import { 
  X, Headphones, Volume2, Shield, Settings, Sliders, Play, 
  Square, Check, UserCheck, Plus, Trash2, Eye, Radio, Sparkles 
} from 'lucide-react';

const COMMON_LANGUAGES = [
  { code: 'ta', name: 'Tamil' },
  { code: 'hi', name: 'Hindi' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'te', name: 'Telugu' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ar', name: 'Arabic' },
  { code: 'ru', name: 'Russian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ko', name: 'Korean' },
];

export default function LanguageInterpretationModal({
  isOpen,
  onClose,
  isHost,
  interpretationSession = {},
  selectedChannel = 'original',
  onSelectChannel,
  originalAudioVolume = 0.2,
  onChangeOriginalVolume,
  interpretationVolume = 1.0,
  onChangeInterpretationVolume,
  signLanguageEnabled = false,
  onToggleSignLanguage,
  onStartInterpretation,
  onStopInterpretation,
  onAddLanguage,
  onRemoveLanguage,
  onAssignInterpreter,
  onAssignSignInterpreter,
  participants = [],
}) {
  const [activeTab, setActiveTab] = useState('participant'); // 'participant' | 'host'
  const [newLangCode, setNewLangCode] = useState('fr');
  const [newLangName, setNewLangName] = useState('French');
  const [newInterpreterId, setNewInterpreterId] = useState('');
  const [newSignInterpreterId, setNewSignInterpreterId] = useState('');

  if (!isOpen) return null;

  const languages = interpretationSession.languages || [];
  const isSessionActive = interpretationSession.status === 'ACTIVE';

  const handleAddChannel = (e) => {
    e.preventDefault();
    const selLang = COMMON_LANGUAGES.find(l => l.code === newLangCode);
    const selPart = participants.find(p => (p.id || p._id) === newInterpreterId);
    onAddLanguage?.({
      languageCode: newLangCode,
      languageName: selLang ? selLang.name : newLangName,
      interpreterId: newInterpreterId || null,
      interpreterName: selPart ? selPart.name : null,
      interpreterEmail: selPart ? selPart.email : null
    });
  };

  const handleAssignSign = (e) => {
    e.preventDefault();
    const selPart = participants.find(p => (p.id || p._id) === newSignInterpreterId);
    if (selPart) {
      onAssignSignInterpreter?.(selPart.id || selPart._id, selPart.name, selPart.email);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#181818] border border-[#2D2D2D] rounded-2xl shadow-2xl w-full max-w-xl flex flex-col overflow-hidden text-gray-200 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2A2A2A] bg-[#1E1E1E]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600/20 flex items-center justify-center text-emerald-400">
              <Headphones className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Language Interpretation</h3>
              <p className="text-[11px] text-gray-400">Select spoken audio channels & sign-language video</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#2A2A2A] px-5 bg-[#151515]">
          <button
            onClick={() => setActiveTab('participant')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'participant'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            Audio Channels
          </button>
          {isHost && (
            <button
              onClick={() => setActiveTab('host')}
              className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'host'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              Host Management
              {isSessionActive && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-1" />
              )}
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="p-5 max-h-[70vh] overflow-y-auto space-y-5">
          {activeTab === 'participant' && (
            <>
              {/* Audio Channel Selection (22.7, 22.9) */}
              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-2">
                  Select Interpretation Audio Channel:
                </label>
                <div className="space-y-2">
                  {/* Original Audio Option */}
                  <label
                    onClick={() => onSelectChannel?.('original')}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                      selectedChannel === 'original'
                        ? 'bg-emerald-600/15 border-emerald-500/80 text-white font-medium shadow-sm'
                        : 'bg-[#222] border-[#303030] text-gray-300 hover:bg-[#282828]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        selectedChannel === 'original' ? 'border-emerald-400' : 'border-gray-500'
                      }`}>
                        {selectedChannel === 'original' && <div className="w-2 h-2 rounded-full bg-emerald-400" />}
                      </div>
                      <div>
                        <span className="text-xs font-semibold block">Original Audio</span>
                        <span className="text-[10px] text-gray-400">Hear the meeting speaker directly</span>
                      </div>
                    </div>
                    <span className="text-[11px] text-gray-400 font-mono">Default</span>
                  </label>

                  {/* Configured Language Channels */}
                  {languages.map(lang => {
                    const isSelected = selectedChannel === lang.languageCode;
                    return (
                      <label
                        key={lang.languageId || lang.languageCode}
                        onClick={() => onSelectChannel?.(lang.languageCode)}
                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-emerald-600/15 border-emerald-500/80 text-white font-medium shadow-sm'
                            : 'bg-[#222] border-[#303030] text-gray-300 hover:bg-[#282828]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected ? 'border-emerald-400' : 'border-gray-500'
                          }`}>
                            {isSelected && <div className="w-2 h-2 rounded-full bg-emerald-400" />}
                          </div>
                          <div>
                            <span className="text-xs font-semibold block">{lang.languageName} Channel</span>
                            <span className="text-[10px] text-gray-400">
                              Interpreter: {lang.interpreterName || 'Assigned Interpreter'}
                            </span>
                          </div>
                        </div>
                        {lang.isSpeaking && (
                          <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/40 animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Speaking
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Original Audio Volume Mixing (22.8) */}
              {selectedChannel !== 'original' && (
                <div className="p-3.5 bg-[#202020] rounded-xl border border-[#2E2E2E] space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                        Original Audio Mixing (22.8)
                      </h4>
                      <p className="text-[11px] text-gray-400">Hear original speaker faintly in background</p>
                    </div>
                    <span className="text-xs font-mono text-emerald-400 font-bold">
                      {Math.round(originalAudioVolume * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="0.5"
                    step="0.05"
                    value={originalAudioVolume}
                    onChange={(e) => onChangeOriginalVolume?.(parseFloat(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-gray-500">
                    <span>Mute original (0%)</span>
                    <span>Subtle background (20%)</span>
                    <span>Audible (50%)</span>
                  </div>
                </div>
              )}

              {/* Sign-Language Interpretation (22.13) */}
              <div className="border-t border-[#2A2A2A] pt-4">
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-indigo-950/20 border border-indigo-800/30">
                  <div className="flex items-center gap-2.5">
                    <Eye className="w-4 h-4 text-indigo-400" />
                    <div>
                      <h4 className="text-xs font-semibold text-white">Sign-Language Interpretation (22.13)</h4>
                      <p className="text-[11px] text-indigo-200/70">Show sign interpreter in a floating video tile</p>
                    </div>
                  </div>
                  <button
                    onClick={onToggleSignLanguage}
                    className={`w-11 h-5 rounded-full transition-colors relative flex items-center px-0.5 ${
                      signLanguageEnabled ? 'bg-indigo-600' : 'bg-gray-700'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        signLanguageEnabled ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </>
          )}

          {activeTab === 'host' && isHost && (
            <div className="space-y-5">
              {/* Start / Stop Session Bar */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#202020] border border-[#2A2A2A]">
                <div>
                  <h4 className="text-sm font-semibold text-white">Interpretation Session</h4>
                  <p className="text-xs text-gray-400">
                    Status: <span className={isSessionActive ? 'text-emerald-400 font-bold' : 'text-gray-400'}>
                      {isSessionActive ? '● Active' : 'Stopped'}
                    </span>
                  </p>
                </div>
                <button
                  onClick={isSessionActive ? onStopInterpretation : onStartInterpretation}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
                    isSessionActive
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  {isSessionActive ? (
                    <>
                      <Square className="w-3.5 h-3.5" /> Stop Session
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" /> Start Session
                    </>
                  )}
                </button>
              </div>

              {/* Configured Language Channels List */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                    Configured Language Channels (22.3, 22.4)
                  </h4>
                  <span className="text-[10px] text-gray-500">{languages.length} channels</span>
                </div>

                <div className="space-y-2">
                  {languages.map(lang => (
                    <div
                      key={lang.languageId || lang.languageCode}
                      className="p-3 bg-[#222] rounded-xl border border-[#2D2D2D] flex items-center justify-between"
                    >
                      <div>
                        <span className="text-xs font-bold text-white block">{lang.languageName}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] text-emerald-400 font-medium">
                            {lang.interpreterName ? `Interpreter: ${lang.interpreterName}` : 'No interpreter assigned'}
                          </span>
                          <span className="text-[10px] bg-black/40 text-gray-400 px-1.5 py-0.2 rounded font-mono uppercase">
                            {lang.languageCode}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Assign from participant dropdown */}
                        <select
                          value={lang.interpreterId || ''}
                          onChange={(e) => {
                            const pId = e.target.value;
                            const p = participants.find(part => (part.id || part._id) === pId);
                            onAssignInterpreter?.(lang.languageId || lang.languageCode, pId, p ? p.name : null, p ? p.email : null);
                          }}
                          className="bg-[#181818] border border-[#3A3A3A] rounded-lg px-2 py-1 text-[11px] text-gray-200 focus:outline-none focus:border-emerald-500"
                        >
                          <option value="">Assign Interpreter...</option>
                          {participants.map(p => (
                            <option key={p.id || p._id} value={p.id || p._id}>
                              {p.name || 'Participant'}
                            </option>
                          ))}
                        </select>

                        <button
                          onClick={() => onRemoveLanguage?.(lang.languageId || lang.languageCode)}
                          className="p-1 rounded-lg text-gray-400 hover:text-red-400 hover:bg-white/5 transition-colors"
                          title="Remove channel"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add New Language Channel Form */}
              <form onSubmit={handleAddChannel} className="p-3 bg-[#1C1C1C] border border-[#2E2E2E] rounded-xl space-y-2.5">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                  <Plus className="w-3.5 h-3.5" /> Add Language Channel
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-gray-400 block mb-1">Language</label>
                    <select
                      value={newLangCode}
                      onChange={(e) => {
                        setNewLangCode(e.target.value);
                        const sel = COMMON_LANGUAGES.find(l => l.code === e.target.value);
                        if (sel) setNewLangName(sel.name);
                      }}
                      className="w-full bg-[#252525] border border-[#333] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                    >
                      {COMMON_LANGUAGES.map(l => (
                        <option key={l.code} value={l.code}>{l.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 block mb-1">Assign Interpreter</label>
                    <select
                      value={newInterpreterId}
                      onChange={(e) => setNewInterpreterId(e.target.value)}
                      className="w-full bg-[#252525] border border-[#333] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                    >
                      <option value="">Choose Participant (Optional)...</option>
                      {participants.map(p => (
                        <option key={p.id || p._id} value={p.id || p._id}>{p.name || 'Participant'}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors"
                >
                  Add Language Channel
                </button>
              </form>

              {/* Sign-Language Interpreter Assignment (22.13) */}
              <div className="p-3 bg-[#1C1C1C] border border-[#2E2E2E] rounded-xl space-y-2">
                <span className="text-xs font-bold text-indigo-400 flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" /> Assign Sign-Language Interpreter (22.13)
                </span>
                <div className="flex gap-2">
                  <select
                    value={newSignInterpreterId}
                    onChange={(e) => setNewSignInterpreterId(e.target.value)}
                    className="flex-1 bg-[#252525] border border-[#333] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                  >
                    <option value="">Select Participant...</option>
                    {participants.map(p => (
                      <option key={p.id || p._id} value={p.id || p._id}>{p.name || 'Participant'}</option>
                    ))}
                  </select>
                  <button
                    onClick={handleAssignSign}
                    disabled={!newSignInterpreterId}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-lg text-xs font-semibold transition-colors"
                  >
                    Assign
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-5 py-3 border-t border-[#2A2A2A] bg-[#1E1E1E]">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
