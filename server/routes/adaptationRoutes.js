import express from 'express';
import DeviceSession from '../models/DeviceSession.js';
import NetworkQuality from '../models/NetworkQuality.js';
import MediaQualityProfile from '../models/MediaQualityProfile.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router({ mergeParams: true });

// Optional auth helper: allows authenticated users or guest participants
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return protect(req, res, next);
  }
  // Allow guest access with fallback identity
  req.user = req.user || {
    id: req.body.userId || 'guest_' + Math.random().toString(36).substring(7),
    name: req.body.userName || 'Guest User'
  };
  next();
};

// @route   POST /api/meetings/:meetingId/adaptation/device-session
// @desc    Register or update device session capabilities
// @access  Public / Private
router.post(['/device-session', '/:meetingId/device-session'], optionalAuth, async (req, res) => {
  try {
    const meetingId = req.params.meetingId || req.body.meetingId;
    const userId = req.user?.id || req.body.userId;
    const {
      sessionId,
      userName,
      deviceType,
      operatingSystem,
      browser,
      cameraAvailable,
      microphoneAvailable,
      speakerAvailable,
      batteryLevel,
      isCharging,
      lowBandwidthMode,
      participationMode
    } = req.body;

    if (!sessionId || !meetingId) {
      return res.status(400).json({ success: false, message: 'sessionId and meetingId are required' });
    }

    const session = await DeviceSession.findOneAndUpdate(
      { sessionId },
      {
        sessionId,
        meetingId,
        userId: String(userId),
        userName: userName || req.user?.name || 'Participant',
        deviceType: deviceType || 'BROWSER',
        operatingSystem: operatingSystem || 'Unknown OS',
        browser: browser || 'Unknown Browser',
        cameraAvailable: cameraAvailable !== undefined ? cameraAvailable : true,
        microphoneAvailable: microphoneAvailable !== undefined ? microphoneAvailable : true,
        speakerAvailable: speakerAvailable !== undefined ? speakerAvailable : true,
        batteryLevel: batteryLevel !== undefined ? Number(batteryLevel) : 100,
        isCharging: isCharging !== undefined ? Boolean(isCharging) : true,
        lowBandwidthMode: lowBandwidthMode || 'AUTO',
        participationMode: participationMode || 'AUDIO_VIDEO'
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({
      success: true,
      message: 'Device session recorded',
      session
    });
  } catch (error) {
    console.error('Error updating device session:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/meetings/:meetingId/adaptation/network-quality
// @desc    Submit network quality telemetry (Section 38.7, 38.18)
// @access  Public / Private
router.post(['/network-quality', '/:meetingId/network-quality'], optionalAuth, async (req, res) => {
  try {
    const meetingId = req.params.meetingId || req.body.meetingId;
    const userId = req.user?.id || req.body.userId;
    const {
      sessionId,
      userName,
      bandwidthUp,
      bandwidthDown,
      latency,
      jitter,
      packetLoss,
      connectionType,
      quality
    } = req.body;

    if (!sessionId || !meetingId) {
      return res.status(400).json({ success: false, message: 'sessionId and meetingId are required' });
    }

    // Classify quality if not provided
    let calculatedQuality = quality;
    if (!calculatedQuality) {
      const lat = Number(latency) || 50;
      const loss = Number(packetLoss) || 0;
      if (lat < 80 && loss < 1.0) calculatedQuality = 'EXCELLENT';
      else if (lat < 160 && loss < 3.0) calculatedQuality = 'GOOD';
      else if (lat < 280 && loss < 6.0) calculatedQuality = 'FAIR';
      else if (lat < 450 && loss < 12.0) calculatedQuality = 'POOR';
      else calculatedQuality = 'CRITICAL';
    }

    const record = await NetworkQuality.create({
      sessionId,
      userId: String(userId),
      userName: userName || req.user?.name || 'Participant',
      meetingId,
      bandwidthUp: Number(bandwidthUp) || 2.5,
      bandwidthDown: Number(bandwidthDown) || 5.0,
      latency: Number(latency) || 50,
      jitter: Number(jitter) || 8,
      packetLoss: Number(packetLoss) || 0.2,
      connectionType: connectionType || 'WIFI',
      quality: calculatedQuality
    });

    res.json({
      success: true,
      quality: calculatedQuality,
      record
    });
  } catch (error) {
    console.error('Error recording network quality:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/meetings/:meetingId/adaptation/media-profile
// @desc    Update active media quality profile (Section 38.18)
// @access  Public / Private
router.put(['/media-profile', '/:meetingId/media-profile'], optionalAuth, async (req, res) => {
  try {
    const meetingId = req.params.meetingId || req.body.meetingId;
    const userId = req.user?.id || req.body.userId;
    const {
      sessionId,
      videoEnabled,
      videoResolution,
      frameRate,
      audioPriority,
      screenShareQuality,
      effectsReduced
    } = req.body;

    if (!sessionId || !meetingId) {
      return res.status(400).json({ success: false, message: 'sessionId and meetingId are required' });
    }

    const profile = await MediaQualityProfile.findOneAndUpdate(
      { sessionId },
      {
        sessionId,
        meetingId,
        userId: String(userId),
        videoEnabled: videoEnabled !== undefined ? Boolean(videoEnabled) : true,
        videoResolution: videoResolution || '720p',
        frameRate: Number(frameRate) || 30,
        audioPriority: audioPriority !== undefined ? Boolean(audioPriority) : false,
        screenShareQuality: screenShareQuality || 'OPTIMIZED',
        effectsReduced: effectsReduced !== undefined ? Boolean(effectsReduced) : false
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({
      success: true,
      message: 'Media quality profile updated',
      profile
    });
  } catch (error) {
    console.error('Error updating media quality profile:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/meetings/:meetingId/adaptation/analytics
// @desc    Retrieve meeting adaptation & network telemetry breakdown (Section 38.20)
// @access  Public / Private
router.get(['/analytics', '/:meetingId/analytics'], optionalAuth, async (req, res) => {
  try {
    const meetingId = req.params.meetingId || req.query.meetingId || req.originalUrl.split('/meetings/')[1]?.split('/')[0];

    const [deviceSessions, networkReadings, mediaProfiles] = await Promise.all([
      DeviceSession.find({ meetingId }).sort({ updatedAt: -1 }),
      NetworkQuality.find({ meetingId }).sort({ measuredAt: -1 }).limit(100),
      MediaQualityProfile.find({ meetingId })
    ]);

    // Aggregate network quality distribution
    const qualityCounts = {
      EXCELLENT: 0,
      GOOD: 0,
      FAIR: 0,
      POOR: 0,
      CRITICAL: 0
    };
    networkReadings.forEach(r => {
      if (qualityCounts[r.quality] !== undefined) {
        qualityCounts[r.quality]++;
      }
    });

    // Aggregate video resolution distribution
    const resolutionCounts = {
      '1080p': 0,
      '720p': 0,
      '480p': 0,
      '360p': 0,
      '240p': 0,
      'none': 0
    };
    let audioOnlyCount = 0;
    mediaProfiles.forEach(p => {
      if (p.videoEnabled === false || p.videoResolution === 'none') {
        audioOnlyCount++;
        resolutionCounts.none++;
      } else if (resolutionCounts[p.videoResolution] !== undefined) {
        resolutionCounts[p.videoResolution]++;
      }
    });

    // Device distribution
    const deviceCounts = {
      DESKTOP: 0,
      MOBILE: 0,
      TABLET: 0,
      BROWSER: 0
    };
    deviceSessions.forEach(s => {
      if (deviceCounts[s.deviceType] !== undefined) {
        deviceCounts[s.deviceType]++;
      }
    });

    res.json({
      success: true,
      meetingId,
      totalParticipants: deviceSessions.length,
      audioOnlyCount,
      networkQualityBreakdown: qualityCounts,
      videoResolutionBreakdown: resolutionCounts,
      deviceBreakdown: deviceCounts,
      latestTelemetry: networkReadings.slice(0, 10),
      activeProfiles: mediaProfiles
    });
  } catch (error) {
    console.error('Error fetching adaptation analytics:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
