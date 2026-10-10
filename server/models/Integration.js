import mongoose from 'mongoose';

const integrationSchema = new mongoose.Schema({
  integrationId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  provider: {
    type: String,
    required: true,
    enum: ['GOOGLE', 'MICROSOFT', 'SLACK', 'ATLASSIAN', 'SALESFORCE', 'HUBSPOT', 'ZAPIER', 'ASANA', 'TRELLO', 'NOTION', 'WEBHOOK']
  },
  category: {
    type: String,
    required: true,
    enum: ['CALENDAR', 'COMMUNICATION', 'COLLABORATION', 'PROJECT_MANAGEMENT', 'CRM', 'AUTOMATION'],
    index: true
  },
  name: {
    type: String,
    required: true
  },
  tagline: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  },
  logo: {
    type: String,
    default: ''
  },
  supportedFeatures: {
    type: [String],
    default: []
  },
  requestedPermissions: [{
    scope: { type: String, required: true },
    label: { type: String, required: true },
    description: { type: String, default: '' },
    required: { type: Boolean, default: true }
  }],
  status: {
    type: String,
    enum: ['ACTIVE', 'BETA', 'DEPRECATED', 'DISABLED_BY_ADMIN'],
    default: 'ACTIVE'
  },
  approvalRequired: {
    type: Boolean,
    default: false
  },
  isPopular: {
    type: Boolean,
    default: false
  },
  isBuiltIn: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const Integration = mongoose.models.Integration || mongoose.model('Integration', integrationSchema);
export default Integration;
