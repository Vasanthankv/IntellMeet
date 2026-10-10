import mongoose from 'mongoose';

const participantAnalyticsSchema = new mongoose.Schema(
  {
    meetingId: {
      type: String,
      required: true,
      index: true,
    },
    participantId: {
      type: String,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    displayName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      default: '',
    },
    joinedAt: {
      type: Date,
      required: true,
    },
    leftAt: {
      type: Date,
      required: true,
    },
    durationMinutes: {
      type: Number,
      default: 0,
    },
    waitingRoomJoinedAt: {
      type: Date,
    },
    waitingRoomLeftAt: {
      type: Date,
    },
    waitingRoomDurationMinutes: {
      type: Number,
      default: 0,
    },
    device: {
      type: String,
      default: 'Desktop (Windows)',
    },
    networkType: {
      type: String,
      default: 'WiFi',
    },
    clientVersion: {
      type: String,
      default: 'v5.18.2',
    },
    audioUsed: {
      type: Boolean,
      default: true,
    },
    videoUsed: {
      type: Boolean,
      default: true,
    },
    screenShareUsed: {
      type: Boolean,
      default: false,
    },
    isGuest: {
      type: Boolean,
      default: false,
    },
    consolidatedEntries: {
      type: Number,
      default: 1,
    },
    qualityRating: {
      type: String,
      enum: ['Good', 'Fair', 'Poor'],
      default: 'Good',
    },
    packetLossPct: {
      type: Number,
      default: 0.2,
    },
    jitterMs: {
      type: Number,
      default: 8,
    },
  },
  {
    timestamps: true,
  }
);

participantAnalyticsSchema.index({ meetingId: 1, joinedAt: 1 });

const ParticipantAnalytics = mongoose.model('ParticipantAnalytics', participantAnalyticsSchema);
export default ParticipantAnalytics;
