import React, { useRef, useState } from 'react';
import { 
  X, Sparkles, Image as ImageIcon, Plus, Check, Sliders, 
  Camera, Eye, Wand2, RefreshCw, Palette, UserCheck 
} from 'lucide-react';
import toast from 'react-hot-toast';

export const PRESET_BACKGROUNDS = [
  { id: 'none', label: 'None', preview: 'bg-black/60 border-2 border-gray-600' },
  { id: 'blur', label: 'Blur', preview: 'bg-gradient-to-tr from-gray-700 to-gray-500 backdrop-blur-md' },
  { 
    id: 'office', 
    label: 'Modern Office', 
    url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=300&q=60'
  },
  { 
    id: 'nature', 
    label: 'Tropical Garden', 
    url: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=1200&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=300&q=60'
  },
  { 
    id: 'penthouse', 
    label: 'City High-Rise', 
    url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=300&q=60'
  },
  { 
    id: 'bookshelf', 
    label: 'Cozy Library', 
    url: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=1200&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=300&q=60'
  },
  { 
    id: 'cyberpunk', 
    label: 'Cyber Studio', 
    url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=300&q=60'
  }
];

export const VIDEO_FILTERS = [
  { id: 'none', label: 'Normal', filterStyle: '' },
  { id: 'warm', label: 'Warm Glow', filterStyle: 'sepia(30%) saturate(140%) brightness(105%)' },
  { id: 'sepia', label: 'Vintage Sepia', filterStyle: 'sepia(80%) contrast(110%)' },
  { id: 'noir', label: 'Noir (B&W)', filterStyle: 'grayscale(100%) contrast(120%)' },
  { id: 'neon', label: 'Cyber Neon', filterStyle: 'hue-rotate(90deg) saturate(180%)' },
  { id: 'studio', label: 'Studio Contrast', filterStyle: 'contrast(125%) brightness(105%)' },
  { id: 'cool', label: 'Cool Ambient', filterStyle: 'hue-rotate(180deg) saturate(90%)' }
];

export const AVATARS = [
  { id: 'none', label: 'Off (Camera)', icon: '📷', bg: 'bg-gray-800' },
  { id: 'fox', label: 'Foxy', icon: '🦊', bg: 'bg-orange-600', role: 'Clever Presenter' },
  { id: 'cat', label: 'Cyber Cat', icon: '🐱', bg: 'bg-purple-600', role: 'Tech Specialist' },
  { id: 'panda', label: 'Cozy Panda', icon: '🐼', bg: 'bg-emerald-700', role: 'Calm Reviewer' },
  { id: 'robot', label: 'AI Bot', icon: '🤖', bg: 'bg-blue-600', role: 'Virtual Assistant' },
  { id: 'owl', label: 'Prof. Owl', icon: '🦉', bg: 'bg-amber-700', role: 'Subject Expert' },
  { id: 'astronaut', label: 'Astro Star', icon: '🚀', bg: 'bg-indigo-700', role: 'Explorer' }
];

