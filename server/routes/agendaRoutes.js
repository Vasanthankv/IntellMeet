import express from 'express';
import MeetingAgenda from '../models/MeetingAgenda.js';
import PreRead from '../models/PreRead.js';
import MeetingNote from '../models/MeetingNote.js';
import Meeting from '../models/Meeting.js';

const router = express.Router({ mergeParams: true });

const getMeetingId = (req) => req.params.meetingId || req.body.meetingId || req.query.meetingId;

// ─────────────────────────────────────────────────────────────────────────────
// 1. AGENDA ENDPOINTS (Section 36.1, 36.5, 36.6, 36.11)
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/meetings/:meetingId/agenda - Fetch or initialize agenda
router.get('/agenda', async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    let agenda = await MeetingAgenda.findOne({ meetingId });

    if (!agenda) {
      // Find meeting to check title
      const meeting = await Meeting.findOne({
        $or: [{ meetingId }, { _id: meetingId?.match(/^[0-9a-fA-F]{24}$/) ? meetingId : null }]
      });

      agenda = await MeetingAgenda.create({
        meetingId,
        title: meeting ? `${meeting.title} - Official Agenda` : 'Meeting Agenda & Preparation Plan',
        description: 'Collaborative agenda, time allocation, and topic discussion items for this meeting session.',
        items: [
          {
            title: '1. Welcome & Meeting Objectives',
            description: 'Align on primary goals, key stakeholders, and session expectations.',
            presenterName: meeting?.hostName || 'Host',
            durationMinutes: 5,
            order: 0,
            status: 'PENDING',
          },
          {
            title: '2. Project Status & Architecture Deep-Dive',
            description: 'Review current sprint milestones, code delivery, and blocker clearing.',
            presenterName: 'Team Lead',
            durationMinutes: 25,
            order: 1,
            status: 'PENDING',
          },
          {
            title: '3. Decisions, Open Q&A & Action Items',
            description: 'Capture architectural sign-offs, assign deadlines, and review next steps.',
            presenterName: 'All Participants',
            durationMinutes: 15,
            order: 2,
            status: 'PENDING',
          },
        ]
      });
    }

    res.json({ success: true, agenda });
  } catch (error) {
    console.error('Error fetching meeting agenda:', error);
    res.status(500).json({ success: false, message: 'Server error fetching agenda' });
  }
});

// POST /api/meetings/:meetingId/agenda/items - Add an agenda item
router.post('/agenda/items', async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    const { title, description, presenterName, presenterEmail, durationMinutes = 10, notes = '' } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Agenda topic title is required' });
    }

    let agenda = await MeetingAgenda.findOne({ meetingId });
    if (!agenda) {
      agenda = await MeetingAgenda.create({ meetingId, items: [] });
    }

    const newItem = {
      title: title.trim(),
      description: description || '',
      presenterName: presenterName || '',
      presenterEmail: presenterEmail || '',
      durationMinutes: Number(durationMinutes) || 10,
      order: agenda.items.length,
      status: 'PENDING',
      notes,
    };

    agenda.items.push(newItem);
    await agenda.save();

    const createdItem = agenda.items[agenda.items.length - 1];

    res.status(201).json({
      success: true,
      item: createdItem,
      agenda,
    });
  } catch (error) {
    console.error('Error adding agenda item:', error);
    res.status(500).json({ success: false, message: 'Server error adding agenda item' });
  }
});

// PUT /api/meetings/:meetingId/agenda/items/:itemId - Update an agenda item
router.put('/agenda/items/:itemId', async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    const { itemId } = req.params;
    const { title, description, presenterName, presenterEmail, durationMinutes, status, notes, decision, actionItems } = req.body;

    const agenda = await MeetingAgenda.findOne({ meetingId });
    if (!agenda) return res.status(404).json({ success: false, message: 'Agenda not found' });

    const item = agenda.items.find(i => i.itemId === itemId || i._id?.toString() === itemId);
    if (!item) return res.status(404).json({ success: false, message: 'Agenda item not found' });

    if (title !== undefined) item.title = title.trim();
    if (description !== undefined) item.description = description;
    if (presenterName !== undefined) item.presenterName = presenterName;
    if (presenterEmail !== undefined) item.presenterEmail = presenterEmail;
    if (durationMinutes !== undefined) item.durationMinutes = Number(durationMinutes);
    if (status !== undefined) item.status = status;
    if (notes !== undefined) item.notes = notes;
    if (decision !== undefined) item.decision = decision;
    if (actionItems !== undefined) item.actionItems = actionItems;

    await agenda.save();

    res.json({ success: true, item, agenda });
  } catch (error) {
    console.error('Error updating agenda item:', error);
    res.status(500).json({ success: false, message: 'Server error updating agenda item' });
  }
});

