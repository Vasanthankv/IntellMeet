import mongoose from 'mongoose';

// ─── Supported Global Languages for Translation (21.7) ───────────────────────
export const SUPPORTED_TRANSLATION_LANGUAGES = [
  { code: 'en', name: 'English', speechCode: 'en-US' },
  { code: 'hi', name: 'Hindi (हिन्दी)', speechCode: 'hi-IN' },
  { code: 'ta', name: 'Tamil (தமிழ்)', speechCode: 'ta-IN' },
  { code: 'te', name: 'Telugu (తెలుగు)', speechCode: 'te-IN' },
  { code: 'es', name: 'Spanish (Español)', speechCode: 'es-ES' },
  { code: 'fr', name: 'French (Français)', speechCode: 'fr-FR' },
  { code: 'de', name: 'German (Deutsch)', speechCode: 'de-DE' },
  { code: 'it', name: 'Italian (Italiano)', speechCode: 'it-IT' },
  { code: 'pt', name: 'Portuguese (Português)', speechCode: 'pt-PT' },
  { code: 'ja', name: 'Japanese (日本語)', speechCode: 'ja-JP' },
  { code: 'ko', name: 'Korean (한국어)', speechCode: 'ko-KR' },
  { code: 'zh', name: 'Chinese (中文)', speechCode: 'zh-CN' },
  { code: 'ar', name: 'Arabic (العربية)', speechCode: 'ar-SA' },
  { code: 'ru', name: 'Russian (Русский)', speechCode: 'ru-RU' },
  { code: 'vi', name: 'Vietnamese (Tiếng Việt)', speechCode: 'vi-VN' },
];

// ─── Translation Session Schema (21.14) ──────────────────────────────────────
const translationSessionSchema = new mongoose.Schema({
  translationSessionId: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
  meetingId:            { type: String, required: true, index: true },
  status:               { type: String, enum: ['ACTIVE', 'STOPPED'], default: 'ACTIVE' },
  enabledLanguages:     {
    type: [String],
    default: ['en', 'hi', 'ta', 'te', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'ko', 'zh', 'ar', 'ru', 'vi']
  },
  voiceTranslationEnabled: { type: Boolean, default: true },
  createdBy:            { type: String, default: 'host' },
  startedAt:            { type: Date, default: Date.now },
  endedAt:              { type: Date, default: null },
}, { timestamps: true });

// ─── Language Pair Schema (21.3, 21.14) ──────────────────────────────────────
const translationLanguagePairSchema = new mongoose.Schema({
  pairId:         { type: String, default: () => new mongoose.Types.ObjectId().toString() },
  meetingId:      { type: String, required: true, index: true },
  sourceLanguage: { type: String, required: true },
  targetLanguages:{ type: [String], default: [] },
  enabled:        { type: Boolean, default: true },
}, { timestamps: true });

// ─── Participant Translation Preference Schema (21.4, 21.13, 21.14) ──────────
const participantTranslationPreferenceSchema = new mongoose.Schema({
  meetingId:               { type: String, required: true, index: true },
  participantId:           { type: String, required: true, index: true },
  participantName:         { type: String, default: 'Participant' },
  speakingLanguage:        { type: String, default: 'en-US' },
  targetLanguage:          { type: String, default: 'ta' },
  translationEnabled:      { type: Boolean, default: true },
  voiceTranslationEnabled: { type: Boolean, default: false },
}, { timestamps: true });

participantTranslationPreferenceSchema.index({ meetingId: 1, participantId: 1 }, { unique: true });

// ─── Translated Caption Record Schema (21.14) ────────────────────────────────
const translatedCaptionSchema = new mongoose.Schema({
  translationId:  { type: String, default: () => new mongoose.Types.ObjectId().toString() },
  meetingId:      { type: String, required: true, index: true },
  segmentId:      { type: String, required: true },
  speakerId:      { type: String, default: 'speaker' },
  speakerName:    { type: String, default: 'Speaker' },
  sourceLanguage: { type: String, default: 'en' },
  sourceText:     { type: String, required: true },
  targetLanguage: { type: String, required: true },
  translatedText: { type: String, required: true },
  createdAt:      { type: Date, default: Date.now },
}, { timestamps: true });

export const TranslationSession = mongoose.model('TranslationSession', translationSessionSchema);
export const TranslationLanguagePair = mongoose.model('TranslationLanguagePair', translationLanguagePairSchema);
export const ParticipantTranslationPreference = mongoose.model('ParticipantTranslationPreference', participantTranslationPreferenceSchema);
export const TranslatedCaption = mongoose.model('TranslatedCaption', translatedCaptionSchema);

export default {
  TranslationSession,
  TranslationLanguagePair,
  ParticipantTranslationPreference,
  TranslatedCaption,
  SUPPORTED_TRANSLATION_LANGUAGES
};
