import mongoose from 'mongoose';

const preReadSchema = new mongoose.Schema(
  {
    meetingId: {
      type: String,
      required: true,
      index: true,
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
    type: {
      type: String,
      enum: ['PDF', 'DOCUMENT', 'PRESENTATION', 'SPREADSHEET', 'LINK', 'IMAGE', 'PREVIOUS_SUMMARY'],
      default: 'DOCUMENT',
    },
    fileUrl: {
      type: String,
      default: '',
    },
    externalUrl: {
      type: String,
      default: '',
    },
    fileSize: {
      type: String,
      default: '',
    },
    uploadedBy: {
      type: String,
      default: '',
    },
    uploadedByName: {
      type: String,
      default: '',
    },
    viewedBy: [
      {
        userId: String,
        userName: String,
        viewedAt: { type: Date, default: Date.now },
        reviewed: { type: Boolean, default: false },
      }
    ],
  },
  {
    timestamps: true,
  }
);

preReadSchema.index({ meetingId: 1, createdAt: -1 });

const PreRead = mongoose.model('PreRead', preReadSchema);
export default PreRead;
