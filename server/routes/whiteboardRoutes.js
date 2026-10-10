import express from 'express';
import Whiteboard from '../models/Whiteboard.js';
import WhiteboardObject from '../models/WhiteboardObject.js';
import WhiteboardComment from '../models/WhiteboardComment.js';

const router = express.Router();

// Helper: Seed default brainstorming sticky notes and diagram for new whiteboards
const seedDefaultWhiteboardObjects = async (whiteboardId, ownerId, ownerName) => {
  const initialObjects = [
    {
      objectId: `obj-sticky-1-${Date.now()}`,
      whiteboardId,
      pageNumber: 1,
      type: 'STICKY_NOTE',
      content: 'Improve Login Security & Multi-Factor Auth',
      position: { x: 120, y: 140 },
      size: { width: 200, height: 160 },
      style: { stickyColor: 'yellow', fontSize: 15, isPrivate: false },
      createdBy: { userId: ownerId, userName: ownerName }
    },
    {
      objectId: `obj-sticky-2-${Date.now()}`,
      whiteboardId,
      pageNumber: 1,
      type: 'STICKY_NOTE',
      content: 'Add Real-Time AI Summary & Transcription',
      position: { x: 380, y: 140 },
      size: { width: 200, height: 160 },
      style: { stickyColor: 'blue', fontSize: 15, isPrivate: false },
      createdBy: { userId: ownerId, userName: ownerName }
    },
    {
      objectId: `obj-sticky-3-${Date.now()}`,
      whiteboardId,
      pageNumber: 1,
      type: 'STICKY_NOTE',
      content: 'Collect Live User Non-Verbal Feedback',
      position: { x: 640, y: 140 },
      size: { width: 200, height: 160 },
      style: { stickyColor: 'green', fontSize: 15, isPrivate: false },
      createdBy: { userId: ownerId, userName: ownerName }
    },
    {
      objectId: `obj-shape-1-${Date.now()}`,
      whiteboardId,
      pageNumber: 1,
      type: 'SHAPE',
      content: 'API Gateway',
      position: { x: 250, y: 380 },
      size: { width: 180, height: 80 },
      style: { color: '#3B82F6', fill: 'rgba(59, 130, 246, 0.15)', shapeType: 'RECTANGLE', strokeWidth: 2 },
      createdBy: { userId: ownerId, userName: ownerName }
    },
    {
      objectId: `obj-shape-2-${Date.now()}`,
      whiteboardId,
      pageNumber: 1,
      type: 'SHAPE',
      content: 'MongoDB Cluster',
      position: { x: 550, y: 380 },
      size: { width: 180, height: 80 },
      style: { color: '#10B981', fill: 'rgba(16, 185, 129, 0.15)', shapeType: 'RECTANGLE', strokeWidth: 2 },
      createdBy: { userId: ownerId, userName: ownerName }
    },
    {
      objectId: `obj-conn-1-${Date.now()}`,
      whiteboardId,
      pageNumber: 1,
      type: 'CONNECTOR',
      content: 'Fast Replication',
      position: { x: 430, y: 420 },
      size: { width: 120, height: 2 },
      connectorData: {
        fromObjectId: `obj-shape-1-${Date.now()}`,
        toObjectId: `obj-shape-2-${Date.now()}`,
        label: 'Sync Data',
        arrowEnd: true,
        startPoint: { x: 430, y: 420 },
        endPoint: { x: 550, y: 420 }
      },
      style: { color: '#F59E0B', strokeWidth: 2 },
      createdBy: { userId: ownerId, userName: ownerName }
    }
  ];

  await WhiteboardObject.insertMany(initialObjects);
};

