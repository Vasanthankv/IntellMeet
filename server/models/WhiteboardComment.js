import mongoose from 'mongoose';

const ReplySchema = new mongoose.Schema({
  replyId: { type: String, required: true },
  userId: { type: String, required: true },
  userName: { type: String, default: 'Participant' },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

const WhiteboardCommentSchema = new mongoose.Schema({
  commentId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  whiteboardId: {
    type: String,
    required: true,
    index: true,
  },
  objectId: {
    type: String,
    index: true,
  },
  pageNumber: {
    type: Number,
    default: 1,
  },
  position: {
    x: { type: Number, default: 200 },
    y: { type: Number, default: 200 },
  },
  userId: {
    type: String,
    required: true,
  },
  userName: {
    type: String,
    default: 'Participant',
  },
  content: {
    type: String,
    required: true,
  },
  mentions: [{
    type: String
  }],
  status: {
    type: String,
    enum: ['ACTIVE', 'RESOLVED'],
    default: 'ACTIVE',
  },
  replies: [ReplySchema]
}, {
  timestamps: true,
});

export default mongoose.model('WhiteboardComment', WhiteboardCommentSchema);
