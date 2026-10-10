import mongoose from 'mongoose';

// ─── Source Citation Schema (26.23, 26.24) ───────────────────────────────────
const sourceSegmentSchema = new mongoose.Schema({
  sourceType:      { type: String, enum: ['TRANSCRIPT', 'CHAT', 'SCREEN_OCR', 'POLL'], default: 'TRANSCRIPT' },
  speakerName:     { type: String, default: 'Participant' },
  speakerId:       { type: String, default: null },
  timecode:        { type: String, default: '00:00' },
  startTime:       { type: Number, default: 0 },
  endTime:         { type: Number, default: 0 },
  textSnippet:     { type: String, required: true },
  relevanceScore:  { type: Number, default: 0.9 }
}, { _id: false });

// ─── AI Answer Sub-document (26.23) ──────────────────────────────────────────
const aiAnswerSchema = new mongoose.Schema({
  answerId:        { type: String, default: () => 'ans_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7) },
  text:            { type: String, required: true },
  confidence:      { type: Number, default: 0.95 },
  sources:         [sourceSegmentSchema],
  model:           { type: String, default: 'gemini-1.5-flash' },
  generatedAt:     { type: Date, default: Date.now }
}, { _id: false });

// ─── Individual Question Item Schema (26.5, 26.7, 26.23) ─────────────────────
const meetingQuestionItemSchema = new mongoose.Schema({
  questionId: {
    type: String,
    default: () => 'q_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8),
    unique: true,
    index: true
  },
  meetingId: {
    type: String,
    required: true,
    index: true
  },
  userId: {
    type: String,
    required: true
  },
  userName: {
    type: String,
    default: 'Participant'
  },
  userRole: {
    type: String,
    enum: ['host', 'co-host', 'participant'],
    default: 'participant'
  },
  question: {
    type: String,
    required: true
  },
  presetType: {
    type: String,
    enum: ['CATCH_ME_UP', 'DECISIONS', 'ACTION_ITEMS', 'DEADLINES', 'MY_NAME', 'CUSTOM'],
    default: 'CUSTOM'
  },
  contextStartTime: {
    type: Number,
    default: 0 // Context boundary start in seconds
  },
  contextEndTime: {
    type: Number,
    default: null // Context boundary end
  },
  answer: {
    type: aiAnswerSchema,
    default: null
  },
  status: {
    type: String,
    enum: ['PENDING', 'ANSWERED', 'FAILED'],
    default: 'PENDING'
  },
  askedAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, { timestamps: true });

// ─── Meeting AI Question Session Master Schema (26.3, 26.12, 26.13) ───────────
const meetingAIQuestionSessionSchema = new mongoose.Schema({
  meetingId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'PAUSED', 'DISABLED'],
    default: 'DISABLED',
    index: true
  },
  startedAt: {
    type: Date,
    default: null
  },
  endedAt: {
    type: Date,
    default: null
  },
  autoStart: {
    type: Boolean,
    default: false
  },
  permissions: {
    whoCanAsk: {
      type: String,
      enum: ['ALL_PARTICIPANTS', 'HOST_AND_COHOST', 'HOST_ONLY', 'ORGANIZATION_ONLY'],
      default: 'ALL_PARTICIPANTS'
    },
    contextScope: {
      type: String,
      enum: ['ENTIRE_MEETING', 'SINCE_JOINED', 'LAST_15_MIN'],
      default: 'ENTIRE_MEETING'
    }
  },
  allowedSources: {
    transcript: { type: Boolean, default: true },
    chat:       { type: Boolean, default: true },
    screenOcr:  { type: Boolean, default: true }
  },
  requests: [{
    requestId:   { type: String, default: () => 'req_' + Date.now() },
    userId:      { type: String },
    userName:    { type: String },
    requestedAt: { type: Date, default: Date.now },
    status:      { type: String, enum: ['PENDING', 'APPROVED', 'DECLINED'], default: 'PENDING' }
  }]
}, { timestamps: true });

export const MeetingAIQuestionSession = mongoose.model('MeetingAIQuestionSession', meetingAIQuestionSessionSchema);
export const MeetingQuestionItem = mongoose.model('MeetingQuestionItem', meetingQuestionItemSchema);

export default {
  MeetingAIQuestionSession,
  MeetingQuestionItem
};
