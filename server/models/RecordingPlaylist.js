import mongoose from 'mongoose';
import crypto from 'crypto';

// ─── Recording Playlist Schema (28.10) ───────────────────────────────────────
const recordingPlaylistSchema = new mongoose.Schema({
  playlistId: {
    type: String,
    default: () => 'pl_' + Date.now() + '_' + crypto.randomBytes(3).toString('hex'),
    unique: true,
    index: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  isSmart: {
    type: Boolean,
    default: false
  },
  smartFilter: {
    topic: { type: String, default: '' },
    keyword: { type: String, default: '' },
    speaker: { type: String, default: '' }
  },
  recordingIds: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

export const RecordingPlaylist = mongoose.model('RecordingPlaylist', recordingPlaylistSchema);
export default RecordingPlaylist;
