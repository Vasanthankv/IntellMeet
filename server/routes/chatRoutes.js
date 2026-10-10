import express from 'express';
import ChatMessage from '../models/ChatMessage.js';
import Meeting from '../models/Meeting.js';

const router = express.Router({ mergeParams: true });

// Helper to find meeting by meetingId or _id
const findMeeting = async (meetingId) => {
  return await Meeting.findOne({
    $or: [
      { meetingId },
      { _id: meetingId?.match(/^[0-9a-fA-F]{24}$/) ? meetingId : null }
    ]
  });
};

// 1. GET all messages for a meeting (Continuous Meeting Chat: pre-meeting, live, post-meeting)
router.get('/:meetingId/messages', async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { userId, phase = 'all', search = '' } = req.query;

    const meeting = await findMeeting(meetingId);

    const query = {
      meetingId,
      $or: [
        { isPrivate: false },
        { recipientId: 'everyone' },
        ...(userId ? [{ senderId: userId }, { recipientId: userId }] : [])
      ]
    };

    if (phase && phase !== 'all' && ['BEFORE', 'DURING', 'AFTER'].includes(phase.toUpperCase())) {
      query.phase = phase.toUpperCase();
    }

    if (search.trim()) {
      query.$and = [
        {
          $or: [
            { text: { $regex: search.trim(), $options: 'i' } },
            { senderName: { $regex: search.trim(), $options: 'i' } },
            { fileName: { $regex: search.trim(), $options: 'i' } },
          ]
        }
      ];
    }

    const rawMessages = await ChatMessage.find(query).sort({ createdAt: 1 });
    const pinnedMessage = await ChatMessage.findOne({ meetingId, isPinned: true });

    // Calculate phase distribution counts across all meeting messages
    const allMeetingMsgs = await ChatMessage.find({ meetingId });
    const phaseStats = {
      total: allMeetingMsgs.length,
      before: allMeetingMsgs.filter(m => m.phase === 'BEFORE').length,
      during: allMeetingMsgs.filter(m => m.phase === 'DURING').length,
      after: allMeetingMsgs.filter(m => m.phase === 'AFTER').length,
      filesCount: allMeetingMsgs.filter(m => Boolean(m.fileUrl || m.documentShare)).length,
    };

    const messages = rawMessages.map(m => {
      const msgObj = m.toObject();
      if (msgObj.isDeleted) {
        msgObj.text = '[This message was deleted]';
        msgObj.fileUrl = '';
        msgObj.fileName = '';
      }
      return msgObj;
    });

    res.json({
      success: true,
      count: messages.length,
      phaseStats,
      pinnedMessage,
      messages,
      meetingStatus: meeting?.status || 'scheduled',
      continuousChatSettings: meeting?.continuousChatSettings || {
        enabled: true,
        beforeMeetingChat: true,
        duringMeetingChat: true,
        afterMeetingChat: true,
        whoCanChat: 'everyone',
        allowFileSharing: true,
        allowReplies: true,
        allowReactions: true,
        retentionDays: 0,
      },
    });
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    res.status(500).json({ success: false, message: 'Server error fetching chat messages' });
  }
});

