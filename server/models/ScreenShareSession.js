import mongoose from 'mongoose';

const screenShareSessionSchema = new mongoose.Schema(
  {
    meetingId: {
      type: String,
      required: true,
      index: true,
    },
    activeSharerId: {
      type: String,
      required: true,
    },
    activeSharerName: {
      type: String,
      default: 'Participant',
    },
    sharingStatus: {
      type: String,
      enum: ['ACTIVE', 'PAUSED', 'ENDED'],
      default: 'ACTIVE',
    },
    shareSession: {
      type: {
        type: String,
        enum: ['SCREEN', 'APPLICATION', 'PORTION', 'CAMERA', 'VIDEO', 'WHITEBOARD', 'DOCUMENT', 'IDE', 'BROWSER', 'WINDOW'],
        default: 'SCREEN',
      },
      sourceName: {
        type: String,
        default: 'Entire Screen',
      },
      audioEnabled: {
        type: Boolean,
        default: false,
      },
      videoOptimization: {
        type: Boolean,
        default: false,
      },
      startedAt: {
        type: Date,
        default: Date.now,
      },
      endedAt: {
        type: Date,
        default: null,
      },
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('ScreenShareSession', screenShareSessionSchema);
