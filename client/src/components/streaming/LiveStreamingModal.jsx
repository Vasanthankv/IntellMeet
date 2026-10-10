import React, { useState, useEffect } from 'react';
import { 
  X, Radio, Globe, Shield, Eye, EyeOff, 
  ExternalLink, Play, Square, Check, AlertTriangle, Layers, Info, 
  Tv, Sliders, Users, Clock, Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';

const YoutubeIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" {...props}>
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

const FacebookIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" {...props}>
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const TwitchIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" {...props}>
    <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>
  </svg>
);

const PRESET_PLATFORMS = {
  YOUTUBE: {
    id: 'YOUTUBE',
    name: 'YouTube Live',
    icon: YoutubeIcon,
    color: 'text-red-500',
    borderColor: 'border-red-500',
    bgColor: 'bg-red-500/10',
    defaultUrl: 'rtmp://a.rtmp.youtube.com/live2',
    defaultPageUrl: 'https://youtube.com/live',
    hint: 'Get Stream Key from YouTube Studio > Go Live'
  },
  FACEBOOK: {
    id: 'FACEBOOK',
    name: 'Facebook Live',
    icon: FacebookIcon,
    color: 'text-blue-500',
    borderColor: 'border-blue-500',
    bgColor: 'bg-blue-500/10',
    defaultUrl: 'rtmps://live-api-s.facebook.com:443/rtmp/',
    defaultPageUrl: 'https://facebook.com/live',
    hint: 'Get Stream Key from Facebook Live Producer'
  },
  TWITCH: {
    id: 'TWITCH',
    name: 'Twitch',
    icon: TwitchIcon,
    color: 'text-purple-500',
    borderColor: 'border-purple-500',
    bgColor: 'bg-purple-500/10',
    defaultUrl: 'rtmp://live.twitch.tv/app/',
    defaultPageUrl: 'https://twitch.tv',
    hint: 'Get Stream Key from Twitch Creator Dashboard'
  },
  CUSTOM_RTMP: {
    id: 'CUSTOM_RTMP',
    name: 'Custom Live Streaming',
    icon: Globe,
    color: 'text-emerald-500',
    borderColor: 'border-emerald-500',
    bgColor: 'bg-emerald-500/10',
    defaultUrl: 'rtmp://',
    defaultPageUrl: '',
    hint: 'Enter RTMP/RTMPS Stream URL and Key from any streaming service'
  }
};

