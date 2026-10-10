import mongoose from 'mongoose';

// Part 12: Reactions & Non-Verbal Feedback Persistence (Section 12.16)
const participantFeedbackSchema = new mongoose.Schema(
  {
    meetingId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: String,
      default: '',
    },
    participantId: {
      type: String,
      required: true,
      index: true,
    },
    displayName: {
      type: String,
      default: 'Participant',
    },
    type: {
      type: String,
      enum: ['REACTION', 'RAISE_HAND', 'NON_VERBAL'],
      required: true,
    },
    value: {
      type: String, // e.g. '👍', '❤️', 'YES', 'NO', 'FASTER', 'SLOWER'
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('ParticipantFeedback', participantFeedbackSchema);
