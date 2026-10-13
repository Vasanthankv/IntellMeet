import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';
import { 
  Settings, Mic, Video, Image, PlaySquare, Accessibility, Shield, 
  Volume2, VolumeX, Check, Camera, RefreshCw, Sliders, Radio, Sparkles, Palette, Globe
} from 'lucide-react';
import PersonalizationWorkspace from '../../components/personalization/PersonalizationWorkspace';
import IntegrationsWorkspace from '../../components/integrations/IntegrationsWorkspace';

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('meeting');
  const [loading, setLoading] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab) setActiveTab(tab);
  }, [location.search]);

  // Settings State with real defaults
  const [settings, setSettings] = useState({
    meeting: {
      hostVideo: true,
      participantVideo: true,
      joinBeforeHost: false,
      muteUponEntry: true,
      waitingRoom: true,
      requirePasscode: true,
      watermark: false,
    },
    audio: {
      microphone: 'Default Microphone (Realtek Audio)',
      speaker: 'Default Speakers (Realtek Audio)',
      micVolume: 80,
      speakerVolume: 85,
      noiseSuppression: 'auto', // auto, low, medium, high
      originalSound: false,
    },
    video: {
      camera: 'Integrated HD Webcam (04f2:b6d9)',
      hdVideo: true,
      mirrorVideo: true,
      touchUpAppearance: true,
      appearanceLevel: 50,
      adjustLowLight: true,
    },
    background: {
      selected: 'blur', // none, blur, office, livingroom, nature
      blurIntensity: 10,
    },
    recording: {
      localRecording: true,
      cloudRecording: true,
      autoRecording: false,
      recordingPath: 'IntellMeet/Recordings',
    },
    accessibility: {
      closedCaptioning: true,
      fontSize: 'medium', // small, medium, large
      screenReaderAlerts: true,
      highContrast: false,
    }
  });

  // Media preview streams
  const [previewStream, setPreviewStream] = useState(null);
  const videoPreviewRef = useRef(null);
  const [isTestingMic, setIsTestingMic] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);

  // Fetch settings from MongoDB on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await fetch('http://localhost:5000/api/users/me/settings', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success && data.settings) {
          setSettings(prev => ({
            ...prev,
            ...data.settings
          }));
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      }
    };
    fetchSettings();
  }, []);

  // Manage Video Preview Stream when on Video or Background tab
  useEffect(() => {
    let localStream = null;
    if (activeTab === 'video' || activeTab === 'background') {
      navigator.mediaDevices?.getUserMedia({ video: true, audio: false })
        .then(stream => {
          localStream = stream;
          setPreviewStream(stream);
          if (videoPreviewRef.current) {
            videoPreviewRef.current.srcObject = stream;
          }
        })
        .catch(err => {
          console.log('Video preview not available:', err);
        });
    } else {
      if (previewStream) {
        previewStream.getTracks().forEach(t => t.stop());
        setPreviewStream(null);
      }
    }

    return () => {
      if (localStream) {
        localStream.getTracks().forEach(t => t.stop());
      }
    };
  }, [activeTab]);

  // Audio Testing Mic Level simulation
  useEffect(() => {
    let interval;
    if (isTestingMic) {
      interval = setInterval(() => {
        setMicLevel(Math.floor(Math.random() * 60) + 20);
      }, 100);
    } else {
      setMicLevel(0);
    }
    return () => clearInterval(interval);
  }, [isTestingMic]);

  // Save changes to backend
  const updateSetting = async (category, field, value) => {
    const updatedCategory = {
      ...settings[category],
      [field]: value
    };
    const newSettings = {
      ...settings,
      [category]: updatedCategory
    };
    setSettings(newSettings);

    try {
      const token = localStorage.getItem('token');
      await fetch('http://localhost:5000/api/users/me/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ [category]: updatedCategory })
      });
      toast.success('Setting saved');
    } catch (err) {
      toast.error('Failed to save setting to backend');
    }
  };

  const playTestSpeakerSound = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5 chime
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
      toast.success('Speaker test tone played');
    } catch (e) {
      toast.error('Audio playback error');
    }
  };

  const tabs = [
    { id: 'meeting', label: 'Meeting', icon: Settings, desc: 'Schedule preferences & security' },
    { id: 'personalization', label: 'Personalization', icon: Palette, desc: 'Theme, wallpaper, toolbar & views (37)' },
    { id: 'audio', label: 'Audio', icon: Mic, desc: 'Microphone & speaker calibration' },
    { id: 'video', label: 'Video', icon: Video, desc: 'Camera preview & quality' },
    { id: 'background', label: 'Virtual Background', icon: Image, desc: 'Background effects & blur' },
    { id: 'recording', label: 'Recording', icon: PlaySquare, desc: 'Local & Cloud storage' },
    { id: 'integrations', label: 'Integrations & Apps', icon: Globe, desc: 'Calendar, Slack, Jira & Marketplace (39)' },
    { id: 'accessibility', label: 'Accessibility', icon: Accessibility, desc: 'Closed captions & alerts' }
  ];

  const virtualBackgrounds = [
    { id: 'none', label: 'None', preview: 'bg-gray-800' },
    { id: 'blur', label: 'Blur', preview: 'bg-gradient-to-r from-blue-900 to-indigo-950 backdrop-blur' },
    { id: 'office', label: 'Modern Office', image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=300&auto=format&fit=crop&q=80' },
    { id: 'livingroom', label: 'Warm Living Room', image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=300&auto=format&fit=crop&q=80' },
    { id: 'nature', label: 'Nature Landscape', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=300&auto=format&fit=crop&q=80' },
  ];

  return (
    <div className="flex h-screen bg-[#1E1E1E] text-gray-100 font-sans overflow-hidden">
      
      {/* Left Sidebar Navigation */}
      <div className="w-72 bg-[#181818] border-r border-[#2C2C2C] flex flex-col shrink-0">
        <div className="p-6 border-b border-[#2C2C2C]">
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-500" />
            User Settings
          </h2>
          <p className="text-xs text-gray-400 mt-1">Configure your meeting workspace</p>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' 
                    : 'text-gray-400 hover:text-white hover:bg-[#252525]'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                <div className="text-left">
                  <div>{tab.label}</div>
                  <div className={`text-[11px] font-normal ${isActive ? 'text-blue-100' : 'text-gray-500'}`}>{tab.desc}</div>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Right Content Panel */}
      <div className="flex-1 overflow-y-auto p-8 bg-[#1E1E1E]">
        <div className="max-w-3xl mx-auto space-y-8">
          
          {/* TAB 1: MEETING SETTINGS */}
          {activeTab === 'meeting' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-white">Meeting Preferences</h3>
                <p className="text-sm text-gray-400 mt-1">Configure how meetings behave when you host or join.</p>
              </div>

              {/* General Meeting Controls */}
              <div className="bg-[#242424] border border-[#333] rounded-2xl p-6 space-y-5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400">Host & Participant Defaults</h4>
                
                <div className="flex items-center justify-between py-2 border-b border-[#2E2E2E]">
                  <div>
                    <p className="text-sm font-semibold text-white">Host video</p>
                    <p className="text-xs text-gray-400">Start meetings with host video turned on</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={settings.meeting.hostVideo} 
                    onChange={e => updateSetting('meeting', 'hostVideo', e.target.checked)}
                    className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between py-2 border-b border-[#2E2E2E]">
                  <div>
                    <p className="text-sm font-semibold text-white">Participants video</p>
                    <p className="text-xs text-gray-400">Start meetings with participants video turned on</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={settings.meeting.participantVideo} 
                    onChange={e => updateSetting('meeting', 'participantVideo', e.target.checked)}
                    className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between py-2 border-b border-[#2E2E2E]">
                  <div>
                    <p className="text-sm font-semibold text-white">Join before host</p>
                    <p className="text-xs text-gray-400">Allow participants to join the meeting before the host arrives</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={settings.meeting.joinBeforeHost} 
                    onChange={e => updateSetting('meeting', 'joinBeforeHost', e.target.checked)}
                    className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-semibold text-white">Mute participants upon entry</p>
                    <p className="text-xs text-gray-400">Automatically mute all attendees when they join</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={settings.meeting.muteUponEntry} 
                    onChange={e => updateSetting('meeting', 'muteUponEntry', e.target.checked)}
                    className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
                  />
                </div>
              </div>

              {/* Security Preferences */}
              <div className="bg-[#242424] border border-[#333] rounded-2xl p-6 space-y-5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" /> Meeting Security Controls
                </h4>

                <div className="flex items-center justify-between py-2 border-b border-[#2E2E2E]">
                  <div>
                    <p className="text-sm font-semibold text-white">Waiting Room</p>
                    <p className="text-xs text-gray-400">When attendees join, admit them one-by-one from the waiting room</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={settings.meeting.waitingRoom} 
                    onChange={e => updateSetting('meeting', 'waitingRoom', e.target.checked)}
                    className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-semibold text-white">Require Passcode</p>
                    <p className="text-xs text-gray-400">Protect all scheduled meetings with a 6-digit access code</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={settings.meeting.requirePasscode} 
                    onChange={e => updateSetting('meeting', 'requirePasscode', e.target.checked)}
                    className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB: PERSONALIZATION (PART 37) */}
          {activeTab === 'personalization' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-white">Personalization</h3>
                <p className="text-sm text-gray-400 mt-1">Configure meeting themes, custom wallpaper, toolbar organization, and multi-speaker views.</p>
              </div>

              <div className="bg-[#242424] border border-[#333] rounded-2xl p-6">
                <PersonalizationWorkspace isModal={false} />
              </div>
            </div>
          )}

          {/* TAB 2: AUDIO SETTINGS */}
          {activeTab === 'audio' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-white">Audio Settings</h3>
                <p className="text-sm text-gray-400 mt-1">Calibrate speaker, microphone, and noise suppression.</p>
              </div>

              {/* Speaker Calibration */}
              <div className="bg-[#242424] border border-[#333] rounded-2xl p-6 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-blue-400" /> Speaker
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  <select 
                    value={settings.audio.speaker}
                    onChange={e => updateSetting('audio', 'speaker', e.target.value)}
                    className="md:col-span-2 bg-[#1A1A1A] border border-[#3A3A3A] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  >
                    <option>Default Speakers (Realtek Audio)</option>
                    <option>Headphones (High Definition Audio Device)</option>
                    <option>External USB Audio Output</option>
                  </select>
                  <button 
                    onClick={playTestSpeakerSound}
                    className="px-4 py-2.5 bg-[#333] hover:bg-[#444] text-white text-xs font-semibold rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
                  >
                    <Volume2 className="w-4 h-4" /> Test Speaker
                  </button>
                </div>

                <div className="pt-2">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Output Volume</span>
                    <span>{settings.audio.speakerVolume}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={settings.audio.speakerVolume}
                    onChange={e => updateSetting('audio', 'speakerVolume', Number(e.target.value))}
                    className="w-full h-1.5 bg-[#333] rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>
              </div>

              {/* Microphone Calibration */}
              <div className="bg-[#242424] border border-[#333] rounded-2xl p-6 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                  <Mic className="w-4 h-4 text-purple-400" /> Microphone
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  <select 
                    value={settings.audio.microphone}
                    onChange={e => updateSetting('audio', 'microphone', e.target.value)}
                    className="md:col-span-2 bg-[#1A1A1A] border border-[#3A3A3A] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  >
                    <option>Default Microphone (Realtek Audio)</option>
                    <option>USB Studio Condenser Mic</option>
                    <option>Bluetooth Headset Audio In</option>
                  </select>
                  <button 
                    onClick={() => setIsTestingMic(!isTestingMic)}
                    className={`px-4 py-2.5 text-xs font-semibold rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2 ${
                      isTestingMic ? 'bg-red-600 text-white' : 'bg-[#333] hover:bg-[#444] text-white'
                    }`}
                  >
                    <Mic className="w-4 h-4" /> {isTestingMic ? 'Stop Test' : 'Test Mic'}
                  </button>
                </div>

                {/* Live Mic Meter */}
                <div className="pt-2">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Input Level</span>
                    <span>{isTestingMic ? 'Speaking...' : 'Idle'}</span>
                  </div>
                  <div className="w-full h-2 bg-[#333] rounded-full overflow-hidden flex">
                    <div 
                      className="bg-emerald-500 h-full transition-all duration-75"
                      style={{ width: `${isTestingMic ? micLevel : 0}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Input Volume</span>
                    <span>{settings.audio.micVolume}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={settings.audio.micVolume}
                    onChange={e => updateSetting('audio', 'micVolume', Number(e.target.value))}
                    className="w-full h-1.5 bg-[#333] rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>
              </div>

              {/* Noise Suppression */}
              <div className="bg-[#242424] border border-[#333] rounded-2xl p-6 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400">Suppress Background Noise</h4>
                <p className="text-xs text-gray-400">Reduce keyboard clicks, fans, dogs barking, and room echo.</p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                  {[
                    { id: 'auto', label: 'Auto (Recommended)' },
                    { id: 'low', label: 'Low (Faint music)' },
                    { id: 'medium', label: 'Medium (Keyboard)' },
                    { id: 'high', label: 'High (Barking/Lawn)' }
                  ].map(lvl => (
                    <button
                      key={lvl.id}
                      onClick={() => updateSetting('audio', 'noiseSuppression', lvl.id)}
                      className={`p-3 rounded-xl border text-xs font-semibold text-center transition-all ${
                        settings.audio.noiseSuppression === lvl.id
                          ? 'border-blue-500 bg-blue-600/20 text-blue-300'
                          : 'border-[#3A3A3A] bg-[#1A1A1A] text-gray-400 hover:text-white'
                      }`}
                    >
                      {lvl.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: VIDEO SETTINGS */}
          {activeTab === 'video' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-white">Video Settings</h3>
                <p className="text-sm text-gray-400 mt-1">Preview your camera feed and configure appearance effects.</p>
              </div>

              {/* Live Camera Preview */}
              <div className="bg-[#242424] border border-[#333] rounded-2xl p-6 space-y-4">
                <div className="relative aspect-video max-w-xl mx-auto rounded-xl overflow-hidden bg-black border border-[#333] flex items-center justify-center shadow-2xl">
                  <video 
                    ref={videoPreviewRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    className="w-full h-full object-cover"
                    style={{
                      transform: settings.video.mirrorVideo ? 'scaleX(-1)' : 'none',
                      filter: settings.video.touchUpAppearance ? `brightness(1.1) contrast(1.05)` : 'none'
                    }}
                  />
                  {!previewStream && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/80 text-gray-400">
                      <Camera className="w-12 h-12 mb-2 opacity-50" />
                      <p className="text-xs">Camera preview active</p>
                    </div>
                  )}
                  <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-md text-[11px] font-medium text-emerald-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Live Camera Feed
                  </div>
                </div>

                <div className="pt-2">
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">Camera Device</label>
                  <select 
                    value={settings.video.camera}
                    onChange={e => updateSetting('video', 'camera', e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-[#3A3A3A] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  >
                    <option>Integrated HD Webcam (04f2:b6d9)</option>
                    <option>Logitech C920 Pro HD Webcam</option>
                    <option>OBS Virtual Camera</option>
                  </select>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between py-1">
                    <span className="text-sm text-white">Enable HD video</span>
                    <input 
                      type="checkbox" 
                      checked={settings.video.hdVideo} 
                      onChange={e => updateSetting('video', 'hdVideo', e.target.checked)}
                      className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between py-1">
                    <span className="text-sm text-white">Mirror my video</span>
                    <input 
                      type="checkbox" 
                      checked={settings.video.mirrorVideo} 
                      onChange={e => updateSetting('video', 'mirrorVideo', e.target.checked)}
                      className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between py-1">
                    <span className="text-sm text-white">Touch up my appearance</span>
                    <input 
                      type="checkbox" 
                      checked={settings.video.touchUpAppearance} 
                      onChange={e => updateSetting('video', 'touchUpAppearance', e.target.checked)}
                      className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: VIRTUAL BACKGROUNDS */}
          {activeTab === 'background' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-white">Virtual Backgrounds & Effects</h3>
                <p className="text-sm text-gray-400 mt-1">Select or upload a background image to hide your real environment.</p>
              </div>

              {/* Stage Preview with applied filter */}
              <div className="bg-[#242424] border border-[#333] rounded-2xl p-6 space-y-6">
                <div className="relative aspect-video max-w-xl mx-auto rounded-xl overflow-hidden bg-black border border-[#333] flex items-center justify-center shadow-2xl">
                  {/* Virtual Background Layer */}
                  {settings.background.selected !== 'none' && settings.background.selected !== 'blur' && (
                    <img 
                      src={virtualBackgrounds.find(b => b.id === settings.background.selected)?.image} 
                      alt="Virtual Background"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  )}
                  <video 
                    ref={videoPreviewRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    className="relative z-10 w-full h-full object-cover"
                    style={{
                      filter: settings.background.selected === 'blur' ? 'blur(12px) brightness(1.1)' : 'none',
                      opacity: settings.background.selected !== 'none' && settings.background.selected !== 'blur' ? 0.85 : 1
                    }}
                  />
                  <div className="absolute top-3 left-3 z-20 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-md text-[11px] font-semibold text-purple-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Effect: {virtualBackgrounds.find(b => b.id === settings.background.selected)?.label}
                  </div>
                </div>

                {/* Background Selection Grid */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Choose Virtual Background</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {virtualBackgrounds.map(bg => (
                      <button
                        key={bg.id}
                        onClick={() => updateSetting('background', 'selected', bg.id)}
                        className={`group relative rounded-xl overflow-hidden aspect-video border-2 transition-all ${
                          settings.background.selected === bg.id 
                            ? 'border-blue-500 ring-2 ring-blue-500/40 scale-105' 
                            : 'border-[#3A3A3A] hover:border-gray-500'
                        }`}
                      >
                        {bg.image ? (
                          <img src={bg.image} alt={bg.label} className="w-full h-full object-cover" />
                        ) : (
                          <div className={`w-full h-full ${bg.preview} flex items-center justify-center text-xs font-semibold text-white`}>
                            {bg.label}
                          </div>
                        )}
                        <span className="absolute bottom-1 inset-x-1 text-[10px] text-center bg-black/70 backdrop-blur-sm text-white py-0.5 rounded font-medium">
                          {bg.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: RECORDING SETTINGS */}
          {activeTab === 'recording' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-white">Recording Settings</h3>
                <p className="text-sm text-gray-400 mt-1">Manage local and cloud video storage preferences.</p>
              </div>

              <div className="bg-[#242424] border border-[#333] rounded-2xl p-6 space-y-5">
                <div className="flex items-center justify-between py-2 border-b border-[#2E2E2E]">
                  <div>
                    <p className="text-sm font-semibold text-white">Local Recording</p>
                    <p className="text-xs text-gray-400">Allow hosts and participants to record video & audio locally</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={settings.recording.localRecording} 
                    onChange={e => updateSetting('recording', 'localRecording', e.target.checked)}
                    className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between py-2 border-b border-[#2E2E2E]">
                  <div>
                    <p className="text-sm font-semibold text-white">Cloud Recording & AI Transcription</p>
                    <p className="text-xs text-gray-400">Automatically store recordings on server for instant Gemini summaries</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={settings.recording.cloudRecording} 
                    onChange={e => updateSetting('recording', 'cloudRecording', e.target.checked)}
                    className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
                  />
                </div>

                <div className="pt-2">
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">Local Storage Path</label>
                  <input 
                    type="text" 
                    value={settings.recording.recordingPath} 
                    onChange={e => updateSetting('recording', 'recordingPath', e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-[#3A3A3A] rounded-xl px-4 py-2.5 text-xs font-mono text-gray-300 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: ACCESSIBILITY */}
          {activeTab === 'accessibility' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-white">Accessibility</h3>
                <p className="text-sm text-gray-400 mt-1">Configure closed caption font sizes and screen reader compatibility.</p>
              </div>

              <div className="bg-[#242424] border border-[#333] rounded-2xl p-6 space-y-5">
                <div className="flex items-center justify-between py-2 border-b border-[#2E2E2E]">
                  <div>
                    <p className="text-sm font-semibold text-white">Always Show Closed Captioning</p>
                    <p className="text-xs text-gray-400">Display automated live subtitles as participants speak</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={settings.accessibility.closedCaptioning} 
                    onChange={e => updateSetting('accessibility', 'closedCaptioning', e.target.checked)}
                    className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-2">Closed Caption Font Size</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['small', 'medium', 'large'].map(size => (
                      <button
                        key={size}
                        onClick={() => updateSetting('accessibility', 'fontSize', size)}
                        className={`py-2 rounded-xl text-xs font-semibold capitalize border transition-all ${
                          settings.accessibility.fontSize === size 
                            ? 'border-blue-500 bg-blue-600 text-white' 
                            : 'border-[#3A3A3A] bg-[#1A1A1A] text-gray-400 hover:text-white'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between py-2 pt-4 border-t border-[#2E2E2E]">
                  <div>
                    <p className="text-sm font-semibold text-white">Screen Reader Audio Alerts</p>
                    <p className="text-xs text-gray-400">Play subtle cues when attendees join or send chat messages</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={settings.accessibility.screenReaderAlerts} 
                    onChange={e => updateSetting('accessibility', 'screenReaderAlerts', e.target.checked)}
                    className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: INTEGRATIONS & APPS (PART 39) */}
          {activeTab === 'integrations' && (
            <IntegrationsWorkspace />
          )}

        </div>
      </div>
    </div>
  );
}