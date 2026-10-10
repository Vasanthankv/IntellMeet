import mongoose from 'mongoose';

// ─── Sub-document: Interpretation Language Channel (22.3, 22.4, 22.17) ────────
const interpretationLanguageSchema = new mongoose.Schema({
  languageId:       { type: String, default: () => new mongoose.Types.ObjectId().toString() },
  languageCode:     { type: String, required: true }, // e.g. 'ta', 'hi', 'es', 'fr', 'de'
  languageName:     { type: String, required: true }, // e.g. 'Tamil', 'Hindi', 'Spanish'
  interpreterId:    { type: String, default: null },   // assigned participant / user ID
  interpreterName:  { type: String, default: null },
  interpreterEmail: { type: String, default: null },
  status:           { type: String, enum: ['ASSIGNED', 'JOINED', 'ACTIVE', 'LIVE', 'MUTED', 'LEFT'], default: 'ASSIGNED' },
  isSpeaking:       { type: Boolean, default: false },
}, { _id: false });

// ─── Sub-document: Sign-Language Interpreter (22.13) ─────────────────────────
const signLanguageInterpreterSchema = new mongoose.Schema({
  interpreterId:    { type: String, default: () => new mongoose.Types.ObjectId().toString() },
  userId:           { type: String, default: null },
  interpreterName:  { type: String, default: 'Sign Interpreter' },
  interpreterEmail: { type: String, default: null },
  status:           { type: String, enum: ['ASSIGNED', 'ACTIVE', 'LEFT'], default: 'ASSIGNED' },
}, { _id: false });

// ─── Interpretation Session Schema (22.2, 22.10, 22.17) ───────────────────────
const interpretationSessionSchema = new mongoose.Schema({
  interpretationId:        { type: String, default: () => new mongoose.Types.ObjectId().toString() },
  meetingId:               { type: String, required: true, unique: true, index: true },
  enabled:                 { type: Boolean, default: true },
  status:                  { type: String, enum: ['CONFIGURED', 'ACTIVE', 'STOPPED', 'ENDED'], default: 'ACTIVE' },
  sourceLanguage:          { type: String, default: 'en' },
  sourceLanguageName:      { type: String, default: 'English' },
  languages:               [interpretationLanguageSchema],
  signLanguageInterpreters:[signLanguageInterpreterSchema],
  allowOriginalAudioMixing:{ type: Boolean, default: true },
  defaultOriginalVolume:   { type: Number, default: 0.2 }, // 20% ducking for original audio
  startedAt:               { type: Date, default: null },
  endedAt:                 { type: Date, default: null },
  createdBy:               { type: String, default: 'host' },
}, { timestamps: true });

// ─── Participant Channel Preference Schema (22.7, 22.8, 22.12, 22.17) ─────────
const interpretationPreferenceSchema = new mongoose.Schema({
  meetingId:             { type: String, required: true, index: true },
  participantId:         { type: String, required: true, index: true },
  participantName:       { type: String, default: 'Participant' },
  selectedChannel:       { type: String, default: 'original' }, // 'original' or languageCode (e.g. 'ta', 'hi')
  originalAudioEnabled:  { type: Boolean, default: true },
  originalAudioVolume:   { type: Number, default: 0.2, min: 0, max: 1 }, // volume of background original speaker
  interpretationVolume:  { type: Number, default: 1.0, min: 0, max: 1 }, // volume of interpreter voice
  signLanguageEnabled:   { type: Boolean, default: false },
}, { timestamps: true });

interpretationPreferenceSchema.index({ meetingId: 1, participantId: 1 }, { unique: true });

export const InterpretationSession = mongoose.model('InterpretationSession', interpretationSessionSchema);
export const InterpretationPreference = mongoose.model('InterpretationPreference', interpretationPreferenceSchema);

export default { InterpretationSession, InterpretationPreference };
