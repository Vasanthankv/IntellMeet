import mongoose from 'mongoose';

const integrationAuditLogSchema = new mongoose.Schema({
  auditId: {
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
  userName: {
    type: String,
    default: 'User'
  },
  organizationId: {
    type: String,
    default: 'default-org',
    index: true
  },
  provider: {
    type: String,
    required: true
  },
  integrationId: {
    type: String,
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'CONNECT', 
      'DISCONNECT', 
      'SYNC', 
      'DISPATCH_MESSAGE', 
      'CREATE_TASK', 
      'SYNC_CRM', 
      'WEBHOOK_DELIVERY', 
      'PERMISSION_CHANGED', 
      'ADMIN_APPROVAL', 
      'ADMIN_REJECTION'
    ]
  },
  status: {
    type: String,
    enum: ['SUCCESS', 'FAILED', 'PENDING'],
    default: 'SUCCESS'
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

const IntegrationAuditLog = mongoose.models.IntegrationAuditLog || mongoose.model('IntegrationAuditLog', integrationAuditLogSchema);
export default IntegrationAuditLog;
