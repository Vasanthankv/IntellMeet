import express from 'express';
import BreakoutRoom from '../models/BreakoutRoom.js';
import BreakoutSavedAssignment from '../models/BreakoutSavedAssignment.js';

const router = express.Router({ mergeParams: true });

// 1. POST /api/meetings/:meetingId/breakout/create - Create Breakout Rooms (18.2 - 18.6)
router.post('/create', async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { 
      count = 2, 
      method = 'AUTOMATIC', // 'AUTOMATIC', 'MANUAL', 'PARTICIPANT_CHOICE', 'LOAD_SAVED'
      participants = [],
      savedAssignmentId,
      roomNames = [],
      settings = {}
    } = req.body;

    // Up to 100 breakout rooms supported (modern Zoom specification)
    const validCount = Math.max(1, Math.min(100, parseInt(count, 10) || 2));

    // Remove any existing active or pending breakout rooms for this meeting
    await BreakoutRoom.deleteMany({ meetingId, status: { $in: ['NOT_STARTED', 'OPEN', 'CLOSING'] } });

    let createdRooms = [];

    // Option A: Load from Saved Assignment (18.6, 18.22)
    if (method === 'LOAD_SAVED' && savedAssignmentId) {
      const saved = await BreakoutSavedAssignment.findOne({ assignmentId: savedAssignmentId });
      if (saved && saved.rooms.length > 0) {
        for (let i = 0; i < saved.rooms.length; i++) {
          const sRoom = saved.rooms[i];
          const roomId = `br-${meetingId}-${i + 1}-${Date.now()}`;
          const newRoom = await BreakoutRoom.create({
            roomId,
            meetingId,
            name: sRoom.name || `Room ${i + 1}`,
            roomIndex: i + 1,
            status: 'NOT_STARTED',
            participants: sRoom.participants.map(p => ({
              userId: p.userId,
              userName: p.userName,
              status: 'ASSIGNED',
              assignedAt: new Date()
            })),
            settings: {
              allowSelfSelect: settings.allowSelfSelect || false,
              allowReturnToMain: settings.allowReturnToMain !== undefined ? settings.allowReturnToMain : true,
              autoMoveParticipants: settings.autoMoveParticipants || false,
              autoClose: settings.autoClose || false,
              durationMinutes: settings.durationMinutes || 30,
              countdownSeconds: settings.countdownSeconds || 60,
              notifyHostOnExpiry: settings.notifyHostOnExpiry !== undefined ? settings.notifyHostOnExpiry : true
            }
          });
          createdRooms.push(newRoom);
        }

        return res.status(201).json({
          success: true,
          message: `Loaded ${createdRooms.length} breakout rooms from saved assignment`,
          rooms: createdRooms
        });
      }
    }

    // Default room templates if custom names not provided
    const defaultLabels = ['Frontend Team', 'Backend Team', 'Testing Team', 'Design Team', 'DevOps & Cloud', 'Product & QA'];

    // Initialize room buckets
    const roomBuckets = Array.from({ length: validCount }, (_, i) => ({
      name: roomNames[i] || (i < defaultLabels.length ? defaultLabels[i] : `Room ${i + 1}`),
      participants: []
    }));

    // Option B: Assign Automatically (18.3)
    if (method === 'AUTOMATIC' && participants.length > 0) {
      participants.forEach((p, idx) => {
        const bucketIndex = idx % validCount;
        roomBuckets[bucketIndex].participants.push({
          userId: p.userId || p.id,
          userName: p.userName || p.name || 'Participant',
          status: 'ASSIGNED',
          assignedAt: new Date()
        });
      });
    }

    // Create rooms in database
    for (let i = 0; i < validCount; i++) {
      const roomId = `br-${meetingId}-${i + 1}-${Date.now()}`;
      const newRoom = await BreakoutRoom.create({
        roomId,
        meetingId,
        name: roomBuckets[i].name,
        roomIndex: i + 1,
        status: 'NOT_STARTED',
        participants: roomBuckets[i].participants,
        settings: {
          allowSelfSelect: method === 'PARTICIPANT_CHOICE' || settings.allowSelfSelect || false,
          allowReturnToMain: settings.allowReturnToMain !== undefined ? settings.allowReturnToMain : true,
          autoMoveParticipants: settings.autoMoveParticipants || false,
          autoClose: settings.autoClose || false,
          durationMinutes: settings.durationMinutes || 30,
          countdownSeconds: settings.countdownSeconds || 60,
          notifyHostOnExpiry: settings.notifyHostOnExpiry !== undefined ? settings.notifyHostOnExpiry : true,
          broadcastEnabled: true
        }
      });
      createdRooms.push(newRoom);
    }

    res.status(201).json({
      success: true,
      message: `Created ${createdRooms.length} breakout rooms successfully`,
      rooms: createdRooms
    });
  } catch (error) {
    console.error('Error creating breakout rooms:', error);
    res.status(500).json({ success: false, message: 'Server error creating breakout rooms' });
  }
});

