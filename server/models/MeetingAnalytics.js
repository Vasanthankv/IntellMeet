import mongoose from 'mongoose';

const meetingAnalyticsSchema = new mongoose.Schema(
  {
    meetingId: {
      type: String,
      required: true,
      index: true,
    },
    meetingNumericId: {
      type: String,
      default: '',
    },
    topic: {
      type: String,
      required: true,
    },
    hostId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    hostName: {
      type: String,
      required: true,
    },
    hostEmail: {
      type: String,
      default: '',
    },
    department: {
      type: String,
      default: 'General',
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    durationMinutes: {
      type: Number,
      default: 0,
    },
    participantCount: {
      type: Number,
      default: 0,
    },
    totalParticipantMinutes: {
      type: Number,
      default: 0,
    },
    meetingType: {
      type: String,
      enum: ['scheduled', 'instant', 'webinar', 'recurring'],
      default: 'scheduled',
    },
    featureUsage: {
      audio: { type: Boolean, default: true },
      video: { type: Boolean, default: true },
      screenShare: { type: Boolean, default: false },
      recording: { type: Boolean, default: false },
      chat: { type: Boolean, default: true },
      polls: { type: Boolean, default: false },
      breakoutRooms: { type: Boolean, default: false },
      whiteboard: { type: Boolean, default: false },
      captions: { type: Boolean, default: false },
      interpretation: { type: Boolean, default: false },
      liveStreaming: { type: Boolean, default: false },
      aiSummary: { type: Boolean, default: false },
      aiQuestions: { type: Boolean, default: false },
    },
    quality: {
      overallScore: { type: Number, default: 95 },
      rating: { type: String, enum: ['Good', 'Fair', 'Poor'], default: 'Good' },
      audioQuality: { type: String, enum: ['Good', 'Fair', 'Poor'], default: 'Good' },
      videoQuality: { type: String, enum: ['Good', 'Fair', 'Poor'], default: 'Good' },
      screenShareQuality: { type: String, enum: ['Good', 'Fair', 'Poor'], default: 'Good' },
      avgJitterMs: { type: Number, default: 12 },
      avgPacketLossPct: { type: Number, default: 0.4 },
      avgLatencyMs: { type: Number, default: 45 },
      reconnectionsCount: { type: Number, default: 0 },
    },
    aiMetrics: {
      summariesGenerated: { type: Number, default: 0 },
      questionsAsked: { type: Number, default: 0 },
      transcriptsProcessed: { type: Number, default: 0 },
      actionItemsDetected: { type: Number, default: 0 },
      decisionsRecorded: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

// Helpful index for date range queries
meetingAnalyticsSchema.index({ startTime: -1 });
meetingAnalyticsSchema.index({ hostId: 1, startTime: -1 });

const MeetingAnalytics = mongoose.model('MeetingAnalytics', meetingAnalyticsSchema);
export default MeetingAnalytics;
