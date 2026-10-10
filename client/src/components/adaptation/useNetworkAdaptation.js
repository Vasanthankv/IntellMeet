import { useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';

// Device & Network Detection Helpers (Section 38.1 - 38.6)
export const getDeviceInfo = () => {
  const ua = navigator.userAgent;
  let operatingSystem = 'Unknown OS';
  if (/Windows/i.test(ua)) operatingSystem = 'Windows';
  else if (/Macintosh|Mac OS X/i.test(ua)) operatingSystem = 'macOS';
  else if (/Linux/i.test(ua)) operatingSystem = 'Linux';
  else if (/Android/i.test(ua)) operatingSystem = 'Android';
  else if (/iPhone|iPad|iPod/i.test(ua)) operatingSystem = 'iOS';

  let browser = 'Unknown Browser';
  if (/Edg\//i.test(ua)) browser = 'Microsoft Edge';
  else if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua)) browser = 'Google Chrome';
  else if (/Firefox\//i.test(ua)) browser = 'Mozilla Firefox';
  else if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) browser = 'Apple Safari';

  let deviceType = 'DESKTOP';
  if (/Mobi|Android|iPhone|iPod/i.test(ua)) deviceType = 'MOBILE';
  else if (/iPad|Tablet/i.test(ua)) deviceType = 'TABLET';
  else deviceType = 'BROWSER';

  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  let connectionType = 'WIFI';
  if (connection) {
    if (connection.type === 'cellular') {
      connectionType = connection.effectiveType === '4g' ? 'CELLULAR_4G' : 'CELLULAR_5G';
    } else if (connection.type === 'ethernet') {
      connectionType = 'ETHERNET';
    } else if (connection.type === 'wifi') {
      connectionType = 'WIFI';
    } else if (connection.effectiveType) {
      connectionType = connection.effectiveType.toUpperCase();
    }
  }

  return {
    operatingSystem,
    browser,
    deviceType,
    connectionType,
    logicalCores: navigator.hardwareConcurrency || 4,
    deviceMemory: navigator.deviceMemory || 8
  };
};

export const classifyNetworkTier = (rtt, packetLoss) => {
  if (rtt < 80 && packetLoss < 1.0) return 'EXCELLENT';
  if (rtt < 160 && packetLoss < 3.0) return 'GOOD';
  if (rtt < 280 && packetLoss < 6.0) return 'FAIR';
  if (rtt < 450 && packetLoss < 12.0) return 'POOR';
  return 'CRITICAL';
};

