import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { Server } from 'socket.io';
import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import meetingRoutes from './routes/meetingRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import MeetingParticipant from './models/MeetingParticipant.js';
import ParticipantFeedback from './models/ParticipantFeedback.js';
import Meeting from './models/Meeting.js';
import jwt from 'jsonwebtoken';
import { getMeetingUserRole, buildMeetingQuery } from './services/meetingAuthorizationService.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling']
});
app.set('io', io);
const PORT = process.env.PORT || 5000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CORS configuration - allow frontend requests
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  maxAge: '1d',
  immutable: true
}));

import moduleRoutes from './routes/moduleRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import pollRoutes from './routes/pollRoutes.js';
import userRoutes from './routes/userRoutes.js';

import chatRoutes from './routes/chatRoutes.js';
import participantRoutes from './routes/participantRoutes.js';
import screenShareRoutes from './routes/screenShareRoutes.js';
import annotationRoutes from './routes/annotationRoutes.js';
import presentationRoutes from './routes/presentationRoutes.js';
import whiteboardRoutes from './routes/whiteboardRoutes.js';
import breakoutRoutes from './routes/breakoutRoutes.js';
import captionRoutes from './routes/captionRoutes.js';
import translationRoutes from './routes/translationRoutes.js';
import interpretationRoutes from './routes/interpretationRoutes.js';
import recordingRoutes from './routes/recordingRoutes.js';
import transcriptRoutes from './routes/transcriptRoutes.js';
import summaryRoutes from './routes/summaryRoutes.js';
import questionRoutes from './routes/questionRoutes.js';
import personalNoteRoutes from './routes/personalNoteRoutes.js';
import smartRecordingRoutes from './routes/smartRecordingRoutes.js';
import pipelineRoutes from './routes/pipelineRoutes.js';
import meetingSecurityRoutes from './routes/meetingSecurityRoutes.js';
import liveStreamRoutes from './routes/liveStreamRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import agendaRoutes from './routes/agendaRoutes.js';
import personalizationRoutes from './routes/personalizationRoutes.js';
import adaptationRoutes from './routes/adaptationRoutes.js';
import integrationRoutes from './routes/integrationRoutes.js';
import lifecycleRoutes from './routes/lifecycleRoutes.js';
import billingRoutes from './routes/billingRoutes.js';
import ScreenShareSession from './models/ScreenShareSession.js';

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/organization', userRoutes);
app.use('/api/organization/users', userRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/meetings', chatRoutes);
app.use('/api/meetings', participantRoutes);
app.use('/api/meetings', screenShareRoutes);
app.use('/api/meetings', annotationRoutes);
app.use('/api/meetings', presentationRoutes);
app.use('/api/meetings/:meetingId/breakout', breakoutRoutes);
app.use('/api/breakout', breakoutRoutes);
app.use('/api/meetings/:meetingId/captions', captionRoutes);
app.use('/api/captions', captionRoutes);
app.use('/api/meetings/:meetingId/translation', translationRoutes);
app.use('/api/translation', translationRoutes);
app.use('/api/meetings/:meetingId/interpretation', interpretationRoutes);
app.use('/api/interpretation', interpretationRoutes);
app.use('/api/meetings/:meetingId/recording', recordingRoutes);
app.use('/api/recordings', recordingRoutes);
app.use('/api/recordings', smartRecordingRoutes);
app.use('/api/smart-recording', smartRecordingRoutes);
app.use('/api/meetings/:meetingId/ai-pipeline', pipelineRoutes);
app.use('/api/recordings/:recordingId/ai-pipeline', pipelineRoutes);
app.use('/api/ai-pipeline', pipelineRoutes);
app.use('/api/meetings/:meetingId/transcript', transcriptRoutes);
app.use('/api/transcripts', transcriptRoutes);
app.use('/api/meetings/:meetingId/summary', summaryRoutes);
app.use('/api/summaries', summaryRoutes);
app.use('/api/meetings/:meetingId/questions', questionRoutes);
app.use('/api/meetings/:meetingId/notes', personalNoteRoutes);
app.use('/api/notes', personalNoteRoutes);
app.use('/api/whiteboards', whiteboardRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/modules', moduleRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/polls', pollRoutes);
app.use('/api/meetings/:meetingId/security', meetingSecurityRoutes);
app.use('/api/meetings/security', meetingSecurityRoutes);
app.use('/api/meetings/:meetingId/livestream', liveStreamRoutes);
app.use('/api/livestream', liveStreamRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/meetings/:meetingId/adaptation', adaptationRoutes);
app.use('/api/adaptation', adaptationRoutes);
app.use('/api/personalization', personalizationRoutes);
app.use('/api/users/preferences', personalizationRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/meetings/:meetingId/integrations', integrationRoutes);
app.use('/api/meetings/:meetingId/lifecycle', lifecycleRoutes);
app.use('/api/meetings/lifecycle', lifecycleRoutes);
app.use('/api/meetings/:meetingId/knowledge', (req, res, next) => {
  req.url = '/knowledge' + (req.url === '/' ? '' : req.url);
  lifecycleRoutes(req, res, next);
});
app.use('/api/meetings/:meetingId', agendaRoutes);
app.use('/api/meetings', agendaRoutes);




// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'IntellMeet Backend API Server is running smoothly',
    timestamp: new Date().toISOString(),
  });
});

