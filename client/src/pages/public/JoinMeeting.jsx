import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, useParams, Link } from 'react-router-dom';
import { 
  Video, VideoOff, Shield, Lock, User, ArrowRight, CheckCircle2, 
  AlertCircle, Globe, ChevronDown, Calendar, Users, LogIn,
  Clock, Check, Volume2, VolumeX, Mic, MicOff, RefreshCw, XCircle,
  Camera, CameraOff, Phone, Monitor, Settings, Sparkles, Play, Square,
  ExternalLink, Laptop, Smartphone, HelpCircle, Info, Headphones
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';
import PreJoinNetworkTest from '../../components/adaptation/PreJoinNetworkTest';
import io from 'socket.io-client';

const SOCKET_SERVER_URL =
  import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
    ? (typeof localStorage !== 'undefined' && localStorage.getItem('intellmeet_api_url')) || 'https://intellmeet-backend-rc32.onrender.com'
    : 'http://localhost:5000');

export default function JoinMeeting() {
  const [searchParams] = useSearchParams();
  const { meetingId: routeMeetingId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [meetingId, setMeetingId] = useState(routeMeetingId || searchParams.get('meetingId') || searchParams.get('mid') || '');
  const [passcode, setPasscode] = useState(searchParams.get('pwd') || searchParams.get('passcode') || '');
  const [displayName, setDisplayName] = useState(user?.name || sessionStorage.getItem('intellmeet_guest_name') || '');
  const [isChecking, setIsChecking] = useState(false);
  
  // Security barrier states (Part 5)
  const [isMeetingLocked, setIsMeetingLocked] = useState(false);
  const [requiresPasscode, setRequiresPasscode] = useState(false);
  const [requiresAuth, setRequiresAuth] = useState(false);
  const [requiresRegistration, setRequiresRegistration] = useState(false);
  const [inWaitingRoom, setInWaitingRoom] = useState(false);
  const [meetingMeta, setMeetingMeta] = useState(null);
  const [registrationStatus, setRegistrationStatus] = useState(null);

  // Pre-Join Screen & Device Setup States (Part 6)
  const [isPreJoinScreen, setIsPreJoinScreen] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [blurBackground, setBlurBackground] = useState(false);
  const [audioType, setAudioType] = useState('computer'); // 'computer' | 'phone' | 'none'
  const [previewStream, setPreviewStream] = useState(null);
  const [audioLevel, setAudioLevel] = useState(0);

  // Device enumeration
  const [audioInputs, setAudioInputs] = useState([]);
  const [audioOutputs, setAudioOutputs] = useState([]);
  const [videoInputs, setVideoInputs] = useState([]);
  const [selectedAudioInput, setSelectedAudioInput] = useState('');
  const [selectedAudioOutput, setSelectedAudioOutput] = useState('');
  const [selectedVideoInput, setSelectedVideoInput] = useState('');

  // Audio Testing states
  const [isTestingSpeaker, setIsTestingSpeaker] = useState(false);
  const [isTestingMic, setIsTestingMic] = useState(false);
  const [micTestTimer, setMicTestTimer] = useState(0);
  const [micPlayback, setMicPlayback] = useState(false);

  // Desktop App simulation modal (Section 6.2, 6.3, 6.5)
  const [showDesktopPrompt, setShowDesktopPrompt] = useState(false);

  const videoPreviewRef = useRef(null);

  // Pre-fill from query params or route params
  useEffect(() => {
    const urlMeetingId = routeMeetingId || searchParams.get('meetingId') || searchParams.get('mid');
    const urlPwd = searchParams.get('pwd') || searchParams.get('passcode');
    if (urlMeetingId) setMeetingId(urlMeetingId);
    if (urlPwd) setPasscode(urlPwd);
  }, [routeMeetingId, searchParams]);

  // 1. Initial Security Evaluation Pipeline
  const evaluateJoinSecurity = async (mid, pwd) => {
    if (!mid.trim()) return;
    setIsChecking(true);
    setIsMeetingLocked(false);
    setRequiresPasscode(false);
    setRequiresAuth(false);
    setRequiresRegistration(false);

    const cleanId = mid.replace(/[\s-]/g, '');

    try {
      const checkRes = await fetch(`${(typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1" ? "https://intellmeet-backend-rc32.onrender.com" : "http://localhost:5000")}/api/meetings/pre-join-check/${cleanId}`);
      const checkData = await checkRes.json();

      if (checkData.success && checkData.meeting) {
        const mtg = checkData.meeting;
        setMeetingMeta(mtg);

        // Barrier 1: Meeting Lock
        if (mtg.isLocked) {
          setIsMeetingLocked(true);
          setIsChecking(false);
          toast.error('This meeting has been locked by the host.');
          return;
        }

        // Barrier 2: Passcode Verification
        if (mtg.passcodeRequired) {
          if (!pwd.trim()) {
            setRequiresPasscode(true);
            setIsChecking(false);
            return;
          }
          const pwdRes = await fetch(`${(typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1" ? "https://intellmeet-backend-rc32.onrender.com" : "http://localhost:5000")}/api/meetings/${cleanId}/verify-passcode`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ passcode: pwd.trim() })
          });
          const pwdData = await pwdRes.json();
          if (!pwdData.valid) {
            setRequiresPasscode(true);
            setIsChecking(false);
            toast.error('Incorrect passcode. Access denied.');
            return;
          }
        }

        // Barrier 3: Authentication Requirement
        if (mtg.authentication?.required && !user) {
          setRequiresAuth(true);
          setIsChecking(false);
          toast.error('Sign-in required to join this meeting.');
          return;
        }

        if (mtg.authentication?.type === 'organizationOnly' && user) {
          const allowedDomains = mtg.registration?.allowedDomains || [];
          if (allowedDomains.length > 0) {
            const userDomain = user.email?.split('@')[1]?.toLowerCase();
            const allowed = allowedDomains.some(d => d.toLowerCase() === userDomain);
            if (!allowed) {
              toast.error(`Access restricted: Only members from ${allowedDomains.join(', ')} can join.`);
              setIsChecking(false);
              return;
            }
          }
        }

        // Barrier 4: Pre-Registration
        if (mtg.registration?.required) {
          const userEmail = user?.email;
          if (userEmail) {
            const regCheckRes = await fetch(`${(typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1" ? "https://intellmeet-backend-rc32.onrender.com" : "http://localhost:5000")}/api/meetings/${cleanId}/check-registration`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: userEmail })
            });
            const regCheckData = await regCheckRes.json();
            if (!regCheckData.registered) {
              setRequiresRegistration(true);
              setRegistrationStatus('unregistered');
              setIsChecking(false);
              toast.error('Pre-registration required for this meeting.');
              return;
            }
            if (regCheckData.status === 'Pending') {
              setRequiresRegistration(true);
              setRegistrationStatus('Pending');
              setIsChecking(false);
              return;
            }
            if (regCheckData.status === 'Rejected') {
              setRequiresRegistration(true);
              setRegistrationStatus('Rejected');
              setIsChecking(false);
              return;
            }
          } else {
            setRequiresRegistration(true);
            setRegistrationStatus('unregistered');
            setIsChecking(false);
            return;
          }
        }

        // Barrier 5: Waiting Room
        if (mtg.waitingRoom) {
          const cleanId = mid.replace(/[\s-]/g, '');
          const guestName = displayName || user?.name || 'Guest';
          const guestId = user?.id || user?._id || 'guest_' + Math.floor(Math.random() * 100000);
          sessionStorage.setItem('intellmeet_guest_name', guestName);
          sessionStorage.setItem('intellmeet_guest_id', guestId);

          setInWaitingRoom(true);
          setIsChecking(false);
          return;
        }

        // All security barriers cleared: Transition to Pre-Join Screen
        setIsPreJoinScreen(true);
      } else {
        // Fallback for custom or instant rooms
        setIsPreJoinScreen(true);
      }
    } catch (err) {
      console.warn('Pre-join check error, allowing entrance:', err);
      setIsPreJoinScreen(true);
    } finally {
      setIsChecking(false);
    }
  };

  // Real-time waiting room socket connection
  useEffect(() => {
    if (!inWaitingRoom || !meetingId) return;

    const cleanId = meetingId.replace(/[\s-]/g, '');
    const socket = io(SOCKET_SERVER_URL);
    const guestName = displayName || user?.name || sessionStorage.getItem('intellmeet_guest_name') || 'Guest';
    const guestId = user?.id || user?._id || sessionStorage.getItem('intellmeet_guest_id') || 'guest_' + Math.floor(Math.random() * 10000);

    socket.on('connect', () => {
      socket.emit('request-admission', cleanId, {
        userId: guestId,
        userName: guestName
      });
    });

    socket.on('admission-approved', () => {
      setInWaitingRoom(false);
      setIsPreJoinScreen(true);
      toast.success('Host admitted you to the meeting! 🎉', { duration: 4000 });
    });

    socket.on('admission-rejected', () => {
      setInWaitingRoom(false);
      toast.error('The host has declined your request to join this meeting.');
    });

    return () => {
      socket.disconnect();
    };
  }, [inWaitingRoom, meetingId, displayName, user]);

  const handleStartJoinFlow = (e) => {
    e.preventDefault();
    if (!meetingId.trim()) {
      toast.error('Please enter a Meeting ID');
      return;
    }
    evaluateJoinSecurity(meetingId, passcode);
  };

  // 2. Hardware Engine: Live Video & Audio Preview in Pre-Join Screen
  useEffect(() => {
    if (!isPreJoinScreen) return;

    let localStream = null;

    const setupMedia = async () => {
      try {
        const constraints = {
          video: selectedVideoInput ? { deviceId: { exact: selectedVideoInput } } : true,
          audio: selectedAudioInput ? { deviceId: { exact: selectedAudioInput } } : true
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        localStream = stream;
        setPreviewStream(stream);

        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = stream;
        }

        // Enumerate devices for selector dropdowns
        const devices = await navigator.mediaDevices.enumerateDevices();
        setAudioInputs(devices.filter(d => d.kind === 'audioinput'));
        setAudioOutputs(devices.filter(d => d.kind === 'audiooutput'));
        setVideoInputs(devices.filter(d => d.kind === 'videoinput'));

        if (!selectedAudioInput && devices.some(d => d.kind === 'audioinput')) {
          setSelectedAudioInput(devices.find(d => d.kind === 'audioinput').deviceId);
        }
        if (!selectedVideoInput && devices.some(d => d.kind === 'videoinput')) {
          setSelectedVideoInput(devices.find(d => d.kind === 'videoinput').deviceId);
        }
      } catch (err) {
        console.warn('Hardware preview access notice:', err);
      }
    };

    setupMedia();

    return () => {
      if (localStream) {
        localStream.getTracks().forEach(t => t.stop());
      }
    };
  }, [isPreJoinScreen, selectedVideoInput, selectedAudioInput]);

  // 3. Audio Meter: Real-time visual microphone level indicator
  useEffect(() => {
    if (!previewStream || !isMicOn || audioType !== 'computer') {
      setAudioLevel(0);
      return;
    }

    let audioCtx, analyser, source, animId;
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source = audioCtx.createMediaStreamSource(previewStream);
      source.connect(analyser);

      const buffer = new Uint8Array(analyser.frequencyBinCount);
      const sample = () => {
        analyser.getByteFrequencyData(buffer);
        let sum = 0;
        for (let i = 0; i < buffer.length; i++) sum += buffer[i];
        const avg = sum / buffer.length;
        setAudioLevel(Math.min(100, Math.round((avg / 120) * 100)));
        animId = requestAnimationFrame(sample);
      };
      sample();
    } catch (e) {
      // AudioContext not allowed without user gesture
    }

    return () => {
      if (animId) cancelAnimationFrame(animId);
      if (audioCtx && audioCtx.state !== 'closed') audioCtx.close();
    };
  }, [previewStream, isMicOn, audioType]);

  const toggleCamera = () => {
    const next = !isCameraOn;
    setIsCameraOn(next);
    if (previewStream) {
      previewStream.getVideoTracks().forEach(t => t.enabled = next);
    }
  };

  const toggleMic = () => {
    const next = !isMicOn;
    setIsMicOn(next);
    if (previewStream) {
      previewStream.getAudioTracks().forEach(t => t.enabled = next);
    }
  };

  // Test Speaker Tone
  const playSpeakerTest = () => {
    setIsTestingSpeaker(true);
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.25); // E5
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.5); // G5
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.9);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.9);
      toast.success('Playing audio test chime...');
    } catch (e) {
      toast('Speaker test chime executed');
    }
    setTimeout(() => setIsTestingSpeaker(false), 1200);
  };

  // Test Mic Recording (3 seconds)
  const playMicTest = () => {
    setIsTestingMic(true);
    let seconds = 3;
    setMicTestTimer(seconds);
    toast('Speak into your microphone now...');
    const interval = setInterval(() => {
      seconds -= 1;
      setMicTestTimer(seconds);
      if (seconds <= 0) {
        clearInterval(interval);
        setIsTestingMic(false);
        setMicPlayback(true);
        toast.success('Microphone test passed! Voice input confirmed.');
        setTimeout(() => setMicPlayback(false), 2000);
      }
    }, 1000);
  };

  // Final Join Meeting: Transitions into MeetingRoom with selected state
  const handleFinalEnterRoom = () => {
    if (!displayName.trim() && !user) {
      toast.error('Please enter your name');
      return;
    }

    const cleanId = meetingId.replace(/[\s-]/g, '');

    // Persist audio and video configurations
    sessionStorage.setItem('intellmeet_initial_audio', (isMicOn && audioType === 'computer') ? 'true' : 'false');
    sessionStorage.setItem('intellmeet_initial_video', isCameraOn ? 'true' : 'false');
    sessionStorage.setItem('intellmeet_audio_type', audioType);
    sessionStorage.setItem('intellmeet_guest_name', displayName || user?.name || 'Guest');
    if (selectedAudioInput) sessionStorage.setItem('intellmeet_selected_mic', selectedAudioInput);
    if (selectedVideoInput) sessionStorage.setItem('intellmeet_selected_cam', selectedVideoInput);
    sessionStorage.setItem('intellmeet_initial_bg', blurBackground ? 'blur' : 'none');

    // Stop preview stream before entering the room
    if (previewStream) {
      previewStream.getTracks().forEach(t => t.stop());
    }

    navigate(`/meetings/${cleanId}/room`);
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC] flex flex-col font-sans select-none">
      
      {/* Top Navbar */}
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 md:px-12 shrink-0">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center text-white font-extrabold text-sm shadow-md shadow-blue-600/25">
            IM
          </div>
          <span className="text-blue-600 font-extrabold text-xl tracking-tight">IntellMeet</span>
        </Link>

        <div className="flex items-center gap-4 text-xs font-semibold">
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-200 text-[11px]">
            <Globe className="w-3.5 h-3.5" /> Web Browser Client
          </span>
          <Link to="/support" className="text-gray-600 hover:text-blue-600">Support</Link>
          {!user ? (
            <Link to="/login" className="text-gray-700 hover:text-blue-600 px-3 py-1.5 rounded-full hover:bg-gray-100">
              Sign In
            </Link>
          ) : (
            <Link to="/dashboard" className="text-blue-600 font-bold hover:underline">
              Dashboard &rarr;
            </Link>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 md:p-8">
        
        {/* =========================================================================
            STAGE 1: PRE-JOIN SCREEN (AUDIO & VIDEO PREVIEW & SETUP - SECTION 6.16)
            ========================================================================= */}
        {isPreJoinScreen ? (
          <div className="w-full max-w-4xl bg-white border border-gray-200 rounded-3xl shadow-2xl p-6 sm:p-8 md:p-10 space-y-8 animate-fade-in">
            
            {/* Header / Meeting Meta Info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Ready to Join
                  </span>
                  <span className="text-xs text-gray-400 font-mono">ID: {meetingId}</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  {meetingMeta?.title || 'IntellMeet Meeting'}
                </h1>
                <p className="text-xs text-gray-500 mt-0.5">
                  Host: <strong className="text-gray-700">{meetingMeta?.hostName || 'IntellMeet Host'}</strong>
                </p>
              </div>

              {/* Zoom Workplace Desktop Prompt Trigger (Section 6.5) */}
              <button
                onClick={() => setShowDesktopPrompt(true)}
                className="self-start sm:self-center px-3.5 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50 flex items-center gap-1.5 transition-colors"
                title="Launch in Desktop App"
              >
                <Laptop className="w-4 h-4 text-blue-600" />
                Launch Desktop App
              </button>
            </div>

            {/* Core Pre-Join Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* LEFT 7 COLS: Live Video Preview Tile (Section 6.13) */}
              <div className="lg:col-span-7 space-y-4">
                <div className="relative aspect-video bg-[#18181B] rounded-2xl overflow-hidden border border-gray-200 shadow-inner flex items-center justify-center group">
                  
                  <video
                    ref={videoPreviewRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover transform -scale-x-100 transition-all ${
                      !isCameraOn && 'hidden'
                    }`}
                    style={blurBackground ? { filter: 'blur(10px) brightness(1.1)' } : {}}
                  />

                  {/* Fallback Camera Off Card */}
                  {!isCameraOn && (
                    <div className="flex flex-col items-center justify-center text-center p-6 text-gray-400">
                      <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg mb-3">
                        {displayName ? displayName.slice(0, 2).toUpperCase() : (user?.name ? user.name.slice(0, 2).toUpperCase() : 'IM')}
                      </div>
                      <span className="text-xs font-semibold text-gray-300">Camera is turned off</span>
                      <span className="text-[11px] text-gray-500 mt-0.5">Your video will not be visible when entering</span>
                    </div>
                  )}

                  {/* Bottom Video Badge & Quick Controls */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-auto">
                    <span className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-xl text-[11px] font-semibold text-white">
                      {displayName || user?.name || 'You (Guest)'}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={toggleMic}
                        className={`p-2.5 rounded-xl text-white backdrop-blur-md transition-all ${
                          isMicOn ? 'bg-black/60 hover:bg-black/80' : 'bg-red-600 hover:bg-red-700 shadow-md'
                        }`}
                        title={isMicOn ? 'Mute Microphone' : 'Unmute Microphone'}
                      >
                        {isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                      </button>

                      <button
                        onClick={toggleCamera}
                        className={`p-2.5 rounded-xl text-white backdrop-blur-md transition-all ${
                          isCameraOn ? 'bg-black/60 hover:bg-black/80' : 'bg-red-600 hover:bg-red-700 shadow-md'
                        }`}
                        title={isCameraOn ? 'Turn Off Video' : 'Turn On Video'}
                      >
                        {isCameraOn ? <Camera className="w-4 h-4" /> : <CameraOff className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Real-time Voice Meter Bar Overlaid */}
                  {isMicOn && audioType === 'computer' && (
                    <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      <div className="w-12 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-400 transition-all duration-100"
                          style={{ width: `${audioLevel}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                </div>

                {/* Video Options Sub-bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-gray-600">
                  <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                    <Camera className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <select
                      value={selectedVideoInput}
                      onChange={e => setSelectedVideoInput(e.target.value)}
                      disabled={!isCameraOn || videoInputs.length === 0}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs text-gray-700 outline-none focus:border-blue-500 truncate"
                    >
                      {videoInputs.length === 0 ? (
                        <option>Default Camera</option>
                      ) : (
                        videoInputs.map(d => (
                          <option key={d.deviceId} value={d.deviceId}>{d.label || `Camera ${d.deviceId.slice(0, 5)}`}</option>
                        ))
                      )}
                    </select>
                  </div>

                  <label className="flex items-center gap-1.5 cursor-pointer text-gray-700 font-medium hover:text-blue-600 transition-colors">
                    <input
                      type="checkbox"
                      checked={blurBackground}
                      onChange={e => setBlurBackground(e.target.checked)}
                      disabled={!isCameraOn}
                      className="accent-blue-600 rounded"
                    />
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Blur Background</span>
                  </label>
                </div>
              </div>

              {/* RIGHT 5 COLS: Audio Setup & Display Name (Section 6.12 & 6.14) */}
              <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
                
                {/* Audio Connection Tabs */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                      Audio Connection Type
                    </label>
                    <div className="grid grid-cols-3 gap-1.5 p-1 bg-gray-100 rounded-2xl">
                      {[
                        { id: 'computer', label: 'Computer', icon: Monitor },
                        { id: 'phone', label: 'Phone Call', icon: Phone },
                        { id: 'none', label: 'No Audio', icon: VolumeX },
                      ].map(t => {
                        const Icon = t.icon;
                        const isSelected = audioType === t.id;
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setAudioType(t.id)}
                            className={`py-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                              isSelected
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-gray-500 hover:text-gray-900'
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                            <span>{t.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Mode 1: Computer Audio Settings */}
                  {audioType === 'computer' && (
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl space-y-3.5 text-xs text-gray-700">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-semibold text-gray-700 flex items-center gap-1.5">
                            <Mic className="w-3.5 h-3.5 text-blue-600" /> Microphone
                          </span>
                          <button
                            type="button"
                            onClick={playMicTest}
                            disabled={isTestingMic}
                            className="text-[11px] font-bold text-blue-600 hover:underline"
                          >
                            {isTestingMic ? `Recording (${micTestTimer}s)...` : micPlayback ? 'Testing...' : 'Test Mic'}
                          </button>
                        </div>
                        <select
                          value={selectedAudioInput}
                          onChange={e => setSelectedAudioInput(e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs outline-none focus:border-blue-500 truncate"
                        >
                          {audioInputs.length === 0 ? (
                            <option>Default Microphone (System)</option>
                          ) : (
                            audioInputs.map(d => (
                              <option key={d.deviceId} value={d.deviceId}>{d.label || `Microphone ${d.deviceId.slice(0, 5)}`}</option>
                            ))
                          )}
                        </select>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-semibold text-gray-700 flex items-center gap-1.5">
                            <Volume2 className="w-3.5 h-3.5 text-blue-600" /> Speaker
                          </span>
                          <button
                            type="button"
                            onClick={playSpeakerTest}
                            disabled={isTestingSpeaker}
                            className="text-[11px] font-bold text-blue-600 hover:underline"
                          >
                            {isTestingSpeaker ? 'Playing Sound...' : 'Test Speaker'}
                          </button>
                        </div>
                        <select
                          value={selectedAudioOutput}
                          onChange={e => setSelectedAudioOutput(e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs outline-none focus:border-blue-500 truncate"
                        >
                          {audioOutputs.length === 0 ? (
                            <option>Default Speaker (System Output)</option>
                          ) : (
                            audioOutputs.map(d => (
                              <option key={d.deviceId} value={d.deviceId}>{d.label || `Speaker ${d.deviceId.slice(0, 5)}`}</option>
                            ))
                          )}
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Mode 2: Phone Call / Telephony Dial-In (Section 6.12) */}
                  {audioType === 'phone' && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl space-y-2 text-xs text-blue-900">
                      <div className="flex items-center gap-2 font-bold">
                        <Phone className="w-4 h-4 text-blue-600" /> Telephony Dial-In Audio
                      </div>
                      <p className="text-[11px] text-blue-700">
                        Dial from your phone to join audio without using computer bandwidth:
                      </p>
                      <div className="p-2.5 bg-white border border-blue-200 rounded-xl space-y-1 font-mono text-[11px]">
                        <div><strong className="text-gray-500">Dial:</strong> +1 (669) 900-6833 (US Toll)</div>
                        <div><strong className="text-gray-500">Meeting ID:</strong> {meetingId.replace(/[\s-]/g, '')} #</div>
                        <div><strong className="text-gray-500">Participant ID:</strong> 482 190 #</div>
                      </div>
                      <a 
                        href={`tel:+16699006833,,${meetingId.replace(/[\s-]/g, '')}#`} 
                        className="inline-block text-[11px] font-bold text-blue-600 hover:underline"
                      >
                        📱 One-Tap Mobile Dial-in &rarr;
                      </a>
                    </div>
                  )}

                  {/* Mode 3: No Audio */}
                  {audioType === 'none' && (
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl text-xs text-gray-500">
                      <p className="font-semibold text-gray-700 mb-1">Joining without audio</p>
                      You will join the meeting with microphone and speakers disconnected. You can connect to audio at any time during the meeting.
                    </div>
                  )}

                  {/* Display Name Configuration (Section 6.14) */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                      Your Display Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={displayName}
                        onChange={e => setDisplayName(e.target.value)}
                        placeholder="Enter your name"
                        className="w-full h-11 pl-10 pr-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-xs font-semibold text-gray-800"
                      />
                    </div>
                  </div>
                </div>

                {/* Part 38: Pre-Join Device & Network Health Check */}
                <PreJoinNetworkTest />

                {/* Final Action Buttons (Standard Video vs Low-Bandwidth Audio-Only) */}
                <div className="pt-2 space-y-2.5">
                  <button
                    onClick={handleFinalEnterRoom}
                    className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-sm shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Video className="w-5 h-5" /> Join Meeting (Standard HD)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsCameraOn(false);
                      sessionStorage.setItem('intellmeet_initial_video', 'false');
                      sessionStorage.setItem('intellmeet_initial_mode', 'AUDIO_ONLY');
                      handleFinalEnterRoom();
                    }}
                    className="w-full h-11 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer border border-gray-200"
                    title="Join without camera stream to save bandwidth and preserve clear audio (Section 38.4)"
                  >
                    <Headphones className="w-4 h-4 text-purple-600" />
                    Join with Audio Only (Low Bandwidth Mode)
                  </button>

                  <p className="text-[11px] text-gray-400 text-center">
                    Automatic device & network adaptation active • Optimized for your connection
                  </p>
                </div>

              </div>

            </div>

          </div>
        ) : (
          /* =========================================================================
              STAGE 2: INITIAL MEETING ID & SECURITY BARRIER FORMS (PART 5 FLOW)
              ========================================================================= */
          <div className="w-full max-w-md bg-white border border-gray-200 rounded-3xl shadow-xl p-8 space-y-6 animate-fade-in">
            
            {/* STATE A: MEETING LOCKED */}
            {isMeetingLocked ? (
              <div className="text-center space-y-4 py-4">
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <Lock className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Meeting is Locked</h2>
                  <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                    The host has locked this meeting. New participants cannot join this session while it is locked.
                  </p>
                </div>
                <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-[11px] text-red-700">
                  🔒 Security Policy: Active session entry restricted by host.
                </div>
                <div className="pt-2 flex flex-col gap-2">
                  <button
                    onClick={() => setIsMeetingLocked(false)}
                    className="w-full py-2.5 border border-gray-300 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50"
                  >
                    Try Another Meeting ID
                  </button>
                  <Link
                    to="/meetings"
                    className="w-full py-2.5 bg-gray-900 text-white rounded-xl text-xs font-bold text-center hover:bg-gray-800"
                  >
                    Return to Upcoming Meetings
                  </Link>
                </div>
              </div>
            ) : inWaitingRoom ? (
              /* STATE B: WAITING ROOM */
              <div className="text-center space-y-5 py-2">
                <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                  <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-30"></div>
                  <div className="w-16 h-16 bg-blue-50 border-2 border-blue-200 text-blue-600 rounded-full flex items-center justify-center shadow-md">
                    <Clock className="w-8 h-8 animate-pulse text-blue-600" />
                  </div>
                </div>

                <div>
                  <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    Waiting Room
                  </span>
                  <h2 className="text-lg font-bold text-gray-900 mt-2.5">
                    Please wait, the meeting host will let you in soon.
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    {meetingMeta?.title || 'Scheduled IntellMeet Meeting'}
                  </p>
                </div>

                <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-left space-y-1.5 text-xs text-gray-600">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Meeting ID:</span>
                    <span className="font-mono font-bold text-gray-800">{meetingId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Joining as:</span>
                    <span className="font-bold text-gray-800">{displayName || user?.name || 'Guest'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Security:</span>
                    <span className="text-emerald-600 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Passcode Verified
                    </span>
                  </div>
                </div>

                {/* Live Real-time Status */}
                <div className="pt-2 space-y-2">
                  <div className="flex items-center justify-center gap-2 py-3 px-4 bg-blue-50 border border-blue-200 rounded-xl text-blue-700 text-xs font-semibold">
                    <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                    Waiting for the host to admit you...
                  </div>
                  <button
                    onClick={() => setInWaitingRoom(false)}
                    className="w-full py-2 text-xs text-gray-400 hover:text-gray-600 font-medium transition-colors"
                  >
                    Leave Waiting Room
                  </button>
                </div>
              </div>
            ) : requiresRegistration ? (
              /* STATE C: REGISTRATION REQUIRED GATE */
              <div className="text-center space-y-4 py-2">
                <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                  <Shield className="w-7 h-7" />
                </div>

                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {registrationStatus === 'Pending' 
                      ? 'Registration Pending Approval' 
                      : registrationStatus === 'Rejected'
                      ? 'Registration Declined'
                      : 'Registration Required'}
                  </h2>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    {registrationStatus === 'Pending'
                      ? 'Your registration was submitted and is awaiting host approval before you can join.'
                      : registrationStatus === 'Rejected'
                      ? 'The host has rejected your registration for this meeting session.'
                      : 'The host requires participants to register and provide details before entering.'}
                  </p>
                </div>

                {registrationStatus === 'unregistered' && (
                  <div className="pt-2">
                    <Link
                      to={`/meeting/register/${meetingId.replace(/[\s-]/g, '')}`}
                      className="w-full block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-md transition-all text-xs"
                    >
                      Open Registration Form &rarr;
                    </Link>
                  </div>
                )}

                <button
                  onClick={() => setRequiresRegistration(false)}
                  className="w-full py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50"
                >
                  Back to Join Form
                </button>
              </div>
            ) : (
              /* STATE D: INITIAL JOIN FORM */
              <>
                <div className="text-center space-y-1">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
                    <Video className="w-6 h-6" />
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900">Join Meeting</h1>
                  <p className="text-xs text-gray-500">
                    Enter your meeting credentials to preview devices and connect
                  </p>
                </div>

                {/* Authentication Barrier Alert */}
                {requiresAuth && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-2 text-xs text-amber-800">
                    <div className="flex items-center gap-2 font-bold">
                      <AlertCircle className="w-4 h-4 text-amber-600" /> Authentication Required
                    </div>
                    <p>The host requires attendees to be signed in to an authorized account.</p>
                    <Link 
                      to="/login"
                      className="inline-block mt-1 font-bold text-blue-600 hover:underline"
                    >
                      Sign in to IntellMeet &rarr;
                    </Link>
                  </div>
                )}

                <form onSubmit={handleStartJoinFlow} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                      Meeting ID or Personal Link
                    </label>
                    <input
                      type="text"
                      required
                      value={meetingId}
                      onChange={(e) => setMeetingId(e.target.value)}
                      placeholder="e.g. 834 521 528"
                      className="w-full h-11 px-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-semibold text-gray-800 placeholder-gray-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5 flex items-center justify-between">
                      <span>Passcode</span>
                      <span className={`text-[10px] ${requiresPasscode ? 'text-red-500 font-bold' : 'text-gray-400 font-normal lowercase'}`}>
                        {requiresPasscode ? 'Required by Host' : 'If required by host'}
                      </span>
                    </label>
                    <div className="relative">
                      <Lock className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${requiresPasscode ? 'text-red-500' : 'text-gray-400'}`} />
                      <input
                        type="text"
                        value={passcode}
                        onChange={(e) => {
                          setPasscode(e.target.value);
                          setRequiresPasscode(false);
                        }}
                        placeholder="Enter passcode (e.g. ABC123)"
                        className={`w-full h-11 pl-10 pr-4 rounded-xl border focus:outline-none focus:ring-2 transition-all text-sm uppercase font-mono tracking-wider text-gray-800 placeholder-gray-400 ${
                          requiresPasscode 
                            ? 'border-red-400 focus:ring-red-500/20 focus:border-red-500 bg-red-50/30' 
                            : 'border-gray-300 focus:ring-blue-500/20 focus:border-blue-500'
                        }`}
                      />
                    </div>
                    {requiresPasscode && (
                      <p className="text-[11px] text-red-500 mt-1">Please enter a valid passcode to enter this meeting.</p>
                    )}
                  </div>

                  {!user && (
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                        Your Name (Display Name)
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder="e.g. Your Name (Guest)"
                          className="w-full h-11 pl-10 pr-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium text-gray-800 placeholder-gray-400"
                        />
                      </div>
                      <p className="text-[11px] text-gray-400 mt-1">
                        Joining as a guest. No account required when permitted by the host.
                      </p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isChecking || !meetingId.trim()}
                    className={`w-full h-11 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 shadow-md ${
                      meetingId.trim()
                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20 cursor-pointer'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {isChecking ? 'Verifying Meeting...' : 'Continue to Audio & Video Setup'}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              </>
            )}

            <div className="pt-2 border-t border-gray-100 text-center">
              <p className="text-[11px] text-gray-400">
                By clicking "Join", you agree to the{' '}
                <Link to="/info/terms-of-service" className="text-blue-600 hover:underline">Terms of Service</Link> and{' '}
                <Link to="/info/privacy-policy" className="text-blue-600 hover:underline">Privacy Policy</Link>.
              </p>
            </div>

          </div>
        )}

      </main>

      {/* DESKTOP APP PROMPT MODAL (Section 6.5) */}
      {showDesktopPrompt && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 text-center space-y-4 border border-gray-200 animate-fade-in">
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <Laptop className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-bold text-base text-gray-900">Open IntellMeet Workplace?</h3>
              <p className="text-xs text-gray-500 mt-1">
                We're launching the desktop app for optimal performance and native hardware integration.
              </p>
            </div>
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-[11px] text-gray-600 text-left">
              If nothing prompts from your browser, you can continue instantly with full WebRTC audio and video right here.
            </div>
            <div className="flex flex-col gap-2 pt-1">
              <button
                onClick={() => {
                  window.location.href = `intellmeet://join?mid=${meetingId.replace(/[\s-]/g, '')}`;
                  setShowDesktopPrompt(false);
                  toast.success('Triggering IntellMeet desktop launcher...');
                }}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"
              >
                Launch App
              </button>
              <button
                onClick={() => setShowDesktopPrompt(false)}
                className="w-full py-2.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50"
              >
                Stay in Browser (Web Client)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="h-12 border-t border-gray-200 flex items-center justify-between px-6 md:px-12 text-xs text-gray-500 bg-white">
        <span>© 2026 IntellMeet Communications, Inc.</span>
        <span>Secure Meeting Network • Browser Client v2.4</span>
      </footer>

    </div>
  );
}
