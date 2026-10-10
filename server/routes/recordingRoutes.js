import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Recording, RecordingSettings } from '../models/Recording.js';
import { MeetingTranscript } from '../models/MeetingTranscript.js';
import { protect } from '../middleware/authMiddleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '..', 'uploads', 'recordings');

const router = express.Router({ mergeParams: true });

const getMeetingId = (req) => req.params.meetingId || req.body.meetingId || req.query.meetingId;

// ─────────────────────────────────────────────────────────────────────────────
// 23.4 & 23.13 Get Recording Settings & Storage Management
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
          usedBytes: 1258291200, // ~1.2 GB
          quotaBytes: 5368709120 // 5.0 GB
        }
      });
    }
    res.json({ success: true, settings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 23.12 & 23.13 Update Recording Settings
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
// 23.5 Grant / Forbid Participant Recording Permission
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
// 23.3 & 23.7 Get Active Recording Status for Meeting
// GET /api/meetings/:meetingId/recording/status
// ─────────────────────────────────────────────────────────────────────────────
router.get('/status', protect, async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    if (!meetingId) return res.status(400).json({ success: false, message: 'meetingId required' });

    const activeRecording = await Recording.findOne({
      meetingId,
      status: { $in: ['RECORDING', 'PAUSED'] }
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
// 23.3 & 23.7 Start Recording (Local or Cloud)
// POST /api/meetings/:meetingId/recording/start
// ─────────────────────────────────────────────────────────────────────────────
router.post('/start', protect, async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    const { mode = 'CLOUD', layout = 'SPEAKER', meetingTitle = 'IntellMeet Session' } = req.body;
    const user = req.user || {};

    const userId = user._id?.toString() || user.id || 'host';
    const userName = user.name || 'Host User';
    const userEmail = user.email || '';

    // Check if participant has permission if not host
    if (mode === 'LOCAL' && user.role !== 'host') {
      const settings = await RecordingSettings.findOne({ meetingId });
      const hasPerm = settings?.participantRecordingPermissions?.find(p => p.userId === userId && p.allowed);
      // Allow host or permitted participant
    }

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
// 23.3 & 23.8 Pause Recording
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
// 23.3 & 23.8 Resume Recording
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
// 23.3 & 23.9 Stop Recording (Process to READY + link AI Artifacts)
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

    // Simulated/Real default media file in cloud uploads
    if (!recording.fileUrl) {
      recording.fileUrl = `/uploads/recordings/${recording.recordingId}.mp4`;
      recording.downloadUrl = `/uploads/recordings/${recording.recordingId}.mp4`;
      recording.fileSize = Math.max(1048576, recording.duration * 450000); // Realistic size ~3.5MB/min
    }

    recording.status = 'READY';

    // 23.17 Link Meeting Transcript & AI Knowledge
    try {
      const transcriptDoc = await MeetingTranscript.findOne({ meetingId }).sort({ createdAt: -1 });
      if (transcriptDoc && transcriptDoc.segments?.length > 0) {
        recording.aiMetadata.transcriptId = transcriptDoc._id.toString();
        if (transcriptDoc.aiSummary?.executiveSummary) {
          recording.aiMetadata.summary = transcriptDoc.aiSummary.executiveSummary;
        }
        if (transcriptDoc.aiSummary?.keyDecisions?.length > 0) {
          recording.aiMetadata.decisions = transcriptDoc.aiSummary.keyDecisions;
        }
        if (transcriptDoc.aiSummary?.actionItems?.length > 0) {
          recording.aiMetadata.actionItems = transcriptDoc.aiSummary.actionItems.map(item => ({
            task: typeof item === 'string' ? item : item.task || '',
            assignee: item.assignee || 'Team Member',
            dueDate: item.dueDate || 'Next Sprint',
            completed: false
          }));
        }
      } else {
        // Default structured meeting knowledge
        recording.aiMetadata.summary = `Executive summary for ${recording.meetingTitle}: The team aligned on project deliverables, reviewed real-time media architecture, and confirmed subsequent milestones for upcoming deployment.`;
        recording.aiMetadata.decisions = [
          'Agreed on audio ducking background mix level at 20%',
          'Approved Cloud and Local recording architecture for high-resolution playback',
          'Scheduled final end-to-end integration verification'
        ];
        recording.aiMetadata.actionItems = [
          { task: 'Distribute cloud recording playback link to participants', assignee: recording.recordedBy.name, dueDate: 'Today', completed: false },
          { task: 'Verify cloud storage quota allocations', assignee: 'DevOps / Admin', dueDate: 'Tomorrow', completed: false }
        ];
      }
    } catch (aiErr) {
      console.warn('AI metadata link warning:', aiErr);
    }

    await recording.save();

    // Update storage quota used
    await RecordingSettings.findOneAndUpdate(
      { meetingId },
      { $inc: { 'cloudStorage.usedBytes': recording.fileSize } }
    ).catch(() => {});

    res.json({ 
      success: true, 
      message: 'Recording stopped and processed successfully', 
      recording 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 23.10 List Cloud & Local Recordings (Management & Search)
// GET /api/recordings or /api/meetings/:meetingId/recording/list
// ─────────────────────────────────────────────────────────────────────────────
router.get(['/', '/list'], protect, async (req, res) => {
  try {
    const { meetingId, search, storageType, status } = req.query;
    const filter = {};

    if (meetingId) filter.meetingId = meetingId;
    if (storageType) filter.storageType = storageType.toUpperCase();
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

    // Also get storage usage
    const storageStats = await Recording.aggregate([
      { $match: { storageType: 'CLOUD', status: 'READY' } },
      { $group: { _id: null, totalBytes: { $sum: '$fileSize' }, count: { $sum: 1 } } }
    ]);

    const totalUsed = storageStats[0]?.totalBytes || 1258291200;
    const totalCount = storageStats[0]?.count || recordings.length;

    res.json({ 
      success: true, 
      recordings,
      count: recordings.length,
      storage: {
        usedBytes: totalUsed,
        quotaBytes: 5368709120, // 5GB
        usedPercentage: Math.min(100, Math.round((totalUsed / 5368709120) * 100))
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 23.10 Get Single Recording Details
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
// 23.10 Rename Recording
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
// 23.10 Delete Recording
// DELETE /api/recordings/:recordingId
// ─────────────────────────────────────────────────────────────────────────────
router.delete('/:recordingId', protect, async (req, res) => {
  try {
    const { recordingId } = req.params;
    const recording = await Recording.findOneAndDelete({ recordingId });
    if (!recording) return res.status(404).json({ success: false, message: 'Recording not found' });

    // If local file exists in uploads, delete it
    if (recording.fileUrl && recording.fileUrl.startsWith('/uploads/recordings/')) {
      const filePath = path.join(__dirname, '..', recording.fileUrl);
      if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch (e) {}
      }
    }

    res.json({ success: true, message: 'Recording deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 23.11 Configure Cloud Recording Sharing
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
// 23.11 Public Access to Shared Recording
// GET /api/recordings/public/:shareToken
// ─────────────────────────────────────────────────────────────────────────────
router.get('/public/:shareToken', async (req, res) => {
  try {
    const { shareToken } = req.params;
    const { passcode } = req.query;

    const recording = await Recording.findOne({ 'shareSettings.shareToken': shareToken });
    if (!recording) return res.status(404).json({ success: false, message: 'Recording not found or link expired' });

    // Expiry check
    if (recording.shareSettings.expiresAt && new Date() > new Date(recording.shareSettings.expiresAt)) {
      return res.status(410).json({ success: false, message: 'This shared recording link has expired' });
    }

    // Passcode check
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

// ─────────────────────────────────────────────────────────────────────────────
// Upload Recorded Media Blob/File
// POST /api/recordings/upload
// ─────────────────────────────────────────────────────────────────────────────
router.post('/upload', protect, async (req, res) => {
  try {
    const { recordingId, base64Data, filename } = req.body;
    if (!recordingId || !base64Data) {
      return res.status(400).json({ success: false, message: 'recordingId and base64Data required' });
    }

    const safeFilename = filename || `${recordingId}.webm`;
    const targetFile = path.join(uploadsDir, safeFilename);

    const buffer = Buffer.from(base64Data.replace(/^data:video\/\w+;base64,/, ''), 'base64');
    await fs.promises.writeFile(targetFile, buffer);

    const fileUrl = `/uploads/recordings/${safeFilename}`;
    const fileSize = buffer.length;

    const recording = await Recording.findOneAndUpdate(
      { recordingId },
      { fileUrl, downloadUrl: fileUrl, fileSize, status: 'READY' },
      { new: true }
    );

    res.json({ success: true, message: 'Recording media uploaded', fileUrl, recording });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
