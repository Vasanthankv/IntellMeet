import React from 'react';
import { Radio } from 'lucide-react';

/**
 * 33.13 Live Streaming Branding Watermark
 * Separate from #32 Participant Security Watermark.
 * This overlay appears on the external livestream broadcast (bottom-right)
 * to brand the public broadcast with the organization logo or "Powered by IntelliMeet".
 */
const LiveStreamingWatermarkOverlay = ({
  branding = {
    watermarkEnabled: true,
    brandText: 'Powered by IntelliMeet',
    position: 'bottom-right'
  },
  isLive = false
}) => {
  if (!branding?.watermarkEnabled) return null;

  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4'
  }[branding.position || 'bottom-right'];

  return (
    <div
      className={`absolute ${positionClasses} z-40 pointer-events-none select-none flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-white shadow-xl animate-fade-in`}
    >
      <div className="flex items-center gap-1.5">
        {isLive && (
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
        )}
        <Radio className="w-3.5 h-3.5 text-blue-400" />
      </div>
      <div className="flex flex-col text-left">
        <span className="text-[11px] font-bold tracking-wider uppercase text-gray-200">
          {branding.brandText || 'Powered by IntelliMeet'}
        </span>
        <span className="text-[9px] text-gray-400 font-medium">
          Live Broadcast
        </span>
      </div>
    </div>
  );
};

export default LiveStreamingWatermarkOverlay;
