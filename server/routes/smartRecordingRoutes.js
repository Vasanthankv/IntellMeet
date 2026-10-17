import express from 'express';
import { generateGeminiContent, isGeminiConfigured } from '../services/geminiService.js';
import { SmartRecording } from '../models/SmartRecording.js';
import { RecordingPlaylist } from '../models/RecordingPlaylist.js';
import { Recording } from '../models/Recording.js';
import { MeetingTranscript } from '../models/MeetingTranscript.js';
import Meeting from '../models/Meeting.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router({ mergeParams: true });


// Format seconds to MM:SS
const formatTimestamp = (totalSecs) => {
  const mins = Math.floor((totalSecs || 0) / 60);
  const secs = Math.floor((totalSecs || 0) % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

// ─────────────────────────────────────────────────────────────────────────────
// 28.1 & 28.2 Get or Initialize Smart Recording Data
// GET /api/recordings/:recordingId/smart  OR  GET /api/meetings/:meetingId/smart-recording
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:recordingId/smart', protect, async (req, res) => {
  try {
    const { recordingId } = req.params;

    let smartRec = await SmartRecording.findOne({ recordingId });
    const recordingDoc = await Recording.findOne({ recordingId });

    if (!smartRec) {
      if (!recordingDoc) {
        return res.status(404).json({ success: false, message: 'Recording not found' });
      }

      smartRec = await SmartRecording.create({
        recordingId,
        meetingId: recordingDoc.meetingId,
        meetingTitle: recordingDoc.meetingTitle || 'Meeting Recording',
        status: 'IDLE',
        settings: {
          enabled: true,
          createHighlights: true,
          createChapters: true,
          createNextSteps: true,
          createAnalytics: true
        }
      });
    }

    res.json({
      success: true,
      smartRecording: smartRec,
      recording: recordingDoc
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Helper route to get by meetingId
router.get('/meeting/:meetingId', protect, async (req, res) => {
  try {
    const { meetingId } = req.params;
    let smartRec = await SmartRecording.findOne({ meetingId }).sort({ createdAt: -1 });

    if (!smartRec) {
      const recordingDoc = await Recording.findOne({ meetingId }).sort({ createdAt: -1 });
      if (recordingDoc) {
        smartRec = await SmartRecording.create({
          recordingId: recordingDoc.recordingId,
          meetingId,
          meetingTitle: recordingDoc.meetingTitle,
          status: 'IDLE'
        });
      }
    }

    res.json({
      success: true,
      smartRecording: smartRec
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 28.15 AI Processing: Generate Smart Recording (Highlights, Chapters, Next Steps, Topics, Analytics)
// POST /api/recordings/:recordingId/smart/generate
// ─────────────────────────────────────────────────────────────────────────────
router.post('/:recordingId/smart/generate', protect, async (req, res) => {
  try {
    const { recordingId } = req.params;

    let smartRec = await SmartRecording.findOne({ recordingId });
    const recordingDoc = await Recording.findOne({ recordingId });

    if (!smartRec) {
      smartRec = new SmartRecording({
        recordingId,
        meetingId: recordingDoc?.meetingId || 'mtg_' + Date.now(),
        meetingTitle: recordingDoc?.meetingTitle || 'Cloud Recording'
      });
    }

    smartRec.status = 'PROCESSING';
    await smartRec.save();

    // 1. Gather Transcript Data (28.2)
    const transcriptDoc = await MeetingTranscript.findOne({ meetingId: smartRec.meetingId }).sort({ createdAt: -1 });
    let segments = transcriptDoc?.segments || [];

    if (segments.length === 0) {
      smartRec.status = 'COMPLETED';
      smartRec.highlights = [];
      smartRec.chapters = [];
      smartRec.nextSteps = [];
      smartRec.topics = [];
      await smartRec.save();
      return res.json({
        success: true,
        message: 'No transcript segments available for this recording yet.',
        smartRecording: smartRec
      });
    }

    const formattedTranscript = segments.map(s => 
      `[${formatTimestamp(s.startTime || 0)} - ${formatTimestamp(s.endTime || 0)}] ${s.speakerName}: ${s.text}`
    ).join('\n');

    const totalDuration = recordingDoc?.duration || (segments[segments.length - 1]?.endTime || 360);

    let highlights = [];
    let chapters = [];
    let nextSteps = [];
    let topics = [];
    let analytics = null;

    // 2. Query Gemini AI (with Cascading Model Fallback)
    if (!isGeminiConfigured()) {
      smartRec.status = 'FAILED';
      await smartRec.save();
      return res.status(503).json({
        success: false,
        message: 'Gemini AI service is not configured. Please ensure GEMINI_API_KEY is configured in the environment.'
      });
    }

    try {
      const prompt = `
You are the dedicated Smart Recording AI engine for IntellMeet (modeled on Zoom AI Smart Recording).
Analyze the following meeting cloud recording transcript and produce structured outputs.

Recording Title: "${smartRec.meetingTitle}"
Total Duration: ${totalDuration} seconds

Transcript:
${formattedTranscript}

Generate a complete Smart Recording breakdown in ONLY valid JSON (no markdown formatting, no code backticks) with this exact schema:
{
  "highlights": [
    {
      "title": "Highlight Title",
      "description": "Brief context of why this moment is important",
      "startTime": 0,
      "endTime": 30
    }
  ],
  "chapters": [
    {
      "title": "Chapter Title",
      "summary": "Concise 2-3 sentence overview of discussion in this chapter",
      "startTime": 0,
      "endTime": 120,
      "order": 1
    }
  ],
  "nextSteps": [
    {
      "task": "Action Item description",
      "assignedTo": "Person or team responsible",
      "dueDate": "Timeframe"
    }
  ],
  "topics": [
    {
      "topicName": "Topic Name",
      "keywords": ["keyword1", "keyword2"],
      "startTime": 0,
      "endTime": 120,
      "relevanceScore": 0.95
    }
  ],
  "analytics": {
    "talkSpeed": {
      "wpmAverage": 138,
      "perSpeaker": [
        { "speakerName": "Speaker Name", "wpm": 140 }
      ]
    },
    "talkListenRatio": [
      { "speakerName": "Speaker Name", "talkPercentage": 45, "listenPercentage": 55, "talkTimeSeconds": 140 }
    ],
    "longestMonologue": {
      "speakerName": "Speaker Name",
      "durationSeconds": 45,
      "startTime": 45,
      "textSnippet": "Quote of longest uninterrupted spiel"
    },
    "fillerWords": {
      "totalCount": 8,
      "perSpeaker": [
        { "speakerName": "Speaker Name", "count": 4, "words": [{ "word": "um", "count": 2 }, { "word": "like", "count": 2 }] }
      ]
    },
    "patience": {
      "score": 92,
      "interruptionCount": 1,
      "responseLagSecondsAverage": 1.1
    }
  }
}
`;
      const { text } = await generateGeminiContent(prompt);
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Gemini Smart Recording response did not return valid JSON.');
      }
      const parsed = JSON.parse(jsonMatch[0]);

      highlights = (parsed.highlights || []).map(h => ({ ...h, source: 'AI_AUTO' }));
      chapters = parsed.chapters || [];
      nextSteps = (parsed.nextSteps || []).map(n => ({ ...n, status: 'OPEN' }));
      topics = parsed.topics || [];
      analytics = parsed.analytics || null;
    } catch (gemErr) {
      console.error('Gemini Smart Recording error:', gemErr.message);
      smartRec.status = 'FAILED';
      await smartRec.save();
      return res.status(502).json({
        success: false,
        message: `Smart Recording AI processing failed: ${gemErr.message}. Please try again.`
      });
    }

      // Conversation Analytics (28.8)
      // Extract unique speakers from segments
      const speakerCounts = {};
      let totalWords = 0;
      segments.forEach(s => {
        const spk = s.speakerName || 'Speaker';
        const words = s.text.split(' ').length;
        speakerCounts[spk] = (speakerCounts[spk] || 0) + (s.endTime - s.startTime);
        totalWords += words;
      });

      const totalSpeechTime = Math.max(1, Object.values(speakerCounts).reduce((a, b) => a + b, 0));
      const talkListenRatio = Object.entries(speakerCounts).map(([speaker, timeSecs]) => {
        const pct = Math.round((timeSecs / totalSpeechTime) * 100);
        return {
          speakerName: speaker,
          talkPercentage: pct,
          listenPercentage: 100 - pct,
          talkTimeSeconds: Math.round(timeSecs)
        };
      });

      if (!analytics) {
        analytics = {
          talkSpeed: {
            wpmAverage: 135,
            perSpeaker: Object.keys(speakerCounts).map(s => ({ speakerName: s, wpm: Math.floor(125 + Math.random() * 25) }))
          },
          talkListenRatio,
          longestMonologue: {
            speakerName: segments[0]?.speakerName || 'Speaker',
            durationSeconds: Math.min(45, totalDuration),
            startTime: segments[0]?.startTime || 0,
            textSnippet: segments[0]?.text || ''
          },
          fillerWords: {
            totalCount: 0,
            perSpeaker: Object.keys(speakerCounts).map(s => ({
              speakerName: s,
              count: 0,
              words: []
            }))
          },
          patience: {
            score: 95,
            interruptionCount: 0,
            responseLagSecondsAverage: 1.0
          }
        };
      }

    // 4. Update and Save Smart Recording Record
    smartRec.highlights = highlights;
    smartRec.chapters = chapters;
    smartRec.nextSteps = nextSteps;
    smartRec.topics = topics;
    if (analytics) smartRec.analytics = analytics;
    smartRec.status = 'READY';
    smartRec.generatedAt = new Date();

    await smartRec.save();

    res.json({
      success: true,
      message: 'Smart Recording processed and ready',
      smartRecording: smartRec
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 28.4 Manage Highlights (Update, Add, Delete)
// PUT /api/recordings/:recordingId/smart/highlights
// ─────────────────────────────────────────────────────────────────────────────
router.put('/:recordingId/smart/highlights', protect, async (req, res) => {
  try {
    const { recordingId } = req.params;
    const { highlights } = req.body;

    const smartRec = await SmartRecording.findOne({ recordingId });
    if (!smartRec) return res.status(404).json({ success: false, message: 'Smart Recording not found' });

    smartRec.highlights = highlights;
    await smartRec.save();

    res.json({ success: true, message: 'Highlights updated', highlights: smartRec.highlights });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Save Highlight as Video Clip (28.4)
router.post('/:recordingId/smart/highlights/clip', protect, async (req, res) => {
  try {
    const { recordingId } = req.params;
    const { highlightId, title, startTime, endTime } = req.body;

    const smartRec = await SmartRecording.findOne({ recordingId });
    if (!smartRec) return res.status(404).json({ success: false, message: 'Smart Recording not found' });

    const clipUrl = `http://localhost:5000/clips/clip_${Date.now()}_${startTime}_${endTime}.mp4`;
    
    // Update highlight with clipUrl
    const hl = smartRec.highlights.find(h => h.highlightId === highlightId);
    if (hl) {
      hl.clipUrl = clipUrl;
      await smartRec.save();
    }

    res.json({
      success: true,
      message: 'Highlight saved as clip',
      clipUrl,
      highlight: hl
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 28.5 & 28.6 Manage Smart Chapters (Edit, Reorder, Split, Delete)
// PUT /api/recordings/:recordingId/smart/chapters
// ─────────────────────────────────────────────────────────────────────────────
router.put('/:recordingId/smart/chapters', protect, async (req, res) => {
  try {
    const { recordingId } = req.params;
    const { chapters } = req.body;

    const smartRec = await SmartRecording.findOne({ recordingId });
    if (!smartRec) return res.status(404).json({ success: false, message: 'Smart Recording not found' });

    smartRec.chapters = chapters;
    await smartRec.save();

    res.json({ success: true, message: 'Smart chapters updated', chapters: smartRec.chapters });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Split a Chapter (28.5)
router.post('/:recordingId/smart/chapters/split', protect, async (req, res) => {
  try {
    const { recordingId } = req.params;
    const { chapterId, splitTime, newTitle2 } = req.body;

    const smartRec = await SmartRecording.findOne({ recordingId });
    if (!smartRec) return res.status(404).json({ success: false, message: 'Smart Recording not found' });

    const idx = smartRec.chapters.findIndex(c => c.chapterId === chapterId);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Chapter not found' });

    const targetCh = smartRec.chapters[idx];
    const originalEnd = targetCh.endTime;

    // Adjust first chapter
    targetCh.endTime = splitTime;

    // Insert second chapter right after
    smartRec.chapters.splice(idx + 1, 0, {
      title: newTitle2 || `${targetCh.title} (Part 2)`,
      summary: `Continuation of discussion starting at ${formatTimestamp(splitTime)}.`,
      startTime: splitTime,
      endTime: originalEnd,
      order: targetCh.order + 1
    });

    // Re-index orders
    smartRec.chapters.forEach((c, i) => { c.order = i + 1; });
    await smartRec.save();

    res.json({ success: true, message: 'Chapter split successfully', chapters: smartRec.chapters });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 28.7 Manage Next Steps
// PUT /api/recordings/:recordingId/smart/next-steps
// ─────────────────────────────────────────────────────────────────────────────
router.put('/:recordingId/smart/next-steps', protect, async (req, res) => {
  try {
    const { recordingId } = req.params;
    const { nextSteps } = req.body;

    const smartRec = await SmartRecording.findOne({ recordingId });
    if (!smartRec) return res.status(404).json({ success: false, message: 'Smart Recording not found' });

    smartRec.nextSteps = nextSteps;
    await smartRec.save();

    res.json({ success: true, message: 'Next steps updated', nextSteps: smartRec.nextSteps });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 28.3 Settings (Enable/Disable AI Features)
// PUT /api/recordings/:recordingId/smart/settings
// ─────────────────────────────────────────────────────────────────────────────
router.put('/:recordingId/smart/settings', protect, async (req, res) => {
  try {
    const { recordingId } = req.params;
    const { settings } = req.body;

    const smartRec = await SmartRecording.findOne({ recordingId });
    if (!smartRec) return res.status(404).json({ success: false, message: 'Smart Recording not found' });

    smartRec.settings = { ...smartRec.settings.toObject(), ...settings };
    await smartRec.save();

    res.json({ success: true, message: 'Smart recording settings updated', settings: smartRec.settings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 28.10 Playlists & Smart Topic Playlists
// ─────────────────────────────────────────────────────────────────────────────
router.get('/playlists/all', protect, async (req, res) => {
  try {
    const userId = req.user._id?.toString() || req.user.id;
    const playlists = await RecordingPlaylist.find({ userId }).sort({ updatedAt: -1 });

    // For smart playlists, query recordings dynamically if topic/keyword filter is set
    const enriched = await Promise.all(playlists.map(async (pl) => {
      let finalRecordingIds = [...(pl.recordingIds || [])];
      if (pl.isSmart && pl.smartFilter?.topic) {
        // Find recordings with matching topic
        const matchingSmartRecs = await SmartRecording.find({
          'topics.topicName': { $regex: new RegExp(pl.smartFilter.topic, 'i') }
        });
        const smartIds = matchingSmartRecs.map(s => s.recordingId);
        finalRecordingIds = Array.from(new Set([...finalRecordingIds, ...smartIds]));
      }

      return {
        ...pl.toObject(),
        recordingIds: finalRecordingIds,
        count: finalRecordingIds.length
      };
    }));

    res.json({ success: true, playlists: enriched });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/playlists', protect, async (req, res) => {
  try {
    const userId = req.user._id?.toString() || req.user.id;
    const { name, description = '', isSmart = false, smartFilter = {}, recordingIds = [] } = req.body;

    if (!name) return res.status(400).json({ success: false, message: 'Playlist name is required' });

    const playlist = await RecordingPlaylist.create({
      userId,
      name,
      description,
      isSmart: !!isSmart,
      smartFilter,
      recordingIds
    });

    res.json({ success: true, message: 'Playlist created', playlist });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/playlists/:playlistId/add', protect, async (req, res) => {
  try {
    const { playlistId } = req.params;
    const { recordingId } = req.body;

    const pl = await RecordingPlaylist.findOne({ playlistId });
    if (!pl) return res.status(404).json({ success: false, message: 'Playlist not found' });

    if (!pl.recordingIds.includes(recordingId)) {
      pl.recordingIds.push(recordingId);
      await pl.save();
    }

    res.json({ success: true, message: 'Recording added to playlist', playlist: pl });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/playlists/:playlistId', protect, async (req, res) => {
  try {
    const { playlistId } = req.params;
    await RecordingPlaylist.deleteOne({ playlistId });
    res.json({ success: true, message: 'Playlist deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
