import mongoose from 'mongoose';
import express from 'express';
import { generateGeminiContent, isGeminiConfigured } from '../services/geminiService.js';
import { PersonalNote } from '../models/PersonalNote.js';
import { MeetingTranscript } from '../models/MeetingTranscript.js';
import Meeting from '../models/Meeting.js';
import User from '../models/User.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router({ mergeParams: true });
const getMeetingId = (req) => req.params.meetingId || req.body.meetingId || req.query.meetingId;


const memoryNotes = new Map();

const safeFindNote = async (meetingId, userId, userName, meetingTitle) => {
  const key = `${meetingId}_${userId}`;
  if (mongoose.connection.readyState === 1) {
    try {
      const doc = await Promise.race([
        PersonalNote.findOne({ meetingId, userId }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000))
      ]);
      if (doc) return doc;
    } catch (e) {
      console.warn('DB PersonalNote read warning:', e.message);
    }
  }
  if (!memoryNotes.has(key)) {
    memoryNotes.set(key, {
      noteId: 'note_' + Math.random().toString(36).substring(2, 9),
      meetingId,
      meetingTitle: meetingTitle || 'IntellMeet Session',
      userId,
      userName: userName || 'Participant',
      title: `${meetingTitle || 'IntellMeet'} - My Notes`,
      content: '',
      visibility: 'PRIVATE',
      sections: { important: [], questions: [], decisions: [], tasks: [], personal: [] },
      save: async function() { return this; }
    });
  }
  return memoryNotes.get(key);
};


