import express from 'express';
import MeetingParticipant from '../models/MeetingParticipant.js';
import ParticipantFeedback from '../models/ParticipantFeedback.js';
import Meeting from '../models/Meeting.js';
import { protect } from '../middleware/authMiddleware.js';
import { getMeetingUserRole, requireMeetingCapability } from '../services/meetingAuthorizationService.js';

const router = express.Router({ mergeParams: true });

// GET all participants & waiting room for a meeting
router.get('/:meetingId/participants', async (req, res) => {
  try {
    const { meetingId } = req.params;
    const participants = await MeetingParticipant.find({
      meetingId,
      leftAt: null,
    }).sort({ role: 1, displayName: 1 });

    const inMeeting = participants.filter(p => !p.isWaiting);
    const waitingRoom = participants.filter(p => p.isWaiting);

    res.json({
      success: true,
      inMeeting,
      waitingRoom,
      totalCount: inMeeting.length,
    });
  } catch (error) {
    console.error('Error fetching participants:', error);
    res.status(500).json({ success: false, message: 'Server error fetching participants' });
  }
});

// POST join meeting / record participant
router.post('/:meetingId/participants/join', async (req, res) => {
  try {
    const { meetingId } = req.params;
    const {
      participantId,
      userId,
      displayName,
      email,
      audioState = 'unmuted',
      videoState = 'on',
      isWaiting = false,
    } = req.body;

    if (!participantId || !displayName) {
      return res.status(400).json({ success: false, message: 'participantId and displayName required' });
    }

    // Authoritative Server-Side Role Computation (Never trust client-supplied role)
    const cleanMId = (meetingId || '').replace(/[\s-]/g, '');
    const auth = await getMeetingUserRole(cleanMId || meetingId, userId, participantId);
    const authoritativeRole = auth.role;

    let participant = await MeetingParticipant.findOne({ meetingId, participantId });

    if (participant) {
      participant.displayName = displayName;
      participant.role = authoritativeRole;
      participant.audioState = audioState;
      participant.videoState = videoState;
      participant.isWaiting = isWaiting;
      participant.leftAt = null;
      await participant.save();
    } else {
      participant = new MeetingParticipant({
        meetingId,
        participantId,
        userId: userId || participantId,
        displayName,
        email,
        role: authoritativeRole,
        audioState,
        videoState,
        isWaiting,
        joinedAt: new Date(),
      });
      await participant.save();
    }

    res.status(201).json({ success: true, participant, role: authoritativeRole, isHost: auth.isHost, permissions: auth.permissions });
  } catch (error) {
    console.error('Error joining participant:', error);
    res.status(500).json({ success: false, message: 'Server error joining participant' });
  }
});

// PUT update participant state (role, mute, video, rename, hand)
router.put('/:meetingId/participants/:participantId', protect, async (req, res) => {
  try {
    const { meetingId, participantId } = req.params;
    const updates = { ...req.body };

    const callerId = req.user?.id || req.user?._id;
    const callerAuth = await getMeetingUserRole(meetingId, callerId);

    // If caller attempts to modify another user's role or co-host permissions
    if (updates.role || updates.coHostPermissions) {
      if (!callerAuth.isHost) {
        return res.status(403).json({ success: false, message: 'Forbidden: Only the meeting Host can assign or change participant roles.' });
      }
    }

    // If caller attempts to modify another user's mute/video/state
    const isSelf = String(participantId) === String(callerId);
    if (!isSelf && !callerAuth.isHost && !callerAuth.permissions?.changeUserPermissions) {
      delete updates.audioState;
      delete updates.videoState;
      delete updates.isHandRaised;
      delete updates.displayName;
    }

    const participant = await MeetingParticipant.findOneAndUpdate(
      { meetingId, participantId },
      { $set: updates },
      { new: true }
    );

    if (!participant) {
      return res.status(404).json({ success: false, message: 'Participant not found' });
    }

    res.json({ success: true, participant });
  } catch (error) {
    console.error('Error updating participant:', error);
    res.status(500).json({ success: false, message: 'Server error updating participant' });
  }
});

// DELETE participant (remove or leave)
router.delete('/:meetingId/participants/:participantId', protect, async (req, res) => {
  try {
    const { meetingId, participantId } = req.params;
    const callerId = req.user?.id || req.user?._id;
    const callerAuth = await getMeetingUserRole(meetingId, callerId);

    const isSelf = String(participantId) === String(callerId);
    if (!isSelf && !callerAuth.isHost && !callerAuth.permissions?.removeParticipants) {
      return res.status(403).json({ success: false, message: 'Forbidden: You do not have permission to remove this participant.' });
    }

    const participant = await MeetingParticipant.findOneAndUpdate(
      { meetingId, participantId },
      { $set: { leftAt: new Date() } },
      { new: true }
    );

    res.json({ success: true, message: 'Participant marked as left', participant });
  } catch (error) {
    console.error('Error removing participant:', error);
    res.status(500).json({ success: false, message: 'Server error removing participant' });
  }
});

