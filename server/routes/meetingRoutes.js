import express from 'express';
import mongoose from 'mongoose';
import Meeting from '../models/Meeting.js';
import MeetingRegistration from '../models/MeetingRegistration.js';
import { protect } from '../middleware/authMiddleware.js';
import { getMeetingUserRole } from '../services/meetingAuthorizationService.js';

const router = express.Router();

const buildMeetingQuery = (rawId) => {
  if (!rawId || rawId === 'undefined') return { meetingId: '' };
  const cleanId = rawId.replace(/[\s-]/g, '');
  const or = [
    { meetingId: rawId },
    { meetingId: cleanId }
  ];

  if (cleanId.length === 10) {
    or.push({ meetingId: `${cleanId.slice(0, 3)} ${cleanId.slice(3, 6)} ${cleanId.slice(6)}` });
    or.push({ meetingId: `${cleanId.slice(0, 3)}-${cleanId.slice(3, 6)}-${cleanId.slice(6)}` });
  } else if (cleanId.length === 9) {
    or.push({ meetingId: `${cleanId.slice(0, 3)} ${cleanId.slice(3, 6)} ${cleanId.slice(6)}` });
    or.push({ meetingId: `${cleanId.slice(0, 3)}-${cleanId.slice(3, 6)}-${cleanId.slice(6)}` });
  } else if (cleanId.length === 11) {
    or.push({ meetingId: `${cleanId.slice(0, 3)} ${cleanId.slice(3, 7)} ${cleanId.slice(7)}` });
  }

  if (cleanId.length >= 6) {
    const pattern = '^' + cleanId.split('').join('[\\s-]*') + '$';
    or.push({ meetingId: { $regex: pattern, $options: 'i' } });
  }

  if (mongoose.Types.ObjectId.isValid(rawId)) {
    or.push({ _id: rawId });
  }
  return { $or: or };
};

// @route   GET /api/meetings
const memoryMeetings = new Map();