// 2. POST send new chat message (persists permanently to MongoDB with Phase)
router.post('/:meetingId/messages', async (req, res) => {
  try {
    const { meetingId } = req.params;
    const {
      senderId,
      senderName,
      senderEmail,
      recipientId = 'everyone',
      recipientName = 'Everyone',
      isPrivate = false,
      text = '',
      fileUrl = '',
      fileName = '',
      fileType = '',
      fileSize = '',
      documentShare,
      replyTo,
      phase: requestedPhase,
    } = req.body;

    if (!senderName || (!text.trim() && !fileUrl && !documentShare)) {
      return res.status(400).json({ success: false, message: 'Message content or attachment required' });
    }

    const meeting = await findMeeting(meetingId);
    const chatSettings = meeting?.continuousChatSettings || {
      enabled: true,
      beforeMeetingChat: true,
      duringMeetingChat: true,
      afterMeetingChat: true,
      whoCanChat: 'everyone',
      allowFileSharing: true,
      allowReplies: true,
      allowReactions: true,
      retentionDays: 0,
    };

    // Determine current phase dynamically if not provided
    let phase = requestedPhase;
    if (!phase || !['BEFORE', 'DURING', 'AFTER'].includes(phase)) {
      if (meeting?.status === 'live') {
        phase = 'DURING';
      } else if (meeting?.status === 'completed') {
        phase = 'AFTER';
      } else {
        phase = 'BEFORE';
      }
    }

    // Permission enforcement (Section 35.2 & 35.10)
    if (!chatSettings.enabled && phase !== 'DURING') {
      return res.status(403).json({
        success: false,
        message: 'Continuous Meeting Chat before/after the meeting is disabled for this meeting.'
      });
    }

    if (phase === 'BEFORE' && chatSettings.beforeMeetingChat === false) {
      return res.status(403).json({
        success: false,
        message: 'Pre-meeting chat is currently disabled by the host.'
      });
    }

    if (phase === 'AFTER' && chatSettings.afterMeetingChat === false) {
      return res.status(403).json({
        success: false,
        message: 'Post-meeting chat is currently disabled by the host.'
      });
    }

    if (fileUrl && chatSettings.allowFileSharing === false) {
      return res.status(403).json({
        success: false,
        message: 'File sharing is disabled in this meeting chat.'
      });
    }

    const newMessage = new ChatMessage({
      meetingId,
      senderId,
      senderName,
      senderEmail,
      recipientId,
      recipientName,
      isPrivate: isPrivate || (recipientId !== 'everyone'),
      text,
      fileUrl,
      fileName,
      fileType,
      fileSize,
      documentShare,
      replyTo,
      phase,
    });

    await newMessage.save();

    res.status(201).json({
      success: true,
      message: newMessage,
    });
  } catch (error) {
    console.error('Error saving chat message:', error);
    res.status(500).json({ success: false, message: 'Server error saving chat message' });
  }
});

// 3. PUT edit a chat message (Section 35.9 & 35.10)
router.put('/:meetingId/messages/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Message text cannot be empty' });
    }

    const message = await ChatMessage.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    message.text = text.trim();
    message.isEdited = true;
    message.editedAt = new Date();
    await message.save();

    res.json({ success: true, message });
  } catch (error) {
    console.error('Error editing message:', error);
    res.status(500).json({ success: false, message: 'Server error editing message' });
  }
});

// 4. DELETE soft-delete a chat message
router.delete('/:meetingId/messages/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await ChatMessage.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    message.isDeleted = true;
    message.deletedAt = new Date();
    message.text = '[This message was deleted]';
    message.fileUrl = '';
    message.fileName = '';
    await message.save();

    res.json({ success: true, messageId, message });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ success: false, message: 'Server error deleting message' });
  }
});

// 5. GET all shared files & documents across all phases (Section 35.13)
router.get('/:meetingId/chat-files', async (req, res) => {
  try {
    const { meetingId } = req.params;
    const messages = await ChatMessage.find({
      meetingId,
      $or: [
        { fileUrl: { $ne: '' } },
        { documentShare: { $ne: null } }
      ]
    }).sort({ createdAt: -1 });

    const files = messages.map(m => ({
      messageId: m._id,
      phase: m.phase || 'DURING',
      fileName: m.fileName || m.documentShare?.docTitle || 'Document',
      fileUrl: m.fileUrl || m.documentShare?.docUrl || '',
      fileType: m.fileType || m.documentShare?.docType || 'document',
      fileSize: m.fileSize || '',
      senderName: m.senderName,
      senderEmail: m.senderEmail,
      createdAt: m.createdAt,
      documentShare: m.documentShare,
    }));

    res.json({ success: true, count: files.length, files });
  } catch (error) {
    console.error('Error fetching chat files:', error);
    res.status(500).json({ success: false, message: 'Server error fetching chat files' });
  }
});