// 2. GET /api/meetings/:meetingId/breakout - List Breakout Rooms (18.12)
router.get('/', async (req, res) => {
  try {
    const { meetingId } = req.params;
    const rooms = await BreakoutRoom.find({ 
      meetingId, 
      status: { $in: ['NOT_STARTED', 'OPEN', 'CLOSING'] } 
    }).sort({ roomIndex: 1 });

    res.json({
      success: true,
      rooms
    });
  } catch (error) {
    console.error('Error fetching breakout rooms:', error);
    res.status(500).json({ success: false, message: 'Server error fetching breakout rooms' });
  }
});

// 3. POST /api/meetings/:meetingId/breakout/open - Open All Breakout Rooms (18.9, 18.10)
router.post('/open', async (req, res) => {
  try {
    const { meetingId } = req.params;
    const now = new Date();

    await BreakoutRoom.updateMany(
      { meetingId, status: { $in: ['NOT_STARTED', 'CLOSED'] } },
      { 
        $set: { 
          status: 'OPEN',
          startedAt: now,
          closingStartedAt: null,
          endedAt: null
        } 
      }
    );

    const rooms = await BreakoutRoom.find({ meetingId, status: 'OPEN' }).sort({ roomIndex: 1 });

    res.json({
      success: true,
      message: 'All breakout rooms are now open',
      rooms
    });
  } catch (error) {
    console.error('Error opening breakout rooms:', error);
    res.status(500).json({ success: false, message: 'Server error opening breakout rooms' });
  }
});

// 4. POST /api/meetings/:meetingId/breakout/close - Initiate Closing Countdown (18.16, 18.18)
router.post('/close', async (req, res) => {
  try {
    const { meetingId } = req.params;
    const now = new Date();

    await BreakoutRoom.updateMany(
      { meetingId, status: 'OPEN' },
      { 
        $set: { 
          status: 'CLOSING',
          closingStartedAt: now 
        } 
      }
    );

    const rooms = await BreakoutRoom.find({ meetingId }).sort({ roomIndex: 1 });

    res.json({
      success: true,
      message: 'Breakout rooms countdown initiated',
      rooms
    });
  } catch (error) {
    console.error('Error closing breakout rooms:', error);
    res.status(500).json({ success: false, message: 'Server error closing breakout rooms' });
  }
});

// 5. POST /api/meetings/:meetingId/breakout/end - Immediately Return Everyone to Main Meeting (18.16)
router.post('/end', async (req, res) => {
  try {
    const { meetingId } = req.params;
    const now = new Date();

    await BreakoutRoom.updateMany(
      { meetingId, status: { $in: ['OPEN', 'CLOSING'] } },
      { 
        $set: { 
          status: 'CLOSED',
          endedAt: now,
          'participants.$[].status': 'LEFT',
          'participants.$[].leftAt': now
        } 
      }
    );

    const rooms = await BreakoutRoom.find({ meetingId }).sort({ roomIndex: 1 });

    res.json({
      success: true,
      message: 'All breakout rooms ended; participants returned to main meeting',
      rooms
    });
  } catch (error) {
    console.error('Error ending breakout rooms:', error);
    res.status(500).json({ success: false, message: 'Server error ending breakout rooms' });
  }
});

// 6. POST /api/meetings/:meetingId/breakout/rooms - Add Room (18.21)
router.post('/rooms', async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { name } = req.body;

    const existingCount = await BreakoutRoom.countDocuments({ meetingId, status: { $ne: 'CLOSED' } });
    if (existingCount >= 100) {
      return res.status(400).json({ success: false, message: 'Maximum limit of 100 breakout rooms reached' });
    }

    const roomIndex = existingCount + 1;
    const roomId = `br-${meetingId}-${roomIndex}-${Date.now()}`;
    const newRoom = await BreakoutRoom.create({
      roomId,
      meetingId,
      name: name || `Room ${roomIndex}`,
      roomIndex,
      status: 'NOT_STARTED',
      participants: []
    });

    res.status(201).json({
      success: true,
      message: 'Added new breakout room',
      room: newRoom
    });
  } catch (error) {
    console.error('Error adding breakout room:', error);
    res.status(500).json({ success: false, message: 'Server error adding room' });
  }
});

