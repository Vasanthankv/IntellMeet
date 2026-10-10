import mongoose from 'mongoose';

const ControllerSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  userName: { type: String, default: 'Participant' },
  userRole: { type: String, default: 'participant' },
  grantedBy: { type: String, required: true },
  grantedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['ACTIVE', 'REVOKED'], default: 'ACTIVE' },
  revokedAt: { type: Date }
}, { _id: false });

const SlideItemSchema = new mongoose.Schema({
  slideNumber: { type: Number, required: true },
  title: { type: String, required: true },
  subtitle: { type: String },
  category: { type: String },
  bullets: [{ type: String }],
  notes: { type: String },
  visualType: { type: String, default: 'card' } // 'card', 'architecture', 'metrics', 'roadmap', 'comparison'
}, { _id: false });

const PresentationSessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  meetingId: {
    type: String,
    required: true,
    index: true,
  },
  presenterId: {
    type: String,
    required: true,
  },
  presenterName: {
    type: String,
    default: 'Presenter',
  },
  presentationType: {
    type: String,
    enum: ['POWERPOINT', 'OFFICE_365', 'GOOGLE_SLIDES', 'KEYNOTE', 'PDF'],
    default: 'POWERPOINT',
  },
  presentationName: {
    type: String,
    default: 'IntellMeet Architecture & Project Roadmap',
  },
  currentSlide: {
    type: Number,
    default: 1,
    min: 1,
  },
  totalSlides: {
    type: Number,
    default: 12,
  },
  controllers: [ControllerSchema],
  slides: [SlideItemSchema],
  lastChangedBy: {
    userId: { type: String },
    userName: { type: String },
    action: { type: String }, // 'NEXT', 'PREV', 'GOTO'
    timestamp: { type: Date }
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'ENDED'],
    default: 'ACTIVE',
  },
  startedAt: {
    type: Date,
    default: Date.now,
  },
  endedAt: {
    type: Date,
  }
}, {
  timestamps: true,
});

export default mongoose.model('PresentationSession', PresentationSessionSchema);
