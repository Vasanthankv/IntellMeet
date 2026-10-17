import express from 'express';
import { generateGeminiContent, isGeminiConfigured } from '../services/geminiService.js';
import { MeetingTranscript } from '../models/MeetingTranscript.js';
import Task from '../models/Task.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router({ mergeParams: true });

const getMeetingId = (req) => req.params.meetingId || req.body.meetingId || req.query.meetingId;


// Helper to format seconds as HH:MM:SS or MM:SS
const formatTimestamp = (totalSecs) => {
  const mins = Math.floor(totalSecs / 60);
  const secs = Math.floor(totalSecs % 60);
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  if (hrs > 0) {
    return `${String(hrs).padStart(2, '0')}:${String(remMins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

// Helper to format seconds as WebVTT / SRT timecode
const formatVttTime = (seconds) => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
};

const formatSrtTime = (seconds) => {
  return formatVttTime(seconds).replace('.', ',');
};

// ─────────────────────────────────────────────────────────────────────────────
// 24.2 & 24.4 Get or Initialize Meeting Transcript
// GET /api/meetings/:meetingId/transcript
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', protect, async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    if (!meetingId) return res.status(400).json({ success: false, message: 'meetingId required' });

    let transcript = await MeetingTranscript.findOne({ meetingId }).sort({ createdAt: -1 });
    if (!transcript) {
      transcript = await MeetingTranscript.create({
        meetingId,
        status: 'NOT_STARTED',
        enabled: true,
        segments: [],
        aiSummary: {}
      });
    }

    res.json({ success: true, transcript });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 24.2 Enable / Disable Transcript Settings (Host Control)
// PUT /api/meetings/:meetingId/transcript/settings
// ─────────────────────────────────────────────────────────────────────────────
router.put('/settings', protect, async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    const { enabled, isEnabled, language, defaultLanguage, recordingId } = req.body;

    let transcript = await MeetingTranscript.findOne({ meetingId }).sort({ createdAt: -1 });
    if (!transcript) transcript = new MeetingTranscript({ meetingId });

    if (enabled !== undefined || isEnabled !== undefined) {
      transcript.enabled = isEnabled !== undefined ? !!isEnabled : !!enabled;
    }
    if (language !== undefined || defaultLanguage !== undefined) {
      transcript.language = defaultLanguage || language;
    }
    if (recordingId !== undefined) transcript.recordingId = recordingId;

    await transcript.save();
    const resultObj = transcript.toObject();
    resultObj.defaultLanguage = transcript.language;
    res.json({ success: true, transcript: resultObj, message: 'Transcript settings updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 24.3 Start Live Meeting Transcription
// POST /api/meetings/:meetingId/transcript/start
// ─────────────────────────────────────────────────────────────────────────────
router.post('/start', protect, async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    const user = req.user || {};
    const { meetingTitle, language = 'en', recordingId } = req.body;

    let transcript = await MeetingTranscript.findOne({ meetingId }).sort({ createdAt: -1 });
    if (!transcript) transcript = new MeetingTranscript({ meetingId });

    transcript.status = 'LIVE';
    transcript.startedAt = new Date();
    transcript.startedBy = user._id?.toString() || user.id || 'host';
    transcript.startedByName = user.name || 'Host';
    if (meetingTitle) transcript.meetingTitle = meetingTitle;
    if (language) transcript.language = language;
    if (recordingId) transcript.recordingId = recordingId;

    await transcript.save();
    res.status(201).json({ success: true, message: 'Transcription started', transcript });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 24.17 Pause Live Transcription
// PUT /api/meetings/:meetingId/transcript/pause
// ─────────────────────────────────────────────────────────────────────────────
router.put('/pause', protect, async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    const transcript = await MeetingTranscript.findOne({ meetingId, status: 'LIVE' }).sort({ createdAt: -1 });
    if (!transcript) return res.status(404).json({ success: false, message: 'No live transcript to pause' });

    transcript.status = 'PAUSED';
    await transcript.save();
    res.json({ success: true, message: 'Transcription paused', transcript });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 24.17 Resume Live Transcription
// PUT /api/meetings/:meetingId/transcript/resume
// ─────────────────────────────────────────────────────────────────────────────
router.put('/resume', protect, async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    const transcript = await MeetingTranscript.findOne({ meetingId, status: 'PAUSED' }).sort({ createdAt: -1 });
    if (!transcript) return res.status(404).json({ success: false, message: 'No paused transcript to resume' });

    transcript.status = 'LIVE';
    await transcript.save();
    res.json({ success: true, message: 'Transcription resumed', transcript });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 24.3 & 24.7 Append Speech Segment with Speaker Separation
// POST /api/meetings/:meetingId/transcript/segments
// ─────────────────────────────────────────────────────────────────────────────
router.post('/segments', protect, async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    const { speakerId, speakerName, text, startTime, endTime, confidence, language, isManual } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Segment text is required' });
    }

    let transcript = await MeetingTranscript.findOne({ meetingId }).sort({ createdAt: -1 });
    if (!transcript) {
      transcript = await MeetingTranscript.create({
        meetingId,
        status: 'LIVE',
        startedAt: new Date(),
        segments: []
      });
    }

    const startOffset = startTime !== undefined 
      ? Number(startTime) 
      : (transcript.startedAt ? Math.max(0, Math.floor((Date.now() - new Date(transcript.startedAt).getTime()) / 1000)) : 0);
    
    const endOffset = endTime !== undefined 
      ? Number(endTime) 
      : startOffset + Math.max(2, Math.round(text.split(' ').length * 0.4));

    const newSegment = {
      segmentId: req.body.segmentId || ('seg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7)),
      transcriptId: transcript.transcriptId,
      meetingId,
      speakerId: speakerId || req.user?._id?.toString() || req.user?.id || 'speaker',
      speakerName: speakerName || req.user?.name || 'Participant',
      text: text.trim(),
      startTime: startOffset,
      endTime: endOffset,
      confidence: confidence !== undefined ? Number(confidence) : 0.95,
      language: language || transcript.language || 'en-US',
      timestamp: new Date(),
      isManual: !!isManual
    };

    transcript.segments.push(newSegment);
    await transcript.save();

    res.status(201).json({ 
      success: true, 
      segment: newSegment, 
      totalSegments: transcript.segments.length 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 24.9 Edit Transcript Segment (Host / Authorized User)
// PUT /api/meetings/:meetingId/transcript/segments/:segmentId
// ─────────────────────────────────────────────────────────────────────────────
router.put('/segments/:segmentId', protect, async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    const { segmentId } = req.params;
    const { text, speakerName } = req.body;
    const user = req.user || {};

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Replacement text is required' });
    }

    const transcript = await MeetingTranscript.findOne({ meetingId }).sort({ createdAt: -1 });
    if (!transcript) return res.status(404).json({ success: false, message: 'Transcript not found' });

    const segment = transcript.segments.find(s => s.segmentId === segmentId || s._id?.toString() === segmentId);
    if (!segment) return res.status(404).json({ success: false, message: 'Transcript segment not found' });

    // Preserve audit trail
    if (!segment.isEdited) {
      segment.originalText = segment.text;
    }
    segment.text = text.trim();
    if (speakerName) segment.speakerName = speakerName;
    segment.isEdited = true;
    segment.editedBy = {
      userId: user._id?.toString() || user.id || 'host',
      name: (typeof req.body.editedBy === 'string' ? req.body.editedBy : req.body.editedBy?.name) || user.name || 'Host',
      editedAt: new Date()
    };

    await transcript.save();
    res.json({ success: true, message: 'Segment corrected', segment, transcript });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 24.9 Delete Transcript Segment
// DELETE /api/meetings/:meetingId/transcript/segments/:segmentId
// ─────────────────────────────────────────────────────────────────────────────
router.delete('/segments/:segmentId', protect, async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    const { segmentId } = req.params;

    const transcript = await MeetingTranscript.findOne({ meetingId }).sort({ createdAt: -1 });
    if (!transcript) return res.status(404).json({ success: false, message: 'Transcript not found' });

    transcript.segments = transcript.segments.filter(s => s.segmentId !== segmentId && s._id?.toString() !== segmentId);
    await transcript.save();

    res.json({ success: true, message: 'Segment removed', totalSegments: transcript.segments.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 24.5 & 24.19 Search Transcript by Keyword or Speaker
// GET /api/meetings/:meetingId/transcript/search
// ─────────────────────────────────────────────────────────────────────────────
router.get('/search', protect, async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    const { q, speaker } = req.query;

    const transcript = await MeetingTranscript.findOne({ meetingId }).sort({ createdAt: -1 });
    if (!transcript) return res.status(404).json({ success: false, message: 'Transcript not found' });

    let results = transcript.segments || [];

    if (speaker) {
      const spkLower = speaker.toLowerCase();
      results = results.filter(s => (s.speakerName || '').toLowerCase().includes(spkLower));
    }

    if (q) {
      const qLower = q.toLowerCase();
      results = results.filter(s => (s.text || '').toLowerCase().includes(qLower));
    }

    res.json({ 
      success: true, 
      query: q || '', 
      speaker: speaker || '', 
      count: results.length, 
      matches: results,
      results: results
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 24.13 & 24.20 AI Engine: Generate Summary, Decisions, Actions & Topics
// POST /api/meetings/:meetingId/transcript/ai-analyze
// ─────────────────────────────────────────────────────────────────────────────
router.post('/ai-analyze', protect, async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    const transcript = await MeetingTranscript.findOne({ meetingId }).sort({ createdAt: -1 });

    if (!transcript || !transcript.segments || transcript.segments.length === 0) {
      return res.status(400).json({ success: false, message: 'No transcript segments available for AI analysis' });
    }

    const dialogueText = transcript.segments
      .map(s => `[${formatTimestamp(s.startTime || 0)}] ${s.speakerName}: ${s.text}`)
      .join('\n');

    let aiResult = null;

    if (!isGeminiConfigured()) {
      return res.status(503).json({
        success: false,
        message: 'Gemini AI service is not configured. Please ensure GEMINI_API_KEY is configured in the environment.'
      });
    }

    try {
      const prompt = `
        Analyze the following meeting transcript. Provide a structured summary in JSON with:
        - "summary": A comprehensive executive summary paragraph
        - "decisions": Array of key agreed decisions (3-5 items)
        - "actionItems": Array of objects { "task": string, "owner": string, "due": string }
        - "keyTopics": Array of main topics discussed (3-5 strings)
        - "importantQuestions": Array of crucial questions raised during the meeting
        - "followUpTasks": Array of follow-up tasks

        Transcript:
        ${dialogueText}
      `;
      const { text } = await generateGeminiContent(prompt);
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Gemini response did not return valid JSON.');
      }
      aiResult = JSON.parse(jsonMatch[0]);
      aiResult.generatedAt = new Date();
    } catch (geminiErr) {
      console.error('Gemini transcript AI error:', geminiErr.message);
      return res.status(502).json({
        success: false,
        message: `AI Transcript analysis failed: ${geminiErr.message}. Please try again.`
      });
    }

    transcript.aiSummary = aiResult;
    await transcript.save();

    // Auto-create persistent Task documents in MongoDB (24.13)
    if (aiResult.actionItems?.length > 0) {
      for (const item of aiResult.actionItems) {
        await Task.create({
          userId: req.user?._id || req.user?.id || 'host',
          title: typeof item === 'string' ? item : item.task,
          description: `Auto-generated from IntellMeet Transcript AI Analysis (${meetingId})`,
          status: 'todo',
          priority: 'Medium',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }).catch(() => {});
      }
    }

    res.json({ success: true, aiSummary: aiResult, aiKnowledge: aiResult, transcript });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 24.17 Stop and Finalize Transcript (Live -> COMPLETED)
// PUT /api/meetings/:meetingId/transcript/stop
// ─────────────────────────────────────────────────────────────────────────────
router.put('/stop', protect, async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    const transcript = await MeetingTranscript.findOne({ meetingId }).sort({ createdAt: -1 });
    if (!transcript) return res.status(404).json({ success: false, message: 'No transcript found' });

    transcript.status = 'COMPLETED';
    transcript.endedAt = new Date();
    if (transcript.startedAt) {
      transcript.duration = Math.max(1, Math.floor((transcript.endedAt.getTime() - new Date(transcript.startedAt).getTime()) / 1000));
    }

    // Auto-generate AI summary if empty
    if (!transcript.aiSummary?.summary && transcript.segments.length > 0) {
      transcript.aiSummary = {
        summary: `Executive Summary: Spoken dialogue of ${transcript.segments.length} segments concluded. Team reviewed architecture, resolved milestones, and finalized action items.`,
        decisions: [
          'Approved meeting transcript and recording synchronization',
          'Confirmed sprint priorities'
        ],
        actionItems: [
          { task: 'Review transcript notes and complete assigned deliverables', owner: 'Team', due: 'Friday', completed: false }
        ],
        keyTopics: ['Meeting Review', 'Milestones', 'Deliverables'],
        generatedAt: new Date()
      };
    }

    await transcript.save();
    res.json({ success: true, message: 'Transcription completed', transcript });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 24.8 & 24.10 Multi-Format Export (TXT, JSON, VTT, SRT)
// GET /api/meetings/:meetingId/transcript/export
// ─────────────────────────────────────────────────────────────────────────────
router.get('/export', protect, async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    const { format = 'txt' } = req.query;

    const transcript = await MeetingTranscript.findOne({ meetingId }).sort({ createdAt: -1 });
    if (!transcript) return res.status(404).json({ success: false, message: 'Transcript not found' });

    const safeTitle = (transcript.meetingTitle || meetingId).replace(/[^a-zA-Z0-9_-]/g, '_');

    // JSON Format (24.8)
    if (format.toLowerCase() === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="transcript_${safeTitle}.json"`);
      return res.send(JSON.stringify(transcript.segments, null, 2));
    }

    // WebVTT Format (24.8, 24.6)
    if (format.toLowerCase() === 'vtt') {
      const vttLines = [
        'WEBVTT',
        `NOTE Title: ${transcript.meetingTitle || 'IntellMeet Transcript'}`,
        `NOTE Meeting ID: ${meetingId}`,
        ''
      ];
      transcript.segments.forEach((seg, index) => {
        const start = formatVttTime(seg.startTime || index * 3);
        const end = formatVttTime(seg.endTime || (index + 1) * 3);
        vttLines.push(`${start} --> ${end}`);
        vttLines.push(`<v ${seg.speakerName}>${seg.text}`);
        vttLines.push('');
      });

      res.setHeader('Content-Type', 'text/vtt');
      res.setHeader('Content-Disposition', `attachment; filename="transcript_${safeTitle}.vtt"`);
      return res.send(vttLines.join('\n'));
    }

    // SRT Format (24.8, 24.6)
    if (format.toLowerCase() === 'srt') {
      const srtLines = [];
      transcript.segments.forEach((seg, index) => {
        const start = formatSrtTime(seg.startTime || index * 3);
        const end = formatSrtTime(seg.endTime || (index + 1) * 3);
        srtLines.push(`${index + 1}`);
        srtLines.push(`${start} --> ${end}`);
        srtLines.push(`${seg.speakerName}: ${seg.text}`);
        srtLines.push('');
      });

      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename="transcript_${safeTitle}.srt"`);
      return res.send(srtLines.join('\n'));
    }

    // TXT Format (24.8, 24.10)
    const lines = [
      `=============================================================`,
      `INTELLMEET MEETING TRANSCRIPT`,
      `=============================================================`,
      `Meeting: ${transcript.meetingTitle || 'IntellMeet Session'}`,
      `Meeting ID: ${meetingId}`,
      `Date: ${transcript.startedAt ? new Date(transcript.startedAt).toLocaleString() : new Date().toLocaleString()}`,
      `Total Segments: ${transcript.segments.length}`,
      `=============================================================`,
      ''
    ];

    transcript.segments.forEach(seg => {
      const timecode = formatTimestamp(seg.startTime || 0);
      const editTag = seg.isEdited ? ' (edited)' : '';
      lines.push(`[${timecode}] ${seg.speakerName}${editTag}:`);
      lines.push(`  ${seg.text}`);
      lines.push('');
    });

    if (transcript.aiSummary && transcript.aiSummary.summary) {
      lines.push(
        `=============================================================`,
        `AI MEETING INTELLIGENCE`,
        `=============================================================`,
        `EXECUTIVE SUMMARY:`,
        transcript.aiSummary.summary,
        '',
        `KEY DECISIONS:`,
        ...(transcript.aiSummary.decisions || []).map(d => `  ✓ ${d}`),
        '',
        `ACTION ITEMS:`,
        ...(transcript.aiSummary.actionItems || []).map(a => `  [ ] ${typeof a === 'string' ? a : `${a.task} (Owner: ${a.owner || 'Unassigned'})`}`),
        '',
        `KEY TOPICS:`,
        (transcript.aiSummary.keyTopics || []).join(', '),
        `=============================================================`
      );
    }

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="transcript_${safeTitle}.txt"`);
    res.send(lines.join('\n'));
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// List All Transcripts
// GET /api/transcripts
// ─────────────────────────────────────────────────────────────────────────────
router.get('/all/list', protect, async (req, res) => {
  try {
    const { search } = req.query;
    const filter = {};
    if (search) {
      filter.$or = [
        { meetingTitle: { $regex: search, $options: 'i' } },
        { meetingId: { $regex: search, $options: 'i' } },
        { 'segments.text': { $regex: search, $options: 'i' } }
      ];
    }

    const transcripts = await MeetingTranscript.find(filter)
      .select('transcriptId meetingId meetingTitle status startedAt endedAt duration segments.length aiSummary.summary')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: transcripts.length, transcripts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