// Socket.io WebRTC, Chat, and Participant Signaling
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Extract user identity from handshake auth if available
  try {
    const token = socket.handshake.auth?.token;
    if (token && token !== 'null' && token !== 'undefined') {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'intellmeet_jwt_secret_key_2026_secure');
      socket.verifiedUserId = decoded.id || decoded._id;
      socket.verifiedUserName = decoded.name;
      socket.verifiedEmail = decoded.email;
    }
  } catch (err) {}

  // Central server-side permission validator for this socket
  const verifySocketPermission = async (action, capability) => {
    if (socket.isHost) return true;
    if (socket.permissions && socket.permissions[capability] === true) return true;
    const cleanRoomId = (socket.roomId || '').replace(/[\s-]/g, '');
    const currentAuth = await getMeetingUserRole(cleanRoomId || socket.roomId, socket.userId, socket.id);
    if (currentAuth.isHost || (currentAuth.permissions && currentAuth.permissions[capability] === true)) {
      socket.role = currentAuth.role;
      socket.isHost = currentAuth.isHost;
      socket.isCoHost = currentAuth.isCoHost;
      socket.permissions = currentAuth.permissions;
      return true;
    }
    console.warn(`[SECURITY VIOLATION BLOCKED] Socket ${socket.id} (user: ${socket.userId}, role: ${socket.role}) denied action: ${action} (${capability})`);
    socket.emit('security-action-denied', { action, capability, message: `Access Denied: You do not have permission to ${action}.` });
    return false;
  };

  socket.on('join-room', async (roomId, userId, userName, clientAuthToken) => {
    socket.join(roomId);

    let effectiveUserId = socket.verifiedUserId;
    let effectiveUserName = socket.verifiedUserName;

    if (!effectiveUserId && clientAuthToken) {
      try {
        const decoded = jwt.verify(clientAuthToken, process.env.JWT_SECRET || 'intellmeet_jwt_secret_key_2026_secure');
        effectiveUserId = decoded.id || decoded._id;
        effectiveUserName = decoded.name;
      } catch (e) {}
    }

    socket.userId = effectiveUserId || userId || socket.id;
    socket.userName = effectiveUserName || userName || 'Participant';
    socket.roomId = roomId;

    // Server-side authoritative role computation
    const cleanRoomId = roomId ? roomId.replace(/[\s-]/g, '') : '';
    const authResult = await getMeetingUserRole(cleanRoomId || roomId, socket.userId, socket.id);
    socket.role = authResult.role;
    socket.isHost = authResult.isHost;
    socket.isCoHost = authResult.isCoHost;
    socket.permissions = authResult.permissions;

    // Authoritative role assignment sent to client
    socket.emit('meeting-role-assigned', {
      role: authResult.role,
      isHost: authResult.isHost,
      isCoHost: authResult.isCoHost,
      permissions: authResult.permissions
    });

    console.log(`User ${socket.userName} (${socket.userId}) joined room ${roomId} as [${authResult.role}]`);

    try {
      const clients = await io.in(roomId).fetchSockets();
      const existingUsers = clients
        .filter(s => s.id !== socket.id)
        .map(s => ({
          socketId: s.id,
          userId: s.userId || s.id,
          userName: s.userName || 'Participant'
        }));
      socket.emit('all-users', existingUsers);
    } catch (e) {
      console.warn('Error fetching existing room sockets:', e);
    }

    // Tell everyone else in the room that a new user joined
    socket.to(roomId).emit('user-connected', socket.userId, socket.userName, socket.id);
  });

  // WebRTC Signaling
  socket.on('sending-signal', payload => {
    io.to(payload.userToSignal).emit('user-joined', { signal: payload.signal, callerID: payload.callerID, callerName: payload.callerName });
  });

  socket.on('returning-signal', payload => {
    io.to(payload.callerID).emit('receiving-returned-signal', { signal: payload.signal, id: socket.id });
  });

  // Real-time camera and microphone track status synchronization
  socket.on('toggle-media-state', (roomId, mediaState) => {
    socket.to(roomId).emit('participant-media-status', {
      socketId: socket.id,
      userId: socket.userId || socket.id,
      ...mediaState
    });
  });

  // Real-time Waiting Room & Admission Signaling
  socket.on('request-admission', (roomId, attendeeData) => {
    socket.join(`${roomId}-waiting`);
    socket.roomId = roomId;
    socket.userId = attendeeData.userId || socket.id;
    socket.userName = attendeeData.userName || 'Guest';
    io.to(roomId).emit('attendee-waiting', {
      socketId: socket.id,
      userId: attendeeData.userId || socket.id,
      name: attendeeData.userName || 'Guest',
      joinedAt: new Date().toISOString()
    });
  });

  socket.on('admit-waiting-participant', (roomId, { socketId, participantId, name }) => {
    io.to(socketId || participantId).emit('admission-approved', { roomId });
    io.to(roomId).emit('waiting-participant-admitted', { socketId, participantId, name });
  });

  socket.on('reject-waiting-participant', (roomId, { socketId, participantId }) => {
    io.to(socketId || participantId).emit('admission-rejected');
    io.to(roomId).emit('waiting-participant-rejected', { socketId, participantId });
  });

  socket.on('admit-all-waiting-participants', (roomId) => {
    io.to(`${roomId}-waiting`).emit('admission-approved', { roomId });
    io.to(roomId).emit('all-waiting-admitted');
  });

  // Chat and Captions (Part 10 In-Meeting & Continuous Chat)
  socket.on('send-message', (roomId, messageData) => {
    io.to(roomId).emit('receive-message', messageData);
  });

  socket.on('send-chat-message', (roomId, messageData) => {
    io.to(roomId).emit('receive-chat-message', messageData);
  });

  socket.on('edit-chat-message', (roomId, messageData) => {
    io.to(roomId).emit('chat-message-edited', messageData);
  });

  socket.on('delete-chat-message', (roomId, messageId) => {
    io.to(roomId).emit('chat-message-deleted', messageId);
  });

  socket.on('pin-chat-message', (roomId, pinnedMessageData) => {
    io.to(roomId).emit('update-pinned-chat', pinnedMessageData);
  });

  socket.on('update-chat-permission', (roomId, permission) => {
    io.to(roomId).emit('chat-permission-updated', permission);
  });

  socket.on('update-continuous-chat-settings', (roomId, settings) => {
    io.to(roomId).emit('continuous-chat-settings-updated', settings);
  });

  socket.on('chat-reaction', (roomId, reactionData) => {
    io.to(roomId).emit('update-chat-reaction', reactionData);
  });

  // Part 36: Notes / Agenda / Pre-reads Real-Time Signaling (36.12)
  socket.on('agenda-item-updated', (roomId, agendaData) => {
    io.to(roomId).emit('agenda-updated', agendaData);
  });

  socket.on('meeting-note-added', (roomId, noteData) => {
    io.to(roomId).emit('meeting-note-created', noteData);
  });

  socket.on('meeting-note-updated', (roomId, noteData) => {
    io.to(roomId).emit('meeting-note-changed', noteData);
  });

  socket.on('preread-updated', (roomId, preReadData) => {
    io.to(roomId).emit('preread-changed', preReadData);
  });

  // Part 40: Complete Meeting Lifecycle Real-Time Signaling
  socket.on('meeting-stage-change', (roomId, stageData) => {
    io.to(roomId).emit('meeting-lifecycle-changed', stageData);
  });

  socket.on('meeting-pipeline-update', (roomId, pipelineData) => {
    io.to(roomId).emit('meeting-lifecycle-pipeline-updated', pipelineData);
  });

  // Part 11: Participant Management & Controls Signaling
  socket.on('host-mute-participant', async (roomId, participantId) => {
    if (!await verifySocketPermission('mute participant', 'changeUserPermissions')) return;
    io.to(roomId).emit('participant-muted', participantId);
  });

  socket.on('host-ask-unmute', async (roomId, { targetParticipantId, hostName }) => {
    if (!await verifySocketPermission('ask participant to unmute', 'changeUserPermissions')) return;
    io.to(roomId).emit('host-asked-unmute', { targetParticipantId, hostName });
  });

  socket.on('host-mute-all', async (roomId, { allowUnmute }) => {
    if (!await verifySocketPermission('mute all participants', 'changeUserPermissions')) return;
    io.to(roomId).emit('all-participants-muted', { allowUnmute });
  });

  socket.on('host-stop-video', async (roomId, participantId) => {
    if (!await verifySocketPermission('stop participant video', 'changeUserPermissions')) return;
    io.to(roomId).emit('participant-video-stopped', participantId);
  });

  socket.on('host-ask-start-video', async (roomId, { targetParticipantId, hostName }) => {
    if (!await verifySocketPermission('ask participant to start video', 'changeUserPermissions')) return;
    io.to(roomId).emit('host-asked-start-video', { targetParticipantId, hostName });
  });

  socket.on('host-make-cohost', async (roomId, { participantId, isCoHost }) => {
    if (!await verifySocketPermission('assign co-host', 'assignRevokeCoHost')) return;
    try {
      const cleanMId = (roomId || '').replace(/[\s-]/g, '');
      await MeetingParticipant.findOneAndUpdate(
        { meetingId: { $in: [roomId, cleanMId] }, $or: [{ participantId }, { userId: participantId }] },
        { 
          role: isCoHost ? 'CO_HOST' : 'PARTICIPANT',
          ...(isCoHost ? { coHostPermissions: { manageWaitingRoom: true, admitRejectParticipants: true, removeParticipants: false, changeMeetingSecurity: false, changeUserPermissions: false, startStopRecording: false, manageCaptions: true, endMeetingForAll: false } } : {})
        }
      );
    } catch (e) {
      console.warn('Error persisting co-host update:', e);
    }
    io.to(roomId).emit('participant-cohost-assigned', { participantId, isCoHost });
  });

  socket.on('host-make-host', async (roomId, { newHostId, newHostName }) => {
    if (!socket.isHost) {
      console.warn(`[SECURITY BLOCKED] Non-host socket ${socket.id} tried to transfer host ownership.`);
      socket.emit('security-action-denied', { action: 'transfer host', message: 'Only the meeting Host can transfer host ownership.' });
      return;
    }
    try {
      const cleanMId = (roomId || '').replace(/[\s-]/g, '');
      const meeting = await Meeting.findOne(buildMeetingQuery(cleanMId || roomId));
      if (meeting) {
        meeting.host = newHostId;
        meeting.hostName = newHostName;
        await meeting.save();
      }
    } catch (e) {}
    io.to(roomId).emit('participant-host-transferred', { newHostId, newHostName });
  });

  socket.on('host-remove-participant', async (roomId, { participantId, name }) => {
    if (!await verifySocketPermission('remove participant', 'removeParticipants')) return;
    io.to(roomId).emit('participant-removed', { participantId, name });
  });

  socket.on('participant-rename', (roomId, { participantId, newName }) => {
    if (participantId !== socket.id && participantId !== socket.userId) {
      verifySocketPermission('rename other participant', 'changeUserPermissions').then(allowed => {
        if (allowed) io.to(roomId).emit('participant-renamed', { participantId, newName });
      });
      return;
    }
    io.to(roomId).emit('participant-renamed', { participantId, newName });
  });

  socket.on('host-update-permissions', async (roomId, permissions) => {
    if (!await verifySocketPermission('update permissions', 'changeUserPermissions')) return;
    io.to(roomId).emit('permissions-updated', permissions);
  });

  socket.on('host-suspend-activities', async (roomId) => {
    if (!await verifySocketPermission('suspend activities', 'changeMeetingSecurity')) return;
    io.to(roomId).emit('activities-suspended');
  });

  socket.on('admit-waiting-participant', async (roomId, { participantId, name, socketId }) => {
    if (!await verifySocketPermission('admit waiting participant', 'admitRejectParticipants')) return;
    io.to(socketId || participantId).emit('admission-approved', { roomId });
    io.to(roomId).emit('waiting-participant-admitted', { socketId, participantId, name });
  });

  socket.on('reject-waiting-participant', async (roomId, { participantId, socketId }) => {
    if (!await verifySocketPermission('reject waiting participant', 'admitRejectParticipants')) return;
    io.to(socketId || participantId).emit('admission-rejected');
    io.to(roomId).emit('waiting-participant-rejected', { socketId, participantId });
  });

  socket.on('admit-all-waiting-participants', async (roomId) => {
    if (!await verifySocketPermission('admit all waiting participants', 'admitRejectParticipants')) return;
    io.to(`${roomId}-waiting`).emit('admission-approved', { roomId });
    io.to(roomId).emit('all-waiting-admitted');
  });

  // ── Part 30: In-Meeting Security Real-Time Events (30.15) ─────────────
  socket.on('security-update-settings', async (roomId, settings) => {
    if (!await verifySocketPermission('update security settings', 'changeMeetingSecurity')) return;
    io.to(roomId).emit('security-settings-updated', settings);
  });

  socket.on('security-toggle-lock', async (roomId, { meetingLocked }) => {
    if (!await verifySocketPermission('toggle meeting lock', 'changeMeetingSecurity')) return;
    io.to(roomId).emit('meeting-lock-toggled', { meetingLocked });
  });

  socket.on('security-toggle-waiting-room', async (roomId, { waitingRoomEnabled }) => {
    if (!await verifySocketPermission('toggle waiting room', 'manageWaitingRoom')) return;
    io.to(roomId).emit('waiting-room-toggled', { waitingRoomEnabled });
  });

  socket.on('security-toggle-hide-profile-pictures', async (roomId, { hideProfilePictures }) => {
    if (!await verifySocketPermission('toggle profile pictures', 'changeMeetingSecurity')) return;
    io.to(roomId).emit('hide-profile-pictures-toggled', { hideProfilePictures });
  });

  socket.on('security-update-permissions', async (roomId, permissions) => {
    if (!await verifySocketPermission('update participant permissions', 'changeUserPermissions')) return;
    io.to(roomId).emit('permissions-updated', permissions);
  });

  socket.on('security-update-share-policy', async (roomId, { whoCanShareScreen }) => {
    if (!await verifySocketPermission('update screen share policy', 'changeMeetingSecurity')) return;
    io.to(roomId).emit('screen-share-policy-updated', { whoCanShareScreen });
  });

  socket.on('security-suspend-activities', async (roomId) => {
    if (!await verifySocketPermission('suspend activities', 'changeMeetingSecurity')) return;
    io.to(roomId).emit('activities-suspended');
    io.to(roomId).emit('meeting-lock-toggled', { meetingLocked: true });
  });

  socket.on('security-resume-activities', async (roomId) => {
    if (!await verifySocketPermission('resume activities', 'changeMeetingSecurity')) return;
    io.to(roomId).emit('activities-resumed');
  });

  socket.on('security-remove-participant', async (roomId, payload) => {
    if (!await verifySocketPermission('remove participant', 'removeParticipants')) return;
    io.to(roomId).emit('participant-removed', payload);
  });

  socket.on('security-admit-waiting', async (roomId, payload) => {
    if (!await verifySocketPermission('admit waiting participant', 'admitRejectParticipants')) return;
    io.to(roomId).emit('waiting-participant-admitted', payload);
  });

  // ── Part 31: Encryption Real-Time Events (31.13) ───────────────────
  socket.on('encryption-type-changed', (roomId, payload) => {
    io.to(roomId).emit('encryption-type-changed', payload);
  });

  socket.on('encryption-verify-requested', (roomId, payload) => {
    io.to(roomId).emit('encryption-verify-requested', payload);
  });

  socket.on('encryption-verified', (roomId, payload) => {
    io.to(roomId).emit('encryption-verified', payload);
  });

  socket.on('partial-encryption-detected', (roomId, payload) => {
    io.to(roomId).emit('partial-encryption-detected', payload);
  });

  // ── Part 32: Watermarking Real-Time Events (32.7, 32.14, 32.15) ────────
  socket.on('watermark-settings-updated', (roomId, watermarkData) => {
    io.to(roomId).emit('watermark-settings-updated', watermarkData);
  });

  socket.on('watermark-audio-signature-assigned', (roomId, payload) => {
    io.to(roomId).emit('watermark-audio-signature-assigned', payload);
  });

  socket.on('watermark-leak-detected', (roomId, payload) => {
    io.to(roomId).emit('watermark-leak-detected', payload);
  });

  // Part 12: Reactions & Non-Verbal Feedback Real-Time Events (12.1 - 12.17)
  socket.on('send-reaction', (roomId, reactionData) => {
    socket.to(roomId).emit('receive-reaction', reactionData);
  });

  socket.on('toggle-hand', async (roomId, { participantId, isRaised, name }) => {
    const handRaisedAt = isRaised ? new Date() : null;
    try {
      await MeetingParticipant.findOneAndUpdate(
        { meetingId: roomId, participantId },
        { $set: { isHandRaised: isRaised, handRaisedAt } }
      );
    } catch (e) {}
    io.to(roomId).emit('hand-toggled', { participantId, isRaised, name, handRaisedAt });
  });

  socket.on('host-lower-hand', async (roomId, { participantId, name }) => {
    try {
      await MeetingParticipant.findOneAndUpdate(
        { meetingId: roomId, participantId },
        { $set: { isHandRaised: false, handRaisedAt: null } }
      );
    } catch (e) {}
    io.to(roomId).emit('hand-toggled', { participantId, isRaised: false, name });
  });

  socket.on('host-lower-all-hands', async (roomId) => {
    try {
      await MeetingParticipant.updateMany(
        { meetingId: roomId },
        { $set: { isHandRaised: false, handRaisedAt: null } }
      );
    } catch (e) {}
    io.to(roomId).emit('all-hands-lowered');
  });

  socket.on('send-non-verbal', async (roomId, { participantId, name, value }) => {
    try {
      await MeetingParticipant.findOneAndUpdate(
        { meetingId: roomId, participantId },
        { $set: { nonVerbalFeedback: value, feedbackUpdatedAt: new Date() } }
      );
      if (value) {
        await ParticipantFeedback.create({
          meetingId: roomId,
          participantId,
          displayName: name,
          type: 'NON_VERBAL',
          value,
        });
      }
    } catch (e) {}
    io.to(roomId).emit('non-verbal-updated', { participantId, name, value });
  });

  socket.on('clear-all-feedback', async (roomId) => {
    try {
      await MeetingParticipant.updateMany(
        { meetingId: roomId },
        { $set: { isHandRaised: false, handRaisedAt: null, nonVerbalFeedback: null } }
      );
      await ParticipantFeedback.updateMany(
        { meetingId: roomId, isActive: true },
        { $set: { isActive: false } }
      );
    } catch (e) {}
    io.to(roomId).emit('feedback-cleared');
  });

  socket.on('host-update-reaction-settings', (roomId, settings) => {
    io.to(roomId).emit('reaction-settings-updated', settings);
  });

  socket.on('send-caption', (roomId, captionData) => {
    socket.to(roomId).emit('receive-caption', captionData);
  });

  socket.on('set-spotlight', (roomId, spotlightParticipantId) => {
    io.to(roomId).emit('update-spotlight', spotlightParticipantId);
  });

  socket.on('set-spotlights', (roomId, spotlightsList) => {
    io.to(roomId).emit('update-spotlights', spotlightsList);
  });

  socket.on('set-host-video-order', (roomId, orderList) => {
    io.to(roomId).emit('update-host-video-order', orderList);
  });

  socket.on('release-host-video-order', (roomId) => {
    io.to(roomId).emit('released-host-video-order');
  });

  // Part 13: Screen Sharing & Whiteboard Socket Events (13.1 - 13.22)
  socket.on('start-screen-share', async (roomId, data) => {
    try {
      await ScreenShareSession.create({
        meetingId: roomId,
        activeSharerId: data.participantId,
        activeSharerName: data.participantName || 'Participant',
        sharingStatus: 'ACTIVE',
        shareSession: {
          type: data.type || 'SCREEN',
          sourceName: data.sourceName || 'Entire Screen',
          audioEnabled: !!data.audioEnabled,
          videoOptimization: !!data.videoOptimization,
          startedAt: new Date(),
        }
      });
    } catch (e) {}
    io.to(roomId).emit('screen-share-started', data);
  });

  socket.on('pause-screen-share', async (roomId, data) => {
    try {
      await ScreenShareSession.findOneAndUpdate(
        { meetingId: roomId, activeSharerId: data.participantId, sharingStatus: { $in: ['ACTIVE', 'PAUSED'] } },
        { $set: { sharingStatus: data.isPaused ? 'PAUSED' : 'ACTIVE' } }
      );
    } catch (e) {}
    io.to(roomId).emit('screen-share-paused', data);
  });

  socket.on('stop-screen-share', async (roomId, data) => {
    try {
      await ScreenShareSession.updateMany(
        { meetingId: roomId, sharingStatus: { $in: ['ACTIVE', 'PAUSED'] } },
        { $set: { sharingStatus: 'ENDED', 'shareSession.endedAt': new Date() } }
      );
    } catch (e) {}
    io.to(roomId).emit('screen-share-stopped', data);
  });

  // Part 14: Host Stops a Participant's Screen Share (14.10)
  socket.on('host-stop-participant-share', async (roomId, data) => {
    try {
      await ScreenShareSession.updateMany(
        { meetingId: roomId, activeSharerId: data.participantId, sharingStatus: { $in: ['ACTIVE', 'PAUSED'] } },
        { $set: { sharingStatus: 'ENDED', 'shareSession.endedAt': new Date() } }
      );
    } catch (e) {}
    io.to(roomId).emit('participant-share-stopped', data);
  });

  socket.on('update-sharing-settings', (roomId, settings) => {
    io.to(roomId).emit('sharing-settings-updated', settings);
  });

  socket.on('whiteboard-draw', (roomId, drawData) => {
    socket.to(roomId).emit('whiteboard-draw', drawData);
  });

  socket.on('whiteboard-clear', (roomId) => {
    io.to(roomId).emit('whiteboard-clear');
  });

  // Part 15: Annotation Socket Events (15.1 - 15.10)
  socket.on('annotation-stroke', (roomId, annotationData) => {
    socket.to(roomId).emit('annotation-stroke', annotationData);
  });

  socket.on('annotation-spotlight', (roomId, spotlightData) => {
    socket.to(roomId).emit('annotation-spotlight', spotlightData);
  });

  socket.on('annotation-clear', (roomId, clearData) => {
    io.to(roomId).emit('annotation-cleared', clearData);
  });

  socket.on('annotation-undo', (roomId, undoData) => {
    io.to(roomId).emit('annotation-undone', undoData);
  });

  socket.on('update-annotation-settings', (roomId, settings) => {
    io.to(roomId).emit('annotation-settings-updated', settings);
  });

  // Part 16: Slide Control Socket Events (16.1 - 16.16)
  socket.on('presentation-start', (roomId, data) => {
    io.to(roomId).emit('presentation-started', data);
  });

  socket.on('presentation-slide-change', (roomId, data) => {
    io.to(roomId).emit('presentation-slide-changed', data);
  });

  socket.on('presentation-grant-control', (roomId, data) => {
    io.to(roomId).emit('presentation-control-granted', data);
  });

  socket.on('presentation-revoke-control', (roomId, data) => {
    io.to(roomId).emit('presentation-control-revoked', data);
  });

  socket.on('presentation-stop-control', (roomId, data) => {
    io.to(roomId).emit('presentation-control-stopped', data);
  });

  socket.on('presentation-end', (roomId, data) => {
    io.to(roomId).emit('presentation-ended', data);
  });

  // Part 17: Whiteboard Socket Events (17.1 - 17.23)
  socket.on('whiteboard-open', (roomId, data) => {
    io.to(roomId).emit('whiteboard-opened', data);
  });

  socket.on('whiteboard-close', (roomId, data) => {
    io.to(roomId).emit('whiteboard-closed', data);
  });

  socket.on('whiteboard-object-create', (roomId, data) => {
    socket.to(roomId).emit('whiteboard-object-created', data);
  });

  socket.on('whiteboard-object-update', (roomId, data) => {
    socket.to(roomId).emit('whiteboard-object-updated', data);
  });

  socket.on('whiteboard-object-delete', (roomId, data) => {
    socket.to(roomId).emit('whiteboard-object-deleted', data);
  });

  socket.on('whiteboard-comment-add', (roomId, data) => {
    io.to(roomId).emit('whiteboard-comment-added', data);
  });

  socket.on('whiteboard-comment-reply', (roomId, data) => {
    io.to(roomId).emit('whiteboard-comment-replied', data);
  });

  socket.on('whiteboard-comment-resolve', (roomId, data) => {
    io.to(roomId).emit('whiteboard-comment-resolved', data);
  });

  socket.on('whiteboard-cursor-move', (roomId, data) => {
    socket.to(roomId).emit('whiteboard-cursor-moved', data);
  });

  socket.on('whiteboard-settings-update', (roomId, data) => {
    io.to(roomId).emit('whiteboard-settings-updated', data);
  });

  // Part 18: Breakout Rooms Socket Events (18.1 - 18.33)
  socket.on('breakout-create', (meetingId, data) => {
    io.to(meetingId).emit('breakout-created', data);
  });

  socket.on('breakout-open', (meetingId, data) => {
    io.to(meetingId).emit('breakout-opened', data);
  });

  socket.on('breakout-close', (meetingId, data) => {
    io.to(meetingId).emit('breakout-closing', data);
  });

  socket.on('breakout-end', (meetingId, data) => {
    io.to(meetingId).emit('breakout-ended', data);
  });

  socket.on('breakout-assign', (meetingId, data) => {
    io.to(meetingId).emit('breakout-assigned', data);
  });

  socket.on('breakout-join', (meetingId, data) => {
    io.to(meetingId).emit('breakout-user-joined', data);
  });

  socket.on('breakout-leave', (meetingId, data) => {
    io.to(meetingId).emit('breakout-user-left', data);
  });

  socket.on('breakout-broadcast-message', (meetingId, data) => {
    io.to(meetingId).emit('breakout-message-broadcast', data);
  });

  socket.on('breakout-broadcast-share', (meetingId, data) => {
    io.to(meetingId).emit('breakout-share-broadcast', data);
  });

  socket.on('breakout-help-request', (meetingId, data) => {
    io.to(meetingId).emit('breakout-help-requested', data);
  });

  socket.on('breakout-help-resolve', (meetingId, data) => {
    io.to(meetingId).emit('breakout-help-resolved', data);
  });

  // Part 19: Polls & Quizzes Socket Events (19.1 - 19.22)
  socket.on('poll-launch', (meetingId, data) => {
    io.to(meetingId).emit('poll-launched', data);
  });

  socket.on('poll-response-submit', (meetingId, data) => {
    io.to(meetingId).emit('poll-response-submitted', data);
  });

  socket.on('poll-results-update', (meetingId, data) => {
    io.to(meetingId).emit('poll-results-updated', data);
  });

  socket.on('poll-end', (meetingId, data) => {
    io.to(meetingId).emit('poll-ended', data);
  });

  socket.on('poll-share-results', (meetingId, data) => {
    io.to(meetingId).emit('poll-results-shared', data);
  });

  socket.on('quiz-launch', (meetingId, data) => {
    io.to(meetingId).emit('quiz-launched', data);
  });

  socket.on('quiz-result-calculate', (meetingId, data) => {
    io.to(meetingId).emit('quiz-result-calculated', data);
  });

  // Part 20: Live Captions & Transcription Socket Events (20.1 - 20.16)
  socket.on('caption-segment', (meetingId, data) => {
    io.to(meetingId).emit('caption-segment', data);
  });

  socket.on('caption-session-toggle', (meetingId, data) => {
    io.to(meetingId).emit('caption-session-toggled', data);
  });

  socket.on('caption-settings-update', (meetingId, data) => {
    io.to(meetingId).emit('caption-settings-updated', data);
  });

  socket.on('caption-request', (meetingId, data) => {
    io.to(meetingId).emit('caption-request-received', data);
  });

  socket.on('caption-request-resolve', (meetingId, data) => {
    io.to(meetingId).emit('caption-request-resolved', data);
  });

  socket.on('transcription-status', (meetingId, data) => {
    io.to(meetingId).emit('transcription-status-changed', data);
  });

  socket.on('manual-caption', (meetingId, data) => {
    io.to(meetingId).emit('caption-segment', data);
  });

  // Part 21: Translation Socket Events (21.1 - 21.19)
  socket.on('translation-settings-update', (meetingId, data) => {
    io.to(meetingId).emit('translation-settings-updated', data);
  });

  socket.on('translation-preference-update', (meetingId, data) => {
    io.to(meetingId).emit('translation-preference-updated', data);
  });

  socket.on('translation-segment', (meetingId, data) => {
    io.to(meetingId).emit('translation-segment-received', data);
  });

  socket.on('voice-translation-toggle', (meetingId, data) => {
    io.to(meetingId).emit('voice-translation-toggled', data);
  });

  // Part 22: Language & Sign-Language Interpretation Socket Events (22.1 - 22.23)
  socket.on('interpretation-session-status', (meetingId, data) => {
    io.to(meetingId).emit('interpretation-session-status-changed', data);
  });

  socket.on('interpretation-channel-change', (meetingId, data) => {
    io.to(meetingId).emit('interpretation-channel-changed', data);
  });

  socket.on('interpreter-status-update', (meetingId, data) => {
    io.to(meetingId).emit('interpreter-status-updated', data);
  });

  socket.on('sign-language-stream-toggle', (meetingId, data) => {
    io.to(meetingId).emit('sign-language-stream-toggled', data);
  });

  // Part 23: Recording Socket Events (23.1 - 23.23)
  socket.on('recording-start', (meetingId, data) => {
    io.to(meetingId).emit('recording-started', data);
  });

  socket.on('recording-pause', (meetingId, data) => {
    io.to(meetingId).emit('recording-paused', data);
  });

  socket.on('recording-resume', (meetingId, data) => {
    io.to(meetingId).emit('recording-resumed', data);
  });

  socket.on('recording-stop', (meetingId, data) => {
    io.to(meetingId).emit('recording-stopped', data);
  });

  socket.on('participant-recording-permission', (meetingId, data) => {
    io.to(meetingId).emit('participant-recording-permission-changed', data);
  });

  // Part 24: Transcript Socket Events (24.1 - 24.21)
  socket.on('transcript-start', (meetingId, data) => {
    io.to(meetingId).emit('transcript-started', data);
  });

  socket.on('transcript-segment-create', (meetingId, data) => {
    io.to(meetingId).emit('transcript-segment-created', data);
  });

  socket.on('transcript-segment-edit', (meetingId, data) => {
    io.to(meetingId).emit('transcript-segment-updated', data);
  });

  socket.on('transcript-pause', (meetingId, data) => {
    io.to(meetingId).emit('transcript-paused', data);
  });

  socket.on('transcript-resume', (meetingId, data) => {
    io.to(meetingId).emit('transcript-resumed', data);
  });

  socket.on('transcript-stop', (meetingId, data) => {
    io.to(meetingId).emit('transcript-completed', data);
  });

  // Part 25: AI Meeting Summary Socket Events (25.1 - 25.24)
  socket.on('ai-summary-start', (meetingId, data) => {
    io.to(meetingId).emit('ai-summary-started', data);
  });

  socket.on('ai-summary-stop', (meetingId, data) => {
    io.to(meetingId).emit('ai-summary-stopped', data);
  });

  socket.on('ai-summary-request', (meetingId, data) => {
    io.to(meetingId).emit('ai-summary-requested', data);
  });

  socket.on('ai-summary-resolve-request', (meetingId, data) => {
    io.to(meetingId).emit('ai-summary-request-resolved', data);
  });

  socket.on('ai-decision-detect', (meetingId, data) => {
    io.to(meetingId).emit('ai-decision-detected', data);
  });

  socket.on('ai-action-item-detect', (meetingId, data) => {
    io.to(meetingId).emit('ai-action-item-detected', data);
  });

  socket.on('ai-topics-update', (meetingId, data) => {
    io.to(meetingId).emit('ai-topics-updated', data);
  });

  socket.on('ai-summary-generated', (meetingId, data) => {
    io.to(meetingId).emit('ai-summary-available', data);
  });

  socket.on('ai-summary-shared', (meetingId, data) => {
    io.to(meetingId).emit('ai-summary-shared-alert', data);
  });

  // Part 26: AI Meeting Questions Socket Events (26.1 - 26.29)
  socket.on('ai-questions-start', (meetingId, data) => {
    io.to(meetingId).emit('ai-questions-started', data);
  });

  socket.on('ai-questions-pause', (meetingId, data) => {
    io.to(meetingId).emit('ai-questions-paused', data);
  });

  socket.on('ai-questions-resume', (meetingId, data) => {
    io.to(meetingId).emit('ai-questions-resumed', data);
  });

  socket.on('ai-questions-stop', (meetingId, data) => {
    io.to(meetingId).emit('ai-questions-stopped', data);
  });

  socket.on('ai-question-submit', (meetingId, data) => {
    io.to(meetingId).emit('ai-question-new', data);
  });

  socket.on('ai-question-request', (meetingId, data) => {
    io.to(meetingId).emit('ai-question-requested', data);
  });

  // Part 27: AI / Personal Notes (My Notes) Socket Events (27.1 - 27.12)
  socket.on('note-update', (meetingId, data) => {
    io.to(meetingId).emit('note-updated', data);
  });

  socket.on('note-transcription-toggle', (meetingId, data) => {
    io.to(meetingId).emit('note-transcription-toggled', data);
  });

  socket.on('ai-note-generate', (meetingId, data) => {
    io.to(meetingId).emit('ai-note-generated-event', data);
  });

  socket.on('ai-note-refine', (meetingId, data) => {
    io.to(meetingId).emit('ai-note-refined-event', data);
  });

  socket.on('note-share', (meetingId, data) => {
    io.to(meetingId).emit('note-shared-event', data);
  });

  // Part 28: Smart Recording Socket Events (28.1 - 28.17)
  socket.on('smart-recording-start', (recordingId, data) => {
    io.emit('smart-recording-started', { recordingId, ...data });
  });

  socket.on('smart-recording-ready', (recordingId, data) => {
    io.emit('smart-recording-processed', { recordingId, ...data });
  });

  socket.on('smart-chapter-update', (recordingId, data) => {
    io.emit('smart-chapter-updated', { recordingId, ...data });
  });

  socket.on('smart-highlight-update', (recordingId, data) => {
    io.emit('smart-highlight-updated', { recordingId, ...data });
  });

  socket.on('smart-nextstep-update', (recordingId, data) => {
    io.emit('smart-nextstep-updated', { recordingId, ...data });
  });

  socket.on('smart-playlist-update', (playlistId, data) => {
    io.emit('smart-playlist-updated', { playlistId, ...data });
  });

  // Part 29: AI Recording Workflow Pipeline Socket Events (29.1 - 29.16)
  socket.on('ai-pipeline-start', (data) => {
    io.emit('ai-pipeline-started', data);
  });

  socket.on('ai-pipeline-stage-update', (data) => {
    io.emit('ai-pipeline-stage-updated', data);
  });

  socket.on('ai-pipeline-complete', (data) => {
    io.emit('ai-pipeline-completed', data);
  });

  // Part 33: Live Streaming Socket Events (33.1 - 33.23)
  socket.on('livestream-start-broadcast', (data) => {
    if (data?.meetingId) {
      io.to(data.meetingId).emit('livestream-status-changed', { ...data, status: 'LIVE' });
      io.to(data.meetingId).emit('livestream-started', data);
    }
  });

  socket.on('livestream-stop-broadcast', (data) => {
    if (data?.meetingId) {
      io.to(data.meetingId).emit('livestream-status-changed', { ...data, status: 'STOPPED' });
      io.to(data.meetingId).emit('livestream-stopped', data);
    }
  });

  socket.on('livestream-sync-viewers', (data) => {
    if (data?.meetingId) {
      io.to(data.meetingId).emit('livestream-viewers-updated', data);
    }
  });

  // Part 38: Device & Network Adaptation Real-Time Events (38.19)
  socket.on('adaptation-network-telemetry', (data) => {
    if (data?.meetingId) {
      socket.to(data.meetingId).emit('peer-network-telemetry', data);
    }
  });

  socket.on('adaptation-quality-changed', (data) => {
    if (data?.meetingId) {
      io.to(data.meetingId).emit('peer-quality-adapted', data);
    }
  });

  socket.on('adaptation-device-session', (data) => {
    if (data?.meetingId) {
      socket.to(data.meetingId).emit('peer-device-session-updated', data);
    }
  });

  // Part 39: Real-time Integration & Event Bus Sockets (39.20, 39.22)
  socket.on('integration-event-dispatched', (data) => {
    if (data?.meetingId) {
      io.to(data.meetingId).emit('integration-action-broadcast', data);
    }
  });

  socket.on('integration-calendar-synced', (data) => {
    if (data?.meetingId) {
      io.to(data.meetingId).emit('integration-calendar-updated', data);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    if (socket.roomId) {
      socket.to(socket.roomId).emit('user-disconnected', socket.id);
      socket.to(socket.roomId).emit('waiting-participant-removed', { participantId: socket.id });
    } else {
      socket.broadcast.emit('user-disconnected', socket.id);
    }
  });

  // Host ends meeting for all participants
  socket.on('end-meeting-for-all', async ({ roomId }) => {
    if (!roomId) return;
    if (!await verifySocketPermission('end meeting for all', 'endMeetingForAll')) return;
    // Notify all other participants in the room to leave
    socket.to(roomId).emit('meeting-ended', { message: 'The host has ended this meeting.' });
    console.log(`Verified Host ${socket.userId} (${socket.id}) ended meeting for all in room ${roomId}`);
  });

  // Explicit leave-room (before disconnect) — notifies peers immediately
  socket.on('leave-room', ({ roomId }) => {
    if (roomId) {
      socket.to(roomId).emit('user-disconnected', socket.id);
      socket.leave(roomId);
      console.log(`Socket ${socket.id} left room ${roomId}`);
    }
  });
});

// Start DB and Express Server
const startServer = async () => {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`================================================`);
    console.log(`🚀 IntellMeet Server running on port ${PORT}`);
    console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
    console.log(`================================================`);
  });
};

startServer();
