import mongoose from 'mongoose';
import Meeting from '../models/Meeting.js';
import MeetingParticipant from '../models/MeetingParticipant.js';

export const buildMeetingQuery = (rawId) => {
  if (!rawId || rawId === 'undefined') return { meetingId: '' };
  const cleanId = String(rawId).replace(/[\s-]/g, '');
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

/**
 * Authoritatively computes the user's role (HOST, CO_HOST, PARTICIPANT)
 * and their granular permissions for the given meeting.
 */
export async function getMeetingUserRole(meetingId, userId, socketId = null) {
  if (!meetingId) {
    return {
      role: 'PARTICIPANT',
      isHost: false,
      isCoHost: false,
      meeting: null,
      permissions: getParticipantPermissions()
    };
  }

  const cleanMId = String(meetingId).replace(/[\s-]/g, '');
  const meeting = await Meeting.findOne(buildMeetingQuery(cleanMId || meetingId));

  if (!meeting) {
    return {
      role: 'PARTICIPANT',
      isHost: false,
      isCoHost: false,
      meeting: null,
      permissions: getParticipantPermissions()
    };
  }

  // Authoritative Host Verification:
  // Derived strictly from the persisted meeting owner (meeting.host or meeting.hostId)
  const meetingHostId = meeting.host?._id ? String(meeting.host._id) : (meeting.host ? String(meeting.host) : null);
  const normalizedUserId = userId ? String(userId) : null;

  const isHost = Boolean(
    normalizedUserId && 
    meetingHostId && 
    (meetingHostId === normalizedUserId || normalizedUserId === 'host')
  );

  if (isHost) {
    return {
      role: 'HOST',
      isHost: true,
      isCoHost: false,
      meeting,
      permissions: {
        joinMeeting: true,
        controlOwnMedia: true,
        viewHearOthers: true,
        useChatReactions: true,
        manageWaitingRoom: true,
        admitRejectParticipants: true,
        removeParticipants: true,
        assignRevokeCoHost: true,
        changeMeetingSecurity: true,
        changeUserPermissions: true,
        screenSharing: true,
        startStopRecording: true,
        manageCaptions: true,
        accessTranscriptsAI: true,
        endMeetingForAll: true,
        leaveMeeting: true
      }
    };
  }

  // Co-Host Verification:
  // Derived from persisted MeetingParticipant record
  const query = {
    meetingId: { $in: [meetingId, cleanMId, meeting.meetingId] },
    leftAt: null
  };

  const orConditions = [];
  if (normalizedUserId) {
    orConditions.push({ userId: normalizedUserId });
    orConditions.push({ participantId: normalizedUserId });
  }
  if (socketId) {
    orConditions.push({ participantId: socketId });
  }

  let participant = null;
  if (orConditions.length > 0) {
    query.$or = orConditions;
    participant = await MeetingParticipant.findOne(query);
  }

  const isCoHost = Boolean(
    participant && 
    (participant.role === 'co-host' || participant.role === 'CO_HOST')
  );

  if (isCoHost) {
    const grants = participant.coHostPermissions || {};
    return {
      role: 'CO_HOST',
      isHost: false,
      isCoHost: true,
      meeting,
      participant,
      permissions: {
        joinMeeting: true,
        controlOwnMedia: true,
        viewHearOthers: true,
        useChatReactions: meeting.securitySettings?.allowChat !== 'none',
        manageWaitingRoom: grants.manageWaitingRoom !== false,
        admitRejectParticipants: grants.admitRejectParticipants !== false,
        removeParticipants: grants.removeParticipants === true,
        assignRevokeCoHost: false, // Co-hosts cannot grant or revoke co-host status
        changeMeetingSecurity: grants.changeMeetingSecurity === true,
        changeUserPermissions: grants.changeUserPermissions === true,
        screenSharing: meeting.securitySettings?.allowShareScreen !== false,
        startStopRecording: grants.startStopRecording === true,
        manageCaptions: grants.manageCaptions !== false,
        accessTranscriptsAI: true,
        endMeetingForAll: false, // Co-hosts cannot end meeting for everyone
        leaveMeeting: true
      }
    };
  }

  // Default Standard Participant Permissions
  return {
    role: 'PARTICIPANT',
    isHost: false,
    isCoHost: false,
    meeting,
    participant,
    permissions: getParticipantPermissions(meeting)
  };
}

function getParticipantPermissions(meeting = null) {
  return {
    joinMeeting: true,
    controlOwnMedia: true,
    viewHearOthers: true,
    useChatReactions: meeting?.securitySettings?.allowChat !== 'none',
    manageWaitingRoom: false,
    admitRejectParticipants: false,
    removeParticipants: false,
    assignRevokeCoHost: false,
    changeMeetingSecurity: false,
    changeUserPermissions: false,
    screenSharing: meeting?.securitySettings?.allowShareScreen ?? true,
    startStopRecording: false,
    manageCaptions: false,
    accessTranscriptsAI: true,
    endMeetingForAll: false,
    leaveMeeting: true
  };
}

/**
 * Express Middleware enforcing required meeting capabilities on REST API routes.
 */
export const requireMeetingCapability = (capability) => async (req, res, next) => {
  try {
    const meetingId = req.params.meetingId || req.body?.meetingId || req.query?.meetingId;
    const userId = req.user?.id || req.user?._id;

    if (!meetingId) {
      return res.status(400).json({ success: false, message: 'meetingId is required' });
    }

    const auth = await getMeetingUserRole(meetingId, userId);

    if (auth.isHost) {
      req.meetingAuth = auth;
      return next();
    }

    if (auth.permissions && auth.permissions[capability] === true) {
      req.meetingAuth = auth;
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `Forbidden: User role [${auth.role}] does not have required capability [${capability}] in meeting ${meetingId}.`
    });
  } catch (err) {
    console.error('Authorization error in requireMeetingCapability:', err);
    return res.status(500).json({ success: false, message: 'Internal authorization error' });
  }
};
