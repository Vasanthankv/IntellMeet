import mongoose from 'mongoose';

const deviceSessionSchema = new mongoose.Schema({
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
  userName: {
    type: String,
    default: 'Participant'
  },
  deviceType: {
    type: String,
    enum: ['DESKTOP', 'MOBILE', 'TABLET', 'BROWSER'],
    default: 'BROWSER'
  },
  operatingSystem: {
    type: String,
    default: 'Unknown OS'
  },
  browser: {
    type: String,
    default: 'Unknown Browser'
  },
  cameraAvailable: {
    type: Boolean,
    default: true
  },
  microphoneAvailable: {
    type: Boolean,
    default: true
  },
  speakerAvailable: {
    type: Boolean,
    default: true
  },
  batteryLevel: {
    type: Number,
    default: 100 // 0-100
  },
  isCharging: {
    type: Boolean,
    default: true
  },
  lowBandwidthMode: {
    type: String,
    enum: ['AUTO', 'STANDARD', 'LOW_BANDWIDTH'],
    default: 'AUTO'
  },
  participationMode: {
    type: String,
    enum: ['AUDIO_VIDEO', 'AUDIO_ONLY', 'REDUCED_VIDEO'],
    default: 'AUDIO_VIDEO'
  }
}, {
  timestamps: true
});

const DeviceSession = mongoose.models.DeviceSession || mongoose.model('DeviceSession', deviceSessionSchema);

export default DeviceSession;
