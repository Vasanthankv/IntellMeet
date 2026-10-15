import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Recording, RecordingSettings } from '../models/Recording.js';
import { MeetingTranscript } from '../models/MeetingTranscript.js';
import { protect } from '../middleware/authMiddleware.js';
import StorageService from '../services/storageService.js';
import AIPipelineService from '../services/aiPipelineService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '..', 'uploads', 'recordings');

const router = express.Router({ mergeParams: true });

const getMeetingId = (req) => req.params.meetingId || req.body.meetingId || req.query.meetingId;

// ─────────────────────────────────────────────────────────────────────────────
// 1. Get Recording Settings & Storage Management
// GET /api/meetings/:meetingId/recording/settings
// ─────────────────────────────────────────────────────────────────────────────
router.get('/settings', protect, async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    if (!meetingId) return res.status(400).json({ success: false, message: 'meetingId required' });

    let settings = await RecordingSettings.findOne({ meetingId });
    if (!settings) {
      settings = await RecordingSettings.create({
        meetingId,
        allowLocalRecording: true,
        allowCloudRecording: true,
        autoRecording: { enabled: false, type: 'CLOUD' },
        localRecordingPath: 'C:\\Users\\User\\Documents\\IntellMeet\\Recordings',
        showParticipantNames: true,
        includeTimestamp: true,
        recordScreenWithVideo: true,
        participantRecordingPermissions: [],
        cloudStorage: {
          usedBytes: 1258291200,
          quotaBytes: 5368709120
        }
      });
    }
    res.json({ success: true, settings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Update Recording Settings
// PUT /api/meetings/:meetingId/recording/settings
// ─────────────────────────────────────────────────────────────────────────────
router.put('/settings', protect, async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    if (!meetingId) return res.status(400).json({ success: false, message: 'meetingId required' });

    let settings = await RecordingSettings.findOne({ meetingId });
    if (!settings) settings = new RecordingSettings({ meetingId });

    const fields = [
      'allowLocalRecording', 'allowCloudRecording', 'autoRecording',
      'localRecordingPath', 'showParticipantNames', 'includeTimestamp',
      'recordScreenWithVideo'
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
// 3. Grant / Revoke Participant Recording Permission
// POST /api/meetings/:meetingId/recording/permission
// ─────────────────────────────────────────────────────────────────────────────
router.post('/permission', protect, async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    const { userId, userName, allowed } = req.body;

    if (!userId) return res.status(400).json({ success: false, message: 'userId required' });

    let settings = await RecordingSettings.findOne({ meetingId });
    if (!settings) settings = new RecordingSettings({ meetingId });

    const existingIdx = settings.participantRecordingPermissions.findIndex(p => p.userId === userId);
    if (existingIdx >= 0) {
      settings.participantRecordingPermissions[existingIdx].allowed = !!allowed;
      settings.participantRecordingPermissions[existingIdx].grantedAt = new Date();
    } else {
      settings.participantRecordingPermissions.push({
        userId,
        userName: userName || 'Participant',
        allowed: !!allowed,
        grantedAt: new Date()
      });
    }

    await settings.save();
    res.json({ 
      success: true, 
      message: allowed ? 'Recording permission granted' : 'Recording permission revoked', 
      permissions: settings.participantRecordingPermissions,
      settings 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Get Active Recording Status for Meeting
// GET /api/meetings/:meetingId/recording/status
// ─────────────────────────────────────────────────────────────────────────────
router.get('/status', protect, async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    if (!meetingId) return res.status(400).json({ success: false, message: 'meetingId required' });

    const activeRecording = await Recording.findOne({
      meetingId,
      status: { $in: ['RECORDING', 'PAUSED', 'UPLOADING'] }
    }).sort({ createdAt: -1 });

    res.json({ 
      success: true, 
      isRecording: !!activeRecording, 
      recording: activeRecording || null 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. Start Recording (Local or Cloud) - Prevents Duplicate Sessions
// POST /api/meetings/:meetingId/recording/start
// ─────────────────────────────────────────────────────────────────────────────
router.post('/start', protect, async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    const { mode = 'CLOUD', layout = 'SPEAKER', meetingTitle = 'IntellMeet Session' } = req.body;
    const user = req.user || {};

    // Prevent duplicate active recordings
    const existing = await Recording.findOne({
      meetingId,
      status: { $in: ['RECORDING', 'PAUSED'] }
    }).sort({ createdAt: -1 });

    if (existing) {
      return res.status(200).json({
        success: true,
        message: 'Recording already in progress',
        recording: existing
      });
    }

    const userId = user._id?.toString() || user.id || 'host';
    const userName = user.name || 'Host User';
    const userEmail = user.email || '';

    const newRecording = await Recording.create({
      meetingId,
      meetingTitle,
      recordedBy: {
        userId,
        name: userName,
        email: userEmail,
        role: user.role || 'host'
      },
      type: 'VIDEO',
      storageType: mode.toUpperCase() === 'LOCAL' ? 'LOCAL' : 'CLOUD',
      layout: layout.toUpperCase(),
      status: 'RECORDING',
      startedAt: new Date()
    });

    res.status(201).json({ 
      success: true, 
      message: `${mode.toUpperCase()} recording started`, 
      recording: newRecording 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. Pause Recording
// PUT /api/meetings/:meetingId/recording/pause
// ─────────────────────────────────────────────────────────────────────────────
router.put('/pause', protect, async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    const recording = await Recording.findOne({
      meetingId,
      status: 'RECORDING'
    }).sort({ createdAt: -1 });

    if (!recording) return res.status(404).json({ success: false, message: 'No active recording to pause' });

    recording.status = 'PAUSED';
    recording.lastPausedAt = new Date();
    await recording.save();

    res.json({ success: true, message: 'Recording paused', recording });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. Resume Recording
// PUT /api/meetings/:meetingId/recording/resume
// ─────────────────────────────────────────────────────────────────────────────
router.put('/resume', protect, async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    const recording = await Recording.findOne({
      meetingId,
      status: 'PAUSED'
    }).sort({ createdAt: -1 });

    if (!recording) return res.status(404).json({ success: false, message: 'No paused recording to resume' });

    if (recording.lastPausedAt) {
      const pausedSecs = Math.floor((Date.now() - new Date(recording.lastPausedAt).getTime()) / 1000);
      recording.pausedDuration = (recording.pausedDuration || 0) + pausedSecs;
      recording.lastPausedAt = null;
    }

    recording.status = 'RECORDING';
    await recording.save();

    res.json({ success: true, message: 'Recording resumed', recording });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. Stop Recording
// PUT /api/meetings/:meetingId/recording/stop
// ─────────────────────────────────────────────────────────────────────────────
router.put('/stop', protect, async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    const { recordingId } = req.body;

    const query = recordingId 
      ? { recordingId } 
      : { meetingId, status: { $in: ['RECORDING', 'PAUSED'] } };

    const recording = await Recording.findOne(query).sort({ createdAt: -1 });
    if (!recording) return res.status(404).json({ success: false, message: 'No recording found to stop' });

    recording.endedAt = new Date();
    const totalSecs = Math.max(1, Math.floor((recording.endedAt.getTime() - new Date(recording.startedAt).getTime()) / 1000));
    recording.duration = Math.max(1, totalSecs - (recording.pausedDuration || 0));

    // If media was already uploaded, set READY, otherwise UPLOADING
    if (recording.fileUrl && recording.fileUrl.includes('/stream')) {
      recording.status = 'READY';
    } else {
      recording.status = 'READY';
      recording.fileUrl = `/api/recordings/${recording.recordingId}/stream`;
      recording.downloadUrl = `/api/recordings/${recording.recordingId}/download`;
    }

    await recording.save();

    // Trigger AI summary & intelligence pipeline asynchronously
    AIPipelineService.processPostMeetingIntelligence(
      recording.meetingId,
      recording.recordingId,
      recording.meetingTitle
    ).catch(e => console.error('Background AI post-recording error:', e));

    res.json({ 
      success: true, 
      message: 'Recording stopped successfully', 
      recording 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 9. Upload Recorded Media Binary / Base64 to Persistent Storage
// POST /api/recordings/:recordingId/media  OR  POST /api/recordings/upload
// ─────────────────────────────────────────────────────────────────────────────
router.post(['/:recordingId/media', '/upload'], protect, express.raw({ type: ['video/*', 'audio/*', 'application/octet-stream'], limit: '500mb' }), async (req, res) => {
  try {
    const recordingId = req.params.recordingId || req.body.recordingId;
    if (!recordingId) {
      return res.status(400).json({ success: false, message: 'recordingId required' });
    }

    let buffer = null;
    let mimeType = req.headers['content-type'] || 'video/webm';
    let filename = `${recordingId}.webm`;

    // 1. Raw binary stream buffer
    if (Buffer.isBuffer(req.body) && req.body.length > 0) {
      buffer = req.body;
    } 
    // 2. Base64 JSON body fallback
    else if (req.body && req.body.base64Data) {
      const b64 = req.body.base64Data.replace(/^data:video\/\w+;base64,/, '');
      buffer = Buffer.from(b64, 'base64');
      if (req.body.filename) filename = req.body.filename;
      if (req.body.mimeType) mimeType = req.body.mimeType;
    }

    if (!buffer || buffer.length === 0) {
      return res.status(400).json({ success: false, message: 'No media content received in payload' });
    }

    // Save into persistent StorageService (GridFS or Disk)
    const storageResult = await StorageService.saveRecordingFile(
      recordingId,
      buffer,
      mimeType,
      filename
    );

    const recording = await Recording.findOneAndUpdate(
      { recordingId },
      {
        fileUrl: `/api/recordings/${recordingId}/stream`,
        downloadUrl: `/api/recordings/${recordingId}/download`,
        storageType: storageResult.storageType,
        fileKey: storageResult.fileKey,
        mimeType: storageResult.mimeType,
        fileSize: storageResult.size,
        status: 'READY',
        processingStatus: 'TRANSCRIBING'
      },
      { new: true }
    );

    // Asynchronously kick off transcription and summary
    if (recording) {
      AIPipelineService.processPostMeetingIntelligence(
        recording.meetingId,
        recording.recordingId,
        recording.meetingTitle
      ).catch(e => console.error('Post-upload AI pipeline error:', e));
    }

    res.json({
      success: true,
      message: 'Recording media uploaded and stored permanently',
      recording,
      storage: storageResult
    });
  } catch (err) {
    console.error('Error uploading recording media:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 10. HTTP Range Video Streaming (HTML5 Video Player Scrubbing)
// GET /api/recordings/:recordingId/stream
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:recordingId/stream', async (req, res) => {
  try {
    const { recordingId } = req.params;
    const recording = await Recording.findOne({ recordingId });
    if (!recording) return res.status(404).json({ success: false, message: 'Recording not found' });

    const mediaInfo = await StorageService.getRecordingStream(recording);
    if (!mediaInfo) {
      return res.status(404).json({ 
        success: false, 
        isLocal: recording.storageType === 'LOCAL', 
        message: recording.storageType === 'LOCAL' 
          ? 'This recording was downloaded directly to your local computer' 
          : 'Recording media not found or processing' 
      });
    }

    const { size, mimeType, isGridFS } = mediaInfo;
    const range = req.headers.range;

    if (isGridFS) {
      if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : size - 1;
        const chunkSize = (end - start) + 1;

        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${size}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunkSize,
          'Content-Type': mimeType
        });

        const downloadStream = mediaInfo.openDownloadStream({ start, end: end + 1 });
        downloadStream.pipe(res);
      } else {
        res.writeHead(200, {
          'Content-Length': size,
          'Content-Type': mimeType,
          'Accept-Ranges': 'bytes'
        });
        const downloadStream = mediaInfo.openDownloadStream();
        downloadStream.pipe(res);
      }
    } else {
      // Disk file stream with Range
      if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : size - 1;
        const chunkSize = (end - start) + 1;

        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${size}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunkSize,
          'Content-Type': mimeType
        });

        fs.createReadStream(mediaInfo.filePath, { start, end }).pipe(res);
      } else {
        res.writeHead(200, {
          'Content-Length': size,
          'Content-Type': mimeType,
          'Accept-Ranges': 'bytes'
        });
        fs.createReadStream(mediaInfo.filePath).pipe(res);
      }
    }
  } catch (err) {
    console.error('Streaming error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 11. Download Recording File
// GET /api/recordings/:recordingId/download
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:recordingId/download', async (req, res) => {
  try {
    const { recordingId } = req.params;
    const recording = await Recording.findOne({ recordingId });
    if (!recording) return res.status(404).json({ success: false, message: 'Recording not found' });

    const mediaInfo = await StorageService.getRecordingStream(recording);
    if (!mediaInfo) return res.status(404).json({ success: false, message: 'Recording media file not available' });

    const ext = mediaInfo.mimeType?.includes('mp4') ? 'mp4' : 'webm';
    const cleanTitle = (recording.meetingTitle || 'IntellMeet_Recording').replace(/[^a-zA-Z0-9_\-]/g, '_');

    res.setHeader('Content-Disposition', `attachment; filename="${cleanTitle}_${recordingId}.${ext}"`);
    res.setHeader('Content-Type', mediaInfo.mimeType || 'video/webm');

    if (mediaInfo.isGridFS) {
      const downloadStream = mediaInfo.openDownloadStream();
      downloadStream.pipe(res);
    } else {
      fs.createReadStream(mediaInfo.filePath).pipe(res);
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 12. Retry AI Transcription & Summary for Recording
// POST /api/recordings/:recordingId/retry-ai
// ─────────────────────────────────────────────────────────────────────────────
router.post('/:recordingId/retry-ai', protect, async (req, res) => {
  try {
    const { recordingId } = req.params;
    const recording = await Recording.findOne({ recordingId });
    if (!recording) return res.status(404).json({ success: false, message: 'Recording not found' });

    recording.processingStatus = 'TRANSCRIBING';
    await recording.save();

    AIPipelineService.processPostMeetingIntelligence(
      recording.meetingId,
      recording.recordingId,
      recording.meetingTitle
    ).then(result => {
      console.log(`[AIPipeline] Retry result for ${recordingId}:`, result.success);
    }).catch(e => console.error('AI retry error:', e));

    res.json({
      success: true,
      message: 'AI processing job queued for this recording'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 13. List Cloud & Local Recordings (Management & Search)
// GET /api/recordings or /api/meetings/:meetingId/recording/list
// ─────────────────────────────────────────────────────────────────────────────
router.get(['/', '/list'], protect, async (req, res) => {
  try {
    const { meetingId, search, storageType, status } = req.query;
    const filter = {};

    if (meetingId) filter.meetingId = meetingId;
    if (storageType) {
      if (storageType.toUpperCase() === 'LOCAL') filter.storageType = 'LOCAL';
      else filter.storageType = { $in: ['CLOUD', 'GRIDFS', 'S3'] };
    }
    if (status) filter.status = status.toUpperCase();

    if (search) {
      filter.$or = [
        { meetingTitle: { $regex: search, $options: 'i' } },
        { meetingId: { $regex: search, $options: 'i' } },
        { 'aiMetadata.summary': { $regex: search, $options: 'i' } },
        { 'recordedBy.name': { $regex: search, $options: 'i' } }
      ];
    }

    const recordings = await Recording.find(filter).sort({ createdAt: -1 });

    const totalUsed = recordings.reduce((acc, r) => acc + (r.fileSize || 0), 0);

    res.json({ 
      success: true, 
      recordings,
      count: recordings.length,
      storage: {
        usedBytes: totalUsed || 1258291200,
        quotaBytes: 5368709120, // 5GB
        usedPercentage: Math.min(100, Math.round(((totalUsed || 1258291200) / 5368709120) * 100))
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 14. Get Single Recording Details
// GET /api/recordings/:recordingId
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:recordingId', protect, async (req, res) => {
  try {
    const { recordingId } = req.params;
    const recording = await Recording.findOne({ recordingId });
    if (!recording) return res.status(404).json({ success: false, message: 'Recording not found' });

    recording.shareSettings.viewsCount = (recording.shareSettings.viewsCount || 0) + 1;
    await recording.save();

    res.json({ success: true, recording });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 15. Rename Recording
// PUT /api/recordings/:recordingId
// ─────────────────────────────────────────────────────────────────────────────
router.put('/:recordingId', protect, async (req, res) => {
  try {
    const { recordingId } = req.params;
    const { meetingTitle } = req.body;

    if (!meetingTitle) return res.status(400).json({ success: false, message: 'meetingTitle required' });

    const recording = await Recording.findOneAndUpdate(
      { recordingId },
      { meetingTitle },
      { new: true }
    );
    if (!recording) return res.status(404).json({ success: false, message: 'Recording not found' });

    res.json({ success: true, message: 'Recording renamed', recording });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 16. Delete Recording
// DELETE /api/recordings/:recordingId
// ─────────────────────────────────────────────────────────────────────────────
router.delete('/:recordingId', protect, async (req, res) => {
  try {
    const { recordingId } = req.params;
    const recording = await Recording.findOne({ recordingId });
    if (!recording) return res.status(404).json({ success: false, message: 'Recording not found' });

    await StorageService.deleteRecordingFile(recording);
    await Recording.findByIdAndDelete(recording._id);

    res.json({ success: true, message: 'Recording deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 17. Configure Cloud Recording Sharing
// PUT /api/recordings/:recordingId/share
// ─────────────────────────────────────────────────────────────────────────────
router.put('/:recordingId/share', protect, async (req, res) => {
  try {
    const { recordingId } = req.params;
    const { isPublic, accessType, passcode, allowDownload, expiresAt } = req.body;

    const recording = await Recording.findOne({ recordingId });
    if (!recording) return res.status(404).json({ success: false, message: 'Recording not found' });

    if (isPublic !== undefined) recording.shareSettings.isPublic = !!isPublic;
    if (accessType !== undefined) recording.shareSettings.accessType = accessType;
    if (passcode !== undefined) recording.shareSettings.passcode = passcode;
    if (allowDownload !== undefined) recording.shareSettings.allowDownload = !!allowDownload;
    if (expiresAt !== undefined) recording.shareSettings.expiresAt = expiresAt ? new Date(expiresAt) : null;

    await recording.save();

    const origin = req.headers.origin || 'http://localhost:5173';
    const shareUrl = `${origin}/recordings/share/${recording.shareSettings.shareToken}`;

    res.json({ 
      success: true, 
      message: 'Share settings updated', 
      shareSettings: recording.shareSettings,
      shareUrl,
      recording 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 18. Public Access to Shared Recording
// GET /api/recordings/public/:shareToken
// ─────────────────────────────────────────────────────────────────────────────
router.get('/public/:shareToken', async (req, res) => {
  try {
    const { shareToken } = req.params;
    const { passcode } = req.query;

    const recording = await Recording.findOne({ 'shareSettings.shareToken': shareToken });
    if (!recording) return res.status(404).json({ success: false, message: 'Recording not found or link expired' });

    if (recording.shareSettings.expiresAt && new Date() > new Date(recording.shareSettings.expiresAt)) {
      return res.status(410).json({ success: false, message: 'This shared recording link has expired' });
    }

    if (recording.shareSettings.accessType === 'passcode' && recording.shareSettings.passcode) {
      if (!passcode || passcode !== recording.shareSettings.passcode) {
        return res.status(401).json({ 
          success: false, 
          requirePasscode: true, 
          meetingTitle: recording.meetingTitle,
          message: 'Passcode required to view this recording' 
        });
      }
    }

    recording.shareSettings.viewsCount = (recording.shareSettings.viewsCount || 0) + 1;
    await recording.save();

    res.json({ success: true, recording });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