// 1. POST /api/whiteboards - Create a new Whiteboard (17.2)
router.post('/', async (req, res) => {
  try {
    const { 
      title = 'Sprint Architecture & Brainstorming', 
      ownerId, 
      ownerName = 'Host', 
      meetingId, 
      accessMode = 'COLLABORATE',
      isStarred = false 
    } = req.body;

    if (!ownerId) {
      return res.status(400).json({ success: false, message: 'ownerId is required' });
    }

    const whiteboardId = `WB-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;

    const whiteboard = await Whiteboard.create({
      whiteboardId,
      title,
      ownerId,
      ownerName,
      meetingId,
      accessMode,
      isStarred,
      pages: [{ pageNumber: 1, title: 'Page 1' }],
      activePage: 1,
      collaborators: [{
        userId: ownerId,
        userName: ownerName,
        role: 'owner',
        grantedBy: ownerId,
        grantedAt: new Date()
      }]
    });

    // Populate initial brainstorm sticky notes & smart connector diagram
    await seedDefaultWhiteboardObjects(whiteboardId, ownerId, ownerName);

    const objects = await WhiteboardObject.find({ whiteboardId, isDeleted: false });

    res.status(201).json({
      success: true,
      message: 'Whiteboard created successfully',
      whiteboard,
      objects
    });
  } catch (error) {
    console.error('Error creating whiteboard:', error);
    res.status(500).json({ success: false, message: 'Server error creating whiteboard' });
  }
});

// 2. GET /api/whiteboards - List Whiteboards with Dashboard Tabs (17.12)
router.get('/', async (req, res) => {
  try {
    const { userId, meetingId, tab = 'all', search } = req.query;

    let query = { status: 'ACTIVE' };

    if (meetingId) {
      query.meetingId = meetingId;
    }

    if (tab === 'starred') {
      query.isStarred = true;
    } else if (tab === 'my' && userId) {
      query.ownerId = userId;
    } else if (tab === 'shared' && userId) {
      query['collaborators.userId'] = userId;
      query.ownerId = { $ne: userId };
    }

    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    const whiteboards = await Whiteboard.find(query).sort({ updatedAt: -1 });

    res.json({
      success: true,
      count: whiteboards.length,
      whiteboards
    });
  } catch (error) {
    console.error('Error listing whiteboards:', error);
    res.status(500).json({ success: false, message: 'Server error fetching whiteboards' });
  }
});

// 3. GET /api/whiteboards/:whiteboardId - Get whiteboard details, objects, comments (17.3, 17.11)
router.get('/:whiteboardId', async (req, res) => {
  try {
    const { whiteboardId } = req.params;
    const whiteboard = await Whiteboard.findOne({ whiteboardId, status: { $ne: 'TRASHED' } });

    if (!whiteboard) {
      return res.status(404).json({ success: false, message: 'Whiteboard not found' });
    }

    const objects = await WhiteboardObject.find({ whiteboardId, isDeleted: false }).sort({ zIndex: 1 });
    const comments = await WhiteboardComment.find({ whiteboardId }).sort({ createdAt: -1 });

    res.json({
      success: true,
      whiteboard,
      objects,
      comments
    });
  } catch (error) {
    console.error('Error fetching whiteboard:', error);
    res.status(500).json({ success: false, message: 'Server error fetching whiteboard' });
  }
});

// 4. PUT /api/whiteboards/:whiteboardId - Update board settings (title, locked, star, mode, pages)
router.put('/:whiteboardId', async (req, res) => {
  try {
    const { whiteboardId } = req.params;
    const { title, isLocked, isStarred, accessMode, privateBrainstorming, activePage } = req.body;

    const whiteboard = await Whiteboard.findOne({ whiteboardId });
    if (!whiteboard) {
      return res.status(404).json({ success: false, message: 'Whiteboard not found' });
    }

    if (title !== undefined) whiteboard.title = title;
    if (isLocked !== undefined) whiteboard.isLocked = isLocked;
    if (isStarred !== undefined) whiteboard.isStarred = isStarred;
    if (accessMode !== undefined) whiteboard.accessMode = accessMode;
    if (privateBrainstorming !== undefined) whiteboard.privateBrainstorming = privateBrainstorming;
    if (activePage !== undefined) whiteboard.activePage = activePage;

    await whiteboard.save();

    res.json({
      success: true,
      message: 'Whiteboard updated successfully',
      whiteboard
    });
  } catch (error) {
    console.error('Error updating whiteboard:', error);
    res.status(500).json({ success: false, message: 'Server error updating whiteboard' });
  }
});

// 5. DELETE /api/whiteboards/:whiteboardId - Trash or delete whiteboard
router.delete('/:whiteboardId', async (req, res) => {
  try {
    const { whiteboardId } = req.params;
    await Whiteboard.findOneAndUpdate({ whiteboardId }, { $set: { status: 'TRASHED' } });

    res.json({
      success: true,
      message: 'Whiteboard deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting whiteboard:', error);
    res.status(500).json({ success: false, message: 'Server error deleting whiteboard' });
  }
});

// 6. POST /api/whiteboards/:whiteboardId/duplicate - Duplicate whiteboard (17.12)
router.post('/:whiteboardId/duplicate', async (req, res) => {
  try {
    const { whiteboardId } = req.params;
    const { userId, userName } = req.body;

    const original = await Whiteboard.findOne({ whiteboardId });
    if (!original) {
      return res.status(404).json({ success: false, message: 'Original whiteboard not found' });
    }

    const newId = `WB-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;

    const duplicatedBoard = await Whiteboard.create({
      whiteboardId: newId,
      title: `${original.title} (Copy)`,
      ownerId: userId || original.ownerId,
      ownerName: userName || original.ownerName,
      meetingId: original.meetingId,
      accessMode: original.accessMode,
      pages: original.pages,
      collaborators: [{
        userId: userId || original.ownerId,
        userName: userName || original.ownerName,
        role: 'owner',
        grantedBy: userId || original.ownerId,
        grantedAt: new Date()
      }]
    });

    const originalObjects = await WhiteboardObject.find({ whiteboardId, isDeleted: false });
    if (originalObjects.length > 0) {
      const cloned = originalObjects.map(obj => ({
        objectId: `obj-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        whiteboardId: newId,
        pageNumber: obj.pageNumber,
        type: obj.type,
        content: obj.content,
        position: obj.position,
        size: obj.size,
        rotation: obj.rotation,
        points: obj.points,
        style: obj.style,
        connectorData: obj.connectorData,
        createdBy: { userId: userId || obj.createdBy.userId, userName: userName || obj.createdBy.userName }
      }));
      await WhiteboardObject.insertMany(cloned);
    }

    res.json({
      success: true,
      message: 'Whiteboard duplicated successfully',
      whiteboard: duplicatedBoard
    });
  } catch (error) {
    console.error('Error duplicating whiteboard:', error);
    res.status(500).json({ success: false, message: 'Server error duplicating whiteboard' });
  }
});

// 7. POST /api/whiteboards/:whiteboardId/permissions - Grant/Update permissions (17.4, 17.13, 17.19)
router.post('/:whiteboardId/permissions', async (req, res) => {
  try {
    const { whiteboardId } = req.params;
    const { userId, userName = 'Participant', role = 'editor', grantedBy } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'userId is required' });
    }

    const whiteboard = await Whiteboard.findOne({ whiteboardId });
    if (!whiteboard) {
      return res.status(404).json({ success: false, message: 'Whiteboard not found' });
    }

    const existingIdx = whiteboard.collaborators.findIndex(c => c.userId === userId);
    if (existingIdx >= 0) {
      whiteboard.collaborators[existingIdx].role = role;
      whiteboard.collaborators[existingIdx].grantedBy = grantedBy || whiteboard.ownerId;
    } else {
      whiteboard.collaborators.push({
        userId,
        userName,
        role,
        grantedBy: grantedBy || whiteboard.ownerId,
        grantedAt: new Date()
      });
    }

    await whiteboard.save();

    res.json({
      success: true,
      message: `Updated permission for ${userName} to ${role}`,
      whiteboard,
      collaborators: whiteboard.collaborators
    });
  } catch (error) {
    console.error('Error updating whiteboard permissions:', error);
    res.status(500).json({ success: false, message: 'Server error updating permissions' });
  }
});

// 8. DELETE /api/whiteboards/:whiteboardId/permissions/:userId - Revoke permissions
router.delete('/:whiteboardId/permissions/:userId', async (req, res) => {
  try {
    const { whiteboardId, userId } = req.params;

    const whiteboard = await Whiteboard.findOne({ whiteboardId });
    if (!whiteboard) {
      return res.status(404).json({ success: false, message: 'Whiteboard not found' });
    }

    whiteboard.collaborators = whiteboard.collaborators.filter(c => c.userId !== userId);
    await whiteboard.save();

    res.json({
      success: true,
      message: `Revoked whiteboard access for user ${userId}`,
      collaborators: whiteboard.collaborators
    });
  } catch (error) {
    console.error('Error revoking permission:', error);
    res.status(500).json({ success: false, message: 'Server error revoking permission' });
  }
});

// 9. POST /api/whiteboards/:whiteboardId/objects - Create object (17.5 - 17.7, 17.20)
router.post('/:whiteboardId/objects', async (req, res) => {
  try {
    const { whiteboardId } = req.params;
    const objectData = req.body;

    const whiteboard = await Whiteboard.findOne({ whiteboardId });
    if (!whiteboard) {
      return res.status(404).json({ success: false, message: 'Whiteboard not found' });
    }

    if (whiteboard.isLocked) {
      return res.status(423).json({ success: false, message: 'Whiteboard is locked by host' });
    }

    const objectId = objectData.objectId || `obj-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const createdBy = typeof objectData.createdBy === 'string'
      ? { userId: objectData.createdBy, userName: objectData.createdByName || 'Participant' }
      : (objectData.createdBy || { userId: 'anonymous', userName: 'Participant' });

    const newObject = await WhiteboardObject.create({
      ...objectData,
      createdBy,
      objectId,
      whiteboardId
    });

    res.status(201).json({
      success: true,
      message: 'Object created successfully',
      object: newObject
    });
  } catch (error) {
    console.error('Error creating whiteboard object:', error);
    res.status(500).json({ success: false, message: 'Server error creating object' });
  }
});

// 10. PUT /api/whiteboards/:whiteboardId/objects/:objectId - Update object position/style (17.21)
router.put('/:whiteboardId/objects/:objectId', async (req, res) => {
  try {
    const { whiteboardId, objectId } = req.params;
    const updates = req.body;

    const updatedObject = await WhiteboardObject.findOneAndUpdate(
      { whiteboardId, objectId, isDeleted: false },
      { $set: updates },
      { new: true }
    );

    if (!updatedObject) {
      return res.status(404).json({ success: false, message: 'Object not found' });
    }

    res.json({
      success: true,
      message: 'Object updated successfully',
      object: updatedObject
    });
  } catch (error) {
    console.error('Error updating whiteboard object:', error);
    res.status(500).json({ success: false, message: 'Server error updating object' });
  }
});

// 11. DELETE /api/whiteboards/:whiteboardId/objects/:objectId - Delete object
router.delete('/:whiteboardId/objects/:objectId', async (req, res) => {
  try {
    const { whiteboardId, objectId } = req.params;

    await WhiteboardObject.findOneAndUpdate(
      { whiteboardId, objectId },
      { $set: { isDeleted: true } }
    );

    res.json({
      success: true,
      message: 'Object deleted successfully',
      objectId
    });
  } catch (error) {
    console.error('Error deleting whiteboard object:', error);
    res.status(500).json({ success: false, message: 'Server error deleting object' });
  }
});

// 12. POST /api/whiteboards/:whiteboardId/comments - Add Comment (17.8)
router.post('/:whiteboardId/comments', async (req, res) => {
  try {
    const { whiteboardId } = req.params;
    const { objectId, pageNumber = 1, position, userId, userName, content, mentions = [] } = req.body;

    if (!userId || !content) {
      return res.status(400).json({ success: false, message: 'userId and content are required' });
    }

    const commentId = `comm-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const comment = await WhiteboardComment.create({
      commentId,
      whiteboardId,
      objectId,
      pageNumber,
      position: position || { x: 200, y: 200 },
      userId,
      userName: userName || 'Participant',
      content,
      mentions,
      status: 'ACTIVE',
      replies: []
    });

    res.json({
      success: true,
      message: 'Comment added successfully',
      comment
    });
  } catch (error) {
    console.error('Error adding whiteboard comment:', error);
    res.status(500).json({ success: false, message: 'Server error adding comment' });
  }
});

// 13. POST /api/whiteboards/:whiteboardId/comments/:commentId/reply - Reply to Comment (17.8, 17.9)
router.post('/:whiteboardId/comments/:commentId/reply', async (req, res) => {
  try {
    const { whiteboardId, commentId } = req.params;
    const { userId, userName, content } = req.body;

    if (!userId || !content) {
      return res.status(400).json({ success: false, message: 'userId and content are required' });
    }

    const comment = await WhiteboardComment.findOne({ whiteboardId, commentId });
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    const replyId = `rep-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newReply = {
      replyId,
      userId,
      userName: userName || 'Participant',
      content,
      createdAt: new Date()
    };

    comment.replies.push(newReply);
    await comment.save();

    res.json({
      success: true,
      message: 'Reply added successfully',
      comment
    });
  } catch (error) {
    console.error('Error replying to comment:', error);
    res.status(500).json({ success: false, message: 'Server error replying to comment' });
  }
});

// 14. PUT /api/whiteboards/:whiteboardId/comments/:commentId/resolve - Resolve Comment (17.9)
router.put('/:whiteboardId/comments/:commentId/resolve', async (req, res) => {
  try {
    const { whiteboardId, commentId } = req.params;
    const { status = 'RESOLVED' } = req.body;

    const comment = await WhiteboardComment.findOneAndUpdate(
      { whiteboardId, commentId },
      { $set: { status } },
      { new: true }
    );

    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    res.json({
      success: true,
      message: `Comment marked as ${status}`,
      comment
    });
  } catch (error) {
    console.error('Error resolving comment:', error);
    res.status(500).json({ success: false, message: 'Server error resolving comment' });
  }
});

// 15. DELETE /api/whiteboards/:whiteboardId/comments/:commentId - Delete Comment (17.9)
router.delete('/:whiteboardId/comments/:commentId', async (req, res) => {
  try {
    const { whiteboardId, commentId } = req.params;

    await WhiteboardComment.findOneAndDelete({ whiteboardId, commentId });

    res.json({
      success: true,
      message: 'Comment deleted successfully',
      commentId
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ success: false, message: 'Server error deleting comment' });
  }
});

// 16. POST /api/whiteboards/:whiteboardId/pages - Add Multiple Pages (17.16)
router.post('/:whiteboardId/pages', async (req, res) => {
  try {
    const { whiteboardId } = req.params;
    const { title } = req.body;

    const whiteboard = await Whiteboard.findOne({ whiteboardId });
    if (!whiteboard) {
      return res.status(404).json({ success: false, message: 'Whiteboard not found' });
    }

    const newPageNum = whiteboard.pages.length + 1;
    whiteboard.pages.push({
      pageNumber: newPageNum,
      title: title || `Page ${newPageNum}`
    });
    whiteboard.activePage = newPageNum;

    await whiteboard.save();

    res.json({
      success: true,
      message: `Created Page ${newPageNum}`,
      whiteboard,
      pages: whiteboard.pages,
      activePage: newPageNum
    });
  } catch (error) {
    console.error('Error adding page:', error);
    res.status(500).json({ success: false, message: 'Server error adding page' });
  }
});

export default router;
