import mongoose from 'mongoose';
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.INTEGRATION_ENC_KEY || 'intellmeet_integration_secret_32_bytes_len!!'; // 32 bytes
const IV_LENGTH = 16;

const encryptToken = (text) => {
  if (!text) return '';
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32)), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
};

const decryptToken = (text) => {
  if (!text || !text.includes(':')) return '';
  try {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32)), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (e) {
    return 'DECRYPTION_ERROR';
  }
};

const integrationCredentialSchema = new mongoose.Schema({
  credentialId: {
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
  provider: {
    type: String,
    required: true
  },
  integrationId: {
    type: String,
    required: true
  },
  encryptedAccessToken: {
    type: String,
    required: true
  },
  encryptedRefreshToken: {
    type: String,
    default: ''
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 3600 * 1000)
  },
  keyVersion: {
    type: Number,
    default: 1
  },
  scopes: {
    type: [String],
    default: []
  }
}, {
  timestamps: true
});

integrationCredentialSchema.statics.encrypt = encryptToken;
integrationCredentialSchema.statics.decrypt = decryptToken;

const IntegrationCredential = mongoose.models.IntegrationCredential || mongoose.model('IntegrationCredential', integrationCredentialSchema);
export default IntegrationCredential;
