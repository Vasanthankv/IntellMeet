import mongoose from 'mongoose';

const networkQualitySchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  userId: {
    type: String,
    required: true
  },
  userName: {
    type: String,
    default: 'Participant'
  },
  meetingId: {
    type: String,
    required: true,
    index: true
  },
  bandwidthUp: {
    type: Number,
    default: 2.5 // in Mbps
  },
  bandwidthDown: {
    type: Number,
    default: 5.0 // in Mbps
  },
  latency: {
    type: Number,
    default: 45 // RTT in ms
  },
  jitter: {
    type: Number,
    default: 8 // in ms
  },
  packetLoss: {
    type: Number,
    default: 0.2 // in %
  },
  connectionType: {
    type: String,
    default: 'WIFI'
  },
  quality: {
    type: String,
    enum: ['EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'CRITICAL'],
    default: 'GOOD'
  },
  measuredAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

const NetworkQuality = mongoose.models.NetworkQuality || mongoose.model('NetworkQuality', networkQualitySchema);

export default NetworkQuality;
