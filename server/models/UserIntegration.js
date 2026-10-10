import mongoose from 'mongoose';

const userIntegrationSchema = new mongoose.Schema({
  userIntegrationId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  organizationId: {
    type: String,
    default: 'default-org',
    index: true
  },
  integrationId: {
    type: String,
    required: true,
    index: true
  },
  provider: {
    type: String,
    required: true
  },
  accountEmail: {
    type: String,
    default: ''
  },
  accountName: {
    type: String,
    default: ''
  },
  grantedScopes: {
    type: [String],
    default: []
  },
  status: {
    type: String,
    enum: ['CONNECTED', 'DISCONNECTED', 'REVOKED', 'PENDING_APPROVAL', 'ERROR'],
    default: 'CONNECTED',
    index: true
  },
  config: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  connectedAt: {
    type: Date,
    default: Date.now
  },
  lastSyncedAt: {
    type: Date,
    default: null
  },
  syncStatus: {
    type: String,
    enum: ['IDLE', 'SYNCING', 'SUCCESS', 'ERROR'],
    default: 'IDLE'
  },
  syncStats: {
    eventsSynced: { type: Number, default: 0 },
    tasksCreated: { type: Number, default: 0 },
    messagesDispatched: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

const UserIntegration = mongoose.models.UserIntegration || mongoose.model('UserIntegration', userIntegrationSchema);
export default UserIntegration;