// PUT /api/meetings/:meetingId/agenda/items/:itemId/status - Quick status toggle
router.put('/agenda/items/:itemId/status', async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    const { itemId } = req.params;
    const { status } = req.body; // 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED'

    if (!['PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    const agenda = await MeetingAgenda.findOne({ meetingId });
    if (!agenda) return res.status(404).json({ success: false, message: 'Agenda not found' });

    const item = agenda.items.find(i => i.itemId === itemId || i._id?.toString() === itemId);
    if (!item) return res.status(404).json({ success: false, message: 'Agenda item not found' });

    item.status = status;

    // If starting this item, automatically set any other IN_PROGRESS items to COMPLETED
    if (status === 'IN_PROGRESS') {
      agenda.items.forEach(other => {
        if (other.itemId !== itemId && other._id?.toString() !== itemId && other.status === 'IN_PROGRESS') {
          other.status = 'COMPLETED';
        }
      });
    }

    await agenda.save();

    res.json({ success: true, item, agenda });
  } catch (error) {
    console.error('Error updating agenda status:', error);
    res.status(500).json({ success: false, message: 'Server error updating agenda status' });
  }
});

// DELETE /api/meetings/:meetingId/agenda/items/:itemId - Remove an agenda item
router.delete('/agenda/items/:itemId', async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    const { itemId } = req.params;

    const agenda = await MeetingAgenda.findOne({ meetingId });
    if (!agenda) return res.status(404).json({ success: false, message: 'Agenda not found' });

    agenda.items = agenda.items.filter(i => i.itemId !== itemId && i._id?.toString() !== itemId);
    await agenda.save();

    res.json({ success: true, message: 'Agenda item deleted', agenda });
  } catch (error) {
    console.error('Error deleting agenda item:', error);
    res.status(500).json({ success: false, message: 'Server error deleting agenda item' });
  }
});

// PUT /api/meetings/:meetingId/agenda/reorder - Reorder agenda items
router.put('/agenda/reorder', async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    const { itemIds } = req.body; // Array of itemIds in new sequence

    if (!Array.isArray(itemIds)) {
      return res.status(400).json({ success: false, message: 'itemIds array required' });
    }

    const agenda = await MeetingAgenda.findOne({ meetingId });
    if (!agenda) return res.status(404).json({ success: false, message: 'Agenda not found' });

    const itemMap = new Map();
    agenda.items.forEach(i => itemMap.set(i.itemId || i._id?.toString(), i));

    const reordered = [];
    itemIds.forEach((id, idx) => {
      const itm = itemMap.get(id);
      if (itm) {
        itm.order = idx;
        reordered.push(itm);
        itemMap.delete(id);
      }
    });

    // Add any remaining items that were not in itemIds
    itemMap.forEach(itm => reordered.push(itm));

    agenda.items = reordered;
    await agenda.save();

    res.json({ success: true, agenda });
  } catch (error) {
    console.error('Error reordering agenda:', error);
    res.status(500).json({ success: false, message: 'Server error reordering agenda' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. PRE-READ MATERIALS ENDPOINTS (Section 36.2, 36.7, 36.11)
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/meetings/:meetingId/prereads - List all pre-read materials
router.get('/prereads', async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    const preReads = await PreRead.find({ meetingId }).sort({ createdAt: -1 });
    res.json({ success: true, count: preReads.length, preReads });
  } catch (error) {
    console.error('Error fetching pre-reads:', error);
    res.status(500).json({ success: false, message: 'Server error fetching pre-reads' });
  }
});

// POST /api/meetings/:meetingId/prereads - Add pre-read material
router.post('/prereads', async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    const {
      title,
      description = '',
      type = 'DOCUMENT',
      fileUrl = '',
      externalUrl = '',
      fileSize = '',
      uploadedBy = '',
      uploadedByName = 'Participant'
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Pre-read document title is required' });
    }

    const newPreRead = await PreRead.create({
      meetingId,
      title: title.trim(),
      description,
      type,
      fileUrl,
      externalUrl,
      fileSize,
      uploadedBy,
      uploadedByName,
      viewedBy: []
    });

    res.status(201).json({ success: true, preRead: newPreRead });
  } catch (error) {
    console.error('Error adding pre-read:', error);
    res.status(500).json({ success: false, message: 'Server error adding pre-read' });
  }
});

