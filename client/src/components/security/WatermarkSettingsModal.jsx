import React, { useState } from 'react';
import { 
  Shield, Eye, EyeOff, Volume2, VolumeX, Sparkles, Sliders, 
  Layers, Lock, CheckCircle2, AlertTriangle, Search, X, 
  FileText, ExternalLink, RefreshCw, Copy, Check
} from 'lucide-react';
import WatermarkOverlay from './WatermarkOverlay';
import toast from 'react-hot-toast';

export default function WatermarkSettingsModal({
  isOpen,
  onClose,
  meetingId,
  isHostOrCoHost = false,
  watermarkSettings = {},
  viewerIdentity = {},
  onSaveWatermarkSettings,
  onTraceAudioLeak
}) {
  const [activeTab, setActiveTab] = useState('visual'); // 'visual' | 'audio' | 'tracer'
  
  // Local form state
  const [visualEnabled, setVisualEnabled] = useState(watermarkSettings.visualEnabled ?? false);
  const [visualMode, setVisualMode] = useState(watermarkSettings.visualMode || 'repeated');
  const [visibleOn, setVisibleOn] = useState(watermarkSettings.visibleOn || 'both');
  const [opacity, setOpacity] = useState(watermarkSettings.opacity || 25);
  const [identityType, setIdentityType] = useState(watermarkSettings.identityType || 'maskedEmail');
  const [audioEnabled, setAudioEnabled] = useState(watermarkSettings.audioEnabled ?? false);
  const [isSaving, setIsSaving] = useState(false);

  // Forensic Tracer State
  const [tracerSignatureInput, setTracerSignatureInput] = useState('');
  const [isTracing, setIsTracing] = useState(false);
  const [traceResult, setTraceResult] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  if (!isOpen) return null;

  // Determine effective display string for preview
  const previewIdentity = 
    identityType === 'maskedEmail'
      ? (viewerIdentity.maskedEmail || 'kv***@gmail.com')
      : identityType === 'email'
        ? (viewerIdentity.rawEmail || 'kvasanthan@gmail.com')
        : (viewerIdentity.participantId || 'USR-7491');

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSaveWatermarkSettings({
        visualEnabled,
        visualMode,
        visibleOn,
        opacity,
        identityType,
        audioEnabled
      });
      toast.success('Watermarking settings saved & synchronized');
      onClose();
    } catch (e) {
      toast.error('Failed to save watermark settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRunForensicTrace = async (e) => {
    e.preventDefault();
    if (!tracerSignatureInput.trim()) {
      toast.error('Please enter an audio signature token or marker');
      return;
    }

    setIsTracing(true);
    setTraceResult(null);
    try {
      const res = await onTraceAudioLeak(tracerSignatureInput.trim());
      if (res && res.found) {
        setTraceResult(res);
        toast.success('Forensic match identified!', { icon: '🎯' });
      } else {
        toast.error('No matching participant signature found for this audio sample');
      }
    } catch (err) {
      toast.error('Forensic trace failed');
    } finally {
      setIsTracing(false);
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-[#1C1C1C] border border-[#3E3E3E] rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col text-xs text-gray-200 animate-in zoom-in-95 duration-150 divide-y divide-[#2E2E2E]">
        
        {/* ── Modal Header ── */}
        <div className="p-5 bg-[#252525] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Watermarking & Anti-Leak Center</span>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-bold">
                  Section 32
                </span>
              </h2>
              <p className="text-[11px] text-gray-400">
                Visual identity overlay and ultrasonic acoustic steganography
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1.5 rounded-xl hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Tabs Navigation ── */}
        <div className="flex border-b border-[#2E2E2E] bg-[#222]">
          <button
            onClick={() => setActiveTab('visual')}
            className={`flex-1 py-3 text-center font-semibold text-xs border-b-2 transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'visual'
                ? 'border-indigo-500 text-indigo-400 bg-white/5'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>Visual Watermark (32.1)</span>
          </button>

          <button
            onClick={() => setActiveTab('audio')}
            className={`flex-1 py-3 text-center font-semibold text-xs border-b-2 transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'audio'
                ? 'border-indigo-500 text-indigo-400 bg-white/5'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Volume2 className="w-4 h-4" />
            <span>Audio Watermark (32.2)</span>
          </button>

          <button
            onClick={() => setActiveTab('tracer')}
            className={`flex-1 py-3 text-center font-semibold text-xs border-b-2 transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'tracer'
                ? 'border-indigo-500 text-indigo-400 bg-white/5'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>Forensic Leak Tracer (32.7)</span>
          </button>
        </div>

        {/* ── Tab 1: Visual Watermark ── */}
        {activeTab === 'visual' && (
          <div className="p-6 space-y-6 max-h-[65vh] overflow-y-auto custom-scrollbar">
            
            {/* Enable Visual Watermark Master Toggle */}
            <div className="flex items-center justify-between p-4 bg-[#262626] border border-[#3A3A3A] rounded-2xl">
              <div>
                <span className="font-bold text-sm text-white block mb-0.5">Enable Visual Watermark</span>
                <p className="text-[11px] text-gray-400">
                  Overlays the viewing participant's identity over shared content and video feeds.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={visualEnabled} 
                  onChange={(e) => setVisualEnabled(e.target.checked)}
                  disabled={!isHostOrCoHost}
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {/* Configuration Options (Active when enabled) */}
            <div className={`space-y-5 transition-opacity ${visualEnabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
              
              {/* Watermark Mode: Single vs Repeated */}
              <div>
                <label className="font-bold text-xs text-gray-300 block mb-2 uppercase tracking-wider">
                  Watermark Pattern Layout (32.1)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setVisualMode('repeated')}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      visualMode === 'repeated'
                        ? 'border-indigo-500 bg-indigo-500/10 text-white'
                        : 'border-[#333] bg-[#242424] text-gray-400 hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-gray-200">Repeated Grid (Recommended)</span>
                      {visualMode === 'repeated' && <CheckCircle2 className="w-4 h-4 text-indigo-400" />}
                    </div>
                    <p className="text-[10px] text-gray-400">
                      Diagonal multi-tile security pattern across entire content area. Prevents cropping.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setVisualMode('single')}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      visualMode === 'single'
                        ? 'border-indigo-500 bg-indigo-500/10 text-white'
                        : 'border-[#333] bg-[#242424] text-gray-400 hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-gray-200">Single Instance</span>
                      {visualMode === 'single' && <CheckCircle2 className="w-4 h-4 text-indigo-400" />}
                    </div>
                    <p className="text-[10px] text-gray-400">
                      Single centered security watermark badge over the content viewport.
                    </p>
                  </button>
                </div>
              </div>

              {/* Visible On: Shared Content / Video / Both */}
              <div>
                <label className="font-bold text-xs text-gray-300 block mb-2 uppercase tracking-wider">
                  Visible On (32.1)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'both', label: 'Both (Recommended)', desc: 'Screen Share & Video' },
                    { id: 'sharedContent', label: 'Shared Content Only', desc: 'Presentations & Screens' },
                    { id: 'video', label: 'Video Feeds Only', desc: 'Participant Cameras' },
                  ].map((target) => (
                    <button
                      key={target.id}
                      type="button"
                      onClick={() => setVisibleOn(target.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        visibleOn === target.id
                          ? 'border-indigo-500 bg-indigo-500/10 text-white'
                          : 'border-[#333] bg-[#242424] text-gray-400 hover:border-gray-600'
                      }`}
                    >
                      <span className="font-bold text-[11px] block">{target.label}</span>
                      <span className="text-[10px] text-gray-500">{target.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Identity Format: Masked Email / Full Email / Participant ID */}
              <div>
                <label className="font-bold text-xs text-gray-300 block mb-2 uppercase tracking-wider">
                  Participant Identity Format (32.1, 32.10)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'maskedEmail', label: 'Masked Email', sample: 'kv***@gmail.com (Privacy)' },
                    { id: 'email', label: 'Full Email', sample: 'kvasanthan@gmail.com' },
                    { id: 'participantId', label: 'Participant ID', sample: 'USR-8942-X' },
                  ].map((idOption) => (
                    <button
                      key={idOption.id}
                      type="button"
                      onClick={() => setIdentityType(idOption.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        identityType === idOption.id
                          ? 'border-indigo-500 bg-indigo-500/10 text-white'
                          : 'border-[#333] bg-[#242424] text-gray-400 hover:border-gray-600'
                      }`}
                    >
                      <span className="font-bold text-[11px] block">{idOption.label}</span>
                      <span className="text-[10px] text-gray-500 font-mono truncate block">{idOption.sample}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Opacity Slider */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-xs text-gray-300 uppercase tracking-wider">
                    Watermark Opacity: {opacity}%
                  </label>
                  <span className="text-[10px] text-gray-400">Subtle yet legible (10% - 80%)</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="80"
                  step="5"
                  value={opacity}
                  onChange={(e) => setOpacity(Number(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer h-2 bg-gray-700 rounded-lg"
                />
              </div>

              {/* ── Live Interactive Preview Window ── */}
              <div>
                <label className="font-bold text-xs text-gray-300 block mb-2 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Real-Time Watermark Preview</span>
                </label>
                <div className="relative h-44 rounded-2xl border border-gray-700 bg-gradient-to-br from-[#1E293B] via-[#0F172A] to-[#0A0E17] overflow-hidden shadow-inner flex flex-col justify-between p-4">
                  {/* Mock Shared Content Underneath */}
                  <div className="space-y-2 pointer-events-none select-none opacity-80">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-mono text-[9px] font-bold">
                        CONFIDENTIAL PRESENTATION
                      </span>
                      <span className="text-[10px] text-gray-400 font-medium">Q4 Engineering Roadmap & Budget</span>
                    </div>
                    <div className="w-3/4 h-2.5 bg-gray-700/80 rounded"></div>
                    <div className="w-1/2 h-2.5 bg-gray-700/60 rounded"></div>
                    <div className="w-5/6 h-2.5 bg-gray-700/40 rounded"></div>
                  </div>

                  <div className="text-[10px] text-gray-500 self-end">
                    Viewing as: <span className="text-gray-300 font-mono font-bold">{previewIdentity}</span>
                  </div>

                  {/* Watermark Overlay in action */}
                  <WatermarkOverlay
                    enabled={visualEnabled}
                    mode={visualMode}
                    visibleOn={visibleOn}
                    containerType="sharedContent"
                    opacity={opacity}
                    identity={previewIdentity}
                    subtext="INTELLIMEET SECURE"
                  />
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ── Tab 2: Audio Watermark ── */}
        {activeTab === 'audio' && (
          <div className="p-6 space-y-6 max-h-[65vh] overflow-y-auto custom-scrollbar">
            
            {/* Enable Audio Watermark Master Toggle */}
            <div className="flex items-center justify-between p-4 bg-[#262626] border border-[#3A3A3A] rounded-2xl">
              <div>
                <span className="font-bold text-sm text-white block mb-0.5">Enable Inaudible Audio Watermark</span>
                <p className="text-[11px] text-gray-400">
                  Embeds a participant-specific inaudible acoustic signature into audio played through the participant's speakers.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={audioEnabled} 
                  onChange={(e) => setAudioEnabled(e.target.checked)}
                  disabled={!isHostOrCoHost}
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {/* Architecture Explanation (Zoom Parity Callout) */}
            <div className="p-4 bg-indigo-950/30 border border-indigo-500/30 rounded-2xl space-y-2 text-xs leading-relaxed text-gray-300">
              <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs">
                <Shield className="w-4 h-4 text-indigo-400" />
                <span>Section 32.2 & 32.5: Ultrasonic Steganography Principles</span>
              </div>
              <p>
                The audio watermark is modulated into an inaudible ultrasonic frequency band (18.5 kHz) played directly through receiving endpoints.
              </p>
              <div className="p-2.5 bg-black/40 rounded-xl border border-white/5 font-mono text-[11px] text-amber-300">
                <strong>Important distinction:</strong> Direct local/cloud recordings made through IntelliMeet do NOT contain this audio watermark. It is designed specifically to trace external microphone recordings (e.g. smartphone recordings of loudspeaker audio).
              </div>
            </div>

            {/* Registered Signatures Table */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-xs text-gray-300 uppercase tracking-wider">
                  Active Participant Acoustic Signatures (Registry)
                </span>
                <span className="text-[10px] text-gray-400">
                  {watermarkSettings.audioSignatures?.length || 0} Registered
                </span>
              </div>

              {watermarkSettings.audioSignatures && watermarkSettings.audioSignatures.length > 0 ? (
                <div className="border border-[#333] rounded-2xl overflow-hidden divide-y divide-[#2A2A2A] bg-[#222]">
                  {watermarkSettings.audioSignatures.map((sig, idx) => (
                    <div key={idx} className="p-3 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-gray-200 flex items-center gap-1.5">
                          <span>{sig.participantName}</span>
                          <span className="text-[10px] text-gray-500">({sig.participantEmail})</span>
                        </div>
                        <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                          Carrier: {sig.frequencyBand || 18500} Hz · Status: <span className="text-emerald-400 font-bold">{sig.status}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-indigo-300 bg-indigo-950/60 border border-indigo-500/40 px-2.5 py-1 rounded-lg">
                          {sig.signatureId}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(sig.signatureId, `sig-${idx}`)}
                          className="text-gray-400 hover:text-white p-1 rounded hover:bg-white/5"
                          title="Copy Signature ID"
                        >
                          {copiedId === `sig-${idx}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 bg-[#222] border border-[#333] rounded-2xl text-center text-gray-400 text-xs">
                  No active audio signatures registered yet. Signatures are assigned as participants connect audio.
                </div>
              )}
            </div>

          </div>
        )}

        {/* ── Tab 3: Forensic Leak Tracer (32.7) ── */}
        {activeTab === 'tracer' && (
          <div className="p-6 space-y-6 max-h-[65vh] overflow-y-auto custom-scrollbar">
            
            <div className="p-4 bg-[#252525] border border-amber-500/30 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Forensic Audio Leak Identification (Section 32.7)</span>
              </div>
              <p className="text-[11px] text-gray-300">
                If an unauthorized audio recording of this meeting surfaces, input the detected acoustic watermark signature to trace the exact viewing participant whose speakers captured the leak.
              </p>
            </div>

            {/* Tracer Search Form */}
            <form onSubmit={handleRunForensicTrace} className="space-y-4">
              <div>
                <label className="font-bold text-xs text-gray-300 block mb-1.5 uppercase tracking-wider">
                  Extracted Signature Marker or Token:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. SIG-A8F2-9901"
                    value={tracerSignatureInput}
                    onChange={(e) => setTracerSignatureInput(e.target.value)}
                    className="flex-1 bg-[#1A1A1A] border border-[#444] rounded-xl px-3.5 py-2 font-mono text-xs text-white focus:border-indigo-500 outline-none uppercase tracking-wider"
                  />
                  <button
                    type="submit"
                    disabled={isTracing}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold flex items-center gap-2 shadow-md transition-all shrink-0"
                  >
                    {isTracing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Analyzing...</span>
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4" />
                        <span>Trace Leaker</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Quick Paste from Current Meeting Signatures */}
              {watermarkSettings.audioSignatures && watermarkSettings.audioSignatures.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                  <span className="text-gray-400 font-semibold">Test with active meeting signature:</span>
                  {watermarkSettings.audioSignatures.map((sig, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setTracerSignatureInput(sig.signatureId)}
                      className="px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/10 text-indigo-300 font-mono border border-white/5"
                    >
                      {sig.signatureId} ({sig.participantName.split(' ')[0]})
                    </button>
                  ))}
                </div>
              )}
            </form>

            {/* Trace Result Output Card */}
            {traceResult && (
              <div className="p-4 bg-emerald-950/30 border border-emerald-500/40 rounded-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-3 border-b border-emerald-500/20">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Cryptographic Match Confirmed (Confidence: {traceResult.confidenceScore})</span>
                  </div>
                  <span className="text-[10px] text-gray-400 font-mono">
                    Incident ID: {traceResult.forensicReport?.incidentId}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase font-bold">Identified Participant:</span>
                    <span className="font-bold text-white text-sm">{traceResult.leakedParticipant?.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase font-bold">Email Address:</span>
                    <span className="font-mono text-gray-200">{traceResult.leakedParticipant?.email}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase font-bold">Matched Signature Token:</span>
                    <span className="font-mono font-bold text-indigo-400">{traceResult.leakedParticipant?.signatureId}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase font-bold">Carrier Steganography Band:</span>
                    <span className="font-mono text-gray-200">{traceResult.leakedParticipant?.carrierFrequency}</span>
                  </div>
                </div>

                <div className="p-3 bg-black/40 rounded-xl text-[11px] text-gray-300 leading-relaxed font-mono">
                  {traceResult.forensicReport?.detectionSummary}
                </div>
              </div>
            )}

          </div>
        )}

        {/* ── Modal Footer ── */}
        <div className="p-4 bg-[#232323] flex items-center justify-between">
          <div className="text-[11px] text-gray-400">
            {isHostOrCoHost ? (
              <span className="text-emerald-400">Host authorized to modify live security watermark policies</span>
            ) : (
              <span className="text-amber-400">View-only mode: Only hosts can modify watermark configuration</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-semibold"
            >
              Cancel
            </button>
            {isHostOrCoHost && (
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-1.5"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Apply Watermark Settings</span>
                )}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