export function useNetworkAdaptation({ meetingId, user, socket, onVideoQualityAdjust }) {
  const sessionIdRef = useRef('sess_' + Math.random().toString(36).substring(2, 10));
  const sessionId = sessionIdRef.current;

  // Device & Battery State
  const [deviceStats, setDeviceStats] = useState(() => ({
    ...getDeviceInfo(),
    batteryLevel: 100,
    isCharging: true
  }));

  // Network Telemetry State
  const [networkStats, setNetworkStats] = useState({
    latency: 35,
    jitter: 4,
    packetLoss: 0.1,
    bandwidthUp: 4.8,
    bandwidthDown: 9.5,
    connectionType: 'WIFI',
    quality: 'EXCELLENT',
    history: [35, 38, 34, 36, 35]
  });

  // Adaptive Media Quality Profile
  const [mediaProfile, setMediaProfile] = useState({
    videoResolution: '720p',
    frameRate: 30,
    audioPriority: false,
    effectsReduced: false,
    mode: 'AUTO', // 'AUTO' | 'STANDARD' | 'LOW_BANDWIDTH' | 'AUDIO_ONLY'
    hysteresisCounter: 0,
    isRecovering: false
  });

  const lastRttRef = useRef(35);
  const stableHighCountRef = useRef(0);
  const isRegisteredRef = useRef(false);

  // 1. Initial Device & Battery Registration
  useEffect(() => {
    let batteryInstance = null;

    const registerSession = async (batteryData = {}) => {
      const dev = getDeviceInfo();
      const payload = {
        sessionId,
        meetingId,
        userId: user?.id || 'guest',
        userName: user?.name || 'Participant',
        deviceType: dev.deviceType,
        operatingSystem: dev.operatingSystem,
        browser: dev.browser,
        cameraAvailable: true,
        microphoneAvailable: true,
        speakerAvailable: true,
        batteryLevel: batteryData.batteryLevel ?? deviceStats.batteryLevel,
        isCharging: batteryData.isCharging ?? deviceStats.isCharging,
        lowBandwidthMode: mediaProfile.mode,
        participationMode: mediaProfile.mode === 'AUDIO_ONLY' ? 'AUDIO_ONLY' : 'AUDIO_VIDEO'
      };

      try {
        await fetch(`http://localhost:5000/api/meetings/${meetingId}/adaptation/device-session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } catch (e) {
        // silent fail in dev
      }

      if (socket) {
        socket.emit('adaptation-device-session', payload);
      }
    };

    // Battery API detection (Section 38.6)
    if (typeof navigator.getBattery === 'function') {
      navigator.getBattery().then(bat => {
        batteryInstance = bat;
        const updateBattery = () => {
          const bLevel = Math.round((bat.level || 1) * 100);
          const bCharging = bat.charging !== undefined ? bat.charging : true;
          setDeviceStats(prev => ({
            ...prev,
            batteryLevel: bLevel,
            isCharging: bCharging
          }));
          registerSession({ batteryLevel: bLevel, isCharging: bCharging });
        };
        updateBattery();
        bat.addEventListener('levelchange', updateBattery);
        bat.addEventListener('chargingchange', updateBattery);
      }).catch(() => {
        registerSession();
      });
    } else {
      registerSession();
    }

    return () => {
      if (batteryInstance) {
        batteryInstance.removeEventListener?.('levelchange', () => {});
        batteryInstance.removeEventListener?.('chargingchange', () => {});
      }
    };
  }, [meetingId, user?.id, user?.name, socket]);

  // 2. Periodic Network Probing & Telemetry Sampling Loop (Every 4 seconds)
  useEffect(() => {
    let isCancelled = false;

    const probeNetwork = async () => {
      const startTime = performance.now();
      let rtt = 40;
      let failed = false;

      try {
        // High-frequency ping probe
        await fetch(`http://localhost:5000/api/meetings/${meetingId}/adaptation/analytics?ping=1`, {
          cache: 'no-store'
        });
        const elapsed = performance.now() - startTime;
        rtt = Math.round(elapsed);
      } catch (err) {
        failed = true;
        rtt = 450;
      }

      if (isCancelled) return;

      // Jitter = |current - previous|
      const prevRtt = lastRttRef.current;
      const jitter = Math.abs(rtt - prevRtt);
      lastRttRef.current = rtt;

      // Packet loss estimate based on RTT spikes & failed requests
      const packetLoss = failed ? 8.5 : rtt > 300 ? 4.2 : rtt > 180 ? 1.8 : 0.1;
      const tier = classifyNetworkTier(rtt, packetLoss);

      // Estimated available bandwidth (Mbps)
      const bandwidthDown = rtt < 60 ? 15.0 : rtt < 120 ? 8.0 : rtt < 250 ? 3.2 : 0.8;
      const bandwidthUp = Math.round((bandwidthDown * 0.4) * 10) / 10;

      const newStats = {
        latency: rtt,
        jitter,
        packetLoss,
        bandwidthUp,
        bandwidthDown,
        connectionType: deviceStats.connectionType || 'WIFI',
        quality: tier
      };

      setNetworkStats(prev => ({
        ...newStats,
        history: [...(prev.history || []).slice(-9), rtt]
      }));

      // Report telemetry to backend REST & Socket (Section 38.7)
      try {
        fetch(`http://localhost:5000/api/meetings/${meetingId}/adaptation/network-quality`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            meetingId,
            userId: user?.id || 'guest',
            userName: user?.name || 'Participant',
            ...newStats
          })
        }).catch(() => {});
      } catch (e) {}

      if (socket) {
        socket.emit('adaptation-network-telemetry', {
          sessionId,
          meetingId,
          userId: user?.id || 'guest',
          ...newStats
        });
      }

      // 3. Automatic Adaptive Hysteresis Engine (Section 38.10 - 38.13)
      if (mediaProfile.mode === 'AUTO') {
        if (tier === 'CRITICAL' || tier === 'POOR') {
          stableHighCountRef.current = 0;
          // Step down to preserve audio
          if (mediaProfile.videoResolution !== '360p' || !mediaProfile.audioPriority) {
            setMediaProfile(prev => ({
              ...prev,
              videoResolution: tier === 'CRITICAL' ? '360p' : '480p',
              frameRate: 15,
              audioPriority: true,
              effectsReduced: true,
              isRecovering: false
            }));

            if (onVideoQualityAdjust) {
              onVideoQualityAdjust({ resolution: tier === 'CRITICAL' ? '360p' : '480p', frameRate: 15, audioPriority: true });
            }

            toast('Network degraded: Adjusting video quality to prioritize clear audio', {
              icon: '📡',
              id: 'network-degraded-toast'
            });
          }
        } else if (tier === 'EXCELLENT' || tier === 'GOOD') {
          // Stabilization period (Hysteresis): wait for 3 consecutive good readings (12s) before upgrading back
          stableHighCountRef.current += 1;
          if (stableHighCountRef.current >= 3 && mediaProfile.videoResolution !== '720p') {
            stableHighCountRef.current = 0;
            setMediaProfile(prev => ({
              ...prev,
              videoResolution: '720p',
              frameRate: 30,
              audioPriority: false,
              effectsReduced: false,
              isRecovering: true
            }));

            if (onVideoQualityAdjust) {
              onVideoQualityAdjust({ resolution: '720p', frameRate: 30, audioPriority: false });
            }

            toast.success('Network recovered: HD video quality restored', {
              id: 'network-recovered-toast'
            });
          }
        }
      }
    };

    const interval = setInterval(probeNetwork, 4000);
    probeNetwork();

    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [meetingId, user?.id, user?.name, socket, mediaProfile.mode, mediaProfile.videoResolution, mediaProfile.audioPriority, deviceStats.connectionType, onVideoQualityAdjust]);

  // Mode Handlers (Section 38.4)
  const setParticipationMode = useCallback(async (newMode) => {
    let nextRes = '720p';
    let nextFps = 30;
    let nextAudioPriority = false;
    let nextEffectsReduced = false;

    if (newMode === 'LOW_BANDWIDTH') {
      nextRes = '360p';
      nextFps = 15;
      nextAudioPriority = true;
      nextEffectsReduced = true;
      toast('Low-Bandwidth Mode enabled: Conserving data & optimizing audio', { icon: '⚡' });
    } else if (newMode === 'AUDIO_ONLY') {
      nextRes = 'none';
      nextFps = 0;
      nextAudioPriority = true;
      nextEffectsReduced = true;
      toast('Switched to Audio-Only Mode: Video streams stopped', { icon: '🎧' });
    } else if (newMode === 'STANDARD') {
      nextRes = '720p';
      nextFps = 30;
      nextAudioPriority = false;
      nextEffectsReduced = false;
      toast.success('Standard HD Mode selected');
    } else {
      toast('Automatic Bandwidth Adaptation enabled');
    }

    setMediaProfile({
      videoResolution: nextRes,
      frameRate: nextFps,
      audioPriority: nextAudioPriority,
      effectsReduced: nextEffectsReduced,
      mode: newMode,
      hysteresisCounter: 0,
      isRecovering: false
    });

    if (onVideoQualityAdjust) {
      onVideoQualityAdjust({ resolution: nextRes, frameRate: nextFps, audioPriority: nextAudioPriority, mode: newMode });
    }

    // Persist media profile to backend
    try {
      await fetch(`http://localhost:5000/api/meetings/${meetingId}/adaptation/media-profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          meetingId,
          userId: user?.id || 'guest',
          videoEnabled: newMode !== 'AUDIO_ONLY',
          videoResolution: nextRes,
          frameRate: nextFps,
          audioPriority: nextAudioPriority,
          effectsReduced: nextEffectsReduced
        })
      });
    } catch (e) {}

    if (socket) {
      socket.emit('adaptation-quality-changed', {
        sessionId,
        meetingId,
        userId: user?.id || 'guest',
        mode: newMode,
        videoResolution: nextRes
      });
    }
  }, [meetingId, user?.id, socket, onVideoQualityAdjust]);

  return {
    sessionId,
    deviceStats,
    networkStats,
    mediaProfile,
    setParticipationMode
  };
}
