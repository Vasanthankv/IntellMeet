import mongoose from 'mongoose';

// ─── Sub-document: Caption Request from Participant (20.4) ───────────────────
const captionRequestSchema = new mongoose.Schema({
  requestId:       { type: String, default: () => new mongoose.Types.ObjectId().toString() },
  participantId:   { type: String, required: true },
  participantName: { type: String, default: 'Participant' },
  requestedAt:     { type: Date, default: Date.now },
  status:          { type: String, enum: ['PENDING', 'APPROVED', 'DECLINED'], default: 'PENDING' },
}, { _id: false });

// ─── Caption Settings Schema (20.1, 20.3, 20.4, 20.12) ────────────────────────
const captionSettingsSchema = new mongoose.Schema({
  meetingId:                  { type: String, required: true, unique: true, index: true },
  captionsEnabled:            { type: Boolean, default: true },
  allowedLanguages:           {
    type: [String],
    default: ['en-US', 'hi-IN', 'ta-IN', 'te-IN', 'es-ES', 'fr-FR', 'de-DE', 'zh-CN', 'ja-JP']
  },
  allowedTranslators:         {
    type: [String],
    default: ['en', 'hi', 'ta', 'te', 'es', 'fr', 'de', 'zh', 'ja']
  },
  hostOnlyControl:            { type: Boolean, default: false },
  participantRequestsAllowed: { type: Boolean, default: true },
  translationEnabled:         { type: Boolean, default: true },
  manualCaptioningEnabled:    { type: Boolean, default: true },
  assignedCaptionerId:        { type: String, default: null },
  assignedCaptionerName:      { type: String, default: null },
  captionRequests:            [captionRequestSchema],
}, { timestamps: true });

// ─── Active Caption Session Schema (20.12) ───────────────────────────────────
const captionSessionSchema = new mongoose.Schema({
  captionSessionId:    { type: String, default: () => new mongoose.Types.ObjectId().toString() },
  meetingId:           { type: String, required: true, index: true },
  status:              { type: String, enum: ['ACTIVE', 'STOPPED'], default: 'STOPPED' },
  provider:            { type: String, enum: ['AUTOMATED', 'WEB_SPEECH', 'MANUAL', 'THIRD_PARTY'], default: 'WEB_SPEECH' },
  sourceLanguage:      { type: String, default: 'en-US' },
  translationLanguage: { type: String, default: null },
  startedBy:           { type: String, default: 'host' },
  startedByName:       { type: String, default: 'Host' },
  startedAt:           { type: Date, default: null },
  endedAt:             { type: Date, default: null },
}, { timestamps: true });

export const CaptionSettings = mongoose.model('CaptionSettings', captionSettingsSchema);
export const CaptionSession = mongoose.model('CaptionSession', captionSessionSchema);

export default { CaptionSettings, CaptionSession };
