import express from 'express';
import { 
  TranslationSession, 
  TranslationLanguagePair, 
  ParticipantTranslationPreference, 
  TranslatedCaption,
  SUPPORTED_TRANSLATION_LANGUAGES 
} from '../models/Translation.js';
import { translateText } from '../services/translationService.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router({ mergeParams: true });

const getMeetingId = (req) => req.params.meetingId || req.body.meetingId || req.query.meetingId;

// ─────────────────────────────────────────────────────────────────────────────
// 21.7 Get Supported Translation Languages
// GET /api/meetings/:meetingId/translation/supported-languages or /api/translation/supported-languages
// ─────────────────────────────────────────────────────────────────────────────
router.get('/supported-languages', protect, (req, res) => {
  res.json({ success: true, languages: SUPPORTED_TRANSLATION_LANGUAGES });
});

// ─────────────────────────────────────────────────────────────────────────────
// 21.2 & 21.12 Get or Initialize Translation Settings for Meeting
// GET /api/meetings/:meetingId/translation/settings
// ─────────────────────────────────────────────────────────────────────────────
router.get('/settings', protect, async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    if (!meetingId) return res.status(400).json({ success: false, message: 'meetingId required' });

    let session = await TranslationSession.findOne({ meetingId });
    if (!session) {
      session = await TranslationSession.create({
        meetingId,
        status: 'ACTIVE',
        createdBy: req.user?._id?.toString() || req.user?.id || 'host',
      });
    }
    res.json({ success: true, session });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 21.2 & 21.12 Update Translation Settings (Host Controls)
// PUT /api/meetings/:meetingId/translation/settings
// ─────────────────────────────────────────────────────────────────────────────
router.put('/settings', protect, async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    if (!meetingId) return res.status(400).json({ success: false, message: 'meetingId required' });

    let session = await TranslationSession.findOne({ meetingId });
    if (!session) session = new TranslationSession({ meetingId });

    if (req.body.status !== undefined) session.status = req.body.status;
    if (req.body.enabledLanguages !== undefined) session.enabledLanguages = req.body.enabledLanguages;
    if (req.body.voiceTranslationEnabled !== undefined) session.voiceTranslationEnabled = req.body.voiceTranslationEnabled;

    await session.save();
    res.json({ success: true, session });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 21.3 Configure Translation Language Pairs (Host Controls)
// GET & PUT /api/meetings/:meetingId/translation/language-pairs
// ─────────────────────────────────────────────────────────────────────────────
router.get('/language-pairs', protect, async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    let pairs = await TranslationLanguagePair.find({ meetingId });
    if (pairs.length === 0) {
      // Initialize default pairs for major languages (21.3)
      const defaultPairs = [
        { meetingId, sourceLanguage: 'en', targetLanguages: ['ta', 'hi', 'te', 'es', 'fr', 'de', 'ja', 'zh'] },
        { meetingId, sourceLanguage: 'es', targetLanguages: ['en', 'ta', 'hi', 'fr'] },
        { meetingId, sourceLanguage: 'ta', targetLanguages: ['en', 'hi', 'te'] },
        { meetingId, sourceLanguage: 'hi', targetLanguages: ['en', 'ta', 'te'] },
      ];
      pairs = await TranslationLanguagePair.insertMany(defaultPairs);
    }
    res.json({ success: true, pairs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/language-pairs', protect, async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    const { sourceLanguage, targetLanguages, enabled = true } = req.body;

    if (!sourceLanguage) {
      return res.status(400).json({ success: false, message: 'sourceLanguage is required' });
    }

    let pair = await TranslationLanguagePair.findOne({ meetingId, sourceLanguage });
    if (!pair) {
      pair = new TranslationLanguagePair({ meetingId, sourceLanguage });
    }

    if (targetLanguages !== undefined) pair.targetLanguages = targetLanguages;
    if (enabled !== undefined) pair.enabled = enabled;

    await pair.save();
    res.json({ success: true, pair });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 21.4 & 21.13 Participant Translation Preferences
// GET & PUT /api/meetings/:meetingId/translation/preference
// ─────────────────────────────────────────────────────────────────────────────
router.get('/preference', protect, async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    const participantId = req.user?._id?.toString() || req.user?.id || 'guest';

    let pref = await ParticipantTranslationPreference.findOne({ meetingId, participantId });
    if (!pref) {
      pref = await ParticipantTranslationPreference.create({
        meetingId,
        participantId,
        participantName: req.user?.name || 'Participant',
        speakingLanguage: 'en-US',
        targetLanguage: 'ta',
        translationEnabled: true,
        voiceTranslationEnabled: false
      });
    }
    res.json({ success: true, preference: pref });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/preference', protect, async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    const participantId = req.user?._id?.toString() || req.user?.id || 'guest';

    let pref = await ParticipantTranslationPreference.findOne({ meetingId, participantId });
    if (!pref) {
      pref = new ParticipantTranslationPreference({
        meetingId,
        participantId,
        participantName: req.user?.name || 'Participant'
      });
    }

    const fields = ['speakingLanguage', 'targetLanguage', 'translationEnabled', 'voiceTranslationEnabled'];
    fields.forEach(f => {
      if (req.body[f] !== undefined) pref[f] = req.body[f];
    });

    await pref.save();
    res.json({ success: true, preference: pref });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 21.1 & 21.10 Real-Time Translation Endpoint
// POST /api/meetings/:meetingId/translation/translate
// ─────────────────────────────────────────────────────────────────────────────
router.post('/translate', protect, async (req, res) => {
  try {
    const { text, sourceLanguage = 'en', targetLanguage = 'ta' } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Text to translate cannot be empty' });
    }

    const translatedText = await translateText(text, sourceLanguage, targetLanguage);
    res.json({
      success: true,
      originalText: text,
      translatedText,
      sourceLanguage,
      targetLanguage
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 21.14 Log Translated Caption Record
// POST /api/meetings/:meetingId/translation/log-translated-segment
// ─────────────────────────────────────────────────────────────────────────────
router.post('/log-translated-segment', protect, async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    const { segmentId, speakerId, speakerName, sourceLanguage, sourceText, targetLanguage, translatedText } = req.body;

    if (!sourceText || !translatedText) {
      return res.status(400).json({ success: false, message: 'sourceText and translatedText are required' });
    }

    const record = await TranslatedCaption.create({
      meetingId,
      segmentId: segmentId || new Date().getTime().toString(),
      speakerId: speakerId || req.user?._id?.toString() || 'speaker',
      speakerName: speakerName || req.user?.name || 'Speaker',
      sourceLanguage: sourceLanguage || 'en',
      sourceText,
      targetLanguage: targetLanguage || 'ta',
      translatedText
    });

    res.status(201).json({ success: true, record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 21.14 Get Translated Caption History
// GET /api/meetings/:meetingId/translation/history
// ─────────────────────────────────────────────────────────────────────────────
router.get('/history', protect, async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    const { targetLanguage } = req.query;

    const query = { meetingId };
    if (targetLanguage) query.targetLanguage = targetLanguage;

    const history = await TranslatedCaption.find(query).sort({ createdAt: -1 }).limit(50);
    res.json({ success: true, count: history.length, history });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
