import mongoose from 'mongoose';

const agendaItemSchema = new mongoose.Schema(
  {
    itemId: {
      type: String,
      default: () => 'item_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    presenterName: {
      type: String,
      default: '',
    },
    presenterEmail: {
      type: String,
      default: '',
    },
    durationMinutes: {
      type: Number,
      default: 10,
    },
    order: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED'],
      default: 'PENDING',
    },
    notes: {
      type: String,
      default: '',
    },
    decision: {
      type: String,
      default: '',
    },
    actionItems: [
      {
        id: { type: String, default: () => 'act_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6) },
        task: { type: String, required: true },
        assignee: { type: String, default: '' },
        dueDate: { type: String, default: '' },
        completed: { type: Boolean, default: false },
      }
    ],
  },
  { _id: true, timestamps: true }
);

const meetingAgendaSchema = new mongoose.Schema(
  {
    meetingId: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: 'Meeting Agenda & Preparation Plan',
    },
    description: {
      type: String,
      default: '',
    },
    items: [agendaItemSchema],
    createdBy: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

const MeetingAgenda = mongoose.model('MeetingAgenda', meetingAgendaSchema);
export default MeetingAgenda;
