import mongoose from 'mongoose';

const ParticipantSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  userName: { type: String, default: 'Participant' },
  role: { type: String, default: 'participant' }, // host, co-host, participant
  status: { 
    type: String, 
    enum: ['ASSIGNED', 'JOINED', 'LEFT'], 
    default: 'ASSIGNED' 
  },
  assignedAt: { type: Date, default: Date.now },
  joinedAt: { type: Date },
  leftAt: { type: Date }
}, { _id: false });

const HelpRequestSchema = new mongoose.Schema({
  requestId: { type: String, required: true },
  userId: { type: String, required: true },
  userName: { type: String, default: 'Participant' },
  message: { type: String, default: 'Participant requested host help' },
  status: { 
    type: String, 
    enum: ['PENDING', 'RESOLVED', 'DISMISSED'], 
    default: 'PENDING' 
  },
  requestedAt: { type: Date, default: Date.now },
  resolvedAt: { type: Date }
}, { _id: false });

const BreakoutRoomSchema = new mongoose.Schema({
  roomId: {
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
  name: {
    type: String,
    required: true,
    default: 'Room 1'
  },
  roomIndex: {
    type: Number,
    default: 1
  },
  status: {
    type: String,
    enum: ['NOT_STARTED', 'OPEN', 'CLOSING', 'CLOSED'],
    default: 'NOT_STARTED',
    index: true
  },
  participants: [ParticipantSchema],
  settings: {
    allowSelfSelect: { type: Boolean, default: false },
    allowReturnToMain: { type: Boolean, default: true },
    autoMoveParticipants: { type: Boolean, default: false },
    autoClose: { type: Boolean, default: false },
    durationMinutes: { type: Number, default: 30 },
    countdownSeconds: { type: Number, default: 60 },
    notifyHostOnExpiry: { type: Boolean, default: true },
    broadcastEnabled: { type: Boolean, default: true }
  },
  startedAt: { type: Date },
  closingStartedAt: { type: Date },
  endedAt: { type: Date },
  hostSharingScreen: {
    isSharing: { type: Boolean, default: false },
    sharerId: { type: String },
    sharerName: { type: String },
    sourceName: { type: String }
  },
  helpRequests: [HelpRequestSchema]
}, {
  timestamps: true
});

export default mongoose.model('BreakoutRoom', BreakoutRoomSchema);
