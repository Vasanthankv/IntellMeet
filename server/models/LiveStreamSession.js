import mongoose from 'mongoose';

// Helper to generate unique stream identifier (33.17) e.g. STR-7K9F-M2P4
export function generateStreamId() {
  const part1 = Math.random().toString(36).substring(2, 6).toUpperCase();
  const part2 = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `STR-${part1}-${part2}`;
}

// Helper to securely mask stream keys for client responses (33.8, 33.20)
export function maskStreamKey(key = '') {
  if (!key || key.length <= 4) return '••••••••••••';
  return `••••••••••••${key.slice(-4)}`;
}

const liveStreamDestinationSchema = new mongoose.Schema({
  destinationId: {
    type: String,
    default: () => `DEST-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
  },
  platform: {
    type: String,
    enum: ['YOUTUBE', 'FACEBOOK', 'TWITCH', 'CUSTOM_RTMP'],
    required: true
  },
  name: {
    type: String,
    default: ''
  },
  streamUrl: {
    type: String,
    default: ''
  },
  streamKey: {
    type: String,
    default: ''
  },
  streamPageUrl: {
    type: String,
    default: ''
  },
  resolution: {
    type: String,
    enum: ['720p', '1080p', '480p'],
    default: '720p'
  },
  requireAuthentication: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['IDLE', 'CONNECTING', 'LIVE', 'STOPPED', 'FAILED'],
    default: 'IDLE'
  },
  viewerCount: {
    type: Number,
    default: 0
  },
  startedAt: {
    type: Date
  },
  endedAt: {
    type: Date
  },
  failureReason: {
    type: String,
    default: ''
  }
}, { _id: false });

const liveStreamSessionSchema = new mongoose.Schema({
  streamId: {
    type: String,
    default: generateStreamId,
    unique: true
  },
  meetingId: {
    type: String,
    required: true,
    index: true
  },
  startedBy: {
    userId: { type: String, default: 'local' },
    name: { type: String, default: 'Host' }
  },
  status: {
    type: String,
    enum: ['NOT_CONFIGURED', 'CONFIGURED', 'CONNECTING', 'LIVE', 'PAUSED', 'STOPPING', 'STOPPED', 'FAILED'],
    default: 'NOT_CONFIGURED'
  },
  viewerCount: {
    type: Number,
    default: 0
  },
  startedAt: {
    type: Date
  },
  endedAt: {
    type: Date
  },
  durationSeconds: {
    type: Number,
    default: 0
  },
  // 33.12 Up to 3 destinations can stream simultaneously
  destinations: [liveStreamDestinationSchema],

  // 33.13 Live Streaming Branding Watermark (Separate from #32 security watermark)
  branding: {
    watermarkEnabled: {
      type: Boolean,
      default: true
    },
    logoUrl: {
      type: String,
      default: ''
    },
    brandText: {
      type: String,
      default: 'Powered by IntelliMeet'
    },
    position: {
      type: String,
      enum: ['bottom-right', 'bottom-left', 'top-right', 'top-left'],
      default: 'bottom-right'
    }
  },

  // 33.2 Administrator Controls & Permissions
  accountSettings: {
    allowLiveStreaming: {
      type: Boolean,
      default: true
    },
    allowedPlatforms: {
      type: [String],
      enum: ['YOUTUBE', 'FACEBOOK', 'TWITCH', 'CUSTOM_RTMP'],
      default: ['YOUTUBE', 'FACEBOOK', 'TWITCH', 'CUSTOM_RTMP']
    },
    isLocked: {
      type: Boolean,
      default: false
    }
  },

  auditLogs: [{
    action: { type: String, required: true },
    performedBy: { type: String, default: 'Host' },
    timestamp: { type: Date, default: Date.now },
    details: { type: String, default: '' }
  }]
}, { timestamps: true });

const LiveStreamSession = mongoose.models.LiveStreamSession || mongoose.model('LiveStreamSession', liveStreamSessionSchema);

export default LiveStreamSession;
