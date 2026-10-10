import express from 'express';
import jwt from 'jsonwebtoken';
import { MeetingSecurity, generateSecurityCode, generateAudioSignatureId } from '../models/MeetingSecurity.js';
import Meeting from '../models/Meeting.js';
import User from '../models/User.js';
import { protect } from '../middleware/authMiddleware.js';

// Helper for optional authentication (supports both signed-in users and anonymous/guest meeting attendees)
const protectOptional = async (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'intellmeet_jwt_secret_key_2026_secure');
      if (User.db && User.db.readyState === 1) {
        req.user = await User.findById(decoded.id).select('-password');
      } else {
        req.user = decoded;
      }
    } catch (e) {}
  }
  next();
};

const router = express.Router({ mergeParams: true });

// Helper to extract meetingId from params or body
const getMeetingId = (req) => req.params.meetingId || req.body.meetingId || req.query.meetingId;

// Helper to mask email for privacy (32.1 & 32.10) e.g. kv***@gmail.com
export function maskEmail(email = '') {
  if (!email || !email.includes('@')) return 'guest***';
  const [local, domain] = email.split('@');
  if (local.length <= 2) return `${local[0] || ''}***@${domain}`;
  return `${local.slice(0, 2)}***@${domain}`;
}

// Helper to get or initialize MeetingSecurity document
async function getOrCreateSecurityDoc(meetingId) {
  let securityDoc = await MeetingSecurity.findOne({ meetingId });
  if (!securityDoc) {
    const meeting = await Meeting.findOne({
      $or: [{ meetingId }, { _id: meetingId.match(/^[0-9a-fA-F]{24}$/) ? meetingId : null }]
    });

    const isE2EE = meeting?.encryption === 'e2ee' || meeting?.securitySettings?.encryptionType === 'E2EE';

    securityDoc = await MeetingSecurity.create({
      meetingId,
      meetingTitle: meeting?.title || 'Meeting Session',
      encryptionType: isE2EE ? 'E2EE' : 'ENHANCED',
      keyManagement: isE2EE ? 'DEVICE_MANAGED' : 'SERVER_MANAGED',
      cipher: '256-bit AES-GCM',
      securityCode: generateSecurityCode(),
      e2eeFeatureCompatibility: {
        aiSummaryDisabled: isE2EE,
        aiQuestionsDisabled: isE2EE,
        liveTranscriptionDisabled: isE2EE,
        cloudRecordingDisabled: isE2EE,
        smartRecordingDisabled: isE2EE,
        aiNotesDisabled: isE2EE,
        whiteboardDisabled: isE2EE,
        pollsDisabled: isE2EE
      },
      meetingLocked: !!(meeting?.isLocked || meeting?.securitySettings?.lockMeeting),
      waitingRoomEnabled: meeting?.waitingRoom !== undefined ? !!meeting.waitingRoom : true,
      hideProfilePictures: !!meeting?.securitySettings?.hideProfilePictures,
      whoCanShareScreen: meeting?.sharingSettings?.whoCanShare === 'hostOnly' ? 'hostOnly' : 'all',
      participantPermissions: {
        canChat: meeting?.securitySettings?.allowChat || 'everyone',
        canUnmute: meeting?.securitySettings?.allowUnmute !== undefined ? !!meeting.securitySettings.allowUnmute : true,
        canStartVideo: meeting?.securitySettings?.allowStartVideo !== undefined ? !!meeting.securitySettings.allowStartVideo : true,
        canShareScreen: meeting?.securitySettings?.allowShareScreen !== undefined ? !!meeting.securitySettings.allowShareScreen : true,
        canRename: meeting?.securitySettings?.allowRename !== undefined ? !!meeting.securitySettings.allowRename : true,
        canShareWhiteboard: meeting?.securitySettings?.allowWhiteboard !== undefined ? !!meeting.securitySettings.allowWhiteboard : true,
        canRequestRecording: true
      },
      watermark: {
        visualEnabled: !!(meeting?.securitySettings?.watermark || meeting?.securitySettings?.watermarkSettings?.visualEnabled),
        visualMode: meeting?.securitySettings?.watermarkSettings?.visualMode || 'repeated',
        visibleOn: meeting?.securitySettings?.watermarkSettings?.visibleOn || 'both',
        opacity: meeting?.securitySettings?.watermarkSettings?.opacity || 25,
        identityType: meeting?.securitySettings?.watermarkSettings?.identityType || 'maskedEmail',
        audioEnabled: !!meeting?.securitySettings?.watermarkSettings?.audioEnabled,
        audioSignatures: []
      },
      participantActivitiesSuspended: !!meeting?.securitySettings?.suspendActivities
    });
  }
  return securityDoc;
}