const formatTimestamp = (totalSecs) => {
  const mins = Math.floor((totalSecs || 0) / 60);
  const secs = Math.floor((totalSecs || 0) % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

// ─────────────────────────────────────────────────────────────────────────────
// 27.1 & 27.2 Get or Initialize My Personal Note for a Meeting
// GET /api/meetings/:meetingId/notes/my  OR  GET /api/notes/my?meetingId=...
// ─────────────────────────────────────────────────────────────────────────────
router.get('/my', protect, async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    const userId = req.user._id?.toString() || req.user.id;
    const userName = req.user.name || 'Participant';

    if (!meetingId) {
      return res.status(400).json({ success: false, message: 'meetingId is required' });
    }

    let note = await safeFindNote(meetingId, userId, userName, 'IntellMeet Session');

    // Also fetch associated transcript segments (if available) for 27.3 integration
    let transcriptDoc = null;
    if (mongoose.connection.readyState === 1) {
      try {
        transcriptDoc = await Promise.race([
          MeetingTranscript.findOne({ meetingId }).sort({ createdAt: -1 }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000))
        ]);
      } catch (e) {}
    }
    const segments = transcriptDoc?.segments || [];

    res.json({
      success: true,
      note,
      transcriptSegmentsCount: segments.length,
      transcriptAvailable: segments.length > 0
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 27.7 List all personal notes for the current user (Dashboard / Past Meetings)
// GET /api/notes/user/all
// ─────────────────────────────────────────────────────────────────────────────
router.get('/user/all', protect, async (req, res) => {
  try {
    const userId = req.user._id?.toString() || req.user.id;
    const notes = await PersonalNote.find({
      $or: [
        { userId },
        { 'shares.userId': userId }
      ]
    }).sort({ updatedAt: -1 }).limit(100);

    res.json({ success: true, count: notes.length, notes });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 27.7 Get single note by noteId (with permissions check)
// GET /api/notes/:noteId
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:noteId', protect, async (req, res) => {
  try {
    const { noteId } = req.params;
    const userId = req.user._id?.toString() || req.user.id;

    const note = await PersonalNote.findOne({
      $or: [{ noteId }, { _id: noteId.match(/^[0-9a-fA-F]{24}$/) ? noteId : null }]
    });

    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }

    // Permissions check
    const isOwner = note.userId === userId;
    const shareRecord = note.shares?.find(s => s.userId === userId);

    if (!isOwner && !shareRecord && note.visibility !== 'SHARED') {
      return res.status(403).json({ success: false, message: 'Access denied to this personal note' });
    }

    const permissionRole = isOwner ? 'owner' : (shareRecord?.role || 'viewer');

    res.json({
      success: true,
      note,
      permissionRole
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 27.2 & 27.7 Update / Auto-save Personal Note
// PUT /api/notes/:noteId
// ─────────────────────────────────────────────────────────────────────────────
router.put('/:noteId', protect, async (req, res) => {
  try {
    const { noteId } = req.params;
    const userId = req.user._id?.toString() || req.user.id;
    const { title, content, sections, visibility } = req.body;

    const note = await PersonalNote.findOne({
      $or: [{ noteId }, { _id: noteId.match(/^[0-9a-fA-F]{24}$/) ? noteId : null }]
    });

    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }

    // Owner, co-owner or editor can edit
    const isOwner = note.userId === userId;
    const shareRecord = note.shares?.find(s => s.userId === userId);
    const canEdit = isOwner || shareRecord?.role === 'co-owner' || shareRecord?.role === 'editor';

    if (!canEdit) {
      return res.status(403).json({ success: false, message: 'You do not have edit permission for this note' });
    }

    if (title !== undefined) note.title = title;
    if (content !== undefined) note.content = content;
    if (sections !== undefined) note.sections = sections;
    if (visibility !== undefined && isOwner) note.visibility = visibility;

    note.lastSavedAt = new Date();
    await note.save();

    res.json({
      success: true,
      message: 'Note saved',
      note
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 27.7 Delete Note
// DELETE /api/notes/:noteId
// ─────────────────────────────────────────────────────────────────────────────
router.delete('/:noteId', protect, async (req, res) => {
  try {
    const { noteId } = req.params;
    const userId = req.user._id?.toString() || req.user.id;

    const note = await PersonalNote.findOne({
      $or: [{ noteId }, { _id: noteId.match(/^[0-9a-fA-F]{24}$/) ? noteId : null }]
    });

    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }

    // Only owner or co-owner can delete
    const isOwner = note.userId === userId;
    const isCoOwner = note.shares?.some(s => s.userId === userId && s.role === 'co-owner');

    if (!isOwner && !isCoOwner) {
      return res.status(403).json({ success: false, message: 'Only note owner or co-owner can delete this note' });
    }

    await PersonalNote.deleteOne({ _id: note._id });

    res.json({ success: true, message: 'Personal note deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 27.3, 27.4 & 27.9 AI Note Enhancement (Manual Notes + Transcript)
// POST /api/notes/:noteId/ai-enhance
// ─────────────────────────────────────────────────────────────────────────────
router.post('/:noteId/ai-enhance', protect, async (req, res) => {
  try {
    const { noteId } = req.params;
    const { template = 'STANDARD', length = 'MEDIUM' } = req.body;
    const userId = req.user._id?.toString() || req.user.id;

    let note = null;
    if (mongoose.connection.readyState === 1) {
      try {
        note = await Promise.race([
          PersonalNote.findOne({
            $or: [{ noteId }, { _id: noteId.match(/^[0-9a-fA-F]{24}$/) ? noteId : null }]
          }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2500))
        ]);
      } catch (e) {
        console.warn('PersonalNote DB lookup timeout, falling back to memory store...');
      }
    }

    if (!note) {
      for (const val of memoryNotes.values()) {
        if (val.noteId === noteId || val._id === noteId || val.id === noteId) {
          note = val;
          break;
        }
      }
    }

    if (!note) {
      // Create fallback note in memory to allow enhancement to proceed
      note = {
        noteId,
        meetingId: req.params.meetingId || 'general',
        userId,
        content: req.body.content || 'Meeting discussion and key action items.',
        sections: { important: [], questions: [], decisions: [], tasks: [], personal: [] },
        save: async function() { return this; }
      };
    }


    // 1. Gather Manual Notes Content & Sections
    let manualNotesText = note.content || '';
    const sectionTexts = [];
    if (note.sections?.important?.length) {
      sectionTexts.push(`Important Points:\n${note.sections.important.map(i => `• ${i.text}`).join('\n')}`);
    }
    if (note.sections?.questions?.length) {
      sectionTexts.push(`Questions:\n${note.sections.questions.map(q => `• ${q.text}`).join('\n')}`);
    }
    if (note.sections?.decisions?.length) {
      sectionTexts.push(`Decisions:\n${note.sections.decisions.map(d => `• ${d.text}`).join('\n')}`);
    }
    if (note.sections?.tasks?.length) {
      sectionTexts.push(`Tasks / Reminders:\n${note.sections.tasks.map(t => `• ${t.text} (Due: ${t.due || 'TBD'})`).join('\n')}`);
    }
    if (note.sections?.personal?.length) {
      sectionTexts.push(`Personal Notes:\n${note.sections.personal.map(p => `• ${p.text}`).join('\n')}`);
    }

    const combinedManualNotes = [manualNotesText, ...sectionTexts].filter(Boolean).join('\n\n') || 'None provided yet.';

    // 2. Fetch Transcript Segments (27.3) with safe timeout
    let transcriptDoc = null;
    if (mongoose.connection.readyState === 1) {
      try {
        transcriptDoc = await Promise.race([
          MeetingTranscript.findOne({ meetingId: note.meetingId }).sort({ createdAt: -1 }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000))
        ]);
      } catch (e) {
        console.warn('Transcript lookup timeout, proceeding with manual notes...');
      }
    }
    const transcriptSegments = transcriptDoc?.segments || [];
    const formattedTranscript = transcriptSegments.map(s => 
      `[${formatTimestamp(s.startTime || 0)}] ${s.speakerName}: ${s.text}`
    ).join('\n');

    let enhancedContent = '';
    let keyPoints = [];
    let decisions = [];
    let actionItems = [];
    let questions = [];
    let citations = [];

    // 3. Generate with Gemini AI (Cascading Model Fallback)
    if (!isGeminiConfigured()) {
      return res.status(503).json({
        success: false,
        message: 'Gemini AI service is not configured. Please ensure GEMINI_API_KEY is configured in the environment.'
      });
    }

    try {
      const prompt = `
You are the dedicated Personal AI Note Assistant for IntellMeet (My Notes feature).
Your task is to enrich, structure, and refine the user's personal notes using the meeting transcript.

User's Manual Notes:
${combinedManualNotes}

Meeting Transcript:
${formattedTranscript || 'No transcript available.'}

Configuration:
- Template Style: ${template} (STANDARD: balanced; EXECUTIVE: high-level decisions & takeaways; TECHNICAL: architecture, code & specs; ACTION_ORIENTED: tasks, blockers, deadlines)
- Desired Length: ${length} (SHORT: bulleted highlights; MEDIUM: comprehensive sections; LONG: detailed write-up with quotes)

Instructions:
1. Synthesize the user's manual notes with the spoken transcript facts.
2. Structure the note cleanly into Key Points, Decisions, Action Items, and Questions/Takeaways.
3. Identify which transcript segments were used as citations (speaker, timecode, text snippet).
4. Return ONLY a valid JSON object with the following schema (no markdown formatting around the JSON, no backticks):

{
  "enhancedContent": "Formatted markdown text for the enriched personal note",
  "keyPoints": ["point 1", "point 2"],
  "decisions": ["decision 1", "decision 2"],
  "actionItems": [
    { "task": "description", "owner": "assigned person", "due": "timeframe or date" }
  ],
  "questions": ["question or reminder 1"],
  "citations": [
    { "speaker": "Speaker Name", "timecode": "MM:SS", "startTime": 0, "text": "Quoted segment" }
  ]
}
`;
      const { text } = await generateGeminiContent(prompt);
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Gemini Personal Note enhancement did not return valid JSON.');
      }
      const parsed = JSON.parse(jsonMatch[0]);

      enhancedContent = parsed.enhancedContent || '';
      keyPoints = parsed.keyPoints || [];
      decisions = parsed.decisions || [];
      actionItems = parsed.actionItems || [];
      questions = parsed.questions || [];
      citations = parsed.citations || [];
    } catch (geminiErr) {
      console.error('Gemini Personal Note enhancement error:', geminiErr.message);
      return res.status(502).json({
        success: false,
        message: `Personal Note AI enhancement failed: ${geminiErr.message}. Please try again.`
      });
    }

    // 5. Update note AI enhancement record
    note.aiEnhancement = {
      enhancementId: 'enh_' + Date.now(),
      template,
      length,
      enhancedContent,
      keyPoints,
      decisions,
      actionItems,
      questions,
      citations: citations.slice(0, 6),
      model: 'gemini-3.5-flash',
      status: 'COMPLETED',
      generatedAt: new Date(),
      chatRefinements: note.aiEnhancement?.chatRefinements || []
    };

    await note.save();

    res.json({
      success: true,
      message: 'Personal note enhanced with AI successfully',
      aiEnhancement: note.aiEnhancement,
      note
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 27.4 & 27.7 Refine AI Enhanced Note via Conversational Chat
// POST /api/notes/:noteId/ai-refine
// ─────────────────────────────────────────────────────────────────────────────
router.post('/:noteId/ai-refine', protect, async (req, res) => {
  try {
    const { noteId } = req.params;
    const { refinementPrompt } = req.body;

    if (!refinementPrompt || !refinementPrompt.trim()) {
      return res.status(400).json({ success: false, message: 'Refinement prompt is required' });
    }

    let note = null;
    if (mongoose.connection.readyState === 1) {
      try {
        note = await Promise.race([
          PersonalNote.findOne({
            $or: [{ noteId }, { _id: noteId.match(/^[0-9a-fA-F]{24}$/) ? noteId : null }]
          }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2500))
        ]);
      } catch (e) {
        console.warn('PersonalNote DB lookup timeout, falling back to memory store...');
      }
    }

    if (!note) {
      for (const val of memoryNotes.values()) {
        if (val.noteId === noteId || val._id === noteId || val.id === noteId) {
          note = val;
          break;
        }
      }
    }

    if (!note) {
      note = {
        noteId,
        content: 'Meeting discussion and key action items.',
        aiEnhancement: {},
        save: async function() { return this; }
      };
    }


    let currentContent = note.aiEnhancement?.enhancedContent || note.content || '';
    let refinedContent = currentContent;
    let assistantMessage = '';

    if (!isGeminiConfigured()) {
      return res.status(503).json({
        success: false,
        message: 'Gemini AI service is not configured. Please ensure GEMINI_API_KEY is configured in the environment.'
      });
    }

    try {
      const prompt = `
The user is refining their personal meeting note.
Current Enhanced Note Content:
${currentContent}

User Refinement Instruction:
"${refinementPrompt}"

Respond with ONLY the updated markdown content for the note incorporating the requested adjustments.
`;
      const { text } = await generateGeminiContent(prompt);
      refinedContent = text.trim();
      assistantMessage = `I've updated your note according to: "${refinementPrompt}"`;
    } catch (err) {
      console.error('Gemini Note Refine error:', err.message);
      return res.status(502).json({
        success: false,
        message: `Personal Note AI refinement failed: ${err.message}. Please try again.`
      });
    }

    if (!note.aiEnhancement) note.aiEnhancement = {};
    note.aiEnhancement.enhancedContent = refinedContent;
    if (!note.aiEnhancement.chatRefinements) note.aiEnhancement.chatRefinements = [];

    note.aiEnhancement.chatRefinements.push({
      role: 'user',
      message: refinementPrompt,
      timestamp: new Date()
    });
    note.aiEnhancement.chatRefinements.push({
      role: 'assistant',
      message: assistantMessage,
      timestamp: new Date()
    });

    await note.save();

    res.json({
      success: true,
      message: 'Note refined successfully',
      enhancedContent: refinedContent,
      chatRefinements: note.aiEnhancement.chatRefinements
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 27.6 Share Note with another user (Viewer / Editor / Co-owner)
// POST /api/notes/:noteId/share
// ─────────────────────────────────────────────────────────────────────────────
router.post('/:noteId/share', protect, async (req, res) => {
  try {
    const { noteId } = req.params;
    const { email, role = 'viewer' } = req.body;
    const currentUserId = req.user._id?.toString() || req.user.id;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Target user email is required' });
    }

    const note = await PersonalNote.findOne({
      $or: [{ noteId }, { _id: noteId.match(/^[0-9a-fA-F]{24}$/) ? noteId : null }]
    });

    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }

    // Only owner or co-owner can share
    const isOwner = note.userId === currentUserId;
    const isCoOwner = note.shares?.some(s => s.userId === currentUserId && s.role === 'co-owner');

    if (!isOwner && !isCoOwner) {
      return res.status(403).json({ success: false, message: 'Only note owner or co-owner can share this note' });
    }

    // Lookup user
    const targetUser = await User.findOne({ email: email.toLowerCase() });
    const targetUserId = targetUser?._id?.toString() || 'usr_' + Date.now();
    const targetUserName = targetUser?.name || email.split('@')[0];

    // Remove existing share for this user if exists
    note.shares = (note.shares || []).filter(s => s.userEmail.toLowerCase() !== email.toLowerCase());

    // Add new share
    note.shares.push({
      userId: targetUserId,
      userEmail: email.toLowerCase(),
      userName: targetUserName,
      role,
      sharedAt: new Date()
    });

    note.visibility = 'SHARED';
    await note.save();

    res.json({
      success: true,
      message: `Note shared with ${email} as ${role}`,
      shares: note.shares
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 27.6 Revoke share
// DELETE /api/notes/:noteId/share/:targetEmailOrId
// ─────────────────────────────────────────────────────────────────────────────
router.delete('/:noteId/share/:targetEmailOrId', protect, async (req, res) => {
  try {
    const { noteId, targetEmailOrId } = req.params;
    const currentUserId = req.user._id?.toString() || req.user.id;

    const note = await PersonalNote.findOne({
      $or: [{ noteId }, { _id: noteId.match(/^[0-9a-fA-F]{24}$/) ? noteId : null }]
    });

    if (!note) return res.status(404).json({ success: false, message: 'Note not found' });

    const isOwner = note.userId === currentUserId;
    const isCoOwner = note.shares?.some(s => s.userId === currentUserId && s.role === 'co-owner');

    if (!isOwner && !isCoOwner) {
      return res.status(403).json({ success: false, message: 'Permission denied' });
    }

    note.shares = note.shares.filter(s => 
      s.userId !== targetEmailOrId && s.userEmail.toLowerCase() !== targetEmailOrId.toLowerCase()
    );

    if (note.shares.length === 0) {
      note.visibility = 'PRIVATE';
    }

    await note.save();
    res.json({ success: true, message: 'Share access revoked', shares: note.shares });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 27.5 Transcript Controls for Note (Pause / Resume / Language)
// PUT /api/notes/:noteId/transcript-control
// ─────────────────────────────────────────────────────────────────────────────
router.put('/:noteId/transcript-control', protect, async (req, res) => {
  try {
    const { noteId } = req.params;
    const { isPaused, language } = req.body;

    const note = await PersonalNote.findOne({
      $or: [{ noteId }, { _id: noteId.match(/^[0-9a-fA-F]{24}$/) ? noteId : null }]
    });

    if (!note) return res.status(404).json({ success: false, message: 'Note not found' });

    if (isPaused !== undefined) note.transcriptSettings.isPaused = !!isPaused;
    if (language !== undefined) note.transcriptSettings.language = language;

    await note.save();
    res.json({ success: true, message: 'Transcript settings updated', transcriptSettings: note.transcriptSettings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