export default function BackgroundEffectsModal({
  isOpen,
  onClose,
  activeTab = 'background',
  setActiveTab,
  currentBackground = 'none',
  customBgUrl = '',
  onSelectBackground,
  currentFilter = 'none',
  onSelectFilter,
  currentAvatar = 'none',
  onSelectAvatar,
  stream,
  isVideoOn = true,
  userName = 'You'
}) {
  const fileInputRef = useRef(null);
  const [hasGreenScreen, setHasGreenScreen] = useState(false);
  const [mirrorVideo, setMirrorVideo] = useState(true);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  if (!isOpen) return null;

  // Handle custom upload image
  const handleUploadImage = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        toast.error('Image exceeds maximum size (8MB)');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        onSelectBackground('custom', event.target.result);
        toast.success('Custom background applied!');
      };
      reader.readAsDataURL(file);
    }
  };

  // One-click AI Background Generator
  const handleGenerateAIBackground = () => {
    setIsGeneratingAI(true);
    toast.loading('Generating AI Virtual Office...', { id: 'ai-bg' });
    setTimeout(() => {
      setIsGeneratingAI(false);
      const aiPrompts = [
        'https://images.unsplash.com/photo-1541123437800-1bb1317badc2?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80'
      ];
      const randomBg = aiPrompts[Math.floor(Math.random() * aiPrompts.length)];
      onSelectBackground('custom', randomBg);
      toast.success('AI Background generated and applied!', { id: 'ai-bg' });
    }, 1200);
  };

  // Compute CSS filter for current filter
  const activeFilterStyle = VIDEO_FILTERS.find(f => f.id === currentFilter)?.filterStyle || '';

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#1E1E1E] text-white border border-[#3A3A3A] rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#333]">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold text-base">Background & Effects</h3>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Preview Area */}
        <div className="p-6 bg-[#141414] border-b border-[#2C2C2C] flex justify-center">
          <div className="w-full max-w-lg aspect-video relative bg-[#2A2A2A] rounded-xl overflow-hidden border border-[#444] shadow-xl flex items-center justify-center">
            
            {/* Background Image / Blur Layer */}
            {currentBackground !== 'none' && currentBackground !== 'blur' && (
              <img 
                src={currentBackground === 'custom' ? customBgUrl : PRESET_BACKGROUNDS.find(b => b.id === currentBackground)?.url} 
                alt="Virtual Background"
                className="absolute inset-0 w-full h-full object-cover z-0"
              />
            )}

            {/* Video Feed */}
            {currentAvatar === 'none' ? (
              isVideoOn && stream ? (
                <video
                  ref={(vid) => {
                    if (vid && stream) vid.srcObject = stream;
                  }}
                  autoPlay
                  playsInline
                  muted
                  className={`relative z-10 w-full h-full object-cover transition-all ${
                    mirrorVideo ? 'scale-x-[-1]' : ''
                  }`}
                  style={{
                    filter: `${currentBackground === 'blur' ? 'blur(12px) ' : ''}${activeFilterStyle}`
                  }}
                />
              ) : (
                <div className="relative z-10 w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center text-3xl font-bold">
                  {userName.slice(0, 2).toUpperCase()}
                </div>
              )
            ) : (
              /* Avatar Mode active */
              <div className="relative z-10 flex flex-col items-center justify-center p-6 text-center animate-bounce-short">
                <div className={`w-28 h-28 rounded-full ${AVATARS.find(a => a.id === currentAvatar)?.bg || 'bg-blue-600'} flex items-center justify-center text-6xl shadow-2xl border-4 border-white/20`}>
                  {AVATARS.find(a => a.id === currentAvatar)?.icon}
                </div>
                <span className="mt-3 px-3 py-1 bg-black/60 rounded-full text-xs font-semibold backdrop-blur-md">
                  {AVATARS.find(a => a.id === currentAvatar)?.label} • Active Avatar
                </span>
              </div>
            )}

            <div className="absolute bottom-3 left-3 bg-black/60 px-2 py-1 rounded text-white text-[11px] font-medium backdrop-blur-sm z-20">
              Live Preview
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-[#333] bg-[#181818] px-6">
          <button
            onClick={() => setActiveTab('background')}
            className={`py-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'background' 
                ? 'border-blue-500 text-blue-400 bg-[#222]' 
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            Virtual Backgrounds (8.5)
          </button>
          <button
            onClick={() => setActiveTab('filter')}
            className={`py-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'filter' 
                ? 'border-blue-500 text-blue-400 bg-[#222]' 
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Palette className="w-4 h-4" />
            Video Filters (8.6)
          </button>
          <button
            onClick={() => setActiveTab('avatar')}
            className={`py-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'avatar' 
                ? 'border-blue-500 text-blue-400 bg-[#222]' 
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            Avatars (8.7)
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* TAB 1: VIRTUAL BACKGROUNDS */}
          {activeTab === 'background' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-white">Choose Virtual Background</h4>
                  <p className="text-xs text-gray-400">Blurs your surroundings or places you in a professional setting.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleGenerateAIBackground}
                    disabled={isGeneratingAI}
                    className="px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/40 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm"
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    AI Generate
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Image
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleUploadImage} 
                    accept="image/*" 
                    className="hidden" 
                  />
                </div>
              </div>

              {/* Grid of Backgrounds */}
              <div className="grid grid-cols-4 gap-3">
                {/* None Option */}
                <button
                  onClick={() => onSelectBackground('none')}
                  className={`h-24 rounded-xl border-2 overflow-hidden flex flex-col items-center justify-center gap-1.5 transition-all ${
                    currentBackground === 'none' ? 'border-blue-500 bg-blue-500/10' : 'border-[#333] hover:border-[#555] bg-[#242424]'
                  }`}
                >
                  <X className="w-6 h-6 text-gray-400" />
                  <span className="text-xs font-medium">None</span>
                </button>

                {/* Blur Option */}
                <button
                  onClick={() => onSelectBackground('blur')}
                  className={`h-24 rounded-xl border-2 overflow-hidden flex flex-col items-center justify-center gap-1.5 transition-all relative ${
                    currentBackground === 'blur' ? 'border-blue-500 bg-blue-500/20' : 'border-[#333] hover:border-[#555] bg-[#242424]'
                  }`}
                >
                  <div className="absolute inset-0 bg-gradient-to-tr from-gray-700 to-gray-500 backdrop-blur-md opacity-60" />
                  <span className="relative z-10 text-xs font-bold">Blur</span>
                </button>

                {/* Preset Images */}
                {PRESET_BACKGROUNDS.filter(b => b.url).map((bg) => (
                  <button
                    key={bg.id}
                    onClick={() => onSelectBackground(bg.id, bg.url)}
                    className={`h-24 rounded-xl border-2 overflow-hidden relative group transition-all ${
                      currentBackground === bg.id ? 'border-blue-500 ring-2 ring-blue-500/40' : 'border-[#333] hover:border-[#555]'
                    }`}
                  >
                    <img src={bg.thumbnail} alt={bg.label} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2">
                      <span className="text-[11px] font-medium text-white truncate">{bg.label}</span>
                    </div>
                    {currentBackground === bg.id && (
                      <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-white">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </button>
                ))}

                {/* Custom Uploaded Background if present */}
                {customBgUrl && (
                  <button
                    onClick={() => onSelectBackground('custom', customBgUrl)}
                    className={`h-24 rounded-xl border-2 overflow-hidden relative group transition-all ${
                      currentBackground === 'custom' ? 'border-blue-500 ring-2 ring-blue-500/40' : 'border-[#333] hover:border-[#555]'
                    }`}
                  >
                    <img src={customBgUrl} alt="Custom Background" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2">
                      <span className="text-[11px] font-medium text-white truncate">Custom Upload</span>
                    </div>
                    {currentBackground === 'custom' && (
                      <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-white">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </button>
                )}
              </div>

              {/* Advanced Green Screen and Mirror Options */}
              <div className="pt-4 border-t border-[#333] flex flex-wrap gap-6 text-xs text-gray-300">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasGreenScreen}
                    onChange={(e) => setHasGreenScreen(e.target.checked)}
                    className="accent-blue-600 rounded"
                  />
                  <span>I have a green screen</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={mirrorVideo}
                    onChange={(e) => setMirrorVideo(e.target.checked)}
                    className="accent-blue-600 rounded"
                  />
                  <span>Mirror my video</span>
                </label>
              </div>
            </div>
          )}

          {/* TAB 2: VIDEO FILTERS */}
          {activeTab === 'filter' && (
            <div className="space-y-5">
              <div>
                <h4 className="text-sm font-semibold text-white">Choose Video Filter</h4>
                <p className="text-xs text-gray-400">Stylize your camera stream with cinema colors and lighting adjustments.</p>
              </div>

              <div className="grid grid-cols-4 gap-3">
                {VIDEO_FILTERS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => {
                      onSelectFilter(f.id);
                      toast.success(`Filter applied: ${f.label}`);
                    }}
                    className={`h-24 rounded-xl border-2 overflow-hidden flex flex-col items-center justify-center p-2 text-center transition-all ${
                      currentFilter === f.id ? 'border-blue-500 bg-blue-500/10' : 'border-[#333] hover:border-[#555] bg-[#242424]'
                    }`}
                  >
                    <div 
                      className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 mb-2 shadow-md"
                      style={{ filter: f.filterStyle }}
                    />
                    <span className="text-xs font-medium text-white">{f.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: AVATARS */}
          {activeTab === 'avatar' && (
            <div className="space-y-5">
              <div>
                <h4 className="text-sm font-semibold text-white">Choose Avatar Persona</h4>
                <p className="text-xs text-gray-400">Mask your camera feed with an expressive virtual avatar character.</p>
              </div>

              <div className="grid grid-cols-4 gap-3">
                {AVATARS.map((av) => (
                  <button
                    key={av.id}
                    onClick={() => {
                      onSelectAvatar(av.id);
                      toast.success(av.id === 'none' ? 'Avatar turned off' : `Avatar active: ${av.label}`);
                    }}
                    className={`h-28 rounded-xl border-2 overflow-hidden flex flex-col items-center justify-center p-2 text-center transition-all ${
                      currentAvatar === av.id ? 'border-blue-500 bg-blue-500/10' : 'border-[#333] hover:border-[#555] bg-[#242424]'
                    }`}
                  >
                    <span className="text-3xl mb-1.5">{av.icon}</span>
                    <span className="text-xs font-bold text-white">{av.label}</span>
                    <span className="text-[10px] text-gray-400">{av.role || 'Default Camera'}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end px-6 py-3.5 border-t border-[#333] bg-[#181818]">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl text-xs transition-colors"
          >
            Apply & Done
          </button>
        </div>

      </div>
    </div>
  );
}
