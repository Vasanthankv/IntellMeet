import mongoose from 'mongoose';
import crypto from 'crypto';

// ─── Recording Schema (23.20) ────────────────────────────────────────────────
const recordingSchema = new mongoose.Schema({
  recordingId: { 
    type: String, 
    default: () => 'rec_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex'),
    unique: true,
    index: true 
  },
  meetingId: { 
    type: String, 
    required: true, 
    index: true 
  },
  meetingTitle: { 
    type: String, 
    default: 'IntellMeet Session' 
  },
  recordedBy: {
    userId: { type: String, required: true },
    name: { type: String, default: 'Host' },
    email: { type: String, default: '' },
    role: { type: String, default: 'host' }
  },
  type: { 
    type: String, 
    enum: ['VIDEO', 'AUDIO', 'SCREEN', 'CHAT'], 
    default: 'VIDEO' 
  },
  storageType: { 
    type: String, 
    enum: ['LOCAL', 'CLOUD'], 
    default: 'CLOUD' 
  },
  fileUrl: { 
    type: String, 
    default: '' 
  },
  downloadUrl: { 
    type: String, 
    default: '' 
  },
  duration: { 
    type: Number, 
    default: 0 // Duration in seconds
  },
  fileSize: { 
    type: Number, 
    default: 0 // In bytes
  },
  status: { 
    type: String, 
    enum: ['RECORDING', 'PAUSED', 'PROCESSING', 'READY', 'FAILED', 'DELETED'], 
    default: 'RECORDING',
    index: true
  },
  layout: { 
    type: String, 
    enum: ['SPEAKER', 'GALLERY', 'SHARED_SCREEN'], 
    default: 'SPEAKER' 
  },
  // 23.11 Cloud Recording Sharing Settings
  shareSettings: {
    isPublic: { type: Boolean, default: false },
    accessType: { type: String, enum: ['public', 'internal', 'passcode'], default: 'public' },
    passcode: { type: String, default: '' },
    shareToken: { 
      type: String, 
      default: () => crypto.randomBytes(16).toString('hex'),
      unique: true,
      sparse: true 
    },
    allowDownload: { type: Boolean, default: true },
    expiresAt: { type: Date, default: null },
    viewsCount: { type: Number, default: 0 },
    downloadsCount: { type: Number, default: 0 }
  },
  // 23.17 AI Integration (Transcript + Summary + Decisions + Action Items)
  aiMetadata: {
    transcriptId: { type: String, default: null },
    summary: { type: String, default: '' },
    decisions: [{ type: String }],
    actionItems: [{
      task: { type: String },
      assignee: { type: String },
      dueDate: { type: String },
      completed: { type: Boolean, default: false }
    }]
  },
  startedAt: { 
    type: Date, 
    default: Date.now 
  },
  endedAt: { 
    type: Date, 
    default: null 
  },
  pausedDuration: { 
    type: Number, 
    default: 0 
  },
  lastPausedAt: { 
    type: Date, 
    default: null 
  }
}, { timestamps: true });

// ─── Recording Settings Schema (23.4, 23.5, 23.12, 23.13, 23.15) ──────────────
const recordingSettingsSchema = new mongoose.Schema({
  meetingId: { 
    type: String, 
    required: true, 
    unique: true, 
    index: true 
  },
  allowLocalRecording: { 
    type: Boolean, 
    default: true 
  },
  allowCloudRecording: { 
    type: Boolean, 
    default: true 
  },
  autoRecording: {
    enabled: { type: Boolean, default: false },
    type: { type: String, enum: ['LOCAL', 'CLOUD'], default: 'CLOUD' }
  },
  localRecordingPath: { 
    type: String, 
    default: 'C:\\Users\\User\\Documents\\IntellMeet\\Recordings' 
  },
  showParticipantNames: { 
    type: Boolean, 
    default: true 
  },
  includeTimestamp: { 
    type: Boolean, 
    default: true 
  },
  recordScreenWithVideo: { 
    type: Boolean, 
    default: true 
  },
  // 23.5 Participant Recording Permissions (Host grants/revokes permission)
  participantRecordingPermissions: [{
    userId: { type: String, required: true },
    userName: { type: String, default: 'Participant' },
    allowed: { type: Boolean, default: false },
    grantedAt: { type: Date, default: Date.now }
  }],
  // 23.15 Cloud Storage Management (Quota & Usage)
  cloudStorage: {
    usedBytes: { type: Number, default: 1258291200 }, // ~1.2 GB currently used
    quotaBytes: { type: Number, default: 5368709120 } // 5.0 GB total allocation
  }
}, { timestamps: true });

export const Recording = mongoose.model('Recording', recordingSchema);
export const RecordingSettings = mongoose.model('RecordingSettings', recordingSettingsSchema);
