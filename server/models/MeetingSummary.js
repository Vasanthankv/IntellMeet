import mongoose from 'mongoose';

// ─── Structured Action Item Schema (25.8, 25.20) ─────────────────────────────
const actionItemSchema = new mongoose.Schema({
  actionItemId:    { type: String, default: () => 'act_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7) },
  task:            { type: String, required: true },
  assignedTo:      { type: String, default: 'Unassigned' },
  assignedToId:    { type: String, default: null },
  assignedToEmail: { type: String, default: null },
  dueDate:         { type: String, default: 'Next Sprint' },
  priority:        { type: String, enum: ['Low', 'Medium', 'High', 'Urgent'], default: 'Medium' },
  status:          { type: String, enum: ['Pending', 'In Progress', 'Completed'], default: 'Pending' },
  sourceTimestamp: { type: Number, default: 0 }, // Seconds offset in meeting transcript
  createdAt:       { type: Date, default: Date.now }
}, { _id: false });

// ─── Structured Decision Schema (25.9, 25.20) ───────────────────────────────
const decisionSchema = new mongoose.Schema({
  decisionId:      { type: String, default: () => 'dec_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7) },
  description:     { type: String, required: true },
  decidedBy:       [{ type: String }], // Array of participant names
  sourceTimestamp: { type: Number, default: 0 },
  createdAt:       { type: Date, default: Date.now }
}, { _id: false });

// ─── Sharing & Security Schema (25.11, 25.14, 25.15) ─────────────────────────
const sharingSettingsSchema = new mongoose.Schema({
  visibility:      { type: String, enum: ['ORGANIZATION', 'PARTICIPANTS_ONLY', 'SPECIFIC_USERS', 'ANYONE_WITH_LINK', 'DISABLED'], default: 'PARTICIPANTS_ONLY' },
  allowedUserIds:  [{ type: String }],
  allowedEmails:   [{ type: String }],
  requireAuth:     { type: Boolean, default: true },
  passcode:        { type: String, default: null },
  isPasscodeProtected: { type: Boolean, default: false },
  shareToken:      { type: String, default: () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) },
  allowExternalSharing: { type: Boolean, default: false },
  accessLogs: [{
    accessedBy:    { type: String },
    accessedAt:    { type: Date, default: Date.now },
    method:        { type: String, default: 'link' }
  }]
}, { _id: false });

// ─── Meeting Summary Master Schema (25.16, 25.17, 25.20) ─────────────────────
const meetingSummarySchema = new mongoose.Schema({
  summaryId: {
    type: String,
    default: () => 'sum_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8),
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
    default: 'IntellMeet Meeting Session'
  },
  template: {
    type: String,
    enum: ['GENERAL', 'PROJECT', 'STANDUP', 'CLIENT', 'INTERVIEW', 'TEAM_REVIEW', 'CUSTOM'],
    default: 'GENERAL'
  },
  status: {
    type: String,
    enum: ['IDLE', 'ACTIVE', 'PROCESSING', 'COMPLETED', 'FAILED'],
    default: 'IDLE',
    index: true
  },
  autoStart: {
    type: Boolean,
    default: false
  },
  generatedBy: {
    userId: { type: String, default: null },
    name:   { type: String, default: 'IntellMeet AI' }
  },

  // 25.7 Core Summary Sections
  overview:              { type: String, default: '' },
  keyDiscussionPoints:   [{ type: String }],
  decisions:             [decisionSchema],
  actionItems:           [actionItemSchema],
  questions:             [{ type: String }],
  importantTopics:       [{ type: String }],
  nextSteps:             [{ type: String }],
  participants:          [{ type: String }],

  // Template-specific sections (25.17)
  standupSpecific: {
    yesterday: [{ type: String }],
    today:     [{ type: String }],
    blockers:  [{ type: String }]
  },
  projectSpecific: {
    projectStatus: { type: String, default: 'On Track' },
    completedWork: [{ type: String }],
    pendingWork:   [{ type: String }],
    issues:        [{ type: String }]
  },

  // Sharing & Security (25.11 - 25.15)
  sharingSettings: {
    type: sharingSettingsSchema,
    default: () => ({})
  },

  // Retention & Auto-deletion (25.16)
  retentionPolicy: {
    type: String,
    enum: ['NEVER', '30_DAYS', '90_DAYS', '1_YEAR', 'CUSTOM'],
    default: 'NEVER'
  },
  expiresAt: {
    type: Date,
    default: null
  },

  isApproved: {
    type: Boolean,
    default: false
  },
  approvedBy: {
    type: String,
    default: null
  },
  approvedAt: {
    type: Date,
    default: null
  }
}, { timestamps: true });

// Auto-expire index
meetingSummarySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const MeetingSummary = mongoose.model('MeetingSummary', meetingSummarySchema);
export default MeetingSummary;
