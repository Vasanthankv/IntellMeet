import mongoose from 'mongoose';

const mediaQualityProfileSchema = new mongoose.Schema({
  sessionId: {
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
  userId: {
    type: String,
    required: true
  },
  videoEnabled: {
    type: Boolean,
    default: true
  },
  videoResolution: {
    type: String,
    enum: ['1080p', '720p', '480p', '360p', '240p', 'none'],
    default: '720p'
  },
  frameRate: {
    type: Number,
    default: 30
  },
  audioPriority: {
    type: Boolean,
    default: false
  },
  screenShareQuality: {
    type: String,
    enum: ['HD', 'OPTIMIZED', 'LOW_BANDWIDTH'],
    default: 'OPTIMIZED'
  },
  effectsReduced: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const MediaQualityProfile = mongoose.models.MediaQualityProfile || mongoose.model('MediaQualityProfile', mediaQualityProfileSchema);

export default MediaQualityProfile;
