import express from 'express';
import Meeting from '../models/Meeting.js';
import ScreenShareSession from '../models/ScreenShareSession.js';

const router = express.Router();

// GET /api/meetings/:meetingId/share-session - Fetch active sharing session & settings
router.get('/:meetingId/share-session', async (req, res) => {
  try {
    const { meetingId } = req.params;

    const meeting = await Meeting.findOne({
      $or: [{ meetingId }, { _id: meetingId.match(/^[0-9a-fA-F]{24}$/) ? meetingId : null }]
    });

    const sharingSettings = meeting?.sharingSettings || {
      whoCanShare: 'all',
      mode: 'oneParticipant',
      whoCanStartWhenSharing: 'hostOnly',
    };

    const activeSessions = await ScreenShareSession.find({
      meetingId,
      sharingStatus: { $in: ['ACTIVE', 'PAUSED'] }
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      sharingSettings,
      activeSessions,
      isSharing: activeSessions.length > 0,
      activeSession: activeSessions[0] || null,
    });
  } catch (error) {
    console.error('Error fetching share session:', error);
    res.status(500).json({ success: false, message: 'Server error fetching share session' });
  }
});

// POST /api/meetings/:meetingId/share-session/start - Start sharing
router.post('/:meetingId/share-session/start', async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { 
      participantId, 
      participantName = 'Participant', 
      type = 'SCREEN', 
      sourceName = 'Entire Screen',
      audioEnabled = false,
      videoOptimization = false,
      userRole = 'participant'
    } = req.body;

    if (!participantId) {
      return res.status(400).json({ success: false, message: 'participantId is required' });
    }

    const meeting = await Meeting.findOne({
      $or: [{ meetingId }, { _id: meetingId.match(/^[0-9a-fA-F]{24}$/) ? meetingId : null }]
    });

    const settings = meeting?.sharingSettings || { whoCanShare: 'all', mode: 'oneParticipant', whoCanStartWhenSharing: 'hostOnly' };

    // Validate hostOnly restriction (Section 13.11, 13.13)
    if (settings.whoCanShare === 'hostOnly' && userRole !== 'host' && userRole !== 'co-host') {
      return res.status(403).json({
        success: false,
        message: 'Host has disabled screen sharing for participants.'
      });
    }

    // Check existing active sessions (Section 13.10)
    const existingActive = await ScreenShareSession.find({
      meetingId,
      sharingStatus: { $in: ['ACTIVE', 'PAUSED'] }
    });

    if (existingActive.length > 0 && settings.mode === 'oneParticipant') {
      const isCurrentSharer = existingActive.some(s => s.activeSharerId === participantId);
      if (!isCurrentSharer) {
        if (settings.whoCanStartWhenSharing === 'hostOnly' && userRole !== 'host' && userRole !== 'co-host') {
          return res.status(409).json({
            success: false,
            message: `Another participant (${existingActive[0].activeSharerName}) is currently sharing.`,
            currentSharer: existingActive[0].activeSharerName
          });
        }
        // If host overrides or allowed, close previous sessions
        await ScreenShareSession.updateMany(
          { meetingId, sharingStatus: { $in: ['ACTIVE', 'PAUSED'] } },
          { $set: { sharingStatus: 'ENDED', 'shareSession.endedAt': new Date() } }
        );
      }
    }

    // Create or update session
    const session = new ScreenShareSession({
      meetingId,
      activeSharerId: participantId,
      activeSharerName: participantName,
      sharingStatus: 'ACTIVE',
      shareSession: {
        type,
        sourceName,
        audioEnabled,
        videoOptimization,
        startedAt: new Date(),
      }
    });

    await session.save();

    res.json({
      success: true,
      message: 'Share session started',
      session,
    });
  } catch (error) {
    console.error('Error starting share session:', error);
    res.status(500).json({ success: false, message: 'Server error starting share session' });
  }
});

// POST /api/meetings/:meetingId/share-session/pause - Pause or resume sharing (Section 13.14)
router.post('/:meetingId/share-session/pause', async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { participantId, isPaused } = req.body;

    const nextStatus = isPaused ? 'PAUSED' : 'ACTIVE';
    const session = await ScreenShareSession.findOneAndUpdate(
      { meetingId, activeSharerId: participantId, sharingStatus: { $in: ['ACTIVE', 'PAUSED'] } },
      { $set: { sharingStatus: nextStatus } },
      { new: true }
    );

    res.json({
      success: true,
      message: `Share session ${nextStatus.toLowerCase()}`,
      session,
    });
  } catch (error) {
    console.error('Error pausing share session:', error);
    res.status(500).json({ success: false, message: 'Server error toggling pause state' });
  }
});

// POST /api/meetings/:meetingId/share-session/stop - Stop sharing (Section 13.14)
router.post('/:meetingId/share-session/stop', async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { participantId } = req.body;

    const query = { meetingId, sharingStatus: { $in: ['ACTIVE', 'PAUSED'] } };
    if (participantId) {
      query.activeSharerId = participantId;
    }

    await ScreenShareSession.updateMany(query, {
      $set: {
        sharingStatus: 'ENDED',
        'shareSession.endedAt': new Date(),
      }
    });

    res.json({
      success: true,
      message: 'Share session ended',
    });
  } catch (error) {
    console.error('Error stopping share session:', error);
    res.status(500).json({ success: false, message: 'Server error stopping share session' });
  }
});

// POST /api/meetings/:meetingId/share-session/stop-participant - Host stops another participant's share (Section 14.10)
router.post('/:meetingId/share-session/stop-participant', async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { participantId, hostId } = req.body;

    if (!participantId) {
      return res.status(400).json({ success: false, message: 'participantId is required' });
    }

    await ScreenShareSession.updateMany(
      { meetingId, activeSharerId: participantId, sharingStatus: { $in: ['ACTIVE', 'PAUSED'] } },
      {
        $set: {
          sharingStatus: 'ENDED',
          'shareSession.endedAt': new Date(),
        }
      }
    );

    res.json({
      success: true,
      message: `Stopped sharing session for participant ${participantId}`,
    });
  } catch (error) {
    console.error('Error stopping participant share session:', error);
    res.status(500).json({ success: false, message: 'Server error stopping participant share session' });
  }
});

// PUT /api/meetings/:meetingId/sharing-settings - Update host sharing settings (Section 13.10, 13.11)
router.put('/:meetingId/sharing-settings', async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { whoCanShare, mode, whoCanStartWhenSharing } = req.body;

    const updates = {};
    if (whoCanShare) updates['sharingSettings.whoCanShare'] = whoCanShare;
    if (mode) updates['sharingSettings.mode'] = mode;
    if (whoCanStartWhenSharing) updates['sharingSettings.whoCanStartWhenSharing'] = whoCanStartWhenSharing;

    const meeting = await Meeting.findOneAndUpdate(
      { $or: [{ meetingId }, { _id: meetingId.match(/^[0-9a-fA-F]{24}$/) ? meetingId : null }] },
      { 
        $set: updates,
        $setOnInsert: { title: 'IntellMeet Session', meetingId }
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.json({
      success: true,
      message: 'Sharing settings updated',
      sharingSettings: meeting?.sharingSettings,
    });
  } catch (error) {
    console.error('Error updating sharing settings:', error);
    res.status(500).json({ success: false, message: 'Server error updating sharing settings' });
  }
});

export default router;
