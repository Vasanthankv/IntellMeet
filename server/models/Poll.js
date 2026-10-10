import mongoose from 'mongoose';

// ─── Sub-document: Option ────────────────────────────────────────────────────
const optionSchema = new mongoose.Schema({
  optionId:   { type: String, default: () => new mongoose.Types.ObjectId().toString() },
  text:       { type: String, required: true },
  imageUrl:   { type: String, default: null },        // Allow image options
}, { _id: false });

// ─── Sub-document: Matching pair ─────────────────────────────────────────────
const matchPairSchema = new mongoose.Schema({
  pairId:  { type: String, default: () => new mongoose.Types.ObjectId().toString() },
  left:    { type: String, required: true },
  right:   { type: String, required: true },
}, { _id: false });

// ─── Sub-document: Question ──────────────────────────────────────────────────
const questionSchema = new mongoose.Schema({
  questionId: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
  order:      { type: Number, required: true },
  questionText: { type: String, required: true },
  questionType: {
    type: String,
    enum: ['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'MATCHING', 'RANK_ORDER', 'SHORT_ANSWER', 'LONG_ANSWER'],
    required: true,
  },
  options:       [optionSchema],      // For SINGLE_CHOICE, MULTIPLE_CHOICE, RANK_ORDER
  matchPairs:    [matchPairSchema],   // For MATCHING
  correctAnswers: [{ type: String }], // optionIds or matchPairIds for quiz scoring
  points:        { type: Number, default: 1 }, // points for quiz
  isRequired:    { type: Boolean, default: true },
}, { _id: false });

// ─── Sub-document: Response Answer ───────────────────────────────────────────
const answerSchema = new mongoose.Schema({
  questionId:    { type: String, required: true },
  selectedOptions: [{ type: String }],  // optionIds chosen
  matchedPairs:  [{ left: String, right: String }],
  rankedOrder:   [{ type: String }],    // optionIds in rank order
  textAnswer:    { type: String, default: '' },
  isCorrect:     { type: Boolean, default: null },   // filled in for quiz
  pointsEarned:  { type: Number, default: 0 },
}, { _id: false });

// ─── Main Poll/Quiz Schema ────────────────────────────────────────────────────
const pollSchema = new mongoose.Schema({
  meetingId:   { type: String, required: true, index: true },
  title:       { type: String, required: true, default: 'Untitled Poll' },
  pollType:    { type: String, enum: ['POLL', 'QUIZ'], default: 'POLL' },
  description: { type: String, default: '' },

  questions:   { type: [questionSchema], default: [] },

  // Status lifecycle: DRAFT → ACTIVE → ENDED → SHARED
  status: {
    type: String,
    enum: ['DRAFT', 'ACTIVE', 'ENDED', 'SHARED'],
    default: 'DRAFT',
  },

  isAnonymous: { type: Boolean, default: false },
  allowImagesInOptions: { type: Boolean, default: false },

  // Timestamps managed by lifecycle
  launchedAt: { type: Date, default: null },
  endedAt:    { type: Date, default: null },
  sharedAt:   { type: Date, default: null },

  // Who created this poll
  createdBy:  { type: String, required: true },

  // Library flag — reusable across meetings
  isLibraryItem: { type: Boolean, default: false },
  libraryName:   { type: String, default: '' },

  // For quiz: whether to show score to participant immediately after submission
  showResultsToParticipants: { type: Boolean, default: false },
  allowRelaunch: { type: Boolean, default: true },

  // Cached aggregate results (updated on each response)
  resultsSummary: { type: mongoose.Schema.Types.Mixed, default: {} },
  totalResponses: { type: Number, default: 0 },

}, { timestamps: true });

// ─── PollResponse Schema ──────────────────────────────────────────────────────
const pollResponseSchema = new mongoose.Schema({
  pollId:        { type: mongoose.Schema.Types.ObjectId, ref: 'Poll', required: true, index: true },
  meetingId:     { type: String, required: true },
  participantId: { type: String, default: null },   // null if anonymous
  participantName: { type: String, default: 'Anonymous' },
  answers:       [answerSchema],
  totalScore:    { type: Number, default: 0 },    // For quizzes
  maxScore:      { type: Number, default: 0 },
  submittedAt:   { type: Date, default: Date.now },
}, { timestamps: true });

export const Poll = mongoose.model('Poll', pollSchema);
export const PollResponse = mongoose.model('PollResponse', pollResponseSchema);

// Keep default export as Poll for backward compatibility
export default Poll;