import mongoose from 'mongoose';
import crypto from 'crypto';

const meetingKnowledgeSchema = new mongoose.Schema(
  {
    knowledgeId: {
      type: String,
      default: () => 'kn_' + Date.now() + '_' + crypto.randomBytes(3).toString('hex'),
      unique: true,
      index: true,
    },
    meetingId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    meetingTitle: {
      type: String,
      default: 'IntelliMeet Session',
    },
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    hostName: {
      type: String,
      default: 'Host',
    },
    date: String,
    duration: String,
    
    // Knowledge Pillars:
    // 1. Agenda Items
    agendaSummary: [
      {
        agendaId: String,
        title: { type: String, required: true },
        description: String,
        completed: { type: Boolean, default: false },
        durationMinutes: { type: Number, default: 0 },
      },
    ],

    // 2. Pre-read Materials
    preReadsSummary: [
      {
        docId: String,
        title: { type: String, required: true },
        type: { type: String, default: 'pdf' },
        url: String,
        readPercentage: { type: Number, default: 100 },
      },
    ],

    // 3. Collaborative & Personal Notes
    notes: [
      {
        noteId: {
          type: String,
          default: () => 'note_' + Date.now() + '_' + crypto.randomBytes(2).toString('hex'),
        },
        author: { type: String, default: 'Participant' },
        text: { type: String, required: true },
        tags: [String],
        createdAt: { type: Date, default: Date.now },
      },
    ],

    // 4. Concrete Decisions Made
    decisions: [
      {
        decisionId: {
          type: String,
          default: () => 'dec_' + Date.now() + '_' + crypto.randomBytes(2).toString('hex'),
        },
        title: { type: String, required: true },
        context: String,
        decidedBy: { type: String, default: 'Team' },
        timestamp: { type: Date, default: Date.now },
      },
    ],

    // 5. Action Items & Commitments
    actionItems: [
      {
        actionId: {
          type: String,
          default: () => 'act_' + Date.now() + '_' + crypto.randomBytes(2).toString('hex'),
        },
        task: { type: String, required: true },
        owner: { type: String, default: 'Unassigned' },
        dueDate: { type: Date },
        status: {
          type: String,
          enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED'],
          default: 'PENDING',
        },
        priority: {
          type: String,
          enum: ['LOW', 'MEDIUM', 'HIGH'],
          default: 'MEDIUM',
        },
      },
    ],

    // 6. Highlighted Chat Conversations
    chatHighlights: [
      {
        messageId: String,
        sender: String,
        content: String,
        timestamp: { type: Date, default: Date.now },
        reactionsCount: { type: Number, default: 0 },
        isPinned: { type: Boolean, default: false },
      },
    ],

    // 7. Smart Chapters & Timestamps
    smartChapters: [
      {
        chapterId: String,
        title: String,
        summary: String,
        startTime: { type: Number, default: 0 },
        timecode: { type: String, default: '00:00' },
      },
    ],

    // 8. Q&A and Key Inquiries
    keyQuestions: [
      {
        questionId: String,
        askedBy: String,
        question: String,
        answer: String,
        isResolved: { type: Boolean, default: true },
      },
    ],

    // 9. Interactive Whiteboard Assets
    whiteboardsSummary: [
      {
        whiteboardId: String,
        title: String,
        objectCount: { type: Number, default: 0 },
        previewUrl: String,
      },
    ],

    // 10. Polls & Voting Results
    pollsSummary: [
      {
        pollId: String,
        question: String,
        options: [
          {
            text: String,
            votes: { type: Number, default: 0 },
          },
        ],
        totalVotes: { type: Number, default: 0 },
      },
    ],

    // 11. Indexed Transcript Tokens
    transcriptTokens: [
      {
        speaker: String,
        text: String,
        timestamp: String,
      },
    ],

    // 12. Synthesized AI Overview
    aiOverview: {
      executiveSummary: { type: String, default: '' },
      sentiment: {
        type: String,
        enum: ['POSITIVE', 'NEUTRAL', 'CHALLENGING', 'ENGAGED'],
        default: 'POSITIVE',
      },
      topicsDiscussed: [String],
      followUpPlan: { type: String, default: '' },
    },

    // 13. Comprehensive Meeting Stats
    metrics: {
      participantCount: { type: Number, default: 0 },
      engagementScore: { type: Number, default: 85 },
      durationMinutes: { type: Number, default: 45 },
      chatMessagesCount: { type: Number, default: 0 },
      recordingUrl: { type: String, default: '' },
    },

    // 14. Full-text Search Terms Index
    searchVector: [String],

    lastAggregatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Index for full-text search capability
meetingKnowledgeSchema.index({ searchVector: 'text', meetingTitle: 'text' });

const MeetingKnowledge =
  mongoose.models.MeetingKnowledge || mongoose.model('MeetingKnowledge', meetingKnowledgeSchema);

export default MeetingKnowledge;
