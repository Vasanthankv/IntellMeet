import React, { useState } from 'react';
import { 
  X, Globe, Volume2, Shield, Settings, Sliders, Play, 
  Check, ArrowRight, Sparkles, MessageSquare, Headphones 
} from 'lucide-react';
import { voiceTranslator } from './VoiceTranslationEngine';

const LANGUAGES = [
  { code: 'en', name: 'English', speechCode: 'en-US' },
  { code: 'es', name: 'Spanish (Español)', speechCode: 'es-ES' },
  { code: 'ta', name: 'Tamil (தமிழ்)', speechCode: 'ta-IN' },
  { code: 'hi', name: 'Hindi (हिन्दी)', speechCode: 'hi-IN' },
  { code: 'te', name: 'Telugu (తెలుగు)', speechCode: 'te-IN' },
  { code: 'fr', name: 'French (Français)', speechCode: 'fr-FR' },
  { code: 'de', name: 'German (Deutsch)', speechCode: 'de-DE' },
  { code: 'it', name: 'Italian (Italiano)', speechCode: 'it-IT' },
  { code: 'pt', name: 'Portuguese (Português)', speechCode: 'pt-PT' },
  { code: 'ja', name: 'Japanese (日本語)', speechCode: 'ja-JP' },
  { code: 'ko', name: 'Korean (한국어)', speechCode: 'ko-KR' },
  { code: 'zh', name: 'Chinese (中文)', speechCode: 'zh-CN' },
  { code: 'ar', name: 'Arabic (العربية)', speechCode: 'ar-SA' },
  { code: 'ru', name: 'Russian (Русский)', speechCode: 'ru-RU' },
  { code: 'vi', name: 'Vietnamese (Tiếng Việt)', speechCode: 'vi-VN' },
];

