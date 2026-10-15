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
      enum: ['host', 'co-host', 'participant', 'HOST', 'CO_HOST', 'PARTICIPANT'],
      default: 'participant',
    },
    coHostPermissions: {
      manageWaitingRoom: { type: Boolean, default: true },
      admitRejectParticipants: { type: Boolean, default: true },
      removeParticipants: { type: Boolean, default: false },
      changeMeetingSecurity: { type: Boolean, default: false },
      changeUserPermissions: { type: Boolean, default: false },
      startStopRecording: { type: Boolean, default: false },
      manageCaptions: { type: Boolean, default: true },
      endMeetingForAll: { type: Boolean, default: false },
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
