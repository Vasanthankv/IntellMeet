import React, { useState } from 'react';
import { 
  Activity, Wifi, Laptop, Smartphone, Globe, Cpu, Battery, BatteryCharging, 
  ShieldCheck, AlertTriangle, CheckCircle2, Sliders, Volume2, Video, 
  ArrowDownUp, RefreshCw, X, Radio, Info, Headphones, Sparkles, Check
} from 'lucide-react';

export default function NetworkHealthModal({ 
  isOpen, 
  onClose, 
  networkStats, 
  deviceStats, 
  mediaProfile, 
  onSelectMode, 
  onSwitchAudioOnly 
}) {
  const [activeTab, setActiveTab] = useState('telemetry'); // 'telemetry' | 'device' | 'adaptation'

  if (!isOpen) return null;

  const {
    latency = 35,
    jitter = 4,
    packetLoss = 0.1,
    bandwidthUp = 4.8,
    bandwidthDown = 9.5,
    connectionType = 'WIFI',
    quality = 'EXCELLENT',
    history = [35, 38, 34, 36, 35]
  } = networkStats || {};

  const {
    operatingSystem = 'Windows',
    browser = 'Google Chrome',
    deviceType = 'DESKTOP',
    logicalCores = 8,
    deviceMemory = 8,
    batteryLevel = 100,
    isCharging = true
  } = deviceStats || {};

  const {
    videoResolution = '720p',
    frameRate = 30,
    audioPriority = false,
    effectsReduced = false,
    mode = 'AUTO'
  } = mediaProfile || {};

  const getQualityBadge = () => {
    switch (quality) {
      case 'EXCELLENT':
        return { label: 'Excellent Connection', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' };
      case 'GOOD':
        return { label: 'Good Connection', color: 'bg-green-500/20 text-green-400 border-green-500/40' };
      case 'FAIR':
        return { label: 'Fair / Fluctuating', color: 'bg-amber-500/20 text-amber-400 border-amber-500/40' };
      case 'POOR':
        return { label: 'Poor / High Latency', color: 'bg-orange-500/20 text-orange-400 border-orange-500/40' };
      case 'CRITICAL':
      default:
        return { label: 'Critical Packet Loss', color: 'bg-red-500/20 text-red-400 border-red-500/40' };
    }
  };

  const badge = getQualityBadge();

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#1A1A1A] text-white border border-[#333] rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2A2A2A] bg-[#202020]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-100 flex items-center gap-2">
                Device & Network Adaptation
                <span className="text-[10px] bg-blue-500/20 text-blue-300 font-semibold px-2 py-0.5 rounded-full border border-blue-500/30">
                  Part 38
                </span>
              </h2>
              <p className="text-xs text-gray-400">
                Real-time connection telemetry, hardware diagnostics & bandwidth optimization
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <span className={`px-2.5 py-1 text-xs font-bold rounded-xl border ${badge.color}`}>
              {badge.label}
            </span>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#2A2A2A] px-6 bg-[#181818] gap-4 text-xs font-semibold text-gray-400">
          <button
            onClick={() => setActiveTab('telemetry')}
            className={`py-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'telemetry' ? 'border-blue-500 text-blue-400' : 'border-transparent hover:text-gray-200'
            }`}
          >
            <Wifi className="w-4 h-4" /> Network Telemetry
          </button>
          <button
            onClick={() => setActiveTab('device')}
            className={`py-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'device' ? 'border-blue-500 text-blue-400' : 'border-transparent hover:text-gray-200'
            }`}
          >
            <Laptop className="w-4 h-4" /> Device & Hardware
          </button>
          <button
            onClick={() => setActiveTab('adaptation')}
            className={`py-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'adaptation' ? 'border-blue-500 text-blue-400' : 'border-transparent hover:text-gray-200'
            }`}
          >
            <Sliders className="w-4 h-4" /> Bandwidth Modes & Hysteresis
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">

          {/* TAB 1: NETWORK TELEMETRY */}
          {activeTab === 'telemetry' && (
            <div className="space-y-5">
              
              {/* Telemetry Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-[#222] border border-[#333] rounded-2xl p-3.5 space-y-1">
                  <div className="flex justify-between items-center text-gray-400 text-[11px] font-medium">
                    <span>Latency (RTT)</span>
                    <Radio className="w-3.5 h-3.5 text-blue-400" />
                  </div>
                  <div className="text-xl font-mono font-bold text-white">
                    {latency} <span className="text-xs text-gray-400 font-sans">ms</span>
                  </div>
                  <div className="text-[10px] text-emerald-400">
                    {latency < 80 ? 'Ideal for real-time video' : latency < 160 ? 'Acceptable' : 'Elevated delay'}
                  </div>
                </div>

                <div className="bg-[#222] border border-[#333] rounded-2xl p-3.5 space-y-1">
                  <div className="flex justify-between items-center text-gray-400 text-[11px] font-medium">
                    <span>Packet Loss</span>
                    <ArrowDownUp className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <div className="text-xl font-mono font-bold text-white">
                    {packetLoss} <span className="text-xs text-gray-400 font-sans">%</span>
                  </div>
                  <div className={`text-[10px] ${packetLoss < 1.0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {packetLoss < 1.0 ? '0 packet drops' : 'Minor packet retransmission'}
                  </div>
                </div>

                <div className="bg-[#222] border border-[#333] rounded-2xl p-3.5 space-y-1">
                  <div className="flex justify-between items-center text-gray-400 text-[11px] font-medium">
                    <span>Jitter</span>
                    <Activity className="w-3.5 h-3.5 text-indigo-400" />
                  </div>
                  <div className="text-xl font-mono font-bold text-white">
                    {jitter} <span className="text-xs text-gray-400 font-sans">ms</span>
                  </div>
                  <div className="text-[10px] text-gray-400">
                    Jitter buffer stable
                  </div>
                </div>

                <div className="bg-[#222] border border-[#333] rounded-2xl p-3.5 space-y-1">
                  <div className="flex justify-between items-center text-gray-400 text-[11px] font-medium">
                    <span>Downlink Bandwidth</span>
                    <Wifi className="w-3.5 h-3.5 text-green-400" />
                  </div>
                  <div className="text-xl font-mono font-bold text-white">
                    {bandwidthDown} <span className="text-xs text-gray-400 font-sans">Mbps</span>
                  </div>
                  <div className="text-[10px] text-emerald-400">
                    HD stream supported
                  </div>
                </div>

                <div className="bg-[#222] border border-[#333] rounded-2xl p-3.5 space-y-1">
                  <div className="flex justify-between items-center text-gray-400 text-[11px] font-medium">
                    <span>Uplink Bandwidth</span>
                    <Wifi className="w-3.5 h-3.5 text-blue-400" />
                  </div>
                  <div className="text-xl font-mono font-bold text-white">
                    {bandwidthUp} <span className="text-xs text-gray-400 font-sans">Mbps</span>
                  </div>
                  <div className="text-[10px] text-blue-400">
                    Camera & screen share OK
                  </div>
                </div>

                <div className="bg-[#222] border border-[#333] rounded-2xl p-3.5 space-y-1">
                  <div className="flex justify-between items-center text-gray-400 text-[11px] font-medium">
                    <span>Connection Type</span>
                    <Globe className="w-3.5 h-3.5 text-purple-400" />
                  </div>
                  <div className="text-base font-bold text-white truncate uppercase">
                    {connectionType}
                  </div>
                  <div className="text-[10px] text-purple-400">
                    WebRTC Peer Transport
                  </div>
                </div>
              </div>

              {/* Ping Sparkline */}
              <div className="bg-[#222] border border-[#333] rounded-2xl p-4 space-y-3">
                <div className="flex justify-between items-center text-xs text-gray-300">
                  <span className="font-semibold">Recent Ping Samples (Every 4s)</span>
                  <span className="font-mono text-[11px] text-gray-400">Avg: {Math.round(history.reduce((a, b) => a + b, 0) / (history.length || 1))}ms</span>
                </div>
                <div className="flex items-end gap-2 h-14 bg-[#181818] p-2 rounded-xl border border-[#2c2c2c]">
                  {history.map((pt, idx) => {
                    const heightPercent = Math.min(100, Math.max(15, (pt / 200) * 100));
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group relative">
                        <div 
                          className={`w-full rounded-t transition-all ${
                            pt < 80 ? 'bg-emerald-500' : pt < 160 ? 'bg-green-500' : pt < 280 ? 'bg-amber-500' : 'bg-red-500'
                          }`}
                          style={{ height: `${heightPercent}%` }}
                        />
                        <span className="opacity-0 group-hover:opacity-100 absolute -top-5 text-[9px] font-mono bg-black px-1 rounded text-white transition-opacity">
                          {pt}ms
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Troubleshooting Tips */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4 space-y-2 text-xs">
                <div className="flex items-center gap-2 font-bold text-blue-400">
                  <Info className="w-4 h-4" /> Network Quality Diagnosis
                </div>
                <p className="text-gray-300 leading-relaxed text-[11px]">
                  {latency > 250 
                    ? 'High round-trip delay detected. Move closer to your Wi-Fi access point or connect via Ethernet cable to ensure uninterrupted audio.'
                    : 'Your network latency is well within the recommended threshold for high-definition video conferencing and zero-jitter multi-party audio.'}
                </p>
              </div>

            </div>
          )}

          {/* TAB 2: DEVICE & HARDWARE */}
          {activeTab === 'device' && (
            <div className="space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                {/* Client Environment */}
                <div className="bg-[#222] border border-[#333] rounded-2xl p-4 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                    <Laptop className="w-4 h-4 text-blue-400" /> Platform & Environment
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-[#333]">
                      <span className="text-gray-400">Device Category:</span>
                      <span className="font-bold text-white uppercase">{deviceType}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#333]">
                      <span className="text-gray-400">Operating System:</span>
                      <span className="font-semibold text-white">{operatingSystem}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#333]">
                      <span className="text-gray-400">Browser Client:</span>
                      <span className="font-semibold text-white">{browser}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-gray-400">Hardware Cores:</span>
                      <span className="font-mono text-white">{logicalCores} CPU Threads</span>
                    </div>
                  </div>
                </div>

                {/* Battery & Power Status (Section 38.6) */}
                <div className="bg-[#222] border border-[#333] rounded-2xl p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                      {isCharging ? <BatteryCharging className="w-4 h-4 text-emerald-400" /> : <Battery className="w-4 h-4 text-amber-400" />} 
                      Power & Battery
                    </h4>
                    {isCharging && (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full">
                        AC Connected
                      </span>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-end">
                      <span className="text-2xl font-mono font-black text-white">{batteryLevel}%</span>
                      <span className="text-xs text-gray-400">{isCharging ? 'Charging' : 'On Battery Power'}</span>
                    </div>
                    <div className="w-full bg-[#181818] h-3 rounded-full overflow-hidden p-0.5 border border-[#333]">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          batteryLevel > 40 ? 'bg-emerald-500' : batteryLevel > 20 ? 'bg-amber-500' : 'bg-red-500 animate-pulse'
                        }`}
                        style={{ width: `${batteryLevel}%` }}
                      />
                    </div>
                    {batteryLevel <= 20 && !isCharging && (
                      <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-[10px] text-amber-300">
                        ⚠️ Battery low: Low-Bandwidth Mode recommended to save CPU and prolong battery life.
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* Hardware Sensors Check */}
              <div className="bg-[#222] border border-[#333] rounded-2xl p-4 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Connected Peripherals & Media Devices
                </h4>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="bg-[#1A1A1A] p-3 rounded-xl border border-[#2c2c2c] flex items-center gap-2.5">
                    <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg">
                      <Volume2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-white">Microphone</div>
                      <div className="text-[10px] text-emerald-400">Ready & Bound</div>
                    </div>
                  </div>

                  <div className="bg-[#1A1A1A] p-3 rounded-xl border border-[#2c2c2c] flex items-center gap-2.5">
                    <div className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg">
                      <Video className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-white">Camera</div>
                      <div className="text-[10px] text-blue-400">Available</div>
                    </div>
                  </div>

                  <div className="bg-[#1A1A1A] p-3 rounded-xl border border-[#2c2c2c] flex items-center gap-2.5">
                    <div className="p-1.5 bg-purple-500/20 text-purple-400 rounded-lg">
                      <Headphones className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-white">Speaker / Audio</div>
                      <div className="text-[10px] text-purple-400">System Audio</div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: BANDWIDTH MODES & HYSTERESIS */}
          {activeTab === 'adaptation' && (
            <div className="space-y-5">
              
              {/* Active Profile Status Banner */}
              <div className="bg-[#222] border border-[#333] rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-400 font-medium">Current Active Media Resolution</div>
                  <div className="text-lg font-bold text-white flex items-center gap-2 mt-0.5">
                    {mode === 'AUDIO_ONLY' ? 'Audio-Only Mode (0kbps video)' : `${videoResolution} @ ${frameRate}fps`}
                    {audioPriority && (
                      <span className="text-[10px] bg-orange-500/20 text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded-full font-bold">
                        Audio Priority Active
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Adaptation Engine</div>
                  <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 justify-end">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Hysteresis Active
                  </div>
                </div>
              </div>

              {/* Mode Selection Cards (Section 38.4) */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block px-1">
                  Choose Participation Mode
                </span>

                {/* Option 1: Auto */}
                <button
                  onClick={() => onSelectMode('AUTO')}
                  className={`w-full p-3.5 rounded-2xl border text-left flex items-start justify-between transition-all ${
                    mode === 'AUTO' 
                      ? 'bg-blue-600/15 border-blue-500 shadow-sm' 
                      : 'bg-[#222] border-[#333] hover:bg-[#282828]'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="font-bold text-sm text-white flex items-center gap-2">
                      <span>Automatic Adaptive Scaling</span>
                      <span className="text-[10px] bg-blue-500 text-white font-extrabold px-1.5 py-0.5 rounded uppercase">
                        Recommended
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      Automatically adjusts resolution (1080p &rarr; 720p &rarr; 480p &rarr; 360p) based on real-time network health. Uses hysteresis stabilization before upgrading to avoid stream flickering.
                    </p>
                  </div>
                  {mode === 'AUTO' && <Check className="w-5 h-5 text-blue-400 shrink-0 mt-1" />}
                </button>

                {/* Option 2: Standard HD */}
                <button
                  onClick={() => onSelectMode('STANDARD')}
                  className={`w-full p-3.5 rounded-2xl border text-left flex items-start justify-between transition-all ${
                    mode === 'STANDARD' 
                      ? 'bg-blue-600/15 border-blue-500 shadow-sm' 
                      : 'bg-[#222] border-[#333] hover:bg-[#282828]'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="font-bold text-sm text-white">Standard HD Video & Audio</div>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      Locks camera at 720p/1080p @ 30fps. Best for high-speed fiber or unmetered Wi-Fi connections.
                    </p>
                  </div>
                  {mode === 'STANDARD' && <Check className="w-5 h-5 text-blue-400 shrink-0 mt-1" />}
                </button>

                {/* Option 3: Low-Bandwidth Mode */}
                <button
                  onClick={() => onSelectMode('LOW_BANDWIDTH')}
                  className={`w-full p-3.5 rounded-2xl border text-left flex items-start justify-between transition-all ${
                    mode === 'LOW_BANDWIDTH' 
                      ? 'bg-amber-600/15 border-amber-500 shadow-sm' 
                      : 'bg-[#222] border-[#333] hover:bg-[#282828]'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="font-bold text-sm text-white flex items-center gap-2">
                      <span>Low-Bandwidth Mode</span>
                      <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded font-bold">
                        Saves Data & Battery
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      Scales video to 360p @ 15fps, pauses heavy background blur effects, and guarantees audio receives 100% bandwidth priority.
                    </p>
                  </div>
                  {mode === 'LOW_BANDWIDTH' && <Check className="w-5 h-5 text-amber-400 shrink-0 mt-1" />}
                </button>

                {/* Option 4: Audio-Only */}
                <button
                  onClick={() => onSelectMode('AUDIO_ONLY')}
                  className={`w-full p-3.5 rounded-2xl border text-left flex items-start justify-between transition-all ${
                    mode === 'AUDIO_ONLY' 
                      ? 'bg-purple-600/15 border-purple-500 shadow-sm' 
                      : 'bg-[#222] border-[#333] hover:bg-[#282828]'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="font-bold text-sm text-white flex items-center gap-2">
                      <span>Audio-Only Mode</span>
                      <span className="text-[10px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded font-bold">
                        Weak 2G/3G Ready
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      Suspends sending and receiving video. Keeps speech completely fluent even under extreme network congestion.
                    </p>
                  </div>
                  {mode === 'AUDIO_ONLY' && <Check className="w-5 h-5 text-purple-400 shrink-0 mt-1" />}
                </button>
              </div>

              {/* Emergency Action */}
              <div className="pt-2">
                <button
                  onClick={() => {
                    onSelectMode('AUDIO_ONLY');
                    if (onSwitchAudioOnly) onSwitchAudioOnly();
                  }}
                  className="w-full py-3 bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/40 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md"
                >
                  <Headphones className="w-4 h-4 text-red-400" />
                  Emergency: Drop Video & Switch to Audio-Only
                </button>
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-[#2A2A2A] bg-[#181818] flex items-center justify-between text-xs text-gray-400">
          <span>IntellMeet Adaptation Protocol v1.4</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-all"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
}