export default function TranslationSettingsModal({
  isOpen,
  onClose,
  isHost,
  speakingLanguage = 'en-US',
  onChangeSpeakingLanguage,
  targetLanguage = 'ta',
  onChangeTargetLanguage,
  translationEnabled = true,
  onToggleTranslation,
  voiceTranslationEnabled = false,
  onToggleVoiceTranslation,
  languagePairs = [],
  onUpdateLanguagePairs,
  meetingTranslationActive = true,
  onToggleMeetingTranslation,
}) {
  const [activeTab, setActiveTab] = useState('participant'); // 'participant' | 'host'
  const [selectedSource, setSelectedSource] = useState('en');
  const [testPlaying, setTestPlaying] = useState(false);

  if (!isOpen) return null;

  const currentPair = languagePairs.find(p => p.sourceLanguage === selectedSource) || {
    sourceLanguage: selectedSource,
    targetLanguages: ['ta', 'hi', 'te', 'es', 'fr', 'de'],
    enabled: true
  };

  const handleToggleTargetInPair = (tgtCode) => {
    const currTargets = currentPair.targetLanguages || [];
    const nextTargets = currTargets.includes(tgtCode)
      ? currTargets.filter(c => c !== tgtCode)
      : [...currTargets, tgtCode];
    onUpdateLanguagePairs?.(selectedSource, nextTargets, true);
  };

  const handleTestVoice = () => {
    setTestPlaying(true);
    const samplePhrases = {
      en: 'The project will be ready tomorrow.',
      es: 'El proyecto estará listo mañana.',
      ta: 'திட்டம் நாளை தயாராகிவிடும்.',
      hi: 'परियोजना कल तैयार हो जाएगी.',
      te: 'ప్రాజెక్ట్ రేపు సిద్ధంగా ఉంటుంది.',
      fr: 'Le projet sera prêt demain.',
      de: 'Das Projekt wird morgen fertig sein.',
      ja: 'プロジェクトは明日準備が整います。',
      zh: '该项目将于明天准备就绪。',
    };
    const sample = samplePhrases[targetLanguage] || 'Hello, testing voice translation audio.';
    voiceTranslator.speak(sample, targetLanguage);
    setTimeout(() => setTestPlaying(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#181818] border border-[#2D2D2D] rounded-2xl shadow-2xl w-full max-w-xl flex flex-col overflow-hidden text-gray-200 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2A2A2A] bg-[#1E1E1E]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-600/20 flex items-center justify-center text-purple-400">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Live Translation & Captions</h3>
              <p className="text-[11px] text-gray-400">Multilingual speech-to-text & voice translation</p>
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
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            My Translation Preferences
          </button>
          {isHost && (
            <button
              onClick={() => setActiveTab('host')}
              className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'host'
                  ? 'border-purple-500 text-purple-400'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              Host Translation Controls
            </button>
          )}
        </div>

        {/* Body */}
        <div className="p-5 max-h-[70vh] overflow-y-auto space-y-5">
          {activeTab === 'participant' && (
            <>
              {/* Enable / Disable Translation Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#202020] border border-[#2A2A2A]">
                <div>
                  <h4 className="text-sm font-semibold text-white">Enable Translated Captions</h4>
                  <p className="text-xs text-gray-400">Display subtitles translated into your chosen target language</p>
                </div>
                <button
                  onClick={onToggleTranslation}
                  className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-1 ${
                    translationEnabled ? 'bg-purple-600' : 'bg-gray-700'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      translationEnabled ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* My Speaking Language (21.5) */}
              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1.5 flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-blue-400" />
                  My Speaking Language
                </label>
                <select
                  value={speakingLanguage}
                  onChange={(e) => onChangeSpeakingLanguage?.(e.target.value)}
                  className="w-full bg-[#242424] border border-[#333] rounded-xl px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-purple-500"
                >
                  {LANGUAGES.map(lang => (
                    <option key={lang.speechCode} value={lang.speechCode}>
                      {lang.name}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-gray-500 mt-1">
                  The language you speak into your microphone during the meeting.
                </p>
              </div>

              {/* Translate Captions To (21.4, 21.6) */}
              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1.5 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-purple-400" />
                  Translate Captions To
                </label>
                <select
                  value={targetLanguage}
                  onChange={(e) => onChangeTargetLanguage?.(e.target.value)}
                  className="w-full bg-[#242424] border border-[#333] rounded-xl px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-purple-500"
                >
                  {LANGUAGES.map(lang => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-gray-500 mt-1">
                  Each participant can independently choose their own translated language.
                </p>
              </div>

              {/* Voice Translation Section (21.17) */}
              <div className="border-t border-[#2A2A2A] pt-4 space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-purple-950/20 border border-purple-800/30">
                  <div className="flex items-center gap-2">
                    <Headphones className="w-4 h-4 text-purple-400" />
                    <div>
                      <h4 className="text-xs font-semibold text-white">Voice Translation (Audio TTS)</h4>
                      <p className="text-[11px] text-purple-300">Listen to translated speech spoken aloud</p>
                    </div>
                  </div>
                  <button
                    onClick={onToggleVoiceTranslation}
                    className={`w-11 h-5 rounded-full transition-colors relative flex items-center px-0.5 ${
                      voiceTranslationEnabled ? 'bg-purple-600' : 'bg-gray-700'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        voiceTranslationEnabled ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {voiceTranslationEnabled && (
                  <div className="p-3 bg-[#202020] rounded-xl border border-[#2E2E2E] space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Audio Voice Preview:</span>
                      <button
                        onClick={handleTestVoice}
                        disabled={testPlaying}
                        className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-1 text-[11px] font-medium transition-colors"
                      >
                        <Play className="w-3 h-3" />
                        {testPlaying ? 'Speaking...' : 'Test Voice'}
                      </button>
                    </div>
                    <p className="text-[10px] text-gray-500">
                      Plays synthetic voice in <span className="text-purple-300 font-semibold">{LANGUAGES.find(l => l.code === targetLanguage)?.name}</span>.
                    </p>
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'host' && isHost && (
            <div className="space-y-4">
              {/* Meeting-wide Translation Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#202020] border border-[#2A2A2A]">
                <div>
                  <h4 className="text-sm font-semibold text-white">Allow Meeting Translation</h4>
                  <p className="text-xs text-gray-400">Allow participants to use real-time translated captions</p>
                </div>
                <input
                  type="checkbox"
                  checked={meetingTranslationActive}
                  onChange={(e) => onToggleMeetingTranslation?.(e.target.checked)}
                  className="w-4 h-4 rounded text-purple-600"
                />
              </div>

              {/* Language Pairs Configuration (21.3) */}
              <div className="border-t border-[#2A2A2A] pt-3 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-purple-400 uppercase tracking-wider">
                    Configured Language Pairs (21.3)
                  </h4>
                  <span className="text-[10px] text-gray-500">Source → Targets</span>
                </div>

                {/* Source Language selector */}
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Select Speaking Source Language:</label>
                  <select
                    value={selectedSource}
                    onChange={(e) => setSelectedSource(e.target.value)}
                    className="w-full bg-[#242424] border border-[#333] rounded-xl px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-purple-500"
                  >
                    {LANGUAGES.map(lang => (
                      <option key={lang.code} value={lang.code}>
                        {lang.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Target languages checklist */}
                <div className="bg-[#202020] border border-[#2C2C2C] rounded-xl p-3 space-y-2">
                  <span className="text-xs font-medium text-gray-300 block mb-1">
                    Allowed Target Languages when speaking {LANGUAGES.find(l => l.code === selectedSource)?.name}:
                  </span>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                    {LANGUAGES.filter(l => l.code !== selectedSource).map(lang => {
                      const isChecked = (currentPair.targetLanguages || []).includes(lang.code);
                      return (
                        <label
                          key={lang.code}
                          className="flex items-center gap-2 p-1.5 rounded hover:bg-white/5 cursor-pointer text-xs"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleTargetInPair(lang.code)}
                            className="rounded text-purple-600"
                          />
                          <span className={isChecked ? 'text-white font-medium' : 'text-gray-400'}>
                            {lang.name}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-5 py-3 border-t border-[#2A2A2A] bg-[#1E1E1E]">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-xl transition-colors"
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
}