// POST Suspend Participant Activities (Section 11.14) - Host / authorized Co-Host only
router.post('/:meetingId/suspend-activities', protect, requireMeetingCapability('changeMeetingSecurity'), async (req, res) => {
  try {
    const { meetingId } = req.params;

    // Lock meeting and restrict permissions in Meeting model
    await Meeting.findOneAndUpdate(
      { $or: [{ meetingId }, { _id: meetingId.match(/^[0-9a-fA-F]{24}$/) ? meetingId : null }] },
      {
        $set: {
          isLocked: true,
          'securitySettings.lockMeeting': true,
          'securitySettings.allowChat': 'none',
          'securitySettings.allowShareScreen': false,
          'securitySettings.allowUnmute': false,
          'securitySettings.allowStartVideo': false,
          'securitySettings.allowWhiteboard': false,
          'securitySettings.suspendActivities': true,
        }
      }
    );

    // Mute and stop video for all participants in DB
    await MeetingParticipant.updateMany(
      { meetingId, leftAt: null, role: { $ne: 'host' } },
      { $set: { audioState: 'muted', videoState: 'off' } }
    );

    res.json({ success: true, message: 'All participant activities suspended and meeting locked' });
  } catch (error) {
    console.error('Error suspending activities:', error);
    res.status(500).json({ success: false, message: 'Server error suspending activities' });
  }
});

// ==========================================
// Part 12: Reactions & Feedback Endpoints (12.1 - 12.17)
// ==========================================

// GET /:meetingId/feedback - Retrieve speaking queue (raised hands) and non-verbal feedback summary
router.get('/:meetingId/feedback', async (req, res) => {
  try {
    const { meetingId } = req.params;

    // Fetch chronologically ordered raised hands
    const raisedHands = await MeetingParticipant.find({
      meetingId,
      leftAt: null,
      isHandRaised: true,
    }).sort({ handRaisedAt: 1, displayName: 1 });

    // Fetch active non-verbal feedbacks
    const activeParticipants = await MeetingParticipant.find({
      meetingId,
      leftAt: null,
      nonVerbalFeedback: { $ne: null },
    });

    const nonVerbalSummary = {
      YES: activeParticipants.filter(p => p.nonVerbalFeedback === 'YES').length,
      NO: activeParticipants.filter(p => p.nonVerbalFeedback === 'NO').length,
      SLOWER: activeParticipants.filter(p => p.nonVerbalFeedback === 'SLOWER').length,
      FASTER: activeParticipants.filter(p => p.nonVerbalFeedback === 'FASTER').length,
    };

    res.json({
      success: true,
      raisedHandsQueue: raisedHands.map((p, idx) => ({
        order: idx + 1,
        participantId: p.participantId,
        displayName: p.displayName,
        name: p.displayName,
        role: p.role,
        handRaisedAt: p.handRaisedAt,
      })),
      nonVerbalSummary,
      activeFeedbacks: {
        nonVerbal: activeParticipants.map(p => ({
          participantId: p.participantId,
          displayName: p.displayName,
          name: p.displayName,
          value: p.nonVerbalFeedback,
          timestamp: p.feedbackUpdatedAt,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({ success: false, message: 'Server error fetching feedback' });
  }
});

// POST /:meetingId/feedback - Submit reaction, raise hand, or non-verbal feedback
router.post('/:meetingId/feedback', async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { participantId, displayName = 'Participant', type, value } = req.body;

    if (!participantId || !type || !value) {
      return res.status(400).json({ success: false, message: 'participantId, type, and value required' });
    }

    if (type === 'RAISE_HAND') {
      const isRaised = value === 'RAISE';
      const handRaisedAt = isRaised ? new Date() : null;
      await MeetingParticipant.findOneAndUpdate(
        { meetingId, participantId },
        { 
          $set: { 
            isHandRaised: isRaised, 
            handRaisedAt, 
            displayName: displayName || 'Participant',
            leftAt: null
          } 
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    } else if (type === 'NON_VERBAL') {
      const nonVerbalFeedback = value === 'CLEAR' ? null : value;
      await MeetingParticipant.findOneAndUpdate(
        { meetingId, participantId },
        { 
          $set: { 
            nonVerbalFeedback, 
            feedbackUpdatedAt: new Date(), 
            displayName: displayName || 'Participant',
            leftAt: null
          } 
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    // Save event log in ParticipantFeedback
    const feedbackDoc = new ParticipantFeedback({
      meetingId,
      participantId,
      displayName,
      type,
      value,
      timestamp: new Date(),
    });
    await feedbackDoc.save();

    res.json({ success: true, feedback: feedbackDoc });
  } catch (error) {
    console.error('Error saving feedback:', error);
    res.status(500).json({ success: false, message: 'Server error saving feedback' });
  }
});

// POST /:meetingId/feedback/clear - Host clears all feedback and hands (12.4, 12.10, 12.17)
router.post('/:meetingId/feedback/clear', async (req, res) => {
  try {
    const { meetingId } = req.params;

    await MeetingParticipant.updateMany(
      { meetingId },
      { $set: { isHandRaised: false, handRaisedAt: null, nonVerbalFeedback: null } }
    );

    await ParticipantFeedback.updateMany(
      { meetingId, isActive: true },
      { $set: { isActive: false } }
    );

    res.json({ success: true, message: 'All feedback and raised hands cleared' });
  } catch (error) {
    console.error('Error clearing feedback:', error);
    res.status(500).json({ success: false, message: 'Server error clearing feedback' });
  }
});

// POST /:meetingId/feedback/lower-all-hands - Host lowers all hands only (12.4, 12.5)
router.post('/:meetingId/feedback/lower-all-hands', async (req, res) => {
  try {
    const { meetingId } = req.params;

    await MeetingParticipant.updateMany(
      { meetingId },
      { $set: { isHandRaised: false, handRaisedAt: null } }
    );

    res.json({ success: true, message: 'All raised hands lowered' });
  } catch (error) {
    console.error('Error lowering all hands:', error);
    res.status(500).json({ success: false, message: 'Server error lowering all hands' });
  }
});

export default router;
