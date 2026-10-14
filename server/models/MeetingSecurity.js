import mongoose from 'mongoose';
import crypto from 'crypto';

// Helper to generate a 16-digit/alphanumeric formatted E2EE security code (31.6)
export const generateSecurityCode = () => {
  const bytes = crypto.randomBytes(8).toString('hex').toUpperCase();
  return `${bytes.slice(0, 4)}-${bytes.slice(4, 8)}-${bytes.slice(8, 12)}-${bytes.slice(12, 16)}`;
};

// Helper to generate a participant-specific inaudible audio watermark signature token (32.2)
export const generateAudioSignatureId = () => {
  const bytes = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `SIG-${bytes.slice(0, 4)}-${bytes.slice(4, 8)}`;
};

const removedParticipantSchema = new mongoose.Schema({
  participantId: { type: String, required: true },
  name: { type: String, default: 'Participant' },
  email: { type: String, default: '' },
  removedAt: { type: Date, default: Date.now },
  preventRejoin: { type: Boolean, default: true }
}, { _id: false });

const waitingParticipantSchema = new mongoose.Schema({
  participantId: { type: String, required: true },
  name: { type: String, default: 'Guest' },
  email: { type: String, default: '' },
  joinedAt: { type: Date, default: Date.now }
}, { _id: false });

const endpointEncryptionSchema = new mongoose.Schema({
  participantId: { type: String, required: true },
  name: { type: String, default: 'Participant' },
  clientType: { 
    type: String, 
    enum: ['DESKTOP', 'MOBILE', 'ZOOM_ROOM', 'WEB_BROWSER', 'SIP_PHONE'], 
    default: 'DESKTOP' 
  },
  encryptionStatus: { 
    type: String, 
    enum: ['E2EE', 'ENHANCED', 'PARTIAL', 'UNENCRYPTED'], 
    default: 'ENHANCED' 
  },
  supportsE2EE: { type: Boolean, default: true },
  verifiedCode: { type: Boolean, default: false },
  joinedAt: { type: Date, default: Date.now }
}, { _id: false });

const securityAuditLogSchema = new mongoose.Schema({
  action: { type: String, required: true },
  performedBy: { type: String, default: 'Host' },
  performedAt: { type: Date, default: Date.now },
  details: { type: String, default: '' }
}, { _id: false });

