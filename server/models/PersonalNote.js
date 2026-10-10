import mongoose from 'mongoose';

// ─── Sub-document: Note Section Item ─────────────────────────────────────────
const noteSectionItemSchema = new mongoose.Schema({
  itemId: { type: String, default: () => 'item_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6) },
  text: { type: String, required: true },
  due: { type: String, default: '' },
  completed: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

// ─── Sub-document: Note Share / Permission (27.6) ────────────────────────────
const noteShareSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  userEmail: { type: String, required: true },
  userName: { type: String, default: 'Colleague' },
  role: { 
    type: String, 
    enum: ['viewer', 'editor', 'co-owner'], 
    default: 'viewer' 
  },
  sharedAt: { type: Date, default: Date.now }
}, { _id: false });

// ─── Sub-document: Citation from Transcript (27.3) ──────────────────────────
const noteCitationSchema = new mongoose.Schema({
  speaker: { type: String, default: 'Speaker' },
  timecode: { type: String, default: '00:00' },
  startTime: { type: Number, default: 0 },
  text: { type: String, default: '' }
}, { _id: false });

// ─── Sub-document: AI Note Enhancement (27.4, 27.10) ─────────────────────────
const aiNoteEnhancementSchema = new mongoose.Schema({
  enhancementId: { type: String, default: () => 'enh_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6) },
  template: { 
    type: String, 
    enum: ['STANDARD', 'EXECUTIVE', 'TECHNICAL', 'ACTION_ORIENTED'], 
    default: 'STANDARD' 
  },
  length: { 
    type: String, 
    enum: ['SHORT', 'MEDIUM', 'LONG'], 
    default: 'MEDIUM' 
  },
  enhancedContent: { type: String, default: '' },
  keyPoints: [{ type: String }],
  decisions: [{ type: String }],
  actionItems: [{
    task: { type: String },
    owner: { type: String, default: 'Team' },
    due: { type: String, default: '' }
  }],
  questions: [{ type: String }],
  citations: [noteCitationSchema],
  chatRefinements: [{
    role: { type: String, enum: ['user', 'assistant'] },
    message: { type: String },
    timestamp: { type: Date, default: Date.now }
  }],
  model: { type: String, default: 'gemini-1.5-flash' },
  status: { 
    type: String, 
    enum: ['IDLE', 'GENERATING', 'COMPLETED', 'FAILED'], 
    default: 'IDLE' 
  },
  generatedAt: { type: Date, default: null }
}, { _id: false });

// ─── Primary Personal Note Schema (27.10) ────────────────────────────────────
const personalNoteSchema = new mongoose.Schema({
  noteId: {
    type: String,
    default: () => 'note_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8),
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
  userId: {
    type: String,
    required: true,
    index: true
  },
  userName: {
    type: String,
    default: 'Participant'
  },
  title: {
    type: String,
    default: 'My Notes'
  },
  content: {
    type: String,
    default: ''
  },
  // Manual Structured Notes (27.2)
  sections: {
    important: [noteSectionItemSchema],
    questions: [noteSectionItemSchema],
    decisions: [noteSectionItemSchema],
    tasks: [noteSectionItemSchema],
    personal: [noteSectionItemSchema]
  },
  // Visibility & Sharing (27.6)
  visibility: {
    type: String,
    enum: ['PRIVATE', 'SHARED'],
    default: 'PRIVATE'
  },
  shares: [noteShareSchema],
  // Transcript integration controls for this personal note (27.5)
  transcriptSettings: {
    isPaused: { type: Boolean, default: false },
    language: { type: String, default: 'en-US' }
  },
  // AI Note Enhancement (27.4, 27.9)
  aiEnhancement: {
    type: aiNoteEnhancementSchema,
    default: () => ({})
  },
  lastSavedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Composite index to quickly fetch user's note for a specific meeting
personalNoteSchema.index({ meetingId: 1, userId: 1 });

export const PersonalNote = mongoose.model('PersonalNote', personalNoteSchema);
export default PersonalNote;
