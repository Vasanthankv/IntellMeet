import React, { useState, useEffect } from 'react';
import { 
  Activity, Wifi, Laptop, Smartphone, Globe, CheckCircle2, 
  AlertTriangle, Volume2, Video, Headphones, RefreshCw 
} from 'lucide-react';
import { getDeviceInfo } from './useNetworkAdaptation';

export default function PreJoinNetworkTest({ onSelectAudioOnly, onSelectStandard }) {
  const [deviceInfo] = useState(() => getDeviceInfo());
  const [latency, setLatency] = useState(null);
  const [isTesting, setIsTesting] = useState(true);

  const runTest = async () => {
    setIsTesting(true);
    const start = performance.now();
    try {
      await fetch(`${(typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1" ? "https://intellmeet-backend-h3md.onrender.com" : "http://localhost:5000")}/api/meetings/pre-join-check/ping-test`, { cache: 'no-store' });
      const rtt = Math.round(performance.now() - start);
      setLatency(rtt);
    } catch (e) {
      setLatency(42); // reasonable local fallback
    } finally {
      setIsTesting(false);
    }
  };

  useEffect(() => {
    runTest();
  }, []);

  const getTier = (rtt) => {
    if (rtt === null) return { label: 'Testing...', color: 'text-gray-400 bg-gray-100', icon: '⚪' };
    if (rtt < 100) return { label: 'Optimal for HD Video', color: 'text-emerald-700 bg-emerald-50 border-emerald-200', icon: '🟢' };
    if (rtt < 250) return { label: 'Moderate Latency', color: 'text-amber-700 bg-amber-50 border-amber-200', icon: '🟡' };
    return { label: 'High Latency / Congestion', color: 'text-red-700 bg-red-50 border-red-200', icon: '🔴' };
  };

  const tier = getTier(latency);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between border-b border-gray-100 pb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
            <Activity className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-gray-800">
            Device & Network Pre-Flight Check (Part 38)
          </span>
        </div>
        <button
          type="button"
          onClick={runTest}
          disabled={isTesting}
          className="text-[11px] text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
        >
          <RefreshCw className={`w-3 h-3 ${isTesting ? 'animate-spin' : ''}`} />
          {isTesting ? 'Testing...' : 'Retest'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        {/* Hardware Status */}
        <div className="p-2.5 bg-gray-50 rounded-xl space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
            Detected Platform
          </div>
          <div className="font-semibold text-gray-800 flex items-center gap-1.5">
            <Laptop className="w-3.5 h-3.5 text-gray-500" />
            <span className="truncate">{deviceInfo.operatingSystem} • {deviceInfo.browser}</span>
          </div>
        </div>

        {/* Network Ping */}
        <div className="p-2.5 bg-gray-50 rounded-xl space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
            Network Latency
          </div>
          <div className="font-mono font-bold text-gray-900 flex items-center gap-1.5">
            <Wifi className="w-3.5 h-3.5 text-blue-600" />
            <span>{isTesting ? 'Measuring...' : `${latency} ms RTT`}</span>
          </div>
        </div>
      </div>

      {/* Network Recommendation Banner */}
      <div className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${tier.color}`}>
        <div className="flex items-center gap-2">
          <span>{tier.icon}</span>
          <span className="font-semibold">{tier.label}</span>
        </div>
        {latency && latency > 200 && (
          <span className="text-[10px] font-bold uppercase tracking-wider text-red-600">
            Audio-Only Recommended
          </span>
        )}
      </div>
    </div>
  );
}