// DELETE /api/meetings/:meetingId/prereads/:preReadId - Delete pre-read material
router.delete('/prereads/:preReadId', async (req, res) => {
  try {
    const { preReadId } = req.params;
    await PreRead.findByIdAndDelete(preReadId);
    res.json({ success: true, message: 'Pre-read material removed' });
  } catch (error) {
    console.error('Error deleting pre-read:', error);
    res.status(500).json({ success: false, message: 'Server error deleting pre-read' });
  }
});

// POST /api/meetings/:meetingId/prereads/:preReadId/view - Mark pre-read as viewed/reviewed
router.post('/prereads/:preReadId/view', async (req, res) => {
  try {
    const { preReadId } = req.params;
    const { userId, userName, reviewed = true } = req.body;

    const preRead = await PreRead.findById(preReadId);
    if (!preRead) return res.status(404).json({ success: false, message: 'Pre-read document not found' });

    const existingIndex = preRead.viewedBy.findIndex(v => v.userId === userId || v.userName === userName);
    if (existingIndex > -1) {
      preRead.viewedBy[existingIndex].reviewed = reviewed;
      preRead.viewedBy[existingIndex].viewedAt = new Date();
    } else {
      preRead.viewedBy.push({
        userId: userId || 'user_' + Date.now(),
        userName: userName || 'Participant',
        viewedAt: new Date(),
        reviewed
      });
    }

    await preRead.save();
    res.json({ success: true, preRead });
  } catch (error) {
    console.error('Error updating pre-read view status:', error);
    res.status(500).json({ success: false, message: 'Server error updating view status' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. SHARED MEETING NOTES & DECISIONS (Section 36.3, 36.6, 36.11)
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/meetings/:meetingId/meeting-notes - List shared meeting notes
router.get('/meeting-notes', async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    const { category, agendaItemId } = req.query;

    const filter = { meetingId };
    if (category && category !== 'ALL') filter.category = category;
    if (agendaItemId) filter.agendaItemId = agendaItemId;

    const notes = await MeetingNote.find(filter).sort({ createdAt: 1 });
    res.json({ success: true, count: notes.length, notes });
  } catch (error) {
    console.error('Error fetching meeting notes:', error);
    res.status(500).json({ success: false, message: 'Server error fetching meeting notes' });
  }
});

// POST /api/meetings/:meetingId/meeting-notes - Create a shared note / decision
router.post('/meeting-notes', async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    const {
      agendaItemId = '',
      authorId = '',
      authorName = 'Participant',
      authorEmail = '',
      content,
      category = 'GENERAL',
      visibility = 'ALL_PARTICIPANTS',
      tags = []
    } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Note content is required' });
    }

    const newNote = await MeetingNote.create({
      meetingId,
      agendaItemId,
      authorId,
      authorName,
      authorEmail,
      content: content.trim(),
      category,
      visibility,
      tags
    });

    res.status(201).json({ success: true, note: newNote });
  } catch (error) {
    console.error('Error saving meeting note:', error);
    res.status(500).json({ success: false, message: 'Server error saving meeting note' });
  }
});

// PUT /api/meetings/:meetingId/meeting-notes/:noteId - Update a shared note
router.put('/meeting-notes/:noteId', async (req, res) => {
  try {
    const { noteId } = req.params;
    const { content, category, visibility, tags } = req.body;

    const note = await MeetingNote.findById(noteId);
    if (!note) return res.status(404).json({ success: false, message: 'Meeting note not found' });

    if (content !== undefined) note.content = content.trim();
    if (category !== undefined) note.category = category;
    if (visibility !== undefined) note.visibility = visibility;
    if (tags !== undefined) note.tags = tags;

    await note.save();
    res.json({ success: true, note });
  } catch (error) {
    console.error('Error updating meeting note:', error);
    res.status(500).json({ success: false, message: 'Server error updating meeting note' });
  }
});

// DELETE /api/meetings/:meetingId/meeting-notes/:noteId - Delete a shared note
router.delete('/meeting-notes/:noteId', async (req, res) => {
  try {
    const { noteId } = req.params;
    await MeetingNote.findByIdAndDelete(noteId);
    res.json({ success: true, message: 'Meeting note deleted' });
  } catch (error) {
    console.error('Error deleting meeting note:', error);
    res.status(500).json({ success: false, message: 'Server error deleting meeting note' });
  }
});

export default router;
