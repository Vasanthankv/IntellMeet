import mongoose from 'mongoose';

// ─── Sub-document: Transcript Segment (24.7, 24.9) ───────────────────────────
const transcriptSegmentSchema = new mongoose.Schema({
  segmentId:      { type: String, default: () => 'seg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7) },
  transcriptId:   { type: String, default: null },
  meetingId:      { type: String, required: true },
  speakerId:      { type: String, required: true },
  speakerName:    { type: String, default: 'Participant' },
  text:           { type: String, required: true },
  startTime:      { type: Number, default: 0 }, // Seconds offset from start
  endTime:        { type: Number, default: 0 },   // Seconds offset
  confidence:     { type: Number, default: 0.95 }, // 0.0 to 1.0 confidence score
  language:       { type: String, default: 'en-US' },
  isEdited:       { type: Boolean, default: false },
  originalText:   { type: String, default: null },
  editedBy: {
    userId:       { type: String, default: null },
    name:         { type: String, default: null },
    editedAt:     { type: Date, default: null }
  },
  timestamp:      { type: Date, default: Date.now },
  isManual:       { type: Boolean, default: false }
}, { _id: false });

// ─── AI Meeting Knowledge Sub-document (24.13, 24.20) ────────────────────────
const aiKnowledgeSchema = new mongoose.Schema({
  summary:            { type: String, default: '' },
  decisions:          [{ type: String }],
  actionItems: [{
    task:             { type: String },
    owner:            { type: String, default: 'Team Member' },
    due:              { type: String, default: 'Next Sprint' },
    completed:        { type: Boolean, default: false }
  }],
  keyTopics:          [{ type: String }],
  importantQuestions: [{ type: String }],
  followUpTasks:      [{ type: String }],
  generatedAt:        { type: Date, default: null }
}, { _id: false });

// ─── Retained Meeting Transcript Schema (24.16, 24.17) ─────────────────────────
const meetingTranscriptSchema = new mongoose.Schema({
  transcriptId: { 
    type: String, 
    default: () => 'tr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8),
    unique: true,
    index: true 
  },
  meetingId:    { type: String, required: true, index: true },
  meetingTitle: { type: String, default: 'IntellMeet Session' },
  recordingId:  { type: String, default: null }, // Linked cloud/local recording for 24.6 time sync
  status: { 
    type: String, 
    enum: ['NOT_STARTED', 'LIVE', 'PAUSED', 'PROCESSING', 'COMPLETED', 'FAILED', 'ACTIVE', 'STOPPED'], 
    default: 'NOT_STARTED',
    index: true
  },
  language:     { type: String, default: 'en' },
  enabled:      { type: Boolean, default: true },
  startedBy:    { type: String, default: 'host' },
  startedByName:{ type: String, default: 'Host' },
  startedAt:    { type: Date, default: null },
  endedAt:      { type: Date, default: null },
  duration:     { type: Number, default: 0 }, // In seconds
  segments:     [transcriptSegmentSchema],
  aiSummary:    { type: aiKnowledgeSchema, default: () => ({}) },
}, { timestamps: true });

export const MeetingTranscript = mongoose.model('MeetingTranscript', meetingTranscriptSchema);
export default MeetingTranscript;
