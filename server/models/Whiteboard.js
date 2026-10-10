import mongoose from 'mongoose';

const CollaboratorSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  userName: { type: String, default: 'Participant' },
  role: { 
    type: String, 
    enum: ['owner', 'co-owner', 'editor', 'commenter', 'viewer', 'OWNER', 'CO_OWNER', 'EDITOR', 'COMMENTER', 'VIEWER'], 
    default: 'editor' 
  },
  grantedBy: { type: String, default: 'owner' },
  grantedAt: { type: Date, default: Date.now }
}, { _id: false });

const PageSchema = new mongoose.Schema({
  pageNumber: { type: Number, required: true, default: 1 },
  title: { type: String, default: 'Page 1' }
}, { _id: false });

const WhiteboardSchema = new mongoose.Schema({
  whiteboardId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
    default: 'Untitled Whiteboard',
  },
  ownerId: {
    type: String,
    required: true,
    index: true,
  },
  ownerName: {
    type: String,
    default: 'Host',
  },
  meetingId: {
    type: String,
    index: true,
  },
  isLocked: {
    type: Boolean,
    default: false,
  },
  isStarred: {
    type: Boolean,
    default: false,
  },
  accessMode: {
    type: String,
    enum: ['COLLABORATE', 'PRESENT', 'COLLABORATING', 'PRESENTING'],
    default: 'COLLABORATE',
  },
  privateBrainstorming: {
    type: Boolean,
    default: false,
  },
  pages: {
    type: [PageSchema],
    default: [{ pageNumber: 1, title: 'Page 1' }]
  },
  activePage: {
    type: Number,
    default: 1
  },
  collaborators: [CollaboratorSchema],
  status: {
    type: String,
    enum: ['ACTIVE', 'ARCHIVED', 'TRASHED'],
    default: 'ACTIVE',
  },
  thumbnail: {
    type: String,
  }
}, {
  timestamps: true,
});

export default mongoose.model('Whiteboard', WhiteboardSchema);