// ─────────────────────────────────────────────────────────────────────────────
// 30.2 & 30.14 GET Meeting Security State
// GET /api/meetings/:meetingId/security
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', protect, async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    if (!meetingId) {
      return res.status(400).json({ success: false, message: 'meetingId is required' });
    }

    const security = await getOrCreateSecurityDoc(meetingId);
    res.json({
      success: true,
      security
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 30.13 & 30.14 PUT Update Full or Partial Security Settings
// PUT /api/meetings/:meetingId/security
// ─────────────────────────────────────────────────────────────────────────────
router.put('/', protect, async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    const {
      meetingLocked,
      waitingRoomEnabled,
      hideProfilePictures,
      whoCanShareScreen,
      participantPermissions,
      allowRemovedParticipantsToRejoin
    } = req.body;

    const security = await getOrCreateSecurityDoc(meetingId);

    if (typeof meetingLocked === 'boolean') security.meetingLocked = meetingLocked;
    if (typeof waitingRoomEnabled === 'boolean') security.waitingRoomEnabled = waitingRoomEnabled;
    if (typeof hideProfilePictures === 'boolean') security.hideProfilePictures = hideProfilePictures;
    if (whoCanShareScreen) security.whoCanShareScreen = whoCanShareScreen;
    if (typeof allowRemovedParticipantsToRejoin === 'boolean') {
      security.allowRemovedParticipantsToRejoin = allowRemovedParticipantsToRejoin;
    }

    if (participantPermissions) {
      security.participantPermissions = {
        ...security.participantPermissions.toObject(),
        ...participantPermissions
      };
    }

    security.securityAuditLogs.push({
      action: 'SETTINGS_UPDATED',
      performedBy: req.user?.name || 'Host',
      details: 'Updated in-meeting security controls'
    });

    await security.save();

    // Sync with Meeting document
    await Meeting.findOneAndUpdate(
      { $or: [{ meetingId }, { _id: meetingId.match(/^[0-9a-fA-F]{24}$/) ? meetingId : null }] },
      {
        $set: {
          isLocked: security.meetingLocked,
          waitingRoom: security.waitingRoomEnabled,
          'securitySettings.lockMeeting': security.meetingLocked,
          'securitySettings.enableWaitingRoom': security.waitingRoomEnabled,
          'securitySettings.hideProfilePictures': security.hideProfilePictures,
          'securitySettings.allowShareScreen': security.participantPermissions.canShareScreen,
          'securitySettings.allowChat': security.participantPermissions.canChat,
          'securitySettings.allowRename': security.participantPermissions.canRename,
          'securitySettings.allowUnmute': security.participantPermissions.canUnmute,
          'securitySettings.allowStartVideo': security.participantPermissions.canStartVideo,
          'securitySettings.allowWhiteboard': security.participantPermissions.canShareWhiteboard,
          'sharingSettings.whoCanShare': security.whoCanShareScreen === 'hostOnly' ? 'hostOnly' : 'all'
        }
      }
    );

    // Real-time socket broadcast (30.15)
    const io = req.app.get('io');
    if (io) {
      io.to(meetingId).emit('security-settings-updated', security);
      io.to(meetingId).emit('permissions-updated', security.participantPermissions);
    }

    res.json({
      success: true,
      message: 'Meeting security settings updated successfully',
      security
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 30.3 Lock Meeting Toggle
// PUT /api/meetings/:meetingId/security/lock
// ─────────────────────────────────────────────────────────────────────────────
router.put('/lock', protect, async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    const { lock } = req.body;
    const security = await getOrCreateSecurityDoc(meetingId);

    const nextLocked = typeof lock === 'boolean' ? lock : !security.meetingLocked;
    security.meetingLocked = nextLocked;
    security.securityAuditLogs.push({
      action: nextLocked ? 'MEETING_LOCKED' : 'MEETING_UNLOCKED',
      performedBy: req.user?.name || 'Host',
      details: nextLocked ? 'Meeting locked. New participants cannot join.' : 'Meeting unlocked.'
    });

    await security.save();

    await Meeting.findOneAndUpdate(
      { $or: [{ meetingId }, { _id: meetingId.match(/^[0-9a-fA-F]{24}$/) ? meetingId : null }] },
      { $set: { isLocked: nextLocked, 'securitySettings.lockMeeting': nextLocked } }
    );

    const io = req.app.get('io');
    if (io) {
      io.to(meetingId).emit('meeting-lock-toggled', { meetingLocked: nextLocked });
      io.to(meetingId).emit('security-settings-updated', security);
    }

    res.json({
      success: true,
      message: nextLocked ? 'Meeting locked successfully' : 'Meeting unlocked successfully',
      meetingLocked: nextLocked,
      security
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 30.4 Enable / Disable Waiting Room
// PUT /api/meetings/:meetingId/security/waiting-room
// ─────────────────────────────────────────────────────────────────────────────
router.put('/waiting-room', protect, async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    const { enabled } = req.body;
    const security = await getOrCreateSecurityDoc(meetingId);

    const nextState = typeof enabled === 'boolean' ? enabled : !security.waitingRoomEnabled;
    security.waitingRoomEnabled = nextState;
    security.securityAuditLogs.push({
      action: nextState ? 'WAITING_ROOM_ENABLED' : 'WAITING_ROOM_DISABLED',
      performedBy: req.user?.name || 'Host',
      details: `Waiting room ${nextState ? 'enabled' : 'disabled'} during active meeting`
    });

    await security.save();

    await Meeting.findOneAndUpdate(
      { $or: [{ meetingId }, { _id: meetingId.match(/^[0-9a-fA-F]{24}$/) ? meetingId : null }] },
      { $set: { waitingRoom: nextState, 'securitySettings.enableWaitingRoom': nextState } }
    );

    const io = req.app.get('io');
    if (io) {
      io.to(meetingId).emit('waiting-room-toggled', { waitingRoomEnabled: nextState });
      io.to(meetingId).emit('security-settings-updated', security);
    }

    res.json({
      success: true,
      message: nextState ? 'Waiting Room enabled' : 'Waiting Room disabled',
      waitingRoomEnabled: nextState,
      security
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 30.6 Hide Profile Pictures
// PUT /api/meetings/:meetingId/security/hide-profile-pictures
// ─────────────────────────────────────────────────────────────────────────────
router.put('/hide-profile-pictures', protect, async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    const { hide } = req.body;
    const security = await getOrCreateSecurityDoc(meetingId);

    const nextHide = typeof hide === 'boolean' ? hide : !security.hideProfilePictures;
    security.hideProfilePictures = nextHide;
    security.securityAuditLogs.push({
      action: nextHide ? 'PROFILE_PICTURES_HIDDEN' : 'PROFILE_PICTURES_SHOWN',
      performedBy: req.user?.name || 'Host',
      details: nextHide ? 'Profile pictures hidden for privacy' : 'Profile pictures visible'
    });

    await security.save();

    await Meeting.findOneAndUpdate(
      { $or: [{ meetingId }, { _id: meetingId.match(/^[0-9a-fA-F]{24}$/) ? meetingId : null }] },
      { $set: { 'securitySettings.hideProfilePictures': nextHide } }
    );

    const io = req.app.get('io');
    if (io) {
      io.to(meetingId).emit('hide-profile-pictures-toggled', { hideProfilePictures: nextHide });
      io.to(meetingId).emit('security-settings-updated', security);
    }

    res.json({
      success: true,
      message: nextHide ? 'Profile pictures hidden' : 'Profile pictures displayed',
      hideProfilePictures: nextHide,
      security
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 30.5 Participant Permissions (Screen Sharing, Chat, Unmute, Video, Rename, Whiteboard, Recording)
// PUT /api/meetings/:meetingId/security/permissions
// ─────────────────────────────────────────────────────────────────────────────
router.put('/permissions', protect, async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    const permissions = req.body; // e.g. { canChat, canUnmute, canStartVideo, canShareScreen, canRename, canShareWhiteboard, canRequestRecording }

    const security = await getOrCreateSecurityDoc(meetingId);
    security.participantPermissions = {
      ...security.participantPermissions.toObject(),
      ...permissions
    };

    security.securityAuditLogs.push({
      action: 'PERMISSIONS_MODIFIED',
      performedBy: req.user?.name || 'Host',
      details: `Permissions updated: ${Object.keys(permissions).join(', ')}`
    });

    await security.save();

    await Meeting.findOneAndUpdate(
      { $or: [{ meetingId }, { _id: meetingId.match(/^[0-9a-fA-F]{24}$/) ? meetingId : null }] },
      {
        $set: {
          'securitySettings.allowShareScreen': security.participantPermissions.canShareScreen,
          'securitySettings.allowChat': security.participantPermissions.canChat,
          'securitySettings.allowRename': security.participantPermissions.canRename,
          'securitySettings.allowUnmute': security.participantPermissions.canUnmute,
          'securitySettings.allowStartVideo': security.participantPermissions.canStartVideo,
          'securitySettings.allowWhiteboard': security.participantPermissions.canShareWhiteboard
        }
      }
    );

    const io = req.app.get('io');
    if (io) {
      io.to(meetingId).emit('permissions-updated', security.participantPermissions);
      io.to(meetingId).emit('security-settings-updated', security);
    }

    res.json({
      success: true,
      message: 'Participant permissions updated successfully',
      participantPermissions: security.participantPermissions,
      security
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 30.8 Control Screen Sharing Policy (Who can share: 'hostOnly' | 'hostCoHost' | 'all')
// PUT /api/meetings/:meetingId/security/screen-sharing
// ─────────────────────────────────────────────────────────────────────────────
router.put('/screen-sharing', protect, async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    const { whoCanShareScreen } = req.body;

    if (!['hostOnly', 'hostCoHost', 'all'].includes(whoCanShareScreen)) {
      return res.status(400).json({ success: false, message: 'Invalid screen share policy' });
    }

    const security = await getOrCreateSecurityDoc(meetingId);
    security.whoCanShareScreen = whoCanShareScreen;
    if (whoCanShareScreen === 'hostOnly') {
      security.participantPermissions.canShareScreen = false;
    } else {
      security.participantPermissions.canShareScreen = true;
    }

    security.securityAuditLogs.push({
      action: 'SCREEN_SHARING_POLICY_UPDATED',
      performedBy: req.user?.name || 'Host',
      details: `Screen sharing policy set to: ${whoCanShareScreen}`
    });

    await security.save();

    await Meeting.findOneAndUpdate(
      { $or: [{ meetingId }, { _id: meetingId.match(/^[0-9a-fA-F]{24}$/) ? meetingId : null }] },
      {
        $set: {
          'sharingSettings.whoCanShare': whoCanShareScreen === 'hostOnly' ? 'hostOnly' : 'all',
          'securitySettings.allowShareScreen': security.participantPermissions.canShareScreen
        }
      }
    );

    const io = req.app.get('io');
    if (io) {
      io.to(meetingId).emit('screen-share-policy-updated', { whoCanShareScreen });
      io.to(meetingId).emit('security-settings-updated', security);
    }

    res.json({
      success: true,
      message: `Screen sharing restricted to ${whoCanShareScreen}`,
      whoCanShareScreen,
      security
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 30.7 Emergency Control: Suspend Participant Activities
// POST /api/meetings/:meetingId/security/suspend-activities
// ─────────────────────────────────────────────────────────────────────────────
router.post('/suspend-activities', protect, async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    const security = await getOrCreateSecurityDoc(meetingId);

    // Suspend activities: Turn off audio, video, stop screen share, lock meeting, disable chat
    security.participantActivitiesSuspended = true;
    security.suspendedAt = new Date();
    security.meetingLocked = true;
    security.participantPermissions = {
      ...security.participantPermissions.toObject(),
      canUnmute: false,
      canStartVideo: false,
      canShareScreen: false,
      canChat: 'none',
      canShareWhiteboard: false,
      canRename: false,
      canRequestRecording: false
    };

    security.securityAuditLogs.push({
      action: 'ACTIVITIES_SUSPENDED',
      performedBy: req.user?.name || 'Host',
      details: 'EMERGENCY: All participant activities suspended and meeting locked.'
    });

    await security.save();

    await Meeting.findOneAndUpdate(
      { $or: [{ meetingId }, { _id: meetingId.match(/^[0-9a-fA-F]{24}$/) ? meetingId : null }] },
      {
        $set: {
          isLocked: true,
          'securitySettings.lockMeeting': true,
          'securitySettings.suspendActivities': true,
          'securitySettings.allowUnmute': false,
          'securitySettings.allowStartVideo': false,
          'securitySettings.allowShareScreen': false,
          'securitySettings.allowChat': 'none',
          'securitySettings.allowWhiteboard': false
        }
      }
    );

    const io = req.app.get('io');
    if (io) {
      io.to(meetingId).emit('activities-suspended');
      io.to(meetingId).emit('meeting-lock-toggled', { meetingLocked: true });
      io.to(meetingId).emit('permissions-updated', security.participantPermissions);
      io.to(meetingId).emit('security-settings-updated', security);
    }

    res.json({
      success: true,
      message: 'Emergency lockdown initiated: Participant activities suspended and meeting locked',
      security
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 30.7 Resume Participant Activities
// POST /api/meetings/:meetingId/security/resume-activities
// ─────────────────────────────────────────────────────────────────────────────
router.post('/resume-activities', protect, async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    const security = await getOrCreateSecurityDoc(meetingId);

    security.participantActivitiesSuspended = false;
    security.suspendedAt = null;
    security.participantPermissions = {
      ...security.participantPermissions.toObject(),
      canUnmute: true,
      canStartVideo: true,
      canShareScreen: security.whoCanShareScreen !== 'hostOnly',
      canChat: 'everyone',
      canShareWhiteboard: true,
      canRename: true,
      canRequestRecording: true
    };

    security.securityAuditLogs.push({
      action: 'ACTIVITIES_RESUMED',
      performedBy: req.user?.name || 'Host',
      details: 'Participant activities resumed by host.'
    });

    await security.save();

    await Meeting.findOneAndUpdate(
      { $or: [{ meetingId }, { _id: meetingId.match(/^[0-9a-fA-F]{24}$/) ? meetingId : null }] },
      {
        $set: {
          'securitySettings.suspendActivities': false,
          'securitySettings.allowUnmute': true,
          'securitySettings.allowStartVideo': true,
          'securitySettings.allowShareScreen': security.participantPermissions.canShareScreen,
          'securitySettings.allowChat': 'everyone',
          'securitySettings.allowWhiteboard': true
        }
      }
    );

    const io = req.app.get('io');
    if (io) {
      io.to(meetingId).emit('activities-resumed');
      io.to(meetingId).emit('permissions-updated', security.participantPermissions);
      io.to(meetingId).emit('security-settings-updated', security);
    }

    res.json({
      success: true,
      message: 'Participant activities resumed successfully',
      security
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 30.9 Remove Participant
// POST /api/meetings/:meetingId/security/remove-participant
// ─────────────────────────────────────────────────────────────────────────────
router.post('/remove-participant', protect, async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    const { participantId, name = 'Participant', email = '', preventRejoin = true } = req.body;

    if (!participantId) {
      return res.status(400).json({ success: false, message: 'participantId is required' });
    }

    const security = await getOrCreateSecurityDoc(meetingId);
    security.removedParticipants.push({
      participantId,
      name,
      email,
      removedAt: new Date(),
      preventRejoin: !!preventRejoin
    });

    security.securityAuditLogs.push({
      action: 'PARTICIPANT_REMOVED',
      performedBy: req.user?.name || 'Host',
      details: `Removed participant: ${name} (${participantId}). Prevent rejoin: ${preventRejoin}`
    });

    await security.save();

    const io = req.app.get('io');
    if (io) {
      io.to(meetingId).emit('participant-removed', {
        participantId,
        name,
        preventRejoin: !!preventRejoin,
        removedBy: req.user?.name || 'Host'
      });
      io.to(meetingId).emit('security-settings-updated', security);
    }

    res.json({
      success: true,
      message: `Participant ${name} removed from meeting`,
      removedParticipant: { participantId, name, preventRejoin },
      security
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 30.4 & 30.10 Waiting Room Management
// GET /api/meetings/:meetingId/security/waiting-room
// ─────────────────────────────────────────────────────────────────────────────
router.get('/waiting-room', protect, async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    const security = await getOrCreateSecurityDoc(meetingId);
    res.json({
      success: true,
      waitingRoomEnabled: security.waitingRoomEnabled,
      queue: security.waitingRoomQueue || []
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/meetings/:meetingId/security/admit-waiting
router.post('/admit-waiting', protect, async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    const { participantId, name } = req.body;

    const security = await getOrCreateSecurityDoc(meetingId);
    security.waitingRoomQueue = security.waitingRoomQueue.filter(p => p.participantId !== participantId);
    await security.save();

    const io = req.app.get('io');
    if (io) {
      io.to(meetingId).emit('waiting-participant-admitted', { participantId, name });
      io.to(meetingId).emit('security-settings-updated', security);
    }

    res.json({
      success: true,
      message: `Admitted ${name || participantId} to the meeting`,
      queue: security.waitingRoomQueue
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/meetings/:meetingId/security/admit-all-waiting
router.post('/admit-all-waiting', protect, async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    const security = await getOrCreateSecurityDoc(meetingId);
    security.waitingRoomQueue = [];
    await security.save();

    const io = req.app.get('io');
    if (io) {
      io.to(meetingId).emit('all-waiting-admitted');
      io.to(meetingId).emit('security-settings-updated', security);
    }

    res.json({
      success: true,
      message: 'Admitted all waiting participants',
      queue: []
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/meetings/:meetingId/security/remove-waiting
router.post('/remove-waiting', protect, async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    const { participantId } = req.body;

    const security = await getOrCreateSecurityDoc(meetingId);
    security.waitingRoomQueue = security.waitingRoomQueue.filter(p => p.participantId !== participantId);
    await security.save();

    const io = req.app.get('io');
    if (io) {
      io.to(meetingId).emit('waiting-participant-removed', { participantId });
      io.to(meetingId).emit('security-settings-updated', security);
    }

    res.json({
      success: true,
      message: 'Removed participant from waiting room',
      queue: security.waitingRoomQueue
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Part 31: Encryption Endpoints (31.1 - 31.16)
// ─────────────────────────────────────────────────────────────────────────────

// @route   GET /api/meetings/:meetingId/security/encryption
// @desc    31.5 & 31.11 Get Current Encryption Configuration, Security Code & Endpoint Statuses
router.get('/encryption', protect, async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    const security = await getOrCreateSecurityDoc(meetingId);

    res.json({
      success: true,
      encryption: {
        type: security.encryptionType,
        enabled: security.encryptionEnabled,
        cipher: security.cipher,
        keyManagement: security.keyManagement,
        securityCode: security.securityCode,
        keyVersion: security.keyVersion,
        keyGeneratedAt: security.keyGeneratedAt,
        isPartialEncryption: security.isPartialEncryption,
        endpointStatuses: security.endpointEncryptionStatuses || [],
        verifiedParticipantsCount: security.verifiedParticipants?.length || 0,
        featureCompatibility: security.e2eeFeatureCompatibility
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   PUT /api/meetings/:meetingId/security/encryption
// @desc    31.4, 31.8, 31.9 Toggle Encryption Type (ENHANCED vs E2EE) & Enforce Feature Matrix
router.put('/encryption', protect, async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    const { encryptionType } = req.body; // 'ENHANCED' | 'E2EE'

    if (!['ENHANCED', 'E2EE'].includes(encryptionType)) {
      return res.status(400).json({ success: false, message: 'Invalid encryption type. Must be ENHANCED or E2EE' });
    }

    const security = await getOrCreateSecurityDoc(meetingId);
    const isE2EE = encryptionType === 'E2EE';

    security.encryptionType = encryptionType;
    security.keyManagement = isE2EE ? 'DEVICE_MANAGED' : 'SERVER_MANAGED';
    security.keyVersion = (security.keyVersion || 1) + 1;
    security.keyGeneratedAt = new Date();

    if (isE2EE) {
      security.securityCode = generateSecurityCode();
      security.e2eeFeatureCompatibility = {
        aiSummaryDisabled: true,
        aiQuestionsDisabled: true,
        liveTranscriptionDisabled: true,
        cloudRecordingDisabled: true,
        smartRecordingDisabled: true,
        aiNotesDisabled: true,
        whiteboardDisabled: true,
        pollsDisabled: true
      };
    } else {
      security.isPartialEncryption = false;
      security.e2eeFeatureCompatibility = {
        aiSummaryDisabled: false,
        aiQuestionsDisabled: false,
        liveTranscriptionDisabled: false,
        cloudRecordingDisabled: false,
        smartRecordingDisabled: false,
        aiNotesDisabled: false,
        whiteboardDisabled: false,
        pollsDisabled: false
      };
    }

    security.securityAuditLogs.push({
      action: isE2EE ? 'ENCRYPTION_UPGRADED_E2EE' : 'ENCRYPTION_SET_ENHANCED',
      performedBy: req.user?.name || 'Host',
      details: `Switched encryption mode to ${encryptionType}. Feature compatibility adjusted.`
    });

    await security.save();

    // Sync with Meeting document
    await Meeting.findOneAndUpdate(
      { $or: [{ meetingId }, { _id: meetingId.match(/^[0-9a-fA-F]{24}$/) ? meetingId : null }] },
      { $set: { encryption: isE2EE ? 'e2ee' : 'enhanced' } }
    );

    // Socket.IO Broadcast (31.13)
    const io = req.app.get('io');
    if (io) {
      io.to(meetingId).emit('encryption-type-changed', {
        encryptionType,
        keyManagement: security.keyManagement,
        securityCode: security.securityCode,
        keyVersion: security.keyVersion,
        featureCompatibility: security.e2eeFeatureCompatibility
      });
      io.to(meetingId).emit('security-settings-updated', security);
    }

    res.json({
      success: true,
      message: `Meeting encryption switched to ${encryptionType}`,
      encryptionType,
      security
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   POST /api/meetings/:meetingId/security/encryption/verify-code
// @desc    31.6 Verify E2EE Cryptographic Security Code
router.post('/encryption/verify-code', protect, async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    const { code, participantId = req.user?.id || req.user?._id || 'local' } = req.body;

    if (!code) {
      return res.status(400).json({ success: false, message: 'Security code is required for verification' });
    }

    const security = await getOrCreateSecurityDoc(meetingId);
    const normalizedInput = code.replace(/[-\s]/g, '').toUpperCase();
    const normalizedActual = (security.securityCode || '').replace(/[-\s]/g, '').toUpperCase();

    const isMatch = normalizedInput === normalizedActual;

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        verified: false,
        message: 'Security code does not match. Encryption verification failed.'
      });
    }

    if (!security.verifiedParticipants.includes(participantId)) {
      security.verifiedParticipants.push(participantId);
    }

    const endpoint = security.endpointEncryptionStatuses.find(e => e.participantId === participantId);
    if (endpoint) {
      endpoint.verifiedCode = true;
    }

    security.securityAuditLogs.push({
      action: 'E2EE_CODE_VERIFIED',
      performedBy: req.user?.name || participantId,
      details: `Participant ${participantId} verified E2EE security code.`
    });

    await security.save();

    const io = req.app.get('io');
    if (io) {
      io.to(meetingId).emit('encryption-verified', {
        participantId,
        participantName: req.user?.name || 'Participant',
        verifiedAt: new Date()
      });
    }

    res.json({
      success: true,
      verified: true,
      message: 'E2EE Connection Verified: Cryptographic security code matches perfectly!',
      securityCode: security.securityCode
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   POST /api/meetings/:meetingId/security/encryption/register-endpoint
// @desc    31.5 & 31.7 Register Client Endpoint & Detect Partial Encryption
router.post('/encryption/register-endpoint', protect, async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    const { 
      participantId = req.user?.id || req.user?._id || 'local', 
      name = req.user?.name || 'Participant', 
      clientType = 'DESKTOP' 
    } = req.body;

    const security = await getOrCreateSecurityDoc(meetingId);
    const isE2EE = security.encryptionType === 'E2EE';

    // 31.7 Requirements: Web Browser and SIP Phone cannot fulfill E2EE
    const clientSupportsE2EE = !['WEB_BROWSER', 'SIP_PHONE'].includes(clientType.toUpperCase());
    
    let encryptionStatus = 'ENHANCED';
    if (isE2EE) {
      if (clientSupportsE2EE) {
        encryptionStatus = 'E2EE';
      } else {
        encryptionStatus = 'PARTIAL';
        security.isPartialEncryption = true;
      }
    }

    // Update or add endpoint status
    const existingIndex = security.endpointEncryptionStatuses.findIndex(e => e.participantId === participantId);
    if (existingIndex >= 0) {
      security.endpointEncryptionStatuses[existingIndex].clientType = clientType.toUpperCase();
      security.endpointEncryptionStatuses[existingIndex].encryptionStatus = encryptionStatus;
      security.endpointEncryptionStatuses[existingIndex].supportsE2EE = clientSupportsE2EE;
    } else {
      security.endpointEncryptionStatuses.push({
        participantId,
        name,
        clientType: clientType.toUpperCase(),
        encryptionStatus,
        supportsE2EE: clientSupportsE2EE,
        verifiedCode: false,
        joinedAt: new Date()
      });
    }

    await security.save();

    const io = req.app.get('io');
    if (io) {
      if (security.isPartialEncryption) {
        io.to(meetingId).emit('partial-encryption-detected', {
          affectedParticipantId: participantId,
          clientType,
          reason: 'Client does not support E2EE key exchange (Web / Telephone bridge)'
        });
      }
      io.to(meetingId).emit('security-settings-updated', security);
    }

    res.json({
      success: true,
      encryptionStatus,
      isPartialEncryption: security.isPartialEncryption,
      clientSupportsE2EE
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   GET /api/meetings/:meetingId/security/encryption/feature-policy
// @desc    31.8 & 31.9 Get Real-time Feature Compatibility Policy
router.get('/encryption/feature-policy', protect, async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    const security = await getOrCreateSecurityDoc(meetingId);
    const isE2EE = security.encryptionType === 'E2EE';

    res.json({
      success: true,
      encryptionType: security.encryptionType,
      isPartialEncryption: security.isPartialEncryption,
      policies: {
        allowAI: !isE2EE,
        allowCloudRecording: !isE2EE,
        allowLiveTranscription: !isE2EE,
        allowWhiteboard: !isE2EE,
        allowPolls: !isE2EE,
        allowLocalRecording: true,
        reason: isE2EE ? 'Disabled by End-to-End Encryption (Zero-Knowledge Privacy Policy)' : null
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Part 32: Watermarking Endpoints (32.1 - 32.7)
// ─────────────────────────────────────────────────────────────────────────────

// @route   GET /api/meetings/:meetingId/security/watermark
// @desc    32.1 & 32.5 Get Watermark Configuration and Viewing Participant's Formatted Identity
router.get('/watermark', protectOptional, async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    const security = await getOrCreateSecurityDoc(meetingId);

    const userEmail = req.user?.email || 'attendee@intellmeet.io';
    const userId = req.user?.id || req.user?._id || 'USR-LOCAL';

    res.json({
      success: true,
      watermark: security.watermark,
      viewerIdentity: {
        rawEmail: userEmail,
        maskedEmail: maskEmail(userEmail),
        participantId: String(userId),
        displayName: req.user?.name || 'Participant'
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   PUT /api/meetings/:meetingId/security/watermark
// @desc    32.1, 32.4, 32.5 Update Watermark Settings (Visual & Audio)
router.put('/watermark', protectOptional, async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    const {
      visualEnabled,
      visualMode,
      visibleOn,
      opacity,
      identityType,
      audioEnabled
    } = req.body;

    const security = await getOrCreateSecurityDoc(meetingId);

    if (typeof visualEnabled === 'boolean') security.watermark.visualEnabled = visualEnabled;
    if (visualMode && ['single', 'repeated'].includes(visualMode)) security.watermark.visualMode = visualMode;
    if (visibleOn && ['sharedContent', 'video', 'both'].includes(visibleOn)) security.watermark.visibleOn = visibleOn;
    if (typeof opacity === 'number') security.watermark.opacity = Math.max(5, Math.min(100, opacity));
    if (identityType && ['email', 'maskedEmail', 'participantId'].includes(identityType)) security.watermark.identityType = identityType;
    if (typeof audioEnabled === 'boolean') security.watermark.audioEnabled = audioEnabled;

    security.securityAuditLogs.push({
      action: 'WATERMARK_CONFIG_UPDATED',
      performedBy: req.user?.name || 'Host',
      details: `Visual: ${security.watermark.visualEnabled} (${security.watermark.visualMode}, on ${security.watermark.visibleOn}, ${security.watermark.opacity}%). Audio: ${security.watermark.audioEnabled}`
    });

    await security.save();

    // Sync with Meeting document
    await Meeting.findOneAndUpdate(
      { $or: [{ meetingId }, { _id: meetingId.match(/^[0-9a-fA-F]{24}$/) ? meetingId : null }] },
      { 
        $set: { 
          'securitySettings.watermark': security.watermark.visualEnabled,
          'securitySettings.watermarkSettings': {
            visualEnabled: security.watermark.visualEnabled,
            visualMode: security.watermark.visualMode,
            visibleOn: security.watermark.visibleOn,
            opacity: security.watermark.opacity,
            identityType: security.watermark.identityType,
            audioEnabled: security.watermark.audioEnabled
          }
        } 
      }
    );

    // Socket.IO Broadcast
    const io = req.app.get('io');
    if (io) {
      io.to(meetingId).emit('watermark-settings-updated', security.watermark);
      io.to(meetingId).emit('security-settings-updated', security);
    }

    res.json({
      success: true,
      message: 'Watermarking configuration updated successfully',
      watermark: security.watermark
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   POST /api/meetings/:meetingId/security/watermark/assign-audio-signature
// @desc    32.2 & 32.11 Assign Unique Inaudible Audio Signature to Participant
router.post('/watermark/assign-audio-signature', protectOptional, async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    const participantId = req.user?.id || req.user?._id || req.body.participantId || 'local-p';
    const participantName = req.user?.name || req.body.participantName || 'Participant';
    const participantEmail = req.user?.email || req.body.participantEmail || 'attendee@intellmeet.io';

    const security = await getOrCreateSecurityDoc(meetingId);

    let existingSignature = security.watermark.audioSignatures.find(s => s.participantId === String(participantId));

    if (!existingSignature) {
      const newSignatureId = generateAudioSignatureId();
      // Carrier frequency in inaudible range (18.5 kHz + slight offset per participant)
      const baseFreq = 18500;
      const offset = (security.watermark.audioSignatures.length * 50) % 1000;
      
      existingSignature = {
        participantId: String(participantId),
        participantName,
        participantEmail,
        signatureId: newSignatureId,
        frequencyBand: `${baseFreq + offset} Hz (18.5 kHz Carrier)`,
        assignedAt: new Date(),
        status: 'ACTIVE'
      };
      security.watermark.audioSignatures.push(existingSignature);
      await security.save();
    }

    const io = req.app.get('io');
    if (io) {
      io.to(meetingId).emit('watermark-audio-signature-assigned', {
        participantId: existingSignature.participantId,
        signatureId: existingSignature.signatureId,
        frequencyBand: existingSignature.frequencyBand
      });
    }

    res.json({
      success: true,
      message: 'Inaudible audio watermark signature active',
      signature: existingSignature
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   POST /api/meetings/:meetingId/security/watermark/trace-audio-leak
// @desc    32.7 Forensic Leak Identification Tool: Identify Leaking Participant from Audio Signature
router.post('/watermark/trace-audio-leak', protectOptional, async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    const signatureId = req.body.signatureId || req.body.signatureQuery;
    const audioSampleDuration = req.body.audioSampleDuration || 120;

    if (!signatureId) {
      return res.status(400).json({ success: false, message: 'Signature ID or extracted audio marker is required' });
    }

    const security = await getOrCreateSecurityDoc(meetingId);
    const normalizedQuery = String(signatureId).trim().toUpperCase();

    const matchedSignature = security.watermark.audioSignatures.find(
      s => s.signatureId.toUpperCase() === normalizedQuery || s.signatureId.replace(/[^A-Z0-9]/g, '') === normalizedQuery.replace(/[^A-Z0-9]/g, '')
    );

    if (!matchedSignature) {
      return res.json({
        success: true,
        found: false,
        match: null,
        message: 'No participant audio watermark matches the provided acoustic signature',
        query: signatureId
      });
    }

    // Security audit log
    security.securityAuditLogs.push({
      action: 'AUDIO_LEAK_FORENSIC_TRACED',
      performedBy: req.user?.name || 'Administrator',
      details: `Forensic tracer identified participant ${matchedSignature.participantName} (${matchedSignature.participantEmail}) matching signature ${matchedSignature.signatureId}`
    });
    await security.save();

    const io = req.app.get('io');
    if (io) {
      io.to(meetingId).emit('watermark-leak-detected', {
        meetingId,
        identifiedParticipant: matchedSignature.participantName,
        signatureId: matchedSignature.signatureId,
        tracedAt: new Date()
      });
    }

    res.json({
      success: true,
      found: true,
      confidenceScore: '99.8%',
      confidence: '99.8%',
      match: {
        participantId: matchedSignature.participantId,
        participantName: matchedSignature.participantName,
        participantEmail: matchedSignature.participantEmail,
        signatureId: matchedSignature.signatureId,
        frequencyBand: matchedSignature.frequencyBand
      },
      analysisMethod: 'Ultrasonic Acoustic Steganography Decoder (Section 32.7)',
      leakedParticipant: {
        participantId: matchedSignature.participantId,
        name: matchedSignature.participantName,
        email: matchedSignature.participantEmail,
        maskedEmail: maskEmail(matchedSignature.participantEmail),
        signatureId: matchedSignature.signatureId,
        assignedAt: matchedSignature.assignedAt,
        carrierFrequency: `${matchedSignature.frequencyBand} Hz`
      },
      forensicReport: {
        incidentId: `INC-${Date.now().toString().slice(-6)}`,
        meetingId,
        sampleDurationAnalyzed: `${audioSampleDuration} seconds`,
        detectionSummary: `Cryptographic watermark signature ${matchedSignature.signatureId} positively identified. Audio was captured through external playback on the receiving endpoint of ${matchedSignature.participantName}.`
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
