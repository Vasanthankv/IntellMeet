import mongoose from 'mongoose';

const meetingNoteSchema = new mongoose.Schema(
  {
    meetingId: {
      type: String,
      required: true,
      index: true,
    },
    agendaItemId: {
      type: String,
      default: '',
    },
    authorId: {
      type: String,
      default: '',
    },
    authorName: {
      type: String,
      required: true,
      default: 'Participant',
    },
    authorEmail: {
      type: String,
      default: '',
    },
    content: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ['GENERAL', 'DECISION', 'ACTION_ITEM', 'KEY_TAKEAWAY'],
      default: 'GENERAL',
    },
    visibility: {
      type: String,
      enum: ['ALL_PARTICIPANTS', 'HOST_ONLY'],
      default: 'ALL_PARTICIPANTS',
    },
    tags: [
      {
        type: String,
        trim: true,
      }
    ],
  },
  {
    timestamps: true,
  }
);

meetingNoteSchema.index({ meetingId: 1, createdAt: 1 });

const MeetingNote = mongoose.model('MeetingNote', meetingNoteSchema);
export default MeetingNote;
