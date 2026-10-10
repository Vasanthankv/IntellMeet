import React, { useState, useEffect, useRef } from 'react';
import { 
  Palette, Image as ImageIcon, Sliders, LayoutGrid, Check, RotateCcw, 
  Upload, Eye, Sparkles, Video, Mic, Shield, Users, MessageSquare, 
  Share, Smile, HelpCircle, FileText, Disc, Radio, Subtitles, 
  BarChart2, Globe, MoveUp, MoveDown, EyeOff, Layers, Grid, User,
  ListChecks, AlertCircle, Info, ChevronRight, Lock
} from 'lucide-react';
import { 
  usePersonalizationStore, 
  THEMES, 
  WALLPAPER_PRESETS, 
  ALL_TOOLBAR_CONTROLS 
} from '../../store/personalizationStore';
import { PRESET_BACKGROUNDS, VIDEO_FILTERS, AVATARS } from '../video/BackgroundEffectsModal';
import toast from 'react-hot-toast';

export default function PersonalizationWorkspace({ isModal = false, onClose = () => {} }) {
  const {
    theme,
    customWallpaper,
    toolbarLayout,
    hiddenToolbarItems,
    defaultVideoLayout,
    multiSpeakerCount,
    hideNonVideoParticipants,
    virtualBackground,
    videoFilter,
    avatar,
    fetchPreferences,
    updatePreferences,
    resetToolbar,
    resetAll
  } = usePersonalizationStore();

  const [activeSubTab, setActiveSubTab] = useState('appearance'); // 'appearance' | 'toolbar' | 'videoEffects' | 'views'
  const [wallpaperUrlInput, setWallpaperUrlInput] = useState(customWallpaper?.url || '');
  const [previewStream, setPreviewStream] = useState(null);
  const videoPreviewRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  // Handle local video preview for Video Effects tab
  useEffect(() => {
    let stream = null;
    if (activeSubTab === 'videoEffects') {
      navigator.mediaDevices?.getUserMedia({ video: true, audio: false })
        .then(s => {
          stream = s;
          setPreviewStream(s);
          if (videoPreviewRef.current) {
            videoPreviewRef.current.srcObject = s;
          }
        })
        .catch(err => {
          console.warn('Camera preview not active:', err);
        });
    } else {
      if (previewStream) {
        previewStream.getTracks().forEach(t => t.stop());
        setPreviewStream(null);
      }
    }

    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, [activeSubTab]);

  // Toolbar reordering helpers
  const moveToolbarItem = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= toolbarLayout.length) return;
    const copy = [...toolbarLayout];
    const [moved] = copy.splice(index, 1);
    copy.splice(newIndex, 0, moved);
    updatePreferences({ toolbarLayout: copy });
    toast.success('Toolbar order updated');
  };

  const toggleHideToolbarItem = (itemId) => {
    let copy = [...hiddenToolbarItems];
    if (copy.includes(itemId)) {
      copy = copy.filter(id => id !== itemId);
      toast.success('Pinned to primary toolbar');
    } else {
      copy.push(itemId);
      toast.success('Moved to More (...) menu');
    }
    updatePreferences({ hiddenToolbarItems: copy });
  };

  const handleCustomWallpaperUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      toast.error('Image exceeds 8MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      updatePreferences({
        customWallpaper: {
          ...customWallpaper,
          preset: 'custom',
          url: dataUrl
        }
      });
      toast.success('Custom wallpaper image loaded!');
    };
    reader.readAsDataURL(file);
  };

  // Resolve current theme object
  const currentThemeObj = THEMES.find(t => t.id === theme) || THEMES[0];

  return (
    <div className="flex flex-col h-full space-y-6">
      
      {/* Top Banner Notice: User-Specific Personalization (Section 37.0) */}
      <div className="bg-gradient-to-r from-blue-900/30 to-indigo-950/40 border border-blue-500/20 rounded-2xl p-4 flex items-start gap-3 text-xs">
        <div className="p-2 bg-blue-500/20 text-blue-400 rounded-xl shrink-0 mt-0.5">
          <Palette className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-white text-sm">Personalized Experience</h4>
            <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded text-[10px] font-semibold">User-Specific</span>
          </div>
          <p className="text-gray-300 mt-0.5">
            Your theme, wallpaper, toolbar order, and video view settings customize your own meeting screen. They do not alter what other participants see or override host permissions.
          </p>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[#333] pb-3">
        <button
          onClick={() => setActiveSubTab('appearance')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'appearance'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'text-gray-400 hover:text-white hover:bg-[#252525]'
          }`}
        >
          <Palette className="w-3.5 h-3.5" /> Appearance & Theme
        </button>

        <button
          onClick={() => setActiveSubTab('toolbar')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'toolbar'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'text-gray-400 hover:text-white hover:bg-[#252525]'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" /> Toolbar Customization
        </button>

        <button
          onClick={() => setActiveSubTab('videoEffects')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'videoEffects'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'text-gray-400 hover:text-white hover:bg-[#252525]'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" /> Video Effects & Avatars
        </button>

        <button
          onClick={() => setActiveSubTab('views')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'views'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'text-gray-400 hover:text-white hover:bg-[#252525]'
          }`}
        >
          <LayoutGrid className="w-3.5 h-3.5" /> Meeting Views & Multi-Speaker
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: APPEARANCE (THEMES & CUSTOM WALLPAPERS)                        */}
      {/* ========================================================================= */}
      {activeSubTab === 'appearance' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          
          {/* 37.1 Meeting Theme */}
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Palette className="w-4 h-4 text-blue-400" />
                Meeting Theme (Section 37.1)
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Adjusts the chrome, panels, headers, and borders of the meeting interface to your aesthetic preference.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {THEMES.map(t => {
                const isSelected = theme === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => {
                      updatePreferences({ theme: t.id });
                      toast.success(`Theme set to ${t.label}`);
                    }}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/10 ring-2 ring-blue-500/30' 
                        : 'border-[#333] bg-[#242424] hover:border-gray-500 hover:bg-[#282828]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: t.accent }} />
                          {t.label}
                        </span>
                        {isSelected && <Check className="w-4 h-4 text-blue-400" />}
                      </div>
                      <p className="text-[11px] text-gray-400 line-clamp-2">{t.desc}</p>
                    </div>

                    <div className="mt-3 pt-3 border-t border-[#333] flex items-center justify-between text-[10px] text-gray-500">
                      <span className="font-mono uppercase">{t.badge}</span>
                      <div className="w-8 h-3 rounded" style={{ backgroundColor: t.canvasBg }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 37.2 Custom Wallpaper */}
          <div className="space-y-4 pt-4 border-t border-[#2E2E2E]">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-emerald-400" />
                  Custom Meeting Wallpaper (Section 37.2)
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Personalizes the visual canvas behind participant video tiles. <strong className="text-gray-200">Kept distinct from camera Virtual Backgrounds.</strong>
                </p>
              </div>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-1.5 bg-[#2E2E2E] hover:bg-[#383838] text-white border border-[#444] rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Upload className="w-3.5 h-3.5" /> Upload Image
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleCustomWallpaperUpload} 
                accept="image/*" 
                className="hidden" 
              />
            </div>

            {/* Presets Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {WALLPAPER_PRESETS.map(wp => {
                const isSelected = customWallpaper?.preset === wp.id;
                return (
                  <div
                    key={wp.id}
                    onClick={() => {
                      updatePreferences({
                        customWallpaper: {
                          ...customWallpaper,
                          preset: wp.id,
                          url: wp.bgImage
                        }
                      });
                      toast.success(`Wallpaper set to ${wp.label}`);
                    }}
                    className={`group relative rounded-xl overflow-hidden border-2 cursor-pointer transition-all aspect-video ${
                      isSelected ? 'border-emerald-500 ring-2 ring-emerald-500/30' : 'border-[#333] hover:border-gray-500'
                    }`}
                  >
                    {wp.bgImage ? (
                      <img src={wp.thumbnail} alt={wp.label} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-[#121212] flex items-center justify-center text-[10px] text-gray-500 font-bold uppercase">
                        Default Canvas
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 bg-black/75 p-1.5 text-center">
                      <p className="text-[10px] font-bold text-white truncate">{wp.label}</p>
                    </div>
                    {isSelected && (
                      <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Controls: Blur & Opacity */}
            <div className="bg-[#242424] border border-[#333] rounded-2xl p-4 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div>
                <div className="flex justify-between font-bold text-gray-300 mb-1.5">
                  <span>Canvas Blur</span>
                  <span>{customWallpaper?.blur || 0} px</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="20" 
                  value={customWallpaper?.blur || 0} 
                  onChange={(e) => updatePreferences({
                    customWallpaper: { ...customWallpaper, blur: Number(e.target.value) }
                  })}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <span className="text-[10px] text-gray-500">Softens wallpaper detail to keep focus on participant video tiles</span>
              </div>

              <div>
                <div className="flex justify-between font-bold text-gray-300 mb-1.5">
                  <span>Canvas Dimming / Opacity</span>
                  <span>{customWallpaper?.opacity || 100}%</span>
                </div>
                <input 
                  type="range" 
                  min="20" 
                  max="100" 
                  value={customWallpaper?.opacity || 100} 
                  onChange={(e) => updatePreferences({
                    customWallpaper: { ...customWallpaper, opacity: Number(e.target.value) }
                  })}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <span className="text-[10px] text-gray-500">Controls wallpaper intensity and contrast against video windows</span>
              </div>
            </div>

            {/* Live Interactive Preview Canvas */}
            <div className="border border-[#333] rounded-2xl p-4 bg-[#181818]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-2">
                Live Canvas Backdrop Preview
              </span>
              <div 
                className="w-full h-44 rounded-xl border border-[#444] overflow-hidden relative flex items-center justify-center p-4"
                style={{
                  backgroundColor: currentThemeObj.canvasBg,
                  backgroundImage: customWallpaper?.url ? `url(${customWallpaper.url})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  filter: `blur(${customWallpaper?.blur ? `${customWallpaper.blur / 4}px` : '0px'})`,
                  opacity: (customWallpaper?.opacity || 100) / 100
                }}
              >
                {/* Mock Video Tiles */}
                <div className="grid grid-cols-2 gap-4 w-72 z-10 filter-none">
                  <div className="bg-black/80 border border-white/20 rounded-lg p-2 text-center aspect-video flex flex-col items-center justify-center shadow-lg">
                    <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center mb-1">
                      YOU
                    </div>
                    <span className="text-[10px] text-gray-200 font-semibold">Local Video</span>
                  </div>
                  <div className="bg-black/80 border border-white/20 rounded-lg p-2 text-center aspect-video flex flex-col items-center justify-center shadow-lg">
                    <div className="w-7 h-7 rounded-full bg-purple-600 text-white font-bold text-xs flex items-center justify-center mb-1">
                      RP
                    </div>
                    <span className="text-[10px] text-gray-200 font-semibold">Remote Participant</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: TOOLBAR CUSTOMIZATION (Section 37.3)                           */}
      {/* ========================================================================= */}
      {activeSubTab === 'toolbar' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-purple-400" />
                In-Meeting Toolbar Organization (Section 37.3)
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Reorder controls and choose which buttons remain pinned on your primary bar vs placed inside the "More (...)" menu.
              </p>
            </div>

            <button
              onClick={resetToolbar}
              className="px-3.5 py-1.5 border border-[#444] bg-[#242424] hover:bg-[#2C2C2C] text-gray-300 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors self-start sm:self-auto"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset Default Order
            </button>
          </div>

          {/* Live Toolbar Preview Bar */}
          <div className="p-4 bg-[#141414] border border-[#2E2E2E] rounded-2xl space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">
              Live Toolbar Preview (Your Screen)
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto p-2 bg-[#1C1C1C] border border-[#333] rounded-xl">
              {toolbarLayout
                .filter(id => !hiddenToolbarItems.includes(id))
                .map((id, idx) => {
                  const ctrl = ALL_TOOLBAR_CONTROLS.find(c => c.id === id);
                  return (
                    <div 
                      key={id} 
                      className="px-2.5 py-1.5 bg-[#282828] border border-[#3A3A3A] rounded-lg text-white text-[11px] font-semibold flex items-center gap-1.5 shrink-0 shadow-sm"
                    >
                      <span className="w-4 h-4 rounded bg-purple-500/20 text-purple-300 text-[10px] flex items-center justify-center font-bold">
                        {idx + 1}
                      </span>
                      <span>{ctrl?.label.split(' ')[0] || id}</span>
                    </div>
                  );
                })}
              <div className="px-2.5 py-1.5 bg-[#242424] border border-dashed border-[#444] rounded-lg text-gray-400 text-[11px] font-medium shrink-0">
                ••• More ({hiddenToolbarItems.length})
              </div>
            </div>
          </div>

          {/* Controls List for Reordering & Toggling */}
          <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
            {toolbarLayout.map((itemId, idx) => {
              const ctrl = ALL_TOOLBAR_CONTROLS.find(c => c.id === itemId) || { id: itemId, label: itemId, category: 'Tool' };
              const isHidden = hiddenToolbarItems.includes(itemId);

              return (
                <div
                  key={itemId}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                    isHidden 
                      ? 'bg-[#1E1E1E] border-[#2A2A2A] opacity-75' 
                      : 'bg-[#242424] border-[#333] hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#181818] border border-[#3A3A3A] text-gray-300 text-xs font-mono font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-white flex items-center gap-2">
                        {ctrl.label}
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#333] text-gray-400 font-normal">
                          {ctrl.category}
                        </span>
                      </p>
                      <p className="text-[10px] text-gray-500">
                        {isHidden ? 'Inside More (...) popover menu' : 'Visible on main bottom bar'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Toggle Pin to main bar vs tuck in more */}
                    <button
                      onClick={() => toggleHideToolbarItem(itemId)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                        isHidden 
                          ? 'bg-[#2E2E2E] hover:bg-[#383838] text-gray-400 border border-[#3E3E3E]' 
                          : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30'
                      }`}
                      title={isHidden ? 'Promote to main toolbar' : 'Tuck into More menu'}
                    >
                      {isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span className="hidden sm:inline">{isHidden ? 'In More Menu' : 'Pinned to Bar'}</span>
                    </button>

                    {/* Up / Down Reordering */}
                    <div className="flex items-center border border-[#3A3A3A] rounded-lg overflow-hidden bg-[#1E1E1E]">
                      <button
                        onClick={() => moveToolbarItem(idx, -1)}
                        disabled={idx === 0}
                        className="p-1.5 hover:bg-[#333] text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move Left / Earlier"
                      >
                        <MoveUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => moveToolbarItem(idx, 1)}
                        disabled={idx === toolbarLayout.length - 1}
                        className="p-1.5 hover:bg-[#333] text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed border-l border-[#3A3A3A]"
                        title="Move Right / Later"
                      >
                        <MoveDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: VIDEO EFFECTS & AVATARS (Sections 37.4, 37.5, 37.6)            */}
      {/* ========================================================================= */}
      {activeSubTab === 'videoEffects' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Video Personalization (Sections 37.4 – 37.6)
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Configure camera virtual backgrounds, real-time video color filters, and animated 3D avatars before or during the call.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left: Video Preview Window */}
            <div className="lg:col-span-5 space-y-3">
              <div className="relative aspect-video rounded-2xl overflow-hidden bg-black border border-[#333] shadow-xl flex items-center justify-center">
                {avatar !== 'none' ? (
                  <div className="text-center space-y-2">
                    <span className="text-6xl animate-bounce block">
                      {AVATARS.find(a => a.id === avatar)?.icon || '🤖'}
                    </span>
                    <p className="text-xs font-bold text-amber-400">
                      {AVATARS.find(a => a.id === avatar)?.label} Avatar Active
                    </p>
                  </div>
                ) : (
                  <video 
                    ref={videoPreviewRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    className="w-full h-full object-cover"
                    style={{
                      filter: VIDEO_FILTERS.find(f => f.id === videoFilter)?.filterStyle || 'none'
                    }}
                  />
                )}

                {/* Filter / Effect Active Badge */}
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[10px] text-white font-medium border border-white/10">
                  {avatar !== 'none' 
                    ? `Avatar: ${avatar}` 
                    : `Filter: ${videoFilter} • BG: ${virtualBackground?.presetId || virtualBackground?.type || 'none'}`}
                </div>
              </div>
              <p className="text-[11px] text-gray-500 text-center">
                Effects apply exclusively to your outgoing stream via client-side WebRTC canvas processing.
              </p>
            </div>

            {/* Right: Selectors */}
            <div className="lg:col-span-7 space-y-5 text-xs">
              
              {/* Virtual Background Presets */}
              <div>
                <span className="font-bold text-white block mb-2">37.4 Virtual Background</span>
                <div className="grid grid-cols-4 gap-2">
                  {PRESET_BACKGROUNDS.map(bg => (
                    <button
                      key={bg.id}
                      onClick={() => {
                        updatePreferences({
                          virtualBackground: {
                            type: bg.id === 'none' ? 'none' : bg.id === 'blur' ? 'blur' : 'preset',
                            presetId: bg.id,
                            url: bg.url || '',
                            blurIntensity: 10
                          }
                        });
                        toast.success(`Virtual background: ${bg.label}`);
                      }}
                      className={`p-2 rounded-xl border text-center transition-all ${
                        virtualBackground?.presetId === bg.id 
                          ? 'border-blue-500 bg-blue-500/20 text-white font-bold' 
                          : 'border-[#333] bg-[#242424] text-gray-400 hover:text-white'
                      }`}
                    >
                      <p className="truncate font-medium">{bg.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Video Filters */}
              <div>
                <span className="font-bold text-white block mb-2">37.5 Video Filters</span>
                <div className="grid grid-cols-4 gap-2">
                  {VIDEO_FILTERS.map(vf => (
                    <button
                      key={vf.id}
                      onClick={() => {
                        updatePreferences({ videoFilter: vf.id });
                        toast.success(`Video filter: ${vf.label}`);
                      }}
                      className={`p-2 rounded-xl border text-center transition-all ${
                        videoFilter === vf.id 
                          ? 'border-purple-500 bg-purple-500/20 text-white font-bold' 
                          : 'border-[#333] bg-[#242424] text-gray-400 hover:text-white'
                      }`}
                    >
                      <p className="truncate font-medium">{vf.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Avatars */}
              <div>
                <span className="font-bold text-white block mb-2">37.6 Animated Avatars</span>
                <div className="grid grid-cols-4 gap-2">
                  {AVATARS.map(av => (
                    <button
                      key={av.id}
                      onClick={() => {
                        updatePreferences({ avatar: av.id });
                        toast.success(av.id === 'none' ? 'Avatar disabled (Camera enabled)' : `Avatar: ${av.label}`);
                      }}
                      className={`p-2 rounded-xl border text-center transition-all ${
                        avatar === av.id 
                          ? 'border-amber-500 bg-amber-500/20 text-white font-bold' 
                          : 'border-[#333] bg-[#242424] text-gray-400 hover:text-white'
                      }`}
                    >
                      <span className="text-base block mb-0.5">{av.icon}</span>
                      <p className="truncate font-medium">{av.label}</p>
                    </button>
                  ))}
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 4: MEETING VIEWS & MULTI-SPEAKER (Section 37.7 & 37.10)           */}
      {/* ========================================================================= */}
      {activeSubTab === 'views' && (
        <div className="space-y-6 animate-in fade-in duration-200 text-xs">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <LayoutGrid className="w-4 h-4 text-emerald-400" />
              Meeting View Personalization (Sections 37.7 & 37.10)
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Select your default meeting video layout and tune Multi-Speaker active tile allocation.
            </p>
          </div>

          {/* Default Layout Cards */}
          <div className="space-y-3">
            <span className="font-bold text-white block">Default Starting Layout</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { id: 'gallery', label: 'Gallery View', desc: 'Equal grid of all meeting participants (up to 25/49 tiles)', icon: Grid },
                { id: 'speaker', label: 'Speaker View', desc: 'Large prominent single active speaker with top thumbnail ribbon', icon: User },
                { id: 'multi', label: 'Multi-Speaker View (37.7)', desc: 'Dynamic emphasis on 2, 3, or 4 active speakers side-by-side', icon: Users },
                { id: 'dynamic-gallery', label: 'Dynamic View', desc: 'Automatically emphasizes active audio participants over quiet ones', icon: LayoutGrid },
                { id: 'immersive', label: 'Immersive View', desc: 'Classroom / auditorium virtual seat arrangement', icon: Sparkles },
                { id: 'floating', label: 'Floating Mini-Window', desc: 'Compact picture-in-picture window for multitasking', icon: Layers }
              ].map(lt => {
                const isSelected = defaultVideoLayout === lt.id;
                const Icon = lt.icon;
                return (
                  <div
                    key={lt.id}
                    onClick={() => {
                      updatePreferences({ defaultVideoLayout: lt.id });
                      toast.success(`Default layout set to ${lt.label}`);
                    }}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected 
                        ? 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/10 ring-2 ring-emerald-500/30' 
                        : 'border-[#333] bg-[#242424] hover:border-gray-500 hover:bg-[#282828]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-white flex items-center gap-2">
                          <Icon className="w-4 h-4 text-emerald-400" />
                          {lt.label}
                        </span>
                        {isSelected && <Check className="w-4 h-4 text-emerald-400" />}
                      </div>
                      <p className="text-[11px] text-gray-400">{lt.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Multi-Speaker Configuration (Section 37.7) */}
          <div className="bg-[#242424] border border-[#333] rounded-2xl p-5 space-y-4">
            <div>
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                Multi-Speaker Active Tile Allocation (Section 37.7)
              </h4>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Specifies how many concurrent active speakers are prominently highlighted side-by-side in panel or interview views.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { count: 2, label: 'Dual Speakers (2)', desc: 'Two equal side-by-side tiles (Interviews & 1:1 discussions)' },
                { count: 3, label: 'Tri-Panel (3)', desc: 'Three prominent speaker tiles (Debates & executive reviews)' },
                { count: 4, label: 'Quad Focus (4)', desc: '2x2 grid of top speaking participants (Panel discussions)' }
              ].map(opt => {
                const isSelected = (multiSpeakerCount || 2) === opt.count;
                return (
                  <button
                    key={opt.count}
                    onClick={() => {
                      updatePreferences({ multiSpeakerCount: opt.count });
                      toast.success(`Multi-speaker allocated to ${opt.count} tiles`);
                    }}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isSelected 
                        ? 'border-emerald-500 bg-emerald-500/20 text-white font-bold' 
                        : 'border-[#333] bg-[#1E1E1E] text-gray-300 hover:border-gray-500'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold">{opt.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                    </div>
                    <p className="text-[10px] text-gray-400">{opt.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 37.10 Personalization vs Host Controls Clarification */}
          <div className="bg-[#1A1A1A] border border-[#333] rounded-2xl p-4 space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
              Section 37.10 Architecture: Personal vs Host Controls
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px]">
              <div className="p-3 bg-blue-900/10 border border-blue-500/20 rounded-xl space-y-1">
                <span className="font-bold text-blue-300 block">Personal Controls (Your Screen Only)</span>
                <ul className="text-gray-300 space-y-0.5 list-disc pl-4">
                  <li>Pinning specific participants to focal area</li>
                  <li>Local Theme, Custom Wallpaper & Toolbar order</li>
                  <li>Multi-Speaker active tile preference</li>
                  <li>Hide non-video participants on your screen</li>
                </ul>
              </div>

              <div className="p-3 bg-purple-900/10 border border-purple-500/20 rounded-xl space-y-1">
                <span className="font-bold text-purple-300 block">Host Controls (Affects Everyone)</span>
                <ul className="text-gray-300 space-y-0.5 list-disc pl-4">
                  <li>Spotlighting a presenter for all attendees</li>
                  <li>Locking meeting & Waiting Room permissions</li>
                  <li>Muting, watermarking & Cloud Recording policy</li>
                  <li>Broadcasting meeting video order (Follow Host)</li>
                </ul>
              </div>
            </div>

            {/* Toggle: Hide Non-Video */}
            <div className="flex items-center justify-between pt-2 border-t border-[#2A2A2A]">
              <div>
                <p className="font-bold text-white text-xs">Hide Non-Video Participants</p>
                <p className="text-[10px] text-gray-400">Do not render black video squares for participants with cameras off</p>
              </div>
              <input 
                type="checkbox"
                checked={hideNonVideoParticipants}
                onChange={(e) => updatePreferences({ hideNonVideoParticipants: e.target.checked })}
                className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
              />
            </div>
          </div>

        </div>
      )}

      {/* Footer Reset & Close Actions */}
      <div className="pt-4 border-t border-[#333] flex items-center justify-between text-xs">
        <button
          onClick={resetAll}
          className="text-gray-500 hover:text-red-400 transition-colors flex items-center gap-1 font-semibold"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reset All Preferences to Defaults
        </button>

        {isModal && (
          <button
            onClick={onClose}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-md shadow-blue-600/20"
          >
            Done
          </button>
        )}
      </div>

    </div>
  );
}
