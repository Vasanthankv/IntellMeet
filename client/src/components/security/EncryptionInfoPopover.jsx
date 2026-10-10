import React, { useState } from 'react';
import { 
  Shield, Check, Lock, AlertTriangle, Copy, CheckCircle2, 
  X, RefreshCw, Smartphone, Laptop, Globe, Users, ArrowRight, ShieldCheck
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function EncryptionInfoPopover({
  isOpen,
  onClose,
  meetingTitle = 'Meeting',
  meetingId,
  encryptionData = {},
  isHostOrCoHost = false,
  onPromptSwitchEncryption,
  onVerifyCode
}) {
  const [verifyInput, setVerifyInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'verify' | 'endpoints' | 'matrix'

  if (!isOpen) return null;

  const encType = encryptionData?.type || 'ENHANCED';
  const isE2EE = encType === 'E2EE';
  const isPartial = !!encryptionData?.isPartialEncryption;
  const securityCode = encryptionData?.securityCode || '7492-1840-5921-3804';
  const endpoints = encryptionData?.endpointStatuses || [];

  const handleCopyCode = () => {
    navigator.clipboard.writeText(securityCode);
    setCopiedCode(true);
    toast.success('Security code copied to clipboard');
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    if (!verifyInput.trim()) return;
    setIsVerifying(true);
    try {
      await onVerifyCode(verifyInput.trim());
      setVerifyInput('');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="absolute top-full left-0 mt-2 w-88 sm:w-[420px] bg-[#1E1E1E] border border-[#3E3E3E] rounded-3xl shadow-2xl z-50 text-xs text-gray-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 divide-y divide-[#2E2E2E]">
      
      {/* ── Top Header Bar ── */}
      <div className="p-4 bg-[#262626] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shadow-inner ${
            isPartial 
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              : isE2EE 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                : 'bg-green-500/20 text-green-400 border border-green-500/30'
          }`}>
            {isPartial ? (
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            ) : isE2EE ? (
              <Lock className="w-5 h-5 text-emerald-400" />
            ) : (
              <Check className="w-5 h-5 text-green-400" />
            )}
          </div>
          <div>
            <h3 className="font-bold text-sm text-white tracking-wide flex items-center gap-2">
              <span>{isPartial ? 'Partial Encryption' : isE2EE ? 'End-to-End Encrypted' : 'Enhanced Encryption'}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                isPartial 
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                  : isE2EE 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                    : 'bg-green-500/20 text-green-300 border border-green-500/40'
              }`}>
                {isPartial ? '31.5 Warning' : isE2EE ? 'E2EE (31.3)' : 'AES-GCM (31.2)'}
              </span>
            </h3>
            <p className="text-[11px] text-gray-400 truncate max-w-[240px]">{meetingTitle}</p>
          </div>
        </div>

        <button 
          onClick={onClose}
          className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* ── Navigation Tabs ── */}
      <div className="flex border-b border-[#2E2E2E] bg-[#222] text-[11px] font-medium">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 py-2 text-center border-b-2 transition-colors ${
            activeTab === 'overview' ? 'border-primary-500 text-white font-bold bg-white/5' : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('verify')}
          className={`flex-1 py-2 text-center border-b-2 transition-colors ${
            activeTab === 'verify' ? 'border-primary-500 text-white font-bold bg-white/5' : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          Verify (31.6)
        </button>
        <button
          onClick={() => setActiveTab('endpoints')}
          className={`flex-1 py-2 text-center border-b-2 transition-colors ${
            activeTab === 'endpoints' ? 'border-primary-500 text-white font-bold bg-white/5' : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          Endpoints (31.7)
        </button>
        <button
          onClick={() => setActiveTab('matrix')}
          className={`flex-1 py-2 text-center border-b-2 transition-colors ${
            activeTab === 'matrix' ? 'border-primary-500 text-white font-bold bg-white/5' : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          Features (31.15)
        </button>
      </div>

      {/* ── Tab 1: Overview ── */}
      {activeTab === 'overview' && (
        <div className="p-4 space-y-4 max-h-[65vh] overflow-y-auto custom-scrollbar">
          
          {/* Warning Banner if Partial */}
          {isPartial && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-2.5 text-[11px] text-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-amber-300">Partial Encryption Detected:</span> One or more attendees joined via an unencrypted bridge or web browser client that cannot fulfill device-based E2EE key exchange.
              </div>
            </div>
          )}

          {/* Core Encryption Info Card */}
          <div className="bg-black/30 border border-white/5 rounded-2xl p-3.5 space-y-2.5">
            <div className="flex justify-between items-center py-1 border-b border-white/5">
              <span className="text-gray-400">Cipher Specification:</span>
              <span className="font-mono font-bold text-white">256-bit AES-GCM</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-white/5">
              <span className="text-gray-400">Key Management Model:</span>
              <span className={`font-semibold ${isE2EE ? 'text-emerald-400' : 'text-blue-400'}`}>
                {isE2EE ? 'Participant Devices (Zero-Knowledge)' : 'IntellMeet Cloud Infrastructure'}
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-white/5">
              <span className="text-gray-400">Key Version:</span>
              <span className="font-mono text-gray-300">v{encryptionData?.keyVersion || 1}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-gray-400">Secure Relay Route:</span>
              <span className="text-gray-300">IntellMeet Secure Mesh (US Region)</span>
            </div>
          </div>

          <p className="text-[11px] text-gray-400 leading-relaxed">
            {isE2EE 
              ? 'In End-to-End Encrypted mode, the meeting encryption keys are generated directly on participants\' devices. Even IntellMeet servers cannot decrypt your real-time audio, video, or shared screen.'
              : 'In Enhanced Encryption mode, real-time audio, video, and content are encrypted in transit using 256-bit AES-GCM. IntellMeet cloud infrastructure securely relays sessions while supporting full AI, recording, and transcript features.'}
          </p>

          {/* Host Toggle Option */}
          {isHostOrCoHost && (
            <div className="pt-2 border-t border-[#2E2E2E]">
              <button
                type="button"
                onClick={() => onPromptSwitchEncryption(isE2EE ? 'ENHANCED' : 'E2EE')}
                className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${
                  isE2EE 
                    ? 'bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30'
                    : 'bg-amber-500/20 hover:bg-amber-600 text-amber-300 hover:text-black border border-amber-500/40'
                }`}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{isE2EE ? 'Switch to Enhanced Encryption (Enable AI Features)' : 'Upgrade to End-to-End Encryption (E2EE)'}</span>
              </button>
            </div>
          )}

        </div>
      )}

      {/* ── Tab 2: Verify Security Code (31.6) ── */}
      {activeTab === 'verify' && (
        <div className="p-4 space-y-4 max-h-[65vh] overflow-y-auto custom-scrollbar">
          <div>
            <span className="text-[11px] font-bold text-gray-300 block mb-1">E2EE Cryptographic Security Code:</span>
            <div className="p-3 bg-black/40 border border-primary-500/30 rounded-2xl flex items-center justify-between">
              <span className="font-mono text-base font-bold text-primary-300 tracking-wider">
                {securityCode}
              </span>
              <button
                onClick={handleCopyCode}
                className="p-1.5 hover:bg-white/10 rounded-lg text-gray-300 hover:text-white transition-colors"
                title="Copy code"
              >
                {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="p-3 bg-primary-950/30 border border-primary-500/20 rounded-xl space-y-1.5 text-[11px] text-gray-300">
            <div className="font-bold text-primary-200">How to Verify Connection (Section 31.6):</div>
            <ol className="list-decimal pl-4 space-y-1">
              <li>The host reads the 16-character code aloud during the meeting.</li>
              <li>Attendees compare their displayed code with the spoken code.</li>
              <li>If the codes match identically, your session is verified to be secure against eavesdropping.</li>
            </ol>
          </div>

          <form onSubmit={handleVerifySubmit} className="space-y-3 pt-1">
            <div>
              <label className="block text-[11px] font-semibold text-gray-300 mb-1">
                Verify Code Match:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={verifyInput}
                  onChange={(e) => setVerifyInput(e.target.value)}
                  placeholder="Paste or enter code to verify"
                  className="flex-1 bg-[#282828] border border-[#444] rounded-xl px-3 py-2 text-xs font-mono text-white outline-none focus:border-primary-500"
                />
                <button
                  type="submit"
                  disabled={!verifyInput.trim() || isVerifying}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs transition-colors disabled:opacity-50"
                >
                  {isVerifying ? 'Checking...' : 'Verify'}
                </button>
              </div>
            </div>
          </form>

          {encryptionData?.verifiedParticipantsCount > 0 && (
            <div className="flex items-center gap-2 p-2.5 bg-emerald-950/30 border border-emerald-600/30 rounded-xl text-emerald-300 text-[11px]">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{encryptionData.verifiedParticipantsCount} participant(s) verified cryptographic match.</span>
            </div>
          )}
        </div>
      )}

      {/* ── Tab 3: Endpoints (31.7) ── */}
      {activeTab === 'endpoints' && (
        <div className="p-4 space-y-3 max-h-[65vh] overflow-y-auto custom-scrollbar">
          <div className="text-[11px] text-gray-400">
            <strong>Supported Clients (31.7):</strong> Desktop & Mobile apps support hardware-accelerated E2EE. Web browsers operate via secure TLS/AES-GCM WebRTC relay.
          </div>

          <div className="space-y-2">
            {endpoints.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-xs">
                Local client connected via Desktop App (E2EE Active)
              </div>
            ) : (
              endpoints.map((ep, idx) => (
                <div key={idx} className="p-2.5 bg-black/30 border border-white/5 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    {ep.clientType === 'MOBILE' ? (
                      <Smartphone className="w-4 h-4 text-blue-400" />
                    ) : ep.clientType === 'WEB_BROWSER' ? (
                      <Globe className="w-4 h-4 text-amber-400" />
                    ) : (
                      <Laptop className="w-4 h-4 text-emerald-400" />
                    )}
                    <div>
                      <div className="font-semibold text-gray-200">{ep.name}</div>
                      <div className="text-[10px] text-gray-400 font-mono">{ep.clientType}</div>
                    </div>
                  </div>

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    ep.encryptionStatus === 'E2EE'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : ep.encryptionStatus === 'PARTIAL'
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-blue-500/20 text-blue-300'
                  }`}>
                    {ep.encryptionStatus}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── Tab 4: Feature Compatibility Matrix (31.15) ── */}
      {activeTab === 'matrix' && (
        <div className="p-4 space-y-3 max-h-[65vh] overflow-y-auto custom-scrollbar">
          <div className="text-[11px] text-gray-400">
            Comparison of features under <strong>Enhanced Encryption</strong> vs <strong>End-to-End Encryption</strong> (Section 31.15):
          </div>

          <div className="bg-black/30 border border-white/5 rounded-2xl overflow-hidden text-[11px]">
            <table className="w-full text-left divide-y divide-white/5">
              <thead className="bg-white/5 text-gray-400 font-bold">
                <tr>
                  <th className="p-2.5">Feature</th>
                  <th className="p-2.5 text-center">Enhanced</th>
                  <th className="p-2.5 text-center">E2EE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-gray-300">
                <tr>
                  <td className="p-2 font-medium">256-bit AES-GCM Cipher</td>
                  <td className="p-2 text-center text-emerald-400 font-bold">✓</td>
                  <td className="p-2 text-center text-emerald-400 font-bold">✓</td>
                </tr>
                <tr>
                  <td className="p-2 font-medium">AI Meeting Summary & Notes</td>
                  <td className="p-2 text-center text-emerald-400 font-bold">✓</td>
                  <td className="p-2 text-center text-red-400 font-bold">✕</td>
                </tr>
                <tr>
                  <td className="p-2 font-medium">Live Speech Transcription</td>
                  <td className="p-2 text-center text-emerald-400 font-bold">✓</td>
                  <td className="p-2 text-center text-red-400 font-bold">✕</td>
                </tr>
                <tr>
                  <td className="p-2 font-medium">Cloud & Smart Recording</td>
                  <td className="p-2 text-center text-emerald-400 font-bold">✓</td>
                  <td className="p-2 text-center text-red-400 font-bold">✕</td>
                </tr>
                <tr>
                  <td className="p-2 font-medium">Interactive Whiteboard Studio</td>
                  <td className="p-2 text-center text-emerald-400 font-bold">✓</td>
                  <td className="p-2 text-center text-red-400 font-bold">✕</td>
                </tr>
                <tr>
                  <td className="p-2 font-medium">Meeting Polls & Quizzes</td>
                  <td className="p-2 text-center text-emerald-400 font-bold">✓</td>
                  <td className="p-2 text-center text-red-400 font-bold">✕</td>
                </tr>
                <tr>
                  <td className="p-2 font-medium">Web Browser Client Join</td>
                  <td className="p-2 text-center text-emerald-400 font-bold">✓</td>
                  <td className="p-2 text-center text-amber-400 font-semibold">Partial</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
