import express from 'express';
import { AIRecordingPipeline } from '../models/AIRecordingPipeline.js';
import { Recording } from '../models/Recording.js';
import { MeetingTranscript } from '../models/MeetingTranscript.js';
import { MeetingSummary } from '../models/MeetingSummary.js';
import { SmartRecording } from '../models/SmartRecording.js';
import { runAIRecordingPipeline, searchUnifiedMeetingKnowledge } from '../services/aiRecordingPipelineService.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router({ mergeParams: true });
const getMeetingId = (req) => req.params.meetingId || req.body.meetingId || req.query.meetingId;

// ─────────────────────────────────────────────────────────────────────────────
// 29.14 & 29.15 Get Pipeline Status and Unified Meeting Knowledge
// GET /api/meetings/:meetingId/ai-pipeline  OR  GET /api/recordings/:recordingId/ai-pipeline
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', protect, async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    const recordingId = req.params.recordingId || req.query.recordingId;

    let pipeline = await AIRecordingPipeline.findOne({
      $or: [
        { meetingId: meetingId || null },
        { recordingId: recordingId || null }
      ].filter(Boolean)
    });

    // If pipeline does not exist yet, initialize it
    if (!pipeline) {
      const recordingDoc = await Recording.findOne({
        $or: [{ meetingId }, { recordingId }]
      });

      pipeline = await AIRecordingPipeline.create({
        meetingId: meetingId || recordingDoc?.meetingId || 'mtg_' + Date.now(),
        recordingId: recordingId || recordingDoc?.recordingId || 'rec_' + Date.now(),
        meetingTitle: recordingDoc?.meetingTitle || 'Meeting Recording',
        status: 'IDLE'
      });
    }

    // Also fetch associated entities to provide a unified payload
    const [recordingDoc, transcriptDoc, summaryDoc, smartRec] = await Promise.all([
      Recording.findOne({ $or: [{ meetingId: pipeline.meetingId }, { recordingId: pipeline.recordingId }] }),
      MeetingTranscript.findOne({ meetingId: pipeline.meetingId }).sort({ createdAt: -1 }),
      MeetingSummary.findOne({ meetingId: pipeline.meetingId }).sort({ createdAt: -1 }),
      SmartRecording.findOne({ $or: [{ recordingId: pipeline.recordingId }, { meetingId: pipeline.meetingId }] })
    ]);

    res.json({
      success: true,
      pipeline,
      knowledge: {
        recording: recordingDoc,
        transcript: transcriptDoc,
        summary: summaryDoc,
        smartRecording: smartRec
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 29.12 & 29.14 Trigger Asynchronous Pipeline Execution
// POST /api/meetings/:meetingId/ai-pipeline/run
// ─────────────────────────────────────────────────────────────────────────────
router.post('/run', protect, async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    const recordingId = req.body.recordingId || req.params.recordingId;
    const io = req.app.get('io') || null;

    // Run pipeline asynchronously (or await if client prefers immediate feedback)
    const pipeline = await runAIRecordingPipeline(meetingId, recordingId, io);

    res.json({
      success: true,
      message: 'AI Recording Pipeline processed successfully',
      pipeline
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 29.11 Unified Cross-Entity Search
// GET /api/meetings/:meetingId/ai-pipeline/search?q=...
// ─────────────────────────────────────────────────────────────────────────────
router.get('/search', protect, async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    const query = req.query.q || '';

    if (!meetingId) {
      return res.status(400).json({ success: false, message: 'meetingId is required' });
    }

    const searchResults = await searchUnifiedMeetingKnowledge(meetingId, query);

    res.json({
      success: true,
      ...searchResults
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 29.5 Manage Key Points with Timestamp Linking
// POST /api/meetings/:meetingId/ai-pipeline/key-points
// ─────────────────────────────────────────────────────────────────────────────
router.post('/key-points', protect, async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    const { text, timecode = '00:00', startTime = 0, endTime = 0, speaker = 'Speaker', category = 'GENERAL' } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Key point text is required' });
    }

    let pipeline = await AIRecordingPipeline.findOne({ meetingId });
    if (!pipeline) {
      pipeline = new AIRecordingPipeline({ meetingId, recordingId: 'rec_' + Date.now() });
    }

    const newPoint = {
      text: text.trim(),
      timecode,
      startTime: Number(startTime),
      endTime: Number(endTime),
      speaker,
      category
    };

    pipeline.keyPoints.push(newPoint);
    pipeline.stages.keyPoints.count = pipeline.keyPoints.length;
    await pipeline.save();

    const addedPoint = pipeline.keyPoints[pipeline.keyPoints.length - 1];

    res.json({
      success: true,
      message: 'Key point added with timestamp link',
      keyPoint: addedPoint,
      keyPoints: pipeline.keyPoints
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/meetings/:meetingId/ai-pipeline/key-points/:pointId
router.delete('/key-points/:pointId', protect, async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    const { pointId } = req.params;

    const pipeline = await AIRecordingPipeline.findOne({ meetingId });
    if (!pipeline) return res.status(404).json({ success: false, message: 'Pipeline not found' });

    pipeline.keyPoints = pipeline.keyPoints.filter(p => p.pointId !== pointId);
    pipeline.stages.keyPoints.count = pipeline.keyPoints.length;
    await pipeline.save();

    res.json({ success: true, message: 'Key point deleted', keyPoints: pipeline.keyPoints });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