const meetingSecuritySchema = new mongoose.Schema({
  meetingId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  meetingTitle: {
    type: String,
    default: 'IntellMeet Meeting Session'
  },

  // ── Part 31: Encryption Architecture (31.1 - 31.16) ───────────────────────
  encryptionType: {
    type: String,
    enum: ['ENHANCED', 'E2EE'],
    default: 'ENHANCED',
    index: true
  },
  encryptionEnabled: {
    type: Boolean,
    default: true
  },
  cipher: {
    type: String,
    default: '256-bit AES-GCM'
  },
  // 31.6 E2EE Verification Security Code (XXXX-XXXX-XXXX-XXXX)
  securityCode: {
    type: String,
    default: generateSecurityCode
  },
  keyVersion: {
    type: Number,
    default: 1
  },
  keyGeneratedAt: {
    type: Date,
    default: Date.now
  },
  keyManagement: {
    type: String,
    enum: ['SERVER_MANAGED', 'DEVICE_MANAGED'],
    default: 'SERVER_MANAGED'
  },
  // 31.5 Partial Encryption Indicator (e.g. unencrypted/web endpoints)
  isPartialEncryption: {
    type: Boolean,
    default: false
  },
  endpointEncryptionStatuses: [endpointEncryptionSchema],
  verifiedParticipants: [{ type: String }],

  // 31.8 & 31.9 E2EE Feature Restrictions Policy Matrix
  e2eeFeatureCompatibility: {
    aiSummaryDisabled: { type: Boolean, default: false },
    aiQuestionsDisabled: { type: Boolean, default: false },
    liveTranscriptionDisabled: { type: Boolean, default: false },
    cloudRecordingDisabled: { type: Boolean, default: false },
    smartRecordingDisabled: { type: Boolean, default: false },
    aiNotesDisabled: { type: Boolean, default: false },
    whiteboardDisabled: { type: Boolean, default: false },
    pollsDisabled: { type: Boolean, default: false }
  },

  // ── Part 32: Watermarking Architecture (32.1 - 32.7) ───────────────────────
  watermark: {
    visualEnabled: { 
      type: Boolean, 
      default: false 
    },
    visualMode: { 
      type: String, 
      enum: ['single', 'repeated'], 
      default: 'repeated' 
    },
    visibleOn: { 
      type: String, 
      enum: ['sharedContent', 'video', 'both'], 
      default: 'both' 
    },
    opacity: { 
      type: Number, 
      min: 5, 
      max: 100, 
      default: 25 
    },
    identityType: { 
      type: String, 
      enum: ['email', 'maskedEmail', 'participantId'], 
      default: 'maskedEmail' 
    },
    audioEnabled: { 
      type: Boolean, 
      default: false 
    },
    audioSignatures: [{
      participantId: { type: String, required: true },
      participantName: { type: String, default: 'Participant' },
      participantEmail: { type: String, default: '' },
      signatureId: { type: String, required: true },
      frequencyBand: { type: String, default: '18500 Hz (18.5 kHz Carrier)' }, // ultrasonic acoustic marker
      assignedAt: { type: Date, default: Date.now },
      status: { type: String, enum: ['ACTIVE', 'EXPIRED'], default: 'ACTIVE' }
    }]
  },

  // ── Part 30: In-Meeting Access & Permissions ───────────────────────────────
  // 30.3 Lock Meeting
  meetingLocked: {
    type: Boolean,
    default: false,
    index: true
  },
  // 30.4 Waiting Room
  waitingRoomEnabled: {
    type: Boolean,
    default: true
  },
  // 30.6 Hide Profile Pictures
  hideProfilePictures: {
    type: Boolean,
    default: false
  },
  // 30.8 Control Screen Sharing: 'hostOnly' | 'hostCoHost' | 'all'
  whoCanShareScreen: {
    type: String,
    enum: ['hostOnly', 'hostCoHost', 'all'],
    default: 'all'
  },
  // 30.5 Participant Permissions
  participantPermissions: {
    canChat: {
      type: String,
      enum: ['everyone', 'hostOnly', 'none'],
      default: 'everyone'
    },
    canUnmute: {
      type: Boolean,
      default: true
    },
    canStartVideo: {
      type: Boolean,
      default: true
    },
    canShareScreen: {
      type: Boolean,
      default: true
    },
    canRename: {
      type: Boolean,
      default: true
    },
    canShareWhiteboard: {
      type: Boolean,
      default: true
    },
    canReact: {
      type: Boolean,
      default: true
    },
    canRequestRecording: {
      type: Boolean,
      default: true
    }
  },
  // 30.7 Suspend Participant Activities (Emergency Lockdown)
  participantActivitiesSuspended: {
    type: Boolean,
    default: false
  },
  suspendedAt: {
    type: Date,
    default: null
  },
  // 30.9 Remove Participant & Rejoin Control
  allowRemovedParticipantsToRejoin: {
    type: Boolean,
    default: false
  },
  removedParticipants: [removedParticipantSchema],
  // 30.4 & 30.10 Waiting Room Queue
  waitingRoomQueue: [waitingParticipantSchema],
  // Audit Logs
  securityAuditLogs: [securityAuditLogSchema]
}, { timestamps: true });

meetingSecuritySchema.index({ meetingId: 1, meetingLocked: 1, encryptionType: 1 });

export const MeetingSecurity = mongoose.models.MeetingSecurity || mongoose.model('MeetingSecurity', meetingSecuritySchema);
export default MeetingSecurity;