// 6. PUT pin / unpin a message
router.put('/:meetingId/messages/:messageId/pin', async (req, res) => {
  try {
    const { meetingId, messageId } = req.params;
    const { pinnedBy } = req.body;

    const targetMsg = await ChatMessage.findById(messageId);
    if (!targetMsg) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    const nextPinned = !targetMsg.isPinned;

    if (nextPinned) {
      await ChatMessage.updateMany({ meetingId }, { isPinned: false });
      targetMsg.isPinned = true;
      targetMsg.pinnedBy = pinnedBy || 'Host';
      targetMsg.pinnedAt = new Date();
    } else {
      targetMsg.isPinned = false;
      targetMsg.pinnedBy = '';
      targetMsg.pinnedAt = null;
    }

    await targetMsg.save();

    res.json({
      success: true,
      pinnedMessage: nextPinned ? targetMsg : null,
      message: targetMsg,
    });
  } catch (error) {
    console.error('Error pinning message:', error);
    res.status(500).json({ success: false, message: 'Server error updating pin' });
  }
});

// 7. POST toggle emoji reaction
router.post('/:meetingId/messages/:messageId/react', async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji, userName } = req.body;

    const message = await ChatMessage.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    let reactionGroup = message.reactions.find(r => r.emoji === emoji);
    if (reactionGroup) {
      const userIndex = reactionGroup.users.indexOf(userName);
      if (userIndex > -1) {
        reactionGroup.users.splice(userIndex, 1);
        reactionGroup.count = reactionGroup.users.length;
      } else {
        reactionGroup.users.push(userName);
        reactionGroup.count = reactionGroup.users.length;
      }
    } else {
      message.reactions.push({
        emoji,
        users: [userName],
        count: 1,
      });
    }

    message.reactions = message.reactions.filter(r => r.count > 0);
    await message.save();

    res.json({ success: true, message });
  } catch (error) {
    console.error('Error adding reaction:', error);
    res.status(500).json({ success: false, message: 'Server error adding reaction' });
  }
});

// 8. GET / PUT Continuous Meeting Chat Settings (Section 35.2 & 35.10)
router.get('/:meetingId/continuous-settings', async (req, res) => {
  try {
    const { meetingId } = req.params;
    const meeting = await findMeeting(meetingId);
    res.json({
      success: true,
      continuousChatSettings: meeting?.continuousChatSettings || {
        enabled: true,
        beforeMeetingChat: true,
        duringMeetingChat: true,
        afterMeetingChat: true,
        whoCanChat: 'everyone',
        allowFileSharing: true,
        allowReplies: true,
        allowReactions: true,
        retentionDays: 0,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error retrieving continuous chat settings' });
  }
});

router.put('/:meetingId/continuous-settings', async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { continuousChatSettings } = req.body;

    const meeting = await Meeting.findOneAndUpdate(
      { $or: [{ meetingId }, { _id: meetingId?.match(/^[0-9a-fA-F]{24}$/) ? meetingId : null }] },
      { $set: { continuousChatSettings } },
      { new: true }
    );

    res.json({
      success: true,
      continuousChatSettings: meeting?.continuousChatSettings || continuousChatSettings
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating continuous chat settings' });
  }
});

// Backward compatibility endpoints for basic chat-settings
router.get('/:meetingId/chat-settings', async (req, res) => {
  try {
    const { meetingId } = req.params;
    const meeting = await findMeeting(meetingId);
    const permission = meeting?.securitySettings?.allowChat || 'everyone';
    res.json({ success: true, allowChat: permission });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error retrieving chat settings' });
  }
});

router.put('/:meetingId/chat-settings', async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { allowChat } = req.body;

    const meeting = await Meeting.findOneAndUpdate(
      { $or: [{ meetingId }, { _id: meetingId?.match(/^[0-9a-fA-F]{24}$/) ? meetingId : null }] },
      { $set: { 'securitySettings.allowChat': allowChat } },
      { new: true }
    );

    res.json({ success: true, allowChat: meeting?.securitySettings?.allowChat || allowChat });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating chat settings' });
  }
});

export default router;
