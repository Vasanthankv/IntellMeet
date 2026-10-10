import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema(
  {
    meetingId: {
      type: String,
      required: true,
      index: true,
    },
    senderId: {
      type: String,
      default: '',
    },
    senderName: {
      type: String,
      required: true,
    },
    senderEmail: {
      type: String,
      default: '',
    },
    senderAvatar: {
      type: String,
      default: '',
    },
    // Recipient: 'everyone' for public group chat, or participant ID for 1:1 direct message
    recipientId: {
      type: String,
      default: 'everyone',
      index: true,
    },
    recipientName: {
      type: String,
      default: 'Everyone',
    },
    isPrivate: {
      type: Boolean,
      default: false,
    },
    text: {
      type: String,
      default: '',
    },
    // File / Media attachments (Section 10.6 & 10.7)
    fileUrl: {
      type: String,
      default: '',
    },
    fileName: {
      type: String,
      default: '',
    },
    fileType: {
      type: String,
      default: '', // 'image', 'pdf', 'document', 'archive', 'code', etc.
    },
    fileSize: {
      type: String,
      default: '',
    },
    // Pinned Chat Message (Section 10.11)
    isPinned: {
      type: Boolean,
      default: false,
      index: true,
    },
    pinnedBy: {
      type: String,
      default: '',
    },
    pinnedAt: {
      type: Date,
    },
    // Document / Canvas Collaboration link (Section 10.18)
    documentShare: {
      docTitle: String,
      docUrl: String,
      docType: String,
    },
    // Emoji Reactions
    reactions: [
      {
        emoji: String,
        users: [String],
        count: { type: Number, default: 0 },
      }
    ],
    // Part 35: Continuous Meeting Chat Phase & Extensions (35.1 - 35.23)
    phase: {
      type: String,
      enum: ['BEFORE', 'DURING', 'AFTER'],
      default: 'DURING',
      index: true,
    },
    replyTo: {
      messageId: String,
      senderName: String,
      text: String,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('ChatMessage', chatMessageSchema);