// 7. PUT /api/meetings/:meetingId/breakout/rooms/:roomId - Rename / Update Room Settings (18.8, 18.20)
router.put('/rooms/:roomId', async (req, res) => {
  try {
    const { meetingId, roomId } = req.params;
    const { name, settings } = req.body;

    const updates = {};
    if (name) updates.name = name;
    if (settings) updates.settings = settings;

    const room = await BreakoutRoom.findOneAndUpdate(
      { meetingId, roomId },
      { $set: updates },
      { new: true }
    );

    if (!room) {
      return res.status(404).json({ success: false, message: 'Breakout room not found' });
    }

    res.json({
      success: true,
      message: 'Room updated successfully',
      room
    });
  } catch (error) {
    console.error('Error updating breakout room:', error);
    res.status(500).json({ success: false, message: 'Server error updating room' });
  }
});

// 8. DELETE /api/meetings/:meetingId/breakout/rooms/:roomId - Delete Room (18.21)
router.delete('/rooms/:roomId', async (req, res) => {
  try {
    const { meetingId, roomId } = req.params;

    const deleted = await BreakoutRoom.findOneAndDelete({ meetingId, roomId });
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    res.json({
      success: true,
      message: 'Room deleted successfully',
      roomId
    });
  } catch (error) {
    console.error('Error deleting breakout room:', error);
    res.status(500).json({ success: false, message: 'Server error deleting room' });
  }
});

// 9. POST /api/meetings/:meetingId/breakout/assign - Assign or Move Participant (18.4, 18.7)
router.post('/assign', async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { userId, userName = 'Participant', targetRoomId, role = 'participant' } = req.body;

    if (!userId || !targetRoomId) {
      return res.status(400).json({ success: false, message: 'userId and targetRoomId required' });
    }

    // Remove user from any other room in this meeting
    await BreakoutRoom.updateMany(
      { meetingId },
      { $pull: { participants: { userId } } }
    );

    // Add user to the target room
    const targetRoom = await BreakoutRoom.findOneAndUpdate(
      { meetingId, roomId: targetRoomId },
      { 
        $push: { 
          participants: {
            userId,
            userName,
            role,
            status: 'ASSIGNED',
            assignedAt: new Date()
          } 
        } 
      },
      { new: true }
    );

    if (!targetRoom) {
      return res.status(404).json({ success: false, message: 'Target room not found' });
    }

    const allRooms = await BreakoutRoom.find({ meetingId, status: { $ne: 'CLOSED' } }).sort({ roomIndex: 1 });

    res.json({
      success: true,
      message: `Assigned ${userName} to ${targetRoom.name}`,
      rooms: allRooms
    });
  } catch (error) {
    console.error('Error assigning participant:', error);
    res.status(500).json({ success: false, message: 'Server error assigning participant' });
  }
});

// 10. POST /api/meetings/:meetingId/breakout/exchange - Swap Two Participants (18.7)
router.post('/exchange', async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { userAId, userBId } = req.body;

    if (!userAId || !userBId) {
      return res.status(400).json({ success: false, message: 'Both userAId and userBId are required' });
    }

    const roomA = await BreakoutRoom.findOne({ meetingId, 'participants.userId': userAId });
    const roomB = await BreakoutRoom.findOne({ meetingId, 'participants.userId': userBId });

    if (!roomA || !roomB) {
      return res.status(404).json({ success: false, message: 'One or both participants not found in any room' });
    }

    const partA = roomA.participants.find(p => p.userId === userAId);
    const partB = roomB.participants.find(p => p.userId === userBId);

    // Remove both
    await BreakoutRoom.updateOne({ _id: roomA._id }, { $pull: { participants: { userId: userAId } } });
    await BreakoutRoom.updateOne({ _id: roomB._id }, { $pull: { participants: { userId: userBId } } });

    // Add swapped
    await BreakoutRoom.updateOne({ _id: roomA._id }, { $push: { participants: partB } });
    await BreakoutRoom.updateOne({ _id: roomB._id }, { $push: { participants: partA } });

    const allRooms = await BreakoutRoom.find({ meetingId, status: { $ne: 'CLOSED' } }).sort({ roomIndex: 1 });

    res.json({
      success: true,
      message: `Exchanged ${partA.userName} and ${partB.userName}`,
      rooms: allRooms
    });
  } catch (error) {
    console.error('Error exchanging participants:', error);
    res.status(500).json({ success: false, message: 'Server error exchanging participants' });
  }
});

