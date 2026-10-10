import mongoose from 'mongoose';
import crypto from 'crypto';

// ─── Sub-document: Recording Highlight (28.4) ────────────────────────────────
const recordingHighlightSchema = new mongoose.Schema({
  highlightId: { 
    type: String, 
    default: () => 'hl_' + Date.now() + '_' + crypto.randomBytes(3).toString('hex') 
  },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  startTime: { type: Number, required: true }, // in seconds
  endTime: { type: Number, required: true },   // in seconds
  source: { type: String, enum: ['AI_AUTO', 'MANUAL'], default: 'AI_AUTO' },
  clipUrl: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

// ─── Sub-document: Smart Chapter (28.5, 28.6) ────────────────────────────────
const smartChapterSchema = new mongoose.Schema({
  chapterId: { 
    type: String, 
    default: () => 'ch_' + Date.now() + '_' + crypto.randomBytes(3).toString('hex') 
  },
  title: { type: String, required: true },
  summary: { type: String, default: '' },
  startTime: { type: Number, required: true }, // in seconds
  endTime: { type: Number, required: true },   // in seconds
  order: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

// ─── Sub-document: Next Step (28.7) ──────────────────────────────────────────
const nextStepSchema = new mongoose.Schema({
  nextStepId: { 
    type: String, 
    default: () => 'step_' + Date.now() + '_' + crypto.randomBytes(3).toString('hex') 
  },
  task: { type: String, required: true },
  assignedTo: { type: String, default: 'Team Member' },
  dueDate: { type: String, default: 'Next Sprint' },
  status: { type: String, enum: ['OPEN', 'COMPLETED'], default: 'OPEN' },
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

// ─── Sub-document: Topic Tracking (28.9) ─────────────────────────────────────
const recordingTopicSchema = new mongoose.Schema({
  topicId: { 
    type: String, 
    default: () => 'top_' + Date.now() + '_' + crypto.randomBytes(3).toString('hex') 
  },
  topicName: { type: String, required: true },
  keywords: [{ type: String }],
  startTime: { type: Number, default: 0 },
  endTime: { type: Number, default: 0 },
  relevanceScore: { type: Number, default: 0.9 }
}, { _id: false });

// ─── Sub-document: Conversation Analytics (28.8) ─────────────────────────────
const conversationAnalyticsSchema = new mongoose.Schema({
  talkSpeed: {
    wpmAverage: { type: Number, default: 135 },
    perSpeaker: [{
      speakerName: { type: String },
      wpm: { type: Number, default: 130 }
    }]
  },
  talkListenRatio: [{
    speakerName: { type: String },
    talkPercentage: { type: Number, default: 50 },
    listenPercentage: { type: Number, default: 50 },
    talkTimeSeconds: { type: Number, default: 0 }
  }],
  longestMonologue: {
    speakerName: { type: String, default: 'Host' },
    durationSeconds: { type: Number, default: 45 },
    startTime: { type: Number, default: 0 },
    textSnippet: { type: String, default: '' }
  },
  fillerWords: {
    totalCount: { type: Number, default: 0 },
    perSpeaker: [{
      speakerName: { type: String },
      count: { type: Number, default: 0 },
      words: [{
        word: { type: String },
        count: { type: Number, default: 0 }
      }]
    }]
  },
  patience: {
    score: { type: Number, default: 88 }, // 0 to 100
    interruptionCount: { type: Number, default: 1 },
    responseLagSecondsAverage: { type: Number, default: 1.2 }
  }
}, { _id: false });

// ─── Main Smart Recording Schema (28.14) ─────────────────────────────────────
const smartRecordingSchema = new mongoose.Schema({
  smartRecordingId: {
    type: String,
    default: () => 'smart_rec_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex'),
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
    default: 'Cloud Recording' 
  },
  status: { 
    type: String, 
    enum: ['IDLE', 'PROCESSING', 'READY', 'FAILED'], 
    default: 'IDLE',
    index: true 
  },
  // Feature Settings (28.3)
  settings: {
    enabled: { type: Boolean, default: true },
    createHighlights: { type: Boolean, default: true },
    createChapters: { type: Boolean, default: true },
    createNextSteps: { type: Boolean, default: true },
    createAnalytics: { type: Boolean, default: true }
  },
  // AI Generated Outputs
  highlights: [recordingHighlightSchema],
  chapters: [smartChapterSchema],
  nextSteps: [nextStepSchema],
  topics: [recordingTopicSchema],
  analytics: {
    type: conversationAnalyticsSchema,
    default: () => ({})
  },
  generatedAt: { type: Date, default: null }
}, { timestamps: true });

smartRecordingSchema.index({ meetingId: 1, recordingId: 1 });

export const SmartRecording = mongoose.model('SmartRecording', smartRecordingSchema);
export default SmartRecording;