const LiveStreamingModal = ({
  isOpen,
  onClose,
  session,
  isHostOrCoHost = false,
  onStartStreaming,
  onStopStreaming,
  onSaveConfiguration
}) => {
  const [activeTab, setActiveTab] = useState('destinations'); // 'destinations' | 'branding' | 'preview'
  const [selectedPlatforms, setSelectedPlatforms] = useState(['YOUTUBE']);
  const [destinationsData, setDestinationsData] = useState({});
  const [brandingData, setBrandingData] = useState({
    watermarkEnabled: true,
    brandText: 'Powered by IntelliMeet',
    position: 'bottom-right'
  });
  const [showKeyMap, setShowKeyMap] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showStopConfirm, setShowStopConfirm] = useState(false);

  const isLive = session?.status === 'LIVE';
  const isConnecting = session?.status === 'CONNECTING';

  // Sync state from server session prop
  useEffect(() => {
    if (session) {
      if (session.destinations && session.destinations.length > 0) {
        const platforms = session.destinations.map(d => d.platform);
        setSelectedPlatforms(platforms);

        const newMap = {};
        session.destinations.forEach(d => {
          newMap[d.platform] = {
            name: d.name || `${d.platform} Stream`,
            streamUrl: d.streamUrl || PRESET_PLATFORMS[d.platform]?.defaultUrl || '',
            streamKey: d.streamKey || '',
            streamPageUrl: d.streamPageUrl || PRESET_PLATFORMS[d.platform]?.defaultPageUrl || '',
            resolution: d.resolution || '720p',
            requireAuthentication: !!d.requireAuthentication
          };
        });
        setDestinationsData(newMap);
      } else {
        // Default to YouTube
        setSelectedPlatforms(['YOUTUBE']);
        setDestinationsData({
          YOUTUBE: {
            name: 'YouTube Stream',
            streamUrl: PRESET_PLATFORMS.YOUTUBE.defaultUrl,
            streamKey: '',
            streamPageUrl: PRESET_PLATFORMS.YOUTUBE.defaultPageUrl,
            resolution: '720p',
            requireAuthentication: false
          }
        });
      }

      if (session.branding) {
        setBrandingData({
          watermarkEnabled: session.branding.watermarkEnabled !== undefined ? session.branding.watermarkEnabled : true,
          brandText: session.branding.brandText || 'Powered by IntelliMeet',
          position: session.branding.position || 'bottom-right'
        });
      }
    }
  }, [session]);

  if (!isOpen) return null;

  // Toggle platform selection (up to 3 simultaneous platforms, 33.12)
  const handleTogglePlatform = (platformId) => {
    if (isLive) {
      toast.error('Cannot change platforms while stream is active. Stop stream first.');
      return;
    }

    if (selectedPlatforms.includes(platformId)) {
      if (selectedPlatforms.length === 1) {
        toast.error('At least one streaming platform must remain selected');
        return;
      }
      setSelectedPlatforms(prev => prev.filter(p => p !== platformId));
    } else {
      if (selectedPlatforms.length >= 3) {
        toast.error('IntelliMeet supports up to 3 simultaneous streaming platforms (Section 33.12)');
        return;
      }
      setSelectedPlatforms(prev => [...prev, platformId]);

      // Initialize defaults for newly selected platform
      if (!destinationsData[platformId]) {
        const preset = PRESET_PLATFORMS[platformId];
        setDestinationsData(prev => ({
          ...prev,
          [platformId]: {
            name: `${preset.name}`,
            streamUrl: preset.defaultUrl,
            streamKey: '',
            streamPageUrl: preset.defaultPageUrl,
            resolution: '720p',
            requireAuthentication: false
          }
        }));
      }
    }
  };

  const handleUpdateDestinationField = (platformId, field, value) => {
    setDestinationsData(prev => ({
      ...prev,
      [platformId]: {
        ...(prev[platformId] || {}),
        [field]: value
      }
    }));
  };

  const handleSaveConfig = async () => {
    setIsSubmitting(true);
    try {
      const payloadDestinations = selectedPlatforms.map(platform => {
        const item = destinationsData[platform] || {};
        return {
          platform,
          name: item.name || `${platform} Stream`,
          streamUrl: item.streamUrl || PRESET_PLATFORMS[platform]?.defaultUrl || '',
          streamKey: item.streamKey || '',
          streamPageUrl: item.streamPageUrl || '',
          resolution: item.resolution || '720p',
          requireAuthentication: !!item.requireAuthentication
        };
      });

      await onSaveConfiguration({
        destinations: payloadDestinations,
        branding: brandingData
      });
      toast.success('Live streaming settings saved');
    } catch (err) {
      toast.error('Failed to save settings');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartBroadcast = async () => {
    // Validate stream URLs
    for (const p of selectedPlatforms) {
      const dest = destinationsData[p];
      if (!dest?.streamUrl || !dest.streamUrl.trim()) {
        toast.error(`Please provide a valid Stream URL for ${PRESET_PLATFORMS[p]?.name || p}`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      // First save configuration
      const payloadDestinations = selectedPlatforms.map(platform => {
        const item = destinationsData[platform] || {};
        return {
          platform,
          name: item.name || `${platform} Stream`,
          streamUrl: item.streamUrl || PRESET_PLATFORMS[platform]?.defaultUrl || '',
          streamKey: item.streamKey || '',
          streamPageUrl: item.streamPageUrl || '',
          resolution: item.resolution || '720p',
          requireAuthentication: !!item.requireAuthentication
        };
      });

      await onSaveConfiguration({
        destinations: payloadDestinations,
        branding: brandingData
      });

      // Then trigger Go Live
      await onStartStreaming();
      toast.success('🚀 Broadcast initiated! External viewers are now tuning in.');
      setActiveTab('destinations');
    } catch (err) {
      toast.error('Failed to start live stream');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmStop = async () => {
    setIsSubmitting(true);
    try {
      await onStopStreaming();
      setShowStopConfirm(false);
      toast.success('Livestream stopped. The Zoom meeting remains active.');
    } catch (err) {
      toast.error('Failed to stop stream');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#1C1C1E] border border-gray-800 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-gray-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-[#252528]">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${isLive ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">
                  Live Streaming
                </h2>
                {isLive && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse">
                    ● LIVE
                  </span>
                )}
                {isConnecting && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40">
                    CONNECTING...
                  </span>
                )}
                <span className="text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/40 px-2 py-0.5 rounded-full font-bold">
                  Section 33
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Broadcast meeting media over RTMP to YouTube, Facebook, Twitch, and custom platforms
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Broadcast Banner (If Active) */}
        {isLive && (
          <div className="bg-gradient-to-r from-red-950/60 via-[#1C1C1E] to-red-950/60 px-6 py-3 border-b border-red-500/30 flex items-center justify-between">
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
                <span className="font-bold text-white uppercase tracking-wider">Broadcasting Live</span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-300">
                <Users className="w-3.5 h-3.5 text-blue-400" />
                <span className="font-bold text-white">{(session?.viewerCount || 0).toLocaleString()}</span>
                <span>active external viewers</span>
              </div>
            </div>

            {isHostOrCoHost && (
              <button
                onClick={() => setShowStopConfirm(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-xs transition-colors shadow-md active:scale-95"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Stop Live Stream</span>
              </button>
            )}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-gray-800 bg-[#202022] text-xs">
          <button
            onClick={() => setActiveTab('destinations')}
            className={`pb-2.5 px-3 font-semibold transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === 'destinations'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Streaming Destinations (33.1, 33.12)</span>
          </button>

          <button
            onClick={() => setActiveTab('branding')}
            className={`pb-2.5 px-3 font-semibold transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === 'branding'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Livestream Watermark & Branding (33.13)</span>
          </button>

          <button
            onClick={() => setActiveTab('preview')}
            className={`pb-2.5 px-3 font-semibold transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === 'preview'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            <span>Broadcast Preview (33.14)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* TAB 1: DESTINATIONS */}
          {activeTab === 'destinations' && (
            <div className="space-y-6">
              
              {/* Platform Selector Grid (33.1 & 33.12 Multi-stream) */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                      Select Platforms (Up to 3 Simultaneously)
                    </span>
                    <p className="text-[11px] text-gray-500">
                      Select YouTube, Facebook, Twitch, or Custom RTMP services to broadcast the meeting feed.
                    </p>
                  </div>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold">
                    {selectedPlatforms.length} / 3 Selected
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {Object.values(PRESET_PLATFORMS).map(preset => {
                    const isSelected = selectedPlatforms.includes(preset.id);
                    const IconComp = preset.icon;

                    return (
                      <div
                        key={preset.id}
                        onClick={() => handleTogglePlatform(preset.id)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                          isSelected
                            ? `${preset.bgColor} ${preset.borderColor} shadow-lg shadow-blue-500/5`
                            : 'bg-[#252528] border-gray-800 hover:border-gray-700 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <IconComp className={`w-5 h-5 ${preset.color}`} />
                            <span className="text-xs font-bold text-white">{preset.name}</span>
                          </div>
                          <div className={`w-4 h-4 rounded flex items-center justify-center border ${
                            isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-600'
                          }`}>
                            {isSelected && <Check className="w-3 h-3" />}
                          </div>
                        </div>
                        <span className="text-[10px] text-gray-400 mt-2 block line-clamp-1">
                          {preset.hint}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Destination Configurations */}
              <div className="space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block">
                  Platform RTMP Configurations (33.8 & 33.20)
                </span>

                {selectedPlatforms.map(platformId => {
                  const preset = PRESET_PLATFORMS[platformId];
                  const IconComp = preset.icon;
                  const config = destinationsData[platformId] || {};
                  const isKeyVisible = showKeyMap[platformId] || false;

                  return (
                    <div
                      key={platformId}
                      className="bg-[#242427] border border-gray-800 rounded-xl p-4 space-y-3 shadow-inner"
                    >
                      <div className="flex items-center justify-between border-b border-gray-800/80 pb-2.5">
                        <div className="flex items-center gap-2">
                          <IconComp className={`w-4 h-4 ${preset.color}`} />
                          <span className="text-xs font-bold text-white">{preset.name}</span>
                          <span className="text-[10px] text-gray-400 font-mono">({platformId})</span>
                        </div>
                        <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-mono">
                          RTMP / RTMPS
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        {/* Stream URL */}
                        <div>
                          <label className="text-[11px] font-semibold text-gray-300 block mb-1">
                            Stream URL <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="text"
                            value={config.streamUrl || ''}
                            onChange={(e) => handleUpdateDestinationField(platformId, 'streamUrl', e.target.value)}
                            placeholder="rtmp://..."
                            disabled={isLive}
                            className="w-full px-3 py-1.5 bg-[#1C1C1E] border border-gray-700 rounded-lg text-white font-mono text-[11px] focus:outline-none focus:border-blue-500 disabled:opacity-60"
                          />
                        </div>

                        {/* Stream Key */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[11px] font-semibold text-gray-300 flex items-center gap-1.5">
                              <span>Stream Key</span>
                              <span className="text-[10px] text-gray-500 font-normal">(Encrypted Backend Storage)</span>
                            </label>
                            <button
                              type="button"
                              onClick={() => setShowKeyMap(prev => ({ ...prev, [platformId]: !prev[platformId] }))}
                              className="text-gray-400 hover:text-white text-[10px] flex items-center gap-1"
                            >
                              {isKeyVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                              <span>{isKeyVisible ? 'Hide' : 'Show'}</span>
                            </button>
                          </div>
                          <div className="relative">
                            <input
                              type={isKeyVisible ? 'text' : 'password'}
                              value={config.streamKey || ''}
                              onChange={(e) => handleUpdateDestinationField(platformId, 'streamKey', e.target.value)}
                              placeholder="Paste Stream Key (Hidden from viewers)"
                              disabled={isLive}
                              className="w-full px-3 py-1.5 bg-[#1C1C1E] border border-gray-700 rounded-lg text-white font-mono text-[11px] focus:outline-none focus:border-blue-500 disabled:opacity-60"
                            />
                          </div>
                        </div>

                        {/* Livestream Page URL */}
                        <div>
                          <label className="text-[11px] font-semibold text-gray-300 block mb-1">
                            Livestream Public Page URL
                          </label>
                          <input
                            type="text"
                            value={config.streamPageUrl || ''}
                            onChange={(e) => handleUpdateDestinationField(platformId, 'streamPageUrl', e.target.value)}
                            placeholder="https://..."
                            disabled={isLive}
                            className="w-full px-3 py-1.5 bg-[#1C1C1E] border border-gray-700 rounded-lg text-white text-[11px] focus:outline-none focus:border-blue-500 disabled:opacity-60"
                          />
                        </div>

                        {/* Resolution & Authentication */}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[11px] font-semibold text-gray-300 block mb-1">
                              Stream Resolution
                            </label>
                            <select
                              value={config.resolution || '720p'}
                              onChange={(e) => handleUpdateDestinationField(platformId, 'resolution', e.target.value)}
                              disabled={isLive}
                              className="w-full px-2.5 py-1.5 bg-[#1C1C1E] border border-gray-700 rounded-lg text-white text-[11px] focus:outline-none focus:border-blue-500 disabled:opacity-60"
                            >
                              <option value="720p">720p HD (Recommended)</option>
                              <option value="1080p">1080p Full HD</option>
                              <option value="480p">480p SD</option>
                            </select>
                          </div>

                          <div className="flex items-center pt-5">
                            <label className="flex items-center gap-2 cursor-pointer text-gray-300 select-none">
                              <input
                                type="checkbox"
                                checked={!!config.requireAuthentication}
                                onChange={(e) => handleUpdateDestinationField(platformId, 'requireAuthentication', e.target.checked)}
                                disabled={isLive}
                                className="accent-blue-600 rounded"
                              />
                              <span className="text-[11px]">Require Auth</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Security Banner (33.20 & 33.22) */}
              <div className="p-3.5 bg-blue-500/10 border border-blue-500/30 rounded-xl text-xs text-blue-200 flex items-start gap-2.5">
                <Shield className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <span className="font-semibold text-white block">Security & Privacy Guard (33.20 & 33.22)</span>
                  <p className="text-[11px] text-blue-200/80 leading-relaxed">
                    Livestream viewers watch external broadcasts and <strong>do not</strong> gain access to internal meeting transcripts, AI question/answers, private chat, or attendee lists. Stream keys are encrypted and hidden.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BRANDING & WATERMARK */}
          {activeTab === 'branding' && (
            <div className="space-y-5">
              <div className="p-4 bg-[#242427] border border-gray-800 rounded-xl space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-white flex items-center gap-2">
                      <span>Livestream Branding Watermark (Section 33.13)</span>
                      <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full font-bold">
                        External Branding
                      </span>
                    </span>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      Displays your organization's logo or "Powered by IntelliMeet" watermark on the broadcast feed sent to external viewers.
                    </p>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={brandingData.watermarkEnabled}
                      onChange={(e) => setBrandingData(prev => ({ ...prev, watermarkEnabled: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {brandingData.watermarkEnabled && (
                  <div className="pt-3 border-t border-gray-800 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="text-[11px] font-semibold text-gray-300 block mb-1">
                        Watermark Brand Text
                      </label>
                      <input
                        type="text"
                        value={brandingData.brandText}
                        onChange={(e) => setBrandingData(prev => ({ ...prev, brandText: e.target.value }))}
                        className="w-full px-3 py-1.5 bg-[#1C1C1E] border border-gray-700 rounded-lg text-white text-xs focus:outline-none focus:border-blue-500"
                        placeholder="Powered by IntelliMeet"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-gray-300 block mb-1">
                        Corner Placement
                      </label>
                      <select
                        value={brandingData.position}
                        onChange={(e) => setBrandingData(prev => ({ ...prev, position: e.target.value }))}
                        className="w-full px-2.5 py-1.5 bg-[#1C1C1E] border border-gray-700 rounded-lg text-white text-xs focus:outline-none focus:border-blue-500"
                      >
                        <option value="bottom-right">Bottom-Right (Default & Standard)</option>
                        <option value="bottom-left">Bottom-Left</option>
                        <option value="top-right">Top-Right</option>
                        <option value="top-left">Top-Left</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Crucial Concept Explainer Table (33.13) */}
              <div className="bg-[#242427] border border-gray-800 rounded-xl p-4 text-xs space-y-3">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-blue-400" />
                  <span>Important Distinction: Watermark #32 vs #33</span>
                </span>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead>
                      <tr className="border-b border-gray-700 text-gray-400">
                        <th className="py-1.5 pr-4 font-semibold">Watermark Type</th>
                        <th className="py-1.5 pr-4 font-semibold">Purpose</th>
                        <th className="py-1.5 font-semibold">Visibility</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800 text-gray-300">
                      <tr>
                        <td className="py-2 pr-4 font-semibold text-amber-400">#32 Security Watermark</td>
                        <td className="py-2 pr-4">Identifies viewing attendee (anti-screenshot/leak tracking)</td>
                        <td className="py-2">In-meeting participant displays only</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4 font-semibold text-blue-400">#33 Livestream Watermark</td>
                        <td className="py-2 pr-4">Brands public broadcast with organization identity</td>
                        <td className="py-2">Visible on external YouTube, Facebook, Twitch streams</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: BROADCAST PREVIEW */}
          {activeTab === 'preview' && (
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">Composite Feed Output Preview (16:9)</span>
                <span className="text-[11px] text-gray-400">
                  {selectedPlatforms.map(p => PRESET_PLATFORMS[p]?.name).join(' • ')}
                </span>
              </div>

              {/* Simulated broadcast canvas */}
              <div className="relative aspect-video w-full max-w-2xl mx-auto bg-black rounded-xl border border-gray-800 overflow-hidden shadow-2xl flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-tr from-gray-900 via-gray-800 to-gray-950 flex flex-col items-center justify-center text-center p-6">
                  <div className="w-16 h-16 rounded-full bg-blue-600/20 border border-blue-500/40 flex items-center justify-center mb-3">
                    <Radio className="w-8 h-8 text-blue-400 animate-pulse" />
                  </div>
                  <h3 className="text-sm font-bold text-white tracking-wide">
                    Live Broadcast Feed
                  </h3>
                  <p className="text-[11px] text-gray-400 mt-1 max-w-sm">
                    High-definition video/audio encoder ready to distribute meeting stream to external CDNs.
                  </p>
                </div>

                {/* Top left LIVE indicator */}
                <div className="absolute top-3 left-3 flex items-center gap-2 px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-md border border-white/10 text-[10px] text-white">
                  <span className="h-2 w-2 rounded-full bg-red-500 animate-ping"></span>
                  <span className="font-bold text-red-400">LIVE FEED</span>
                  <span className="text-gray-400 font-mono">720p 30fps</span>
                </div>

                {/* Bottom branding watermark */}
                {brandingData.watermarkEnabled && (
                  <div className={`absolute ${
                    brandingData.position === 'bottom-left' ? 'bottom-3 left-3' :
                    brandingData.position === 'top-left' ? 'top-3 left-3' :
                    brandingData.position === 'top-right' ? 'top-3 right-3' :
                    'bottom-3 right-3'
                  } px-3 py-1.5 rounded-lg bg-black/70 backdrop-blur-md border border-white/10 text-white flex items-center gap-2`}>
                    <Radio className="w-3.5 h-3.5 text-blue-400" />
                    <div className="flex flex-col text-left">
                      <span className="text-[10px] font-bold tracking-wider text-gray-200 uppercase">
                        {brandingData.brandText}
                      </span>
                      <span className="text-[8px] text-gray-400">Official Broadcast</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 border-t border-gray-800 bg-[#252528] flex items-center justify-between">
          <div className="text-xs text-gray-400">
            {isLive ? (
              <span className="text-red-400 font-semibold flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
                <span>Active Broadcast — {(session?.viewerCount || 0).toLocaleString()} viewers</span>
              </span>
            ) : (
              <span>Ready to broadcast to {selectedPlatforms.length} platform(s)</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveConfig}
              disabled={isSubmitting || isLive}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-gray-300 hover:text-white transition-colors disabled:opacity-50"
            >
              Save Configuration
            </button>

            {isHostOrCoHost && (
              isLive ? (
                <button
                  onClick={() => setShowStopConfirm(true)}
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs transition-all shadow-lg active:scale-95 flex items-center gap-2"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Stop Live Stream</span>
                </button>
              ) : (
                <button
                  onClick={handleStartBroadcast}
                  disabled={isSubmitting || selectedPlatforms.length === 0}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs transition-all shadow-lg shadow-red-600/20 active:scale-95 flex items-center gap-2 disabled:opacity-50"
                >
                  <Radio className="w-3.5 h-3.5" />
                  <span>Go Live (Start Streaming)</span>
                </button>
              )
            )}
          </div>
        </div>

      </div>

      {/* Confirmation Modal: Stop Live Stream without ending meeting (33.10) */}
      {showStopConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-[#242427] border border-red-500/40 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-base font-bold text-white">Stop Live Stream?</h3>
            </div>
            
            <p className="text-xs text-gray-300 leading-relaxed">
              This will stop broadcasting the meeting feed to external viewers on <strong>{selectedPlatforms.map(p => PRESET_PLATFORMS[p]?.name).join(', ')}</strong>.
            </p>

            <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-xs text-blue-200">
              <strong>Notice (33.10):</strong> Stopping the livestream will <strong>NOT</strong> end the meeting. All participants will remain connected in the private meeting room.
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowStopConfirm(false)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmStop}
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-colors shadow-lg shadow-red-600/20"
              >
                Stop Broadcast
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveStreamingModal;
