import mongoose from 'mongoose';

const meetingParticipantSchema = new mongoose.Schema(
  {
    meetingId: {
      type: String,
      required: true,
      index: true,
    },
    participantId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: String,
      default: '',
    },
    displayName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      default: '',
    },
    avatar: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      enum: ['host', 'co-host', 'participant'],
      default: 'participant',
    },
    audioState: {
      type: String,
      enum: ['muted', 'unmuted'],
      default: 'unmuted',
    },
    videoState: {
      type: String,
      enum: ['on', 'off'],
      default: 'on',
    },
    isHandRaised: {
      type: Boolean,
      default: false,
    },
    handRaisedAt: {
      type: Date,
      default: null,
    },
    nonVerbalFeedback: {
      type: String, // 'YES', 'NO', 'FASTER', 'SLOWER', or null
      default: null,
    },
    feedbackUpdatedAt: {
      type: Date,
      default: null,
    },
    isWaiting: {
      type: Boolean,
      default: false,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    leftAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('MeetingParticipant', meetingParticipantSchema);
