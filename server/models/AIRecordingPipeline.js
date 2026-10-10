import mongoose from 'mongoose';
import crypto from 'crypto';

// ─── Sub-document: Pipeline Stage Tracker (29.14) ────────────────────────────
const stageStatusSchema = new mongoose.Schema({
  status: { 
    type: String, 
    enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'SKIPPED'], 
    default: 'PENDING' 
  },
  count: { type: Number, default: 0 },
  details: { type: String, default: '' },
  completedAt: { type: Date, default: null }
}, { _id: false });

// ─── Sub-document: Key Point with Timestamp Linking (29.5) ───────────────────
const keyPointSchema = new mongoose.Schema({
  pointId: { 
    type: String, 
    default: () => 'kp_' + Date.now() + '_' + crypto.randomBytes(3).toString('hex') 
  },
  text: { type: String, required: true },
  timecode: { type: String, default: '00:00' },
  startTime: { type: Number, default: 0 },
  endTime: { type: Number, default: 0 },
  speaker: { type: String, default: 'Speaker' },
  category: { 
    type: String, 
    enum: ['DECISION', 'ARCHITECTURE', 'MILESTONE', 'ACTION', 'GENERAL'], 
    default: 'GENERAL' 
  }
}, { _id: false });

// ─── Main AI Recording Pipeline Schema (29.11, 29.13, 29.14) ──────────────────
const aiRecordingPipelineSchema = new mongoose.Schema({
  pipelineId: {
    type: String,
    default: () => 'pipe_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex'),
    unique: true,
    index: true
  },
  meetingId: { 
    type: String, 
    required: true, 
    index: true 
  },
  recordingId: { 
    type: String, 
    required: true, 
    index: true 
  },
  transcriptId: { 
    type: String, 
    default: null 
  },
  meetingTitle: { 
    type: String, 
    default: 'Meeting Recording' 
  },
  status: { 
    type: String, 
    enum: ['IDLE', 'PROCESSING', 'COMPLETED', 'FAILED'], 
    default: 'IDLE',
    index: true 
  },
  currentStage: { 
    type: String, 
    default: 'NONE' 
  },
  // Detailed Stage Progress (29.14)
  stages: {
    recording: { type: stageStatusSchema, default: () => ({ status: 'PENDING' }) },
    transcript: { type: stageStatusSchema, default: () => ({ status: 'PENDING' }) },
    summary: { type: stageStatusSchema, default: () => ({ status: 'PENDING' }) },
    keyPoints: { type: stageStatusSchema, default: () => ({ status: 'PENDING' }) },
    smartChapters: { type: stageStatusSchema, default: () => ({ status: 'PENDING' }) },
    highlights: { type: stageStatusSchema, default: () => ({ status: 'PENDING' }) },
    nextSteps: { type: stageStatusSchema, default: () => ({ status: 'PENDING' }) },
    topics: { type: stageStatusSchema, default: () => ({ status: 'PENDING' }) },
    analytics: { type: stageStatusSchema, default: () => ({ status: 'PENDING' }) }
  },
  // Key Points with precise transcript linking (29.5)
  keyPoints: [keyPointSchema],
  error: { 
    type: String, 
    default: null 
  },
  startedAt: { 
    type: Date, 
    default: null 
  },
  completedAt: { 
    type: Date, 
    default: null 
  }
}, { timestamps: true });

aiRecordingPipelineSchema.index({ meetingId: 1, recordingId: 1 });

export const AIRecordingPipeline = mongoose.model('AIRecordingPipeline', aiRecordingPipelineSchema);
export default AIRecordingPipeline;
