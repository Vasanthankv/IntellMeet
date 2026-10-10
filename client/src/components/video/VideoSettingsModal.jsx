import React from 'react';
import { 
  X, Video, Settings, Camera, Sliders, Check, 
  Sparkles, Sun, Eye, Shield 
} from 'lucide-react';

export default function VideoSettingsModal({
  isOpen,
  onClose,
  videoInputs = [],
  selectedCamera = 'default',
  onSelectCamera,
  stream,
  isVideoOn = true,
  videoSettings = {
    aspectRatio: '16:9',
    hd: true,
    mirror: true,
    lowLight: true,
    touchUp: false,
    touchUpLevel: 50
  },
  onUpdateVideoSettings,
  onOpenBackgroundEffects
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#1F1F1F] text-white border border-[#3A3A3A] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#333]">
          <div className="flex items-center gap-2">
            <Video className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold text-base">Settings — Video & Effects</h3>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-gray-200">
          
          {/* Live Preview & Camera Dropdown */}
          <div className="space-y-3 pb-5 border-b border-[#2C2C2C]">
            <div className="w-full max-w-md mx-auto aspect-video bg-[#2A2A2A] rounded-xl overflow-hidden border border-[#444] shadow-md flex items-center justify-center relative">
              {isVideoOn && stream ? (
                <video
                  ref={(vid) => {
                    if (vid && stream) vid.srcObject = stream;
                  }}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${
                    videoSettings.mirror ? 'scale-x-[-1]' : ''
                  }`}
                  style={{
                    filter: videoSettings.touchUp ? 'blur(0.4px) contrast(95%) brightness(105%)' : ''
                  }}
                />
              ) : (
                <div className="text-gray-400 flex flex-col items-center gap-1.5">
                  <Camera className="w-8 h-8 opacity-40" />
                  <span>Camera is turned off</span>
                </div>
              )}
              <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-0.5 rounded text-[10px] text-white backdrop-blur-sm">
                Video Preview
              </div>
            </div>

            <div className="space-y-1.5 max-w-md mx-auto">
              <label className="text-gray-400 font-medium">Camera Selection:</label>
              <select
                value={selectedCamera}
                onChange={(e) => onSelectCamera(e.target.value)}
                className="w-full bg-[#2A2A2A] border border-[#444] rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500"
              >
                <option value="default">Default - System Integrated Camera</option>
                {videoInputs.map((cam) => (
                  <option key={cam.deviceId} value={cam.deviceId}>
                    {cam.label || `Camera (${cam.deviceId.slice(0, 8)})`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Aspect & Video Quality Options */}
          <div className="space-y-3 pb-5 border-b border-[#2C2C2C]">
            <h4 className="text-sm font-semibold text-white">Camera Aspect & Resolution</h4>
            
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="aspectRatio"
                  checked={videoSettings.aspectRatio === '16:9'}
                  onChange={() => onUpdateVideoSettings('aspectRatio', '16:9')}
                  className="accent-blue-600"
                />
                <span>16:9 (Widescreen)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="aspectRatio"
                  checked={videoSettings.aspectRatio === 'original'}
                  onChange={() => onUpdateVideoSettings('aspectRatio', 'original')}
                  className="accent-blue-600"
                />
                <span>Original ratio</span>
              </label>
            </div>

            <div className="pt-2 space-y-2">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={videoSettings.hd}
                  onChange={(e) => onUpdateVideoSettings('hd', e.target.checked)}
                  className="accent-blue-600 rounded"
                />
                <span>Enable HD video stream (720p / 1080p)</span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={videoSettings.mirror}
                  onChange={(e) => onUpdateVideoSettings('mirror', e.target.checked)}
                  className="accent-blue-600 rounded"
                />
                <span>Mirror my video</span>
              </label>
            </div>
          </div>

          {/* Video Enhancements & Appearance */}
          <div className="space-y-3 pb-5 border-b border-[#2C2C2C]">
            <h4 className="text-sm font-semibold text-white">Video Enhancements</h4>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={videoSettings.lowLight}
                onChange={(e) => onUpdateVideoSettings('lowLight', e.target.checked)}
                className="accent-blue-600 rounded"
              />
              <span>Adjust for low light (Auto exposure & noise reduction)</span>
            </label>

            <div className="space-y-2 pt-1">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={videoSettings.touchUp}
                  onChange={(e) => onUpdateVideoSettings('touchUp', e.target.checked)}
                  className="accent-blue-600 rounded"
                />
                <span>Touch up my appearance (Soft focus / skin smoothing)</span>
              </label>

              {videoSettings.touchUp && (
                <div className="flex items-center gap-3 pl-6 pt-1">
                  <span className="text-gray-400">Level:</span>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={videoSettings.touchUpLevel}
                    onChange={(e) => onUpdateVideoSettings('touchUpLevel', Number(e.target.value))}
                    className="flex-1 accent-blue-600 h-1.5 bg-[#333] rounded-lg cursor-pointer"
                  />
                  <span className="w-8 text-right font-mono text-gray-400">{videoSettings.touchUpLevel}%</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick link to Virtual Backgrounds */}
          <div className="bg-[#181818] p-4 rounded-xl border border-[#333] flex items-center justify-between">
            <div>
              <h5 className="font-semibold text-white text-xs">Background & Video Effects</h5>
              <p className="text-[11px] text-gray-400">Configure virtual backgrounds, custom wallpapers, and fun avatars.</p>
            </div>
            <button
              onClick={() => {
                onClose();
                onOpenBackgroundEffects();
              }}
              className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/40 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Configure Effects
            </button>
          </div>

        </div>

        {/* Footer */}
        <div className="flex justify-end px-6 py-3.5 border-t border-[#333] bg-[#181818]">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl text-xs transition-colors"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
}
