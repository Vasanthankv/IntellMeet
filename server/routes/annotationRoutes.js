import express from 'express';
import Meeting from '../models/Meeting.js';
import Annotation from '../models/Annotation.js';

const router = express.Router();

// GET /api/meetings/:meetingId/annotations - Fetch all active annotations
router.get('/:meetingId/annotations', async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { shareSessionId } = req.query;

    const query = {
      meetingId,
      isDeleted: false,
    };
    if (shareSessionId) {
      query.shareSessionId = shareSessionId;
    }

    const annotations = await Annotation.find(query).sort({ createdAt: 1 });

    const meeting = await Meeting.findOne({
      $or: [{ meetingId }, { _id: meetingId.match(/^[0-9a-fA-F]{24}$/) ? meetingId : null }]
    });

    const settings = meeting?.annotationSettings || {
      enableAnnotation: true,
      annotationPermission: 'all',
      showAnnotatorNames: true,
      allowSaveAnnotation: true,
    };

    res.json({
      success: true,
      annotations,
      settings,
    });
  } catch (error) {
    console.error('Error fetching annotations:', error);
    res.status(500).json({ success: false, message: 'Server error fetching annotations' });
  }
});

// POST /api/meetings/:meetingId/annotations - Create or batch create annotations
router.post('/:meetingId/annotations', async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { 
      annotationId, 
      shareSessionId = 'current', 
      userId, 
      userName = 'Participant', 
      userRole = 'participant',
      type = 'DRAW', 
      points, 
      position, 
      dimensions, 
      text, 
      stampType, 
      color = '#EF4444', 
      lineWidth = 3, 
      fontSize = 16, 
      isVanishing = false 
    } = req.body;

    if (!annotationId || !userId) {
      return res.status(400).json({ success: false, message: 'annotationId and userId are required' });
    }

    const annotation = new Annotation({
      annotationId,
      meetingId,
      shareSessionId,
      userId,
      userName,
      userRole,
      type,
      points,
      position,
      dimensions,
      text,
      stampType,
      color,
      lineWidth,
      fontSize,
      isVanishing,
    });

    await annotation.save();

    res.json({
      success: true,
      message: 'Annotation saved',
      annotation,
    });
  } catch (error) {
    console.error('Error saving annotation:', error);
    res.status(500).json({ success: false, message: 'Server error saving annotation' });
  }
});

// DELETE /api/meetings/:meetingId/annotations/clear - Clear annotations (all, mine, or viewers')
const handleClearAnnotations = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const clearType = req.body?.clearType || req.query.clearType || 'all';
    const userId = req.body?.userId || req.query.userId;
    const isHostOrPresenter = req.body?.isHostOrPresenter !== undefined 
      ? req.body.isHostOrPresenter 
      : (req.query.isHostOrPresenter === 'true' || true);

    let query = { meetingId, isDeleted: false };

    if (clearType === 'mine') {
      if (!userId) {
        return res.status(400).json({ success: false, message: 'userId required for clearType mine' });
      }
      query.userId = userId;
    } else if (clearType === 'viewers') {
      if (!isHostOrPresenter) {
        return res.status(403).json({ success: false, message: 'Only host or presenter can clear viewers drawings' });
      }
      query.userRole = { $in: ['participant', 'viewer'] };
    } else if (clearType === 'all') {
      if (!isHostOrPresenter) {
        return res.status(403).json({ success: false, message: 'Only host or presenter can clear all drawings' });
      }
      // clears all in meeting
    }

    await Annotation.updateMany(query, { $set: { isDeleted: true } });

    res.json({
      success: true,
      message: `Cleared ${clearType} annotations successfully`,
    });
  } catch (error) {
    console.error('Error clearing annotations:', error);
    res.status(500).json({ success: false, message: 'Server error clearing annotations' });
  }
};

router.delete('/:meetingId/annotations/clear', handleClearAnnotations);
router.post('/:meetingId/annotations/clear', handleClearAnnotations);

// POST /api/meetings/:meetingId/annotations/undo - Undo last annotation by user
router.post('/:meetingId/annotations/undo', async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'userId is required' });
    }

    const lastAnnotation = await Annotation.findOne({
      meetingId,
      userId,
      isDeleted: false,
    }).sort({ createdAt: -1 });

    if (!lastAnnotation) {
      return res.json({ success: true, message: 'No annotations to undo', undoneId: null });
    }

    lastAnnotation.isDeleted = true;
    await lastAnnotation.save();

    res.json({
      success: true,
      message: 'Last annotation undone',
      undoneId: lastAnnotation.annotationId,
    });
  } catch (error) {
    console.error('Error undoing annotation:', error);
    res.status(500).json({ success: false, message: 'Server error undoing annotation' });
  }
});

// GET /api/meetings/:meetingId/annotation-settings - Fetch annotation settings
router.get('/:meetingId/annotation-settings', async (req, res) => {
  try {
    const { meetingId } = req.params;

    const meeting = await Meeting.findOne({
      $or: [{ meetingId }, { _id: meetingId.match(/^[0-9a-fA-F]{24}$/) ? meetingId : null }]
    });

    const settings = meeting?.annotationSettings || {
      enableAnnotation: true,
      annotationPermission: 'all',
      showAnnotatorNames: true,
      allowSaveAnnotation: true,
    };

    res.json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error('Error fetching annotation settings:', error);
    res.status(500).json({ success: false, message: 'Server error fetching annotation settings' });
  }
});

// PUT /api/meetings/:meetingId/annotation-settings - Update host annotation settings
router.put('/:meetingId/annotation-settings', async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { enableAnnotation, annotationPermission, showAnnotatorNames, allowSaveAnnotation } = req.body;

    const updates = {};
    if (enableAnnotation !== undefined) updates['annotationSettings.enableAnnotation'] = enableAnnotation;
    if (annotationPermission) updates['annotationSettings.annotationPermission'] = annotationPermission;
    if (showAnnotatorNames !== undefined) updates['annotationSettings.showAnnotatorNames'] = showAnnotatorNames;
    if (allowSaveAnnotation !== undefined) updates['annotationSettings.allowSaveAnnotation'] = allowSaveAnnotation;

    if (enableAnnotation !== undefined) updates['securitySettings.allowAnnotation'] = enableAnnotation;

    const meeting = await Meeting.findOneAndUpdate(
      { $or: [{ meetingId }, { _id: meetingId.match(/^[0-9a-fA-F]{24}$/) ? meetingId : null }] },
      { 
        $set: updates,
        $setOnInsert: { title: 'IntellMeet Session', meetingId }
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.json({
      success: true,
      message: 'Annotation settings updated',
      settings: meeting?.annotationSettings,
    });
  } catch (error) {
    console.error('Error updating annotation settings:', error);
    res.status(500).json({ success: false, message: 'Server error updating annotation settings' });
  }
});

export default router;
