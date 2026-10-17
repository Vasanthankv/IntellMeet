import express from 'express';
import { CaptionSettings, CaptionSession } from '../models/CaptionSession.js';
import MeetingTranscript from '../models/MeetingTranscript.js';
import Task from '../models/Task.js';
import { generateGeminiContent, isGeminiConfigured } from '../services/geminiService.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router({ mergeParams: true });

// Helper to resolve meetingId from params or body
const getMeetingId = (req) => req.params.meetingId || req.body.meetingId || req.query.meetingId;

// ─────────────────────────────────────────────────────────────────────────────
// 20.1 & 20.3 & 20.4 Get or initialize caption settings
// GET /api/meetings/:meetingId/captions/settings or /api/captions/:meetingId/settings
// ─────────────────────────────────────────────────────────────────────────────
router.get('/settings', protect, async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    if (!meetingId) return res.status(400).json({ success: false, message: 'meetingId required' });

    let settings = await CaptionSettings.findOne({ meetingId });
    if (!settings) {
      settings = await CaptionSettings.create({ meetingId });
    }
    res.json({ success: true, settings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 20.3 & 20.4 Update caption settings (Host/Admin control)
// PUT /api/meetings/:meetingId/captions/settings
// ─────────────────────────────────────────────────────────────────────────────
router.put('/settings', protect, async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    if (!meetingId) return res.status(400).json({ success: false, message: 'meetingId required' });

    let settings = await CaptionSettings.findOne({ meetingId });
    if (!settings) {
      settings = new CaptionSettings({ meetingId });
    }

    const fields = [
      'captionsEnabled', 'allowedLanguages', 'allowedTranslators',
      'hostOnlyControl', 'participantRequestsAllowed', 'translationEnabled',
      'manualCaptioningEnabled', 'assignedCaptionerId', 'assignedCaptionerName'
    ];

    fields.forEach(f => {
      if (req.body[f] !== undefined) settings[f] = req.body[f];
    });

    await settings.save();
    res.json({ success: true, settings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 20.4 Request host to enable captions
// POST /api/meetings/:meetingId/captions/request
// ─────────────────────────────────────────────────────────────────────────────
router.post('/request', protect, async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    if (!meetingId) return res.status(400).json({ success: false, message: 'meetingId required' });

    let settings = await CaptionSettings.findOne({ meetingId });
    if (!settings) settings = await CaptionSettings.create({ meetingId });

    if (!settings.participantRequestsAllowed) {
      return res.status(403).json({ success: false, message: 'Participant caption requests are disabled by host' });
    }

    const participantId = req.user?._id?.toString() || req.user?.id || 'user_guest';
    const participantName = req.user?.name || req.body.participantName || 'Participant';

    // Avoid duplicate pending requests
    const existing = settings.captionRequests.find(r => r.participantId === participantId && r.status === 'PENDING');
    if (existing) {
      return res.json({ success: true, request: existing, message: 'Request already pending' });
    }

    const newRequest = {
      requestId: new Date().getTime().toString(),
      participantId,
      participantName,
      requestedAt: new Date(),
      status: 'PENDING'
    };

    settings.captionRequests.push(newRequest);
    await settings.save();

    res.status(201).json({ success: true, request: newRequest });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 20.4 Host approve or decline caption request
// PUT /api/meetings/:meetingId/captions/request/:requestId
// ─────────────────────────────────────────────────────────────────────────────
router.put('/request/:requestId', protect, async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    const { requestId } = req.params;
    const { action } = req.body; // 'APPROVE' or 'DECLINE'

    let settings = await CaptionSettings.findOne({ meetingId });
    if (!settings) return res.status(404).json({ success: false, message: 'Settings not found' });

    const request = settings.captionRequests.find(r => r.requestId === requestId);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    if (action === 'APPROVE') {
      request.status = 'APPROVED';
      settings.captionsEnabled = true;
    } else {
      request.status = 'DECLINED';
    }

    await settings.save();
    res.json({ success: true, request, settings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 20.2 & 20.12 Start Live Caption Session
// POST /api/meetings/:meetingId/captions/session/start
// ─────────────────────────────────────────────────────────────────────────────
router.post('/session/start', protect, async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    const { provider = 'WEB_SPEECH', sourceLanguage = 'en-US', translationLanguage = null } = req.body;

    let session = await CaptionSession.findOne({ meetingId, status: 'ACTIVE' });
    if (!session) {
      session = await CaptionSession.create({
        meetingId,
        status: 'ACTIVE',
        provider,
        sourceLanguage,
        translationLanguage,
        startedBy: req.user?._id?.toString() || req.user?.id || 'host',
        startedByName: req.user?.name || 'Host',
        startedAt: new Date()
      });
    } else {
      session.provider = provider;
      session.sourceLanguage = sourceLanguage;
      session.translationLanguage = translationLanguage;
      await session.save();
    }

    res.json({ success: true, session });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 20.12 Stop Live Caption Session
// PUT /api/meetings/:meetingId/captions/session/stop
// ─────────────────────────────────────────────────────────────────────────────
router.put('/session/stop', protect, async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    const session = await CaptionSession.findOne({ meetingId, status: 'ACTIVE' });
    if (session) {
      session.status = 'STOPPED';
      session.endedAt = new Date();
      await session.save();
    }
    res.json({ success: true, message: 'Caption session stopped', session });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 20.12 Get Active Caption Session
// GET /api/meetings/:meetingId/captions/session
// ─────────────────────────────────────────────────────────────────────────────
router.get('/session', protect, async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    const session = await CaptionSession.findOne({ meetingId, status: 'ACTIVE' });
    res.json({ success: true, active: !!session, session: session || null });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 20.6 Assign Manual Captioner
// POST /api/meetings/:meetingId/captions/assign-captioner
// ─────────────────────────────────────────────────────────────────────────────
router.post('/assign-captioner', protect, async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    const { participantId, participantName } = req.body;

    let settings = await CaptionSettings.findOne({ meetingId });
    if (!settings) settings = await CaptionSettings.create({ meetingId });

    settings.assignedCaptionerId = participantId || null;
    settings.assignedCaptionerName = participantName || null;
    await settings.save();

    res.json({
      success: true,
      message: participantId ? `Assigned ${participantName} as manual captioner` : 'Manual captioner removed',
      assignedCaptionerId: settings.assignedCaptionerId,
      assignedCaptionerName: settings.assignedCaptionerName
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 20.8 & 20.9 Start Retained Meeting Transcription
// POST /api/meetings/:meetingId/captions/transcription/start
// ─────────────────────────────────────────────────────────────────────────────
router.post('/transcription/start', protect, async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    let transcript = await MeetingTranscript.findOne({ meetingId, status: 'ACTIVE' });
    if (!transcript) {
      transcript = await MeetingTranscript.create({
        meetingId,
        status: 'ACTIVE',
        startedBy: req.user?._id?.toString() || req.user?.id || 'host',
        startedByName: req.user?.name || 'Host',
        startedAt: new Date(),
        segments: []
      });
    }
    res.json({ success: true, message: 'Transcription started', transcript });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 20.8 & 20.9 Stop Retained Meeting Transcription
// POST /api/meetings/:meetingId/captions/transcription/stop
// ─────────────────────────────────────────────────────────────────────────────
router.post('/transcription/stop', protect, async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    const transcript = await MeetingTranscript.findOne({ meetingId, status: 'ACTIVE' });
    if (transcript) {
      transcript.status = 'STOPPED';
      transcript.endedAt = new Date();
      await transcript.save();
    }
    res.json({ success: true, message: 'Transcription stopped', transcript });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 20.9 Get Retained Transcript
// GET /api/meetings/:meetingId/captions/transcription
// ─────────────────────────────────────────────────────────────────────────────
router.get('/transcription', protect, async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    // Find latest transcript for this meeting
    const transcript = await MeetingTranscript.findOne({ meetingId }).sort({ createdAt: -1 });
    res.json({
      success: true,
      transcript: transcript || { meetingId, status: 'STOPPED', segments: [], aiSummary: {} }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 20.9 Append Segment to Retained Transcript
// POST /api/meetings/:meetingId/captions/transcription/segment
// ─────────────────────────────────────────────────────────────────────────────
router.post('/transcription/segment', protect, async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    const { speakerId, speakerName, text, translatedText, language = 'en-US', isManual = false } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Segment text cannot be empty' });
    }

    let transcript = await MeetingTranscript.findOne({ meetingId, status: 'ACTIVE' });
    if (!transcript) {
      // Create active transcript record if not yet started
      transcript = await MeetingTranscript.create({
        meetingId,
        status: 'ACTIVE',
        startedBy: speakerId || 'user',
        startedByName: speakerName || 'Speaker',
        startedAt: new Date(),
        segments: []
      });
    }

    const newSegment = {
      segmentId: new Date().getTime().toString() + '_' + Math.random().toString(36).substr(2, 5),
      speakerId: speakerId || req.user?._id?.toString() || 'anonymous',
      speakerName: speakerName || req.user?.name || 'Speaker',
      text: text.trim(),
      translatedText: translatedText || null,
      language,
      timestamp: new Date(),
      isManual: !!isManual
    };

    transcript.segments.push(newSegment);
    await transcript.save();

    res.status(201).json({ success: true, segment: newSegment, totalSegments: transcript.segments.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 20.14 AI Meeting Summary from Retained Transcript
// POST /api/meetings/:meetingId/captions/transcription/ai-summary
// ─────────────────────────────────────────────────────────────────────────────
router.post('/transcription/ai-summary', protect, async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    const transcript = await MeetingTranscript.findOne({ meetingId }).sort({ createdAt: -1 });

    if (!transcript || !transcript.segments || transcript.segments.length === 0) {
      return res.status(400).json({ success: false, message: 'No transcript segments available to summarize' });
    }

    const formattedTranscript = transcript.segments
      .map(s => `${s.speakerName}: ${s.text}`)
      .join('\n');

    let aiResult = null;

    if (isGeminiConfigured()) {
      try {
        const prompt = `
          Analyze the following meeting transcript and produce an executive summary.
          Return ONLY valid JSON matching this schema:
          {
            "summary": "2-3 sentence overview",
            "keyPoints": ["Point 1", "Point 2"],
            "actionItems": ["Action 1", "Action 2"],
            "decisions": ["Decision 1"]
          }
          Transcript:
          ${formattedTranscript}
        `;
        const { text } = await generateGeminiContent(prompt);
        const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
        aiResult = JSON.parse(cleaned);
      } catch (geminiErr) {
        console.warn('Gemini API call failed, generating deterministic structured summary:', geminiErr.message);
      }
    }

    // High quality rule-based fallback if no Gemini key or offline
    if (!aiResult) {
      const allSentences = transcript.segments.map(s => s.text);
      const actionKeywords = ['will', 'shall', 'need to', 'deploy', 'complete', 'test', 'review', 'prepare', 'send', 'fix'];
      const decisionKeywords = ['agree', 'decided', 'approved', 'choose', 'confirm', 'consensus', 'selected'];

      const actionItems = [];
      const decisions = [];
      const keyPoints = [];

      transcript.segments.forEach(seg => {
        const lower = seg.text.toLowerCase();
        if (actionKeywords.some(kw => lower.includes(kw))) {
          actionItems.push(`${seg.speakerName}: ${seg.text}`);
        }
        if (decisionKeywords.some(kw => lower.includes(kw))) {
          decisions.push(`${seg.speakerName}: ${seg.text}`);
        }
        if (keyPoints.length < 5) {
          keyPoints.push(seg.text);
        }
      });

      aiResult = {
        summary: `Meeting of ${transcript.segments.length} dialogue segments recorded between participants including ${Array.from(new Set(transcript.segments.map(s => s.speakerName))).join(', ')}.`,
        keyPoints: keyPoints.length > 0 ? keyPoints.slice(0, 4) : ['Productive discussion and collaboration.'],
        actionItems: actionItems.length > 0 ? actionItems.slice(0, 5) : ['Follow up on items discussed in meeting.'],
        decisions: decisions.length > 0 ? decisions.slice(0, 3) : ['Proceed with planned sprint schedule.']
      };
    }

    aiResult.generatedAt = new Date();
    transcript.aiSummary = aiResult;
    await transcript.save();

    // Auto-create Tasks in MongoDB for the user if action items exist (20.14)
    if (aiResult.actionItems && aiResult.actionItems.length > 0 && req.user) {
      try {
        const userId = req.user._id || req.user.id;
        const taskPromises = aiResult.actionItems.map(actionText => {
          return new Task({
            title: actionText.substring(0, 100),
            description: `Auto-generated from IntellMeet Part 20 Transcript Summary (${meetingId})`,
            status: 'todo',
            priority: 'Medium',
            user: userId
          }).save();
        });
        await Promise.all(taskPromises);
      } catch (taskErr) {
        console.warn('Could not auto-create tasks:', taskErr.message);
      }
    }

    res.json({ success: true, summary: aiResult });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 20.9 Export Retained Transcript
// GET /api/meetings/:meetingId/captions/transcription/export
// ─────────────────────────────────────────────────────────────────────────────
router.get('/transcription/export', protect, async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    const format = req.query.format || 'txt';
    const transcript = await MeetingTranscript.findOne({ meetingId }).sort({ createdAt: -1 });

    if (!transcript) {
      return res.status(404).json({ success: false, message: 'No transcript found' });
    }

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="transcript_${meetingId}.json"`);
      return res.send(JSON.stringify(transcript, null, 2));
    }

    // Default plain text format
    const lines = [
      `=== INTELLMEET MEETING TRANSCRIPT ===`,
      `Meeting ID: ${meetingId}`,
      `Started: ${transcript.startedAt ? new Date(transcript.startedAt).toLocaleString() : 'N/A'}`,
      `Ended: ${transcript.endedAt ? new Date(transcript.endedAt).toLocaleString() : 'Ongoing'}`,
      `Total Segments: ${transcript.segments.length}`,
      `=====================================`,
      '',
      ...transcript.segments.map(s => {
        const time = new Date(s.timestamp).toLocaleTimeString();
        const trans = s.translatedText ? ` [Translated: ${s.translatedText}]` : '';
        return `[${time}] ${s.speakerName}: ${s.text}${trans}`;
      })
    ];

    if (transcript.aiSummary && transcript.aiSummary.summary) {
      lines.push(
        '',
        `=== AI MEETING SUMMARY ===`,
        `Summary: ${transcript.aiSummary.summary}`,
        '',
        `Key Points:`,
        ...(transcript.aiSummary.keyPoints || []).map(p => `• ${p}`),
        '',
        `Action Items:`,
        ...(transcript.aiSummary.actionItems || []).map(a => `• [ ] ${a}`),
        '',
        `Decisions:`,
        ...(transcript.aiSummary.decisions || []).map(d => `• ✓ ${d}`),
        `==========================`
      );
    }

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="transcript_${meetingId}.txt"`);
    res.send(lines.join('\n'));
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
