import mongoose from 'mongoose';

const webhookSubscriptionSchema = new mongoose.Schema({
  subscriptionId: {
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
  name: {
    type: String,
    required: true
  },
  endpoint: {
    type: String,
    required: true
  },
  secretKey: {
    type: String,
    required: true
  },
  events: {
    type: [String],
    default: ['meeting.completed', 'summary.generated', 'action_item.created']
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'PAUSED', 'DISABLED'],
    default: 'ACTIVE'
  },
  deliveryCount: {
    type: Number,
    default: 0
  },
  failureCount: {
    type: Number,
    default: 0
  },
  lastDeliveryAt: {
    type: Date,
    default: null
  },
  lastDeliveryStatus: {
    type: Number,
    default: 200
  },
  lastDeliveryPayload: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  }
}, {
  timestamps: true
});

const WebhookSubscription = mongoose.models.WebhookSubscription || mongoose.model('WebhookSubscription', webhookSubscriptionSchema);
export default WebhookSubscription;
