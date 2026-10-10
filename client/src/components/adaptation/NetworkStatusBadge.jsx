import React from 'react';
import { Wifi, AlertTriangle, Activity, Battery, BatteryCharging, Zap } from 'lucide-react';

export default function NetworkStatusBadge({ networkStats, deviceStats, mediaProfile, onClick }) {
  const { latency = 35, packetLoss = 0, quality = 'EXCELLENT' } = networkStats || {};
  const { batteryLevel = 100, isCharging = true } = deviceStats || {};
  const { mode = 'AUTO', videoResolution = '720p', audioPriority = false } = mediaProfile || {};

  const getQualityStyles = () => {
    switch (quality) {
      case 'EXCELLENT':
        return {
          textColor: 'text-emerald-400',
          borderColor: 'border-emerald-500/30',
          bgColor: 'bg-emerald-500/10 hover:bg-emerald-500/20',
          dotColor: 'bg-emerald-400',
          label: 'Good'
        };
      case 'GOOD':
        return {
          textColor: 'text-green-400',
          borderColor: 'border-green-500/30',
          bgColor: 'bg-green-500/10 hover:bg-green-500/20',
          dotColor: 'bg-green-400',
          label: 'Normal'
        };
      case 'FAIR':
        return {
          textColor: 'text-amber-400',
          borderColor: 'border-amber-500/30',
          bgColor: 'bg-amber-500/10 hover:bg-amber-500/20',
          dotColor: 'bg-amber-400',
          label: 'Unstable'
        };
      case 'POOR':
        return {
          textColor: 'text-orange-400',
          borderColor: 'border-orange-500/40',
          bgColor: 'bg-orange-500/15 hover:bg-orange-500/25',
          dotColor: 'bg-orange-400 animate-pulse',
          label: 'Poor'
        };
      case 'CRITICAL':
      default:
        return {
          textColor: 'text-red-400',
          borderColor: 'border-red-500/50',
          bgColor: 'bg-red-500/20 hover:bg-red-500/30',
          dotColor: 'bg-red-400 animate-ping',
          label: 'Critical'
        };
    }
  };

  const style = getQualityStyles();

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-2.5 py-1 rounded-xl border text-xs font-semibold backdrop-blur-md transition-all shadow-sm ${style.bgColor} ${style.borderColor} ${style.textColor}`}
      title={`Network Quality: ${quality} (${latency}ms RTT, ${packetLoss}% loss) • ${videoResolution} • Click for Health & Adaptation`}
    >
      {/* Signal Strength Dots / Wifi Icon */}
      <div className="flex items-end gap-0.5 h-3 w-3.5">
        <span className={`w-0.5 rounded-full ${latency < 450 ? style.dotColor : 'bg-gray-600'} h-1.5`} />
        <span className={`w-0.5 rounded-full ${latency < 280 ? style.dotColor : 'bg-gray-600'} h-2`} />
        <span className={`w-0.5 rounded-full ${latency < 160 ? style.dotColor : 'bg-gray-600'} h-2.5`} />
        <span className={`w-0.5 rounded-full ${latency < 80 ? style.dotColor : 'bg-gray-600'} h-3`} />
      </div>

      <span className="font-mono text-[11px]">{latency}ms</span>

      {/* Mode / Audio Priority Badge */}
      {mode === 'LOW_BANDWIDTH' && (
        <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1 py-0.2 rounded font-bold uppercase tracking-wider">
          LOW
        </span>
      )}
      {mode === 'AUDIO_ONLY' && (
        <span className="text-[9px] bg-blue-500/20 text-blue-300 px-1 py-0.2 rounded font-bold uppercase tracking-wider">
          AUDIO
        </span>
      )}
      {audioPriority && mode === 'AUTO' && (
        <span className="text-[9px] bg-orange-500/20 text-orange-300 px-1 py-0.2 rounded font-bold uppercase tracking-wider">
          AUDIO PRIORITY
        </span>
      )}

      {/* Battery low warning if < 25% */}
      {batteryLevel <= 25 && !isCharging && (
        <div className="flex items-center text-amber-400 pl-0.5" title={`Battery low: ${batteryLevel}%`}>
          <Battery className="w-3 h-3 animate-pulse" />
        </div>
      )}
    </button>
  );
}
