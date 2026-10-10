import mongoose from 'mongoose';

const SavedRoomSchema = new mongoose.Schema({
  name: { type: String, required: true },
  participants: [{
    userId: { type: String, required: true },
    userName: { type: String, default: 'Participant' }
  }]
}, { _id: false });

const BreakoutSavedAssignmentSchema = new mongoose.Schema({
  assignmentId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  meetingId: {
    type: String,
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    default: 'Saved Breakout Assignment'
  },
  rooms: [SavedRoomSchema],
  createdBy: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

export default mongoose.model('BreakoutSavedAssignment', BreakoutSavedAssignmentSchema);