// @desc    Get user meetings
router.get('/', protect, async (req, res) => {
  try {
    const isDbConnected = mongoose.connection.readyState === 1;
    const userId = req.user?._id || req.user?.id;
    const userName = req.user?.name;
    const userEmail = req.user?.email;
    const userObjId = mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : null;

    if (isDbConnected) {
      try {
        const hostConditions = [];
        if (userId) {
          hostConditions.push({ host: userId });
          hostConditions.push({ host: String(userId) });
          if (userObjId) {
            hostConditions.push({ host: userObjId });
            hostConditions.push({ 'participants.user': userObjId });
          }
          hostConditions.push({ 'participants.user': userId });
          hostConditions.push({ 'participants.user': String(userId) });
        }
        if (userName) {
          hostConditions.push({ hostName: userName });
        }
        if (userEmail) {
          hostConditions.push({ hostEmail: userEmail.toLowerCase() });
          hostConditions.push({ 'participants.email': userEmail.toLowerCase() });
        }

        const query = hostConditions.length > 0 ? { $or: hostConditions } : {};
        const meetings = await Meeting.find(query)
          .select('title description date time duration timezone status meetingId passcode recurring participants host hostName hostEmail createdAt')
          .sort({ createdAt: -1 })
          .limit(50)
          .lean();
        if (meetings && meetings.length > 0) {
          return res.json({ success: true, meetings });
        }
      } catch (dbErr) {
        console.warn('DB Meeting query fallback:', dbErr.message);
      }
    }

    // Fallback to memory meetings
    const userMemMeetings = Array.from(memoryMeetings.values()).filter(m => 
      (userId && (m.host === userId || m.host === String(userId) || (userObjId && String(m.host) === String(userObjId)))) ||
      (userName && m.hostName === userName) ||
      (userEmail && m.hostEmail === userEmail.toLowerCase())
    );
    return res.json({ success: true, meetings: userMemMeetings });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/meetings
// @desc    Create a new meeting
router.post('/', protect, async (req, res) => {
  try {
    const meetingData = req.body;
    const { title, date, time } = meetingData;
    const userId = req.user?._id || req.user?.id || 'host';
    const userName = req.user?.name || 'Host';
    
    // Generate meeting ID if not provided automatically
    const meetingId = meetingData.meetingId || `${Math.floor(100 + Math.random() * 900)}-${Math.floor(100 + Math.random() * 900)}-${Math.floor(1000 + Math.random() * 9000)}`;

    const meetingPayload = {
      ...meetingData,
      meetingId,
      host: userId,
      hostName: userName,
      status: meetingData.status || 'scheduled',
      createdAt: new Date()
    };

    const isDbConnected = mongoose.connection.readyState === 1;
    if (isDbConnected) {
      try {
        const newMeeting = await Meeting.create(meetingPayload);
        memoryMeetings.set(meetingId, newMeeting.toObject ? newMeeting.toObject() : newMeeting);
        return res.status(201).json({ success: true, meeting: newMeeting });
      } catch (dbErr) {
        console.warn('DB Meeting create fallback:', dbErr.message);
      }
    }

    const fallbackMeeting = {
      _id: 'mtg_' + Date.now(),
      id: 'mtg_' + Date.now(),
      ...meetingPayload,
      title: title || 'New Meeting',
      date: date || new Date().toISOString().split('T')[0],
      time: time || '10:00 AM',
    };
    memoryMeetings.set(meetingId, fallbackMeeting);

    return res.status(201).json({
      success: true,
      meeting: fallbackMeeting
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/meetings/:meetingId/my-role
// @desc    Authoritatively get user role and permissions for the meeting
router.get('/:meetingId/my-role', protect, async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const auth = await getMeetingUserRole(req.params.meetingId, userId);
    return res.json({
      success: true,
      role: auth.role,
      isHost: auth.isHost,
      isCoHost: auth.isCoHost,
      permissions: auth.permissions,
      meetingTitle: auth.meeting?.title || 'Meeting'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/meetings/:meetingId
// @desc    Get meeting details
router.get('/:meetingId', async (req, res) => {
  try {
    const isDbConnected = Meeting.db && Meeting.db.readyState === 1;
    if (isDbConnected) {
      const meeting = await Meeting.findOne(buildMeetingQuery(req.params.meetingId)).lean();
      if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found' });
      return res.json({ success: true, meeting });
    }
    return res.status(404).json({ success: false, message: 'Database offline' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// @route   DELETE /api/meetings/:meetingId
// @desc    Delete scheduled meeting
router.delete('/:meetingId', protect, async (req, res) => {
  try {
    const isDbConnected = Meeting.db && Meeting.db.readyState === 1;
    if (isDbConnected) {
      await Meeting.findOneAndDelete(buildMeetingQuery(req.params.meetingId));
      return res.json({ success: true, message: 'Meeting deleted' });
    }
    return res.status(404).json({ success: false, message: 'Database offline' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/meetings/public/:meetingId
// @desc    Get public meeting info for registration page (no auth required)
router.get('/public/:meetingId', async (req, res) => {
  try {
    const isDbConnected = Meeting.db && Meeting.db.readyState === 1;
    if (isDbConnected) {
      const meeting = await Meeting.findOne(buildMeetingQuery(req.params.meetingId))
        .select('title description date time timezone hostName registration passcode')
        .lean();
      if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found' });
      return res.json({ success: true, meeting });
    }
    return res.status(404).json({ success: false, message: 'Database offline' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/meetings/:meetingId/register
// @desc    Submit participant registration
router.post('/:meetingId/register', async (req, res) => {
  try {
    const { name, email, organization, customAnswers } = req.body;
    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Name and email are required' });
    }

    const meeting = await Meeting.findOne(buildMeetingQuery(req.params.meetingId));

    if (!meeting) {
      return res.status(404).json({ success: false, message: 'Meeting not found' });
    }

    // Check email domain restriction if configured
    if (meeting.registration?.allowedDomains && meeting.registration.allowedDomains.length > 0) {
      const userDomain = email.split('@')[1]?.toLowerCase();
      const isAllowed = meeting.registration.allowedDomains.some(d => d.toLowerCase() === userDomain);
      if (!isAllowed) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Registration for this meeting is restricted to: ${meeting.registration.allowedDomains.join(', ')}`
        });
      }
    }

    // Check if already registered
    const existing = await MeetingRegistration.findOne({
      meetingId: meeting.meetingId,
      email: email.toLowerCase()
    });

    if (existing) {
      return res.json({
        success: true,
        message: 'You are already registered for this meeting.',
        registration: existing,
        meeting
      });
    }

    // Determine approval status
    const isManualApproval = meeting.registration?.approvalType === 'manual';
    const status = isManualApproval ? 'Pending' : 'Approved';

    const newReg = await MeetingRegistration.create({
      registrationId: 'reg_' + Math.floor(100000 + Math.random() * 900000),
      meetingId: meeting.meetingId,
      name,
      email: email.toLowerCase(),
      organization: organization || '',
      customAnswers: customAnswers || [],
      status,
      registeredAt: new Date()
    });

    res.status(201).json({
      success: true,
      message: isManualApproval 
        ? 'Your registration has been submitted and is pending host approval.' 
        : 'Registration approved! You can now join the meeting.',
      registration: newReg,
      meeting
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/meetings/:meetingId/registrations
// @desc    Get all registrants for a meeting (Host view)
router.get('/:meetingId/registrations', protect, async (req, res) => {
  try {
    const cleanId = req.params.meetingId.replace(/[\s-]/g, '');
    const registrations = await MeetingRegistration.find({
      $or: [{ meetingId: req.params.meetingId }, { meetingId: cleanId }]
    }).sort({ createdAt: -1 });

    res.json({ success: true, count: registrations.length, registrations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/meetings/:meetingId/registrations/:regId
// @desc    Approve or reject a registrant
router.put('/:meetingId/registrations/:regId', protect, async (req, res) => {
  try {
    const { status } = req.body; // 'Approved' or 'Rejected'
    const reg = await MeetingRegistration.findOneAndUpdate(
      { $or: [{ registrationId: req.params.regId }, { _id: req.params.regId }] },
      { status },
      { new: true }
    );
    if (!reg) return res.status(404).json({ success: false, message: 'Registration not found' });
    res.json({ success: true, registration: reg });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   DELETE /api/meetings/:meetingId/registrations/:regId
// @desc    Remove a registrant
router.delete('/:meetingId/registrations/:regId', protect, async (req, res) => {
  try {
    await MeetingRegistration.findOneAndDelete({
      $or: [{ registrationId: req.params.regId }, { _id: req.params.regId }]
    });
    res.json({ success: true, message: 'Registration removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/meetings/pre-join-check/:meetingId
// @desc    Pre-meeting security evaluation pipeline (Passcode, Auth, Reg, Lock, Waiting Room)
router.get('/pre-join-check/:meetingId', async (req, res) => {
  try {
    const meeting = await Meeting.findOne(buildMeetingQuery(req.params.meetingId));

    if (!meeting) {
      return res.status(404).json({ success: false, notFound: true, message: 'Meeting not found' });
    }

    const isLocked = !!(meeting.isLocked || meeting.securitySettings?.lockMeeting);

    res.json({
      success: true,
      meeting: {
        id: meeting._id,
        meetingId: meeting.meetingId,
        title: meeting.title,
        hostName: meeting.hostName,
        isLocked,
        passcodeRequired: !!(meeting.passcode && meeting.passcode.trim().length > 0 && meeting.passcodeEnabled !== false),
        waitingRoom: !!meeting.waitingRoom,
        authentication: meeting.authentication || { required: false },
        registration: meeting.registration || { required: false },
        securitySettings: meeting.securitySettings || {},
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/meetings/:meetingId/verify-passcode
// @desc    Validate participant passcode
router.post('/:meetingId/verify-passcode', async (req, res) => {
  try {
    const { passcode } = req.body;
    const meeting = await Meeting.findOne(buildMeetingQuery(req.params.meetingId));

    if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found' });

    if (!meeting.passcode || meeting.passcode.trim() === '') {
      return res.json({ success: true, valid: true });
    }

    const isValid = passcode && passcode.trim().toUpperCase() === meeting.passcode.trim().toUpperCase();
    if (!isValid) {
      return res.status(400).json({ success: false, valid: false, message: 'Invalid passcode' });
    }

    res.json({ success: true, valid: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/meetings/:meetingId/check-registration
// @desc    Verify if participant email is registered and approved
router.post('/:meetingId/check-registration', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email required' });

    const meeting = await Meeting.findOne(buildMeetingQuery(req.params.meetingId));

    if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found' });

    const registration = await MeetingRegistration.findOne({
      meetingId: meeting.meetingId,
      email: email.toLowerCase().trim()
    });

    if (!registration) {
      return res.json({ success: true, registered: false });
    }

    res.json({
      success: true,
      registered: true,
      status: registration.status, // 'Approved', 'Pending', 'Rejected'
      registration
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/meetings/:meetingId/security
// @desc    Host in-meeting security controls update (Lock, Waiting Room, Permissions, Screen Capture)
router.put('/:meetingId/security', protect, async (req, res) => {
  try {
    const { isLocked, waitingRoom, securitySettings } = req.body;

    const updateFields = {};
    if (typeof isLocked === 'boolean') {
      updateFields.isLocked = isLocked;
      updateFields['securitySettings.lockMeeting'] = isLocked;
    }
    if (typeof waitingRoom === 'boolean') {
      updateFields.waitingRoom = waitingRoom;
      updateFields['securitySettings.enableWaitingRoom'] = waitingRoom;
    }
    if (securitySettings) {
      for (const [key, val] of Object.entries(securitySettings)) {
        updateFields[`securitySettings.${key}`] = val;
      }
    }

    const meeting = await Meeting.findOneAndUpdate(
      buildMeetingQuery(req.params.meetingId),
      { $set: updateFields },
      { new: true }
    );

    if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found' });
    res.json({ success: true, meeting });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/meetings/:meetingId/lock
// @desc    Quick toggle lock meeting
router.put('/:meetingId/lock', protect, async (req, res) => {
  try {
    const { lock } = req.body;
    const meeting = await Meeting.findOneAndUpdate(
      buildMeetingQuery(req.params.meetingId),
      { $set: { isLocked: !!lock, 'securitySettings.lockMeeting': !!lock } },
      { new: true }
    );
    if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found' });
    res.json({ success: true, isLocked: meeting.isLocked });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/meetings/:meetingId/end
// @desc    End meeting workflow (Finalize recordings, save end duration, queue AI pipeline)
router.post('/:meetingId/end', protect, async (req, res) => {
  try {
    const meetingId = req.params.meetingId;
    const meeting = await Meeting.findOne(buildMeetingQuery(meetingId));

    if (!meeting) {
      return res.status(404).json({ success: false, message: 'Meeting not found' });
    }

    meeting.status = 'ended';
    meeting.endedAt = new Date();
    await meeting.save();

    // Finalize any active recording
    let activeRecording = null;
    try {
      const { Recording } = await import('../models/Recording.js');
      const { AIPipelineService } = await import('../services/aiPipelineService.js');

      activeRecording = await Recording.findOne({
        meetingId: meeting.meetingId,
        status: { $in: ['RECORDING', 'PAUSED'] }
      }).sort({ createdAt: -1 });

      if (activeRecording) {
        activeRecording.endedAt = new Date();
        const totalSecs = Math.max(1, Math.floor((activeRecording.endedAt.getTime() - new Date(activeRecording.startedAt).getTime()) / 1000));
        activeRecording.duration = Math.max(1, totalSecs - (activeRecording.pausedDuration || 0));
        activeRecording.status = 'READY';
        activeRecording.fileUrl = `/api/recordings/${activeRecording.recordingId}/stream`;
        activeRecording.downloadUrl = `/api/recordings/${activeRecording.recordingId}/download`;
        await activeRecording.save();
      }

      // Queue post-meeting AI intelligence in background
      AIPipelineService.processPostMeetingIntelligence(
        meeting.meetingId,
        activeRecording?.recordingId,
        meeting.title
      ).catch(e => console.error('Meeting end AI pipeline error:', e));

    } catch (pipelineErr) {
      console.warn('Meeting end recording/AI finalize warning:', pipelineErr);
    }

    res.json({
      success: true,
      message: 'Meeting ended successfully. Post-meeting assets and intelligence queued.',
      meeting,
      recording: activeRecording
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

