import express from 'express';
import { InterpretationSession, InterpretationPreference } from '../models/Interpretation.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router({ mergeParams: true });

const getMeetingId = (req) => req.params.meetingId || req.body.meetingId || req.query.meetingId;

// ─────────────────────────────────────────────────────────────────────────────
// 22.2 & 22.14 Get or Initialize Interpretation Settings for Meeting
// GET /api/meetings/:meetingId/interpretation/settings
// ─────────────────────────────────────────────────────────────────────────────
router.get('/settings', protect, async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    if (!meetingId) return res.status(400).json({ success: false, message: 'meetingId required' });

    let session = await InterpretationSession.findOne({ meetingId });
    if (!session) {
      // Initialize with common default channels: Tamil, Hindi, Spanish (22.3, 22.14)
      session = await InterpretationSession.create({
        meetingId,
        enabled: true,
        status: 'ACTIVE',
        sourceLanguage: 'en',
        sourceLanguageName: 'English',
        languages: [
          { languageCode: 'ta', languageName: 'Tamil', interpreterName: 'Ravi', status: 'ASSIGNED' },
          { languageCode: 'hi', languageName: 'Hindi', interpreterName: 'Kumar', status: 'ASSIGNED' },
          { languageCode: 'es', languageName: 'Spanish', interpreterName: 'Maria', status: 'ASSIGNED' },
        ],
        createdBy: req.user?._id?.toString() || req.user?.id || 'host',
      });
    }
    res.json({ success: true, session });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 22.2 & 22.10 Update Interpretation Settings (Host Controls)
// PUT /api/meetings/:meetingId/interpretation/settings
// ─────────────────────────────────────────────────────────────────────────────
router.put('/settings', protect, async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    if (!meetingId) return res.status(400).json({ success: false, message: 'meetingId required' });

    let session = await InterpretationSession.findOne({ meetingId });
    if (!session) session = new InterpretationSession({ meetingId });

    const fields = ['enabled', 'sourceLanguage', 'sourceLanguageName', 'allowOriginalAudioMixing', 'defaultOriginalVolume'];
    fields.forEach(f => {
      if (req.body[f] !== undefined) session[f] = req.body[f];
    });

    await session.save();
    res.json({ success: true, session });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 22.3 & 22.10 Add Interpretation Language (Host Controls)
// POST /api/meetings/:meetingId/interpretation/languages
// ─────────────────────────────────────────────────────────────────────────────
router.post('/languages', protect, async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    const { languageCode, languageName, interpreterId, interpreterName, interpreterEmail } = req.body;

    if (!languageCode || !languageName) {
      return res.status(400).json({ success: false, message: 'languageCode and languageName are required' });
    }

    let session = await InterpretationSession.findOne({ meetingId });
    if (!session) session = new InterpretationSession({ meetingId });

    // Check if channel already exists
    const existing = session.languages.find(l => l.languageCode.toLowerCase() === languageCode.toLowerCase());
    if (existing) {
      return res.status(400).json({ success: false, message: 'Language channel already configured' });
    }

    const newLang = {
      languageId: new Date().getTime().toString(),
      languageCode: languageCode.toLowerCase(),
      languageName,
      interpreterId: interpreterId || null,
      interpreterName: interpreterName || null,
      interpreterEmail: interpreterEmail || null,
      status: interpreterId ? 'ASSIGNED' : 'ASSIGNED'
    };

    session.languages.push(newLang);
    await session.save();

    res.status(201).json({ success: true, language: newLang, languages: session.languages, session });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 22.10 Remove Interpretation Language (Host Controls)
// DELETE /api/meetings/:meetingId/interpretation/languages/:languageId
// ─────────────────────────────────────────────────────────────────────────────
router.delete('/languages/:languageId', protect, async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    const { languageId } = req.params;

    let session = await InterpretationSession.findOne({ meetingId });
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });

    session.languages = session.languages.filter(l => l.languageId !== languageId && l.languageCode !== languageId && l._id?.toString() !== languageId);
    await session.save();

    res.json({ success: true, message: 'Language channel removed', languages: session.languages, session });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 22.4 & 22.10 Assign Interpreter to Channel (Host Controls)
// PUT /api/meetings/:meetingId/interpretation/languages/:languageId/interpreter
// ─────────────────────────────────────────────────────────────────────────────
router.put('/languages/:languageId/interpreter', protect, async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    const { languageId } = req.params;
    const { interpreterId, interpreterName, interpreterEmail } = req.body;

    let session = await InterpretationSession.findOne({ meetingId });
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });

    const lang = session.languages.find(l => l.languageId === languageId || l.languageCode === languageId);
    if (!lang) return res.status(404).json({ success: false, message: 'Language channel not found' });

    lang.interpreterId = interpreterId || null;
    lang.interpreterName = interpreterName || null;
    lang.interpreterEmail = interpreterEmail || null;
    lang.status = interpreterId ? 'ASSIGNED' : 'ASSIGNED';

    await session.save();
    res.json({ success: true, language: lang, session });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 22.5 & 22.10 Start Interpretation Session (Host Controls)
// POST /api/meetings/:meetingId/interpretation/session/start
// ─────────────────────────────────────────────────────────────────────────────
router.post('/session/start', protect, async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    let session = await InterpretationSession.findOne({ meetingId });
    if (!session) session = new InterpretationSession({ meetingId });

    session.status = 'ACTIVE';
    session.startedAt = new Date();
    await session.save();

    res.json({ success: true, message: 'Interpretation started', session });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 22.10 Stop Interpretation Session (Host Controls)
// PUT /api/meetings/:meetingId/interpretation/session/stop
// ─────────────────────────────────────────────────────────────────────────────
router.put('/session/stop', protect, async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    let session = await InterpretationSession.findOne({ meetingId });
    if (session) {
      session.status = 'ENDED';
      session.endedAt = new Date();
      await session.save();
    }
    res.json({ success: true, message: 'Interpretation stopped', session });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 22.7 & 22.12 Participant Channel & Volume Preference
// GET & PUT /api/meetings/:meetingId/interpretation/preference
// ─────────────────────────────────────────────────────────────────────────────
router.get('/preference', protect, async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    const participantId = req.user?._id?.toString() || req.user?.id || 'guest';

    let pref = await InterpretationPreference.findOne({ meetingId, participantId });
    if (!pref) {
      pref = await InterpretationPreference.create({
        meetingId,
        participantId,
        participantName: req.user?.name || 'Participant',
        selectedChannel: 'original',
        originalAudioEnabled: true,
        originalAudioVolume: 0.2,
        interpretationVolume: 1.0,
        signLanguageEnabled: false
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

    let pref = await InterpretationPreference.findOne({ meetingId, participantId });
    if (!pref) {
      pref = new InterpretationPreference({
        meetingId,
        participantId,
        participantName: req.user?.name || 'Participant'
      });
    }

    const fields = ['selectedChannel', 'originalAudioEnabled', 'originalAudioVolume', 'interpretationVolume', 'signLanguageEnabled'];
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
// 22.13 Assign Sign-Language Interpreter (Host Controls)
// POST /api/meetings/:meetingId/interpretation/sign-language/assign
// ─────────────────────────────────────────────────────────────────────────────
router.post('/sign-language/assign', protect, async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    const { userId, interpreterName, interpreterEmail } = req.body;

    let session = await InterpretationSession.findOne({ meetingId });
    if (!session) session = new InterpretationSession({ meetingId });

    const newSignInterpreter = {
      interpreterId: new Date().getTime().toString(),
      userId: userId || null,
      interpreterName: interpreterName || 'Sign Interpreter',
      interpreterEmail: interpreterEmail || null,
      status: 'ACTIVE'
    };

    session.signLanguageInterpreters.push(newSignInterpreter);
    await session.save();

    res.status(201).json({ success: true, signInterpreter: newSignInterpreter, session });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 22.11 Interpreter Updates Live Speaking Status
// PUT /api/meetings/:meetingId/interpretation/interpreter/status
// ─────────────────────────────────────────────────────────────────────────────
router.put('/interpreter/status', protect, async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    const { languageCode, isSpeaking, status } = req.body;
    const currentUserId = req.user?._id?.toString() || req.user?.id;

    let session = await InterpretationSession.findOne({ meetingId });
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });

    const lang = session.languages.find(l => 
      (languageCode && l.languageCode === languageCode) || 
      (l.interpreterId && l.interpreterId === currentUserId)
    );

    if (lang) {
      if (isSpeaking !== undefined) lang.isSpeaking = isSpeaking;
      if (status !== undefined) lang.status = status;
      await session.save();
    }

    res.json({ success: true, language: lang, session });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
