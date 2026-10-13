import React from 'react';
import { Shield } from 'lucide-react';

/**
 * Part 32: Visual Watermark Overlay Component (32.1, 32.10)
 * Overlays the VIEWING participant's identity (email / masked email / ID)
 * over shared content and/or participant video feeds to prevent and trace leaks.
 *
 * Props:
 *  - enabled (boolean): whether watermark is currently visible
 *  - mode ('single' | 'repeated'): pattern layout
 *  - visibleOn ('sharedContent' | 'video' | 'both'): scope target
 *  - containerType ('sharedContent' | 'video'): what this overlay is wrapping
 *  - opacity (number): 5 to 100
 *  - identity (string): e.g. "us***@example.com" or "user@example.com"
 *  - subtext (string, optional): e.g. "IntellMeet Confidential"
 */
export default function WatermarkOverlay({
  enabled = false,
  mode = 'repeated',
  visibleOn = 'both',
  containerType = 'sharedContent',
  opacity = 25,
  identity = 'participant@intellmeet.io',
  subtext = 'CONFIDENTIAL'
}) {
  if (!enabled) return null;

  // Check if watermark is enabled for this specific container type
  if (visibleOn !== 'both' && visibleOn !== containerType) {
    return null;
  }

  const opacityValue = Math.max(0.05, Math.min(0.9, opacity / 100));

  // 32.1: Single Watermark Mode (Subtle Center / Corner Stamp)
  if (mode === 'single') {
    return (
      <div 
        className="absolute inset-0 pointer-events-none select-none z-30 flex items-center justify-center overflow-hidden"
        style={{ opacity: opacityValue }}
      >
        <div className="flex flex-col items-center justify-center p-3 rounded-2xl border border-white/20 bg-black/10 backdrop-blur-[1px] transform -rotate-12 text-center shadow-lg">
          <div className="flex items-center gap-1.5 text-white/90 font-mono font-bold tracking-wider text-sm sm:text-base drop-shadow-md">
            <Shield className="w-4 h-4 text-white/80" />
            <span>{identity}</span>
          </div>
          <span className="text-[10px] tracking-widest text-white/70 font-semibold uppercase mt-0.5">
            {subtext}
          </span>
        </div>
      </div>
    );
  }

  // 32.1: Repeated Watermark Mode (Multi-Instance Diagonal Security Grid)
  // Generates repeated diagonal tiles across the viewport to prevent crop evasion
  const rows = [0, 1, 2, 3];
  const cols = [0, 1, 2, 3];

  return (
    <div 
      className="absolute inset-0 pointer-events-none select-none z-30 overflow-hidden"
      style={{ opacity: opacityValue }}
      aria-hidden="true"
    >
      <div className="w-[140%] h-[140%] -ml-[20%] -mt-[20%] grid grid-cols-4 grid-rows-4 transform -rotate-18">
        {rows.map((r) =>
          cols.map((c) => (
            <div 
              key={`${r}-${c}`} 
              className="flex flex-col items-center justify-center p-4 text-center transform hover:scale-105 transition-transform"
            >
              <div className="flex items-center gap-1.5 text-white font-mono font-bold tracking-wider text-xs sm:text-sm drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                <Shield className="w-3.5 h-3.5 text-white/80 shrink-0" />
                <span className="truncate max-w-[200px]">{identity}</span>
              </div>
              <span className="text-[9px] tracking-widest text-white/70 font-semibold uppercase drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
                {subtext}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