// 11. POST /api/meetings/:meetingId/breakout/join - Participant or Host Joins Room (18.5, 18.10, 18.11)
router.post('/join', async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { roomId, userId, userName = 'Participant', role = 'participant' } = req.body;

    const room = await BreakoutRoom.findOne({ meetingId, roomId });
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    const existingIndex = room.participants.findIndex(p => p.userId === userId);
    if (existingIndex >= 0) {
      room.participants[existingIndex].status = 'JOINED';
      room.participants[existingIndex].joinedAt = new Date();
    } else {
      room.participants.push({
        userId,
        userName,
        role,
        status: 'JOINED',
        joinedAt: new Date()
      });
    }

    await room.save();

    res.json({
      success: true,
      message: `Joined ${room.name}`,
      room
    });
  } catch (error) {
    console.error('Error joining room:', error);
    res.status(500).json({ success: false, message: 'Server error joining room' });
  }
});

// 12. POST /api/meetings/:meetingId/breakout/leave - Return to Main Meeting (18.16)
router.post('/leave', async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { roomId, userId } = req.body;

    const room = await BreakoutRoom.findOne({ meetingId, roomId });
    if (room) {
      const part = room.participants.find(p => p.userId === userId);
      if (part) {
        part.status = 'LEFT';
        part.leftAt = new Date();
        await room.save();
      }
    }

    res.json({
      success: true,
      message: 'Returned to main meeting',
      roomId
    });
  } catch (error) {
    console.error('Error leaving room:', error);
    res.status(500).json({ success: false, message: 'Server error leaving room' });
  }
});

// 13. POST /api/meetings/:meetingId/breakout/help - Ask for Help (18.15)
router.post('/help', async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { roomId, userId, userName = 'Participant', message } = req.body;

    const room = await BreakoutRoom.findOne({ meetingId, roomId });
    if (!room) {
      return res.status(404).json({ success: false, message: 'Breakout room not found' });
    }

    const requestId = `help-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const helpReq = {
      requestId,
      userId,
      userName,
      message: message || `${userName} requested help in ${room.name}`,
      status: 'PENDING',
      requestedAt: new Date()
    };

    room.helpRequests.push(helpReq);
    await room.save();

    res.status(201).json({
      success: true,
      message: 'Help request sent to host',
      helpRequest: helpReq,
      roomName: room.name,
      roomId: room.roomId
    });
  } catch (error) {
    console.error('Error requesting help:', error);
    res.status(500).json({ success: false, message: 'Server error requesting help' });
  }
});

// 14. PUT /api/meetings/:meetingId/breakout/help/:requestId/resolve - Resolve Help Request (18.15)
router.put('/help/:requestId/resolve', async (req, res) => {
  try {
    const { meetingId, requestId } = req.params;

    const room = await BreakoutRoom.findOne({ meetingId, 'helpRequests.requestId': requestId });
    if (!room) {
      return res.status(404).json({ success: false, message: 'Help request not found' });
    }

    const reqItem = room.helpRequests.find(h => h.requestId === requestId);
    if (reqItem) {
      reqItem.status = 'RESOLVED';
      reqItem.resolvedAt = new Date();
      await room.save();
    }

    res.json({
      success: true,
      message: 'Help request marked as resolved',
      requestId
    });
  } catch (error) {
    console.error('Error resolving help request:', error);
    res.status(500).json({ success: false, message: 'Server error resolving help request' });
  }
});

// 15. POST /api/meetings/:meetingId/breakout/save-assignment - Save Assignment for Future/Recurring (18.6, 18.22)
router.post('/save-assignment', async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { title = 'Saved Breakout Assignment', createdBy = 'host' } = req.body;

    const currentRooms = await BreakoutRoom.find({ meetingId, status: { $ne: 'CLOSED' } });
    if (currentRooms.length === 0) {
      return res.status(400).json({ success: false, message: 'No active rooms to save' });
    }

    const assignmentId = `asg-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const savedAssignment = await BreakoutSavedAssignment.create({
      assignmentId,
      meetingId,
      title,
      createdBy,
      rooms: currentRooms.map(r => ({
        name: r.name,
        participants: r.participants.map(p => ({ userId: p.userId, userName: p.userName }))
      }))
    });

    res.status(201).json({
      success: true,
      message: 'Breakout room assignments saved for future use',
      savedAssignment
    });
  } catch (error) {
    console.error('Error saving assignments:', error);
    res.status(500).json({ success: false, message: 'Server error saving assignments' });
  }
});

// 16. GET /api/meetings/:meetingId/breakout/saved-assignments - Get Saved Assignments (18.6, 18.22)
router.get('/saved-assignments', async (req, res) => {
  try {
    const { meetingId } = req.params;
    const saved = await BreakoutSavedAssignment.find({ meetingId }).sort({ createdAt: -1 });

    res.json({
      success: true,
      savedAssignments: saved
    });
  } catch (error) {
    console.error('Error fetching saved assignments:', error);
    res.status(500).json({ success: false, message: 'Server error fetching saved assignments' });
  }
});

export default router;
