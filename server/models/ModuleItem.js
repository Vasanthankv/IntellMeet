import mongoose from 'mongoose';

const moduleItemSchema = new mongoose.Schema(
  {
    type: {
      type: String, // 'recordings', 'whiteboards', 'notes', 'clips', 'canvas', 'paper', 'sheets', 'tasks'
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: String,
    content: String,
    fileUrl: String,
    status: {
      type: String,
      default: 'active' // active, archived, completed
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

const ModuleItem = mongoose.models.ModuleItem || mongoose.model('ModuleItem', moduleItemSchema);
export default ModuleItem;
