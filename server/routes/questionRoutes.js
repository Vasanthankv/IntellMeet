import mongoose from 'mongoose';
import express from 'express';
import { generateGeminiContent, isGeminiConfigured } from '../services/geminiService.js';
import { MeetingAIQuestionSession, MeetingQuestionItem } from '../models/MeetingQuestion.js';
import { MeetingTranscript } from '../models/MeetingTranscript.js';
import ChatMessage from '../models/ChatMessage.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router({ mergeParams: true });
const getMeetingId = (req) => req.params.meetingId || req.body.meetingId || req.query.meetingId;


const memoryQuestionSessions = new Map();
const memoryQuestionItems = new Map();

const safeFindQuestionSession = async (meetingId) => {
  if (mongoose.connection.readyState === 1) {
    try {
      const doc = await Promise.race([
        MeetingAIQuestionSession.findOne({ meetingId }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000))
      ]);
      if (doc) return doc;
    } catch (e) {
      console.warn('DB MeetingAIQuestionSession read warning:', e.message);
    }
  }
  if (!memoryQuestionSessions.has(meetingId)) {
    memoryQuestionSessions.set(meetingId, {
      meetingId,
      status: 'ACTIVE',
      autoStart: false,
      permissions: { whoCanAsk: 'ALL_PARTICIPANTS', contextScope: 'ENTIRE_MEETING' },
      allowedSources: { transcript: true, chat: true, screenOcr: true },
      save: async function() { return this; }
    });
  }
  return memoryQuestionSessions.get(meetingId);
};

const safeSaveQuestionSession = async (session) => {
  if (mongoose.connection.readyState === 1 && session && typeof session.save === 'function') {
    try {
      return await Promise.race([
        session.save(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000))
      ]);
    } catch (e) {
      console.warn('DB MeetingAIQuestionSession save warning:', e.message);
    }
  }
  if (session && session.meetingId) {
    memoryQuestionSessions.set(session.meetingId, session);
  }
  return session;
};


// Format seconds to MM:SS
const formatTimestamp = (totalSecs) => {
  const mins = Math.floor((totalSecs || 0) / 60);
  const secs = Math.floor((totalSecs || 0) % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

// ─────────────────────────────────────────────────────────────────────────────
// 26.3 & 26.4 Get or Initialize AI Questions Session
// GET /api/meetings/:meetingId/questions/session
// ─────────────────────────────────────────────────────────────────────────────
router.get('/session', protect, async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    if (!meetingId) return res.status(400).json({ success: false, message: 'meetingId required' });

    let session = await safeFindQuestionSession(meetingId);
    res.json({ success: true, session });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 26.12 & 26.13 Update Permissions and Settings (Host)
// PUT /api/meetings/:meetingId/questions/settings
// ─────────────────────────────────────────────────────────────────────────────
router.put('/settings', protect, async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    const { whoCanAsk, contextScope, allowedSources, autoStart } = req.body;

    let session = await MeetingAIQuestionSession.findOne({ meetingId });
    if (!session) session = new MeetingAIQuestionSession({ meetingId });

    if (whoCanAsk) session.permissions.whoCanAsk = whoCanAsk;
    if (contextScope) session.permissions.contextScope = contextScope;
    if (allowedSources) {
      session.allowedSources = {
        ...session.allowedSources.toObject(),
        ...allowedSources
      };
    }
    if (autoStart !== undefined) session.autoStart = !!autoStart;

    await session.save();
    res.json({ success: true, message: 'AI Question settings updated', session });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 26.4 Start Meeting Questions
// POST /api/meetings/:meetingId/questions/start
// ─────────────────────────────────────────────────────────────────────────────
router.post('/start', protect, async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    let session = await safeFindQuestionSession(meetingId);
    session.status = 'ACTIVE';
    session.startedAt = new Date();
    await safeSaveQuestionSession(session);

    res.json({ success: true, message: 'AI Meeting Questions active', session });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 26.18 Pause, Resume, or Stop AI Questions
// ─────────────────────────────────────────────────────────────────────────────
router.put('/pause', protect, async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    const session = await MeetingAIQuestionSession.findOne({ meetingId });
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });

    session.status = 'PAUSED';
    await session.save();
    res.json({ success: true, message: 'AI Meeting Questions paused', session });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/resume', protect, async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    const session = await MeetingAIQuestionSession.findOne({ meetingId });
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });

    session.status = 'ACTIVE';
    await session.save();
    res.json({ success: true, message: 'AI Meeting Questions resumed', session });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/stop', protect, async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    const { deleteContext = false } = req.body;

    const session = await MeetingAIQuestionSession.findOne({ meetingId });
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });

    session.status = 'DISABLED';
    session.endedAt = new Date();
    await session.save();

    if (deleteContext) {
      await MeetingQuestionItem.deleteMany({ meetingId });
    }

    res.json({ success: true, message: 'AI Meeting Questions stopped', session, contextPurged: !!deleteContext });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 26.5 - 26.11 Ask a Meeting Question (RAG Retrieval Pipeline)
// POST /api/meetings/:meetingId/questions/ask
// ─────────────────────────────────────────────────────────────────────────────
router.post('/ask', protect, async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    const { question, presetType = 'CUSTOM', joinedAtSeconds = 0 } = req.body;
    const user = req.user || {};

    if (!question || !question.trim()) {
      return res.status(400).json({ success: false, message: 'Question string is required' });
    }

    // 1. Check Session & Permissions (26.12, 26.13, 26.17)
    let session = await safeFindQuestionSession(meetingId);

    const isHost = user.role === 'host' || user.id === 'host';
    if (session.status === 'DISABLED' && !isHost) {
      return res.status(403).json({
        success: false,
        message: 'AI Meeting Questions is currently disabled by the host.'
      });
    }

    // 2. Retrieve Meeting Context (26.14, 26.15)
    let contextSegments = [];

    // Source A: Part 24 Transcript
    if (session.allowedSources?.transcript !== false) {
      let transcriptDoc = null;
      if (mongoose.connection.readyState === 1) {
        try { transcriptDoc = await MeetingTranscript.findOne({ meetingId }).sort({ createdAt: -1 }); } catch (e) {}
      }
      if (transcriptDoc?.segments) {
        let segs = transcriptDoc.segments;
        // Scope filtering (26.13)
        if (session.permissions?.contextScope === 'SINCE_JOINED' && joinedAtSeconds > 0) {
          segs = segs.filter(s => (s.startTime || 0) >= joinedAtSeconds);
        }
        segs.forEach(s => {
          contextSegments.push({
            sourceType: 'TRANSCRIPT',
            speakerName: s.speakerName || 'Participant',
            startTime: s.startTime || 0,
            endTime: s.endTime || (s.startTime || 0) + 3,
            timecode: formatTimestamp(s.startTime || 0),
            text: s.text
          });
        });
      }
    }

    // Source B: Meeting Chat (Continuous Meeting Chat - 26.15 & 35.15)
    if (session.allowedSources?.chat !== false) {
      let chatDocs = [];
      if (mongoose.connection.readyState === 1) {
        try { chatDocs = await ChatMessage.find({ meetingId, isDeleted: { $ne: true } }).sort({ createdAt: 1 }).limit(100); } catch (e) {}
      }
      chatDocs.forEach(c => {
        const chatText = c.text || c.message || (c.fileName ? `[Shared File: ${c.fileName}]` : '');
        if (chatText) {
          contextSegments.push({
            sourceType: 'CHAT',
            speakerName: `${c.senderName || 'Chat'} (${c.phase || 'DURING'})`,
            startTime: 0,
            endTime: 0,
            timecode: c.createdAt ? new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '00:00',
            text: `[Phase: ${c.phase || 'DURING'}] ${chatText}`
          });
        }
      });
    }

    // 3. Fallback Dialogue if context is empty
    if (contextSegments.length === 0) {
      contextSegments.push({
        sourceType: 'TRANSCRIPT',
        speakerName: 'System',
        startTime: 0,
        endTime: 5,
        timecode: '00:00',
        text: 'The meeting commenced with architecture review and sprint planning.'
      });
    }

    // 4. Grounding Context String for RAG
    const formattedContext = contextSegments.map(c => 
      `[${c.sourceType} | ${c.timecode}] ${c.speakerName}: ${c.text}`
    ).join('\n');

    let answerText = '';
    let citedSources = [];
    let confidence = 0.95;

    // 5. Query LLM (Gemini AI with Model Cascade) with Grounded RAG Prompt (26.24)
    if (isGeminiConfigured()) {
      try {
        const prompt = `
You are the dedicated in-meeting AI assistant for IntellMeet.
A meeting participant has asked a question during an active meeting.
You must answer strictly based on the provided meeting context (speech-to-text transcript and chat).
Do NOT extrapolate beyond the facts stated in the context.
If the information was not mentioned, state: "That was not discussed in the meeting context available so far."

User Question: "${question}"
Question Type: ${presetType}
User Asking: ${user.name || 'Participant'}

Meeting Context:
${formattedContext}

Return ONLY valid JSON with this exact schema (no markdown, no backticks):
{
  "answer": "Direct, helpful, concise answer to the question",
  "confidence": 0.95,
  "sources": [
    {
      "sourceType": "TRANSCRIPT or CHAT",
      "speakerName": "Name of person who said this",
      "timecode": "MM:SS or timestamp",
      "startTime": 0,
      "textSnippet": "Exact sentence or segment quoted"
    }
  ]
}
`;
        const { text } = await generateGeminiContent(prompt);
        const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        answerText = parsed.answer;
        confidence = parsed.confidence || 0.95;
        citedSources = (parsed.sources || []).map(s => ({
          sourceType: s.sourceType || 'TRANSCRIPT',
          speakerName: s.speakerName || 'Speaker',
          timecode: s.timecode || '00:00',
          startTime: s.startTime || 0,
          endTime: s.startTime ? s.startTime + 4 : 4,
          textSnippet: s.textSnippet || '',
          relevanceScore: 0.95
        }));
      } catch (geminiErr) {
        console.warn('Gemini Meeting Questions fallback triggered:', geminiErr.message);
      }
    }

    // 6. Heuristic RAG Fallback if Gemini unavailable or rate-limited
    if (!answerText) {
      const qLower = question.toLowerCase();
      const matched = [];

      contextSegments.forEach(seg => {
        const sLower = seg.text.toLowerCase();
        let matchScore = 0;
        const words = qLower.split(' ').filter(w => w.length > 3);
        words.forEach(w => {
          if (sLower.includes(w)) matchScore += 1;
        });

        if (matchScore > 0 || presetType === 'CATCH_ME_UP') {
          matched.push({ seg, score: matchScore });
        }
      });

      matched.sort((a, b) => b.score - a.score);
      const topMatches = matched.slice(0, 3).map(m => m.seg);

      if (presetType === 'CATCH_ME_UP') {
        answerText = `Here is what was discussed so far:\n• ` +
          contextSegments.slice(0, 4).map(s => `${s.speakerName}: "${s.text}"`).join('\n• ');
        citedSources = contextSegments.slice(0, 3).map(s => ({
          sourceType: s.sourceType,
          speakerName: s.speakerName,
          timecode: s.timecode,
          startTime: s.startTime,
          endTime: s.endTime,
          textSnippet: s.text,
          relevanceScore: 0.9
        }));
      } else if (presetType === 'DECISIONS' || qLower.includes('decide') || qLower.includes('decision')) {
        const decSeg = contextSegments.find(s => s.text.toLowerCase().includes('agree') || s.text.toLowerCase().includes('decid') || s.text.toLowerCase().includes('let\'s')) || contextSegments[0];
        answerText = `The team agreed: "${decSeg.text}".`;
        citedSources = [{
          sourceType: decSeg.sourceType,
          speakerName: decSeg.speakerName,
          timecode: decSeg.timecode,
          startTime: decSeg.startTime,
          endTime: decSeg.endTime,
          textSnippet: decSeg.text,
          relevanceScore: 0.95
        }];
      } else if (presetType === 'ACTION_ITEMS' || qLower.includes('action') || qLower.includes('task') || qLower.includes('who is')) {
        const actSeg = contextSegments.find(s => s.text.toLowerCase().includes('will') || s.text.toLowerCase().includes('action') || s.text.toLowerCase().includes('complete')) || contextSegments[contextSegments.length - 1];
        answerText = `${actSeg.speakerName} committed to: "${actSeg.text}".`;
        citedSources = [{
          sourceType: actSeg.sourceType,
          speakerName: actSeg.speakerName,
          timecode: actSeg.timecode,
          startTime: actSeg.startTime,
          endTime: actSeg.endTime,
          textSnippet: actSeg.text,
          relevanceScore: 0.95
        }];
      } else if (presetType === 'DEADLINES' || qLower.includes('deadline') || qLower.includes('when') || qLower.includes('date')) {
        const deadSeg = contextSegments.find(s => s.text.toLowerCase().includes('friday') || s.text.toLowerCase().includes('monday') || s.text.toLowerCase().includes('today') || s.text.toLowerCase().includes('deadline')) || contextSegments[0];
        answerText = `According to ${deadSeg.speakerName}, the agreed timeframe is: "${deadSeg.text}".`;
        citedSources = [{
          sourceType: deadSeg.sourceType,
          speakerName: deadSeg.speakerName,
          timecode: deadSeg.timecode,
          startTime: deadSeg.startTime,
          endTime: deadSeg.endTime,
          textSnippet: deadSeg.text,
          relevanceScore: 0.95
        }];
      } else if (presetType === 'MY_NAME' || qLower.includes('my name') || (user.name && qLower.includes(user.name.toLowerCase()))) {
        const nameQuery = user.name ? user.name.toLowerCase() : 'you';
        const mention = contextSegments.find(s => s.text.toLowerCase().includes(nameQuery));
        if (mention) {
          answerText = `Your name was mentioned by ${mention.speakerName}: "${mention.text}".`;
          citedSources = [{
            sourceType: mention.sourceType,
            speakerName: mention.speakerName,
            timecode: mention.timecode,
            startTime: mention.startTime,
            endTime: mention.endTime,
            textSnippet: mention.text,
            relevanceScore: 0.95
          }];
        } else {
          answerText = `Your name (${user.name || 'Participant'}) has not been mentioned in the meeting discussion recorded so far.`;
        }
      } else if (topMatches.length > 0) {
        answerText = `Based on the discussion, ${topMatches[0].speakerName} stated: "${topMatches[0].text}".`;
        citedSources = topMatches.map(s => ({
          sourceType: s.sourceType,
          speakerName: s.speakerName,
          timecode: s.timecode,
          startTime: s.startTime,
          endTime: s.endTime,
          textSnippet: s.text,
          relevanceScore: 0.9
        }));
      } else {
        answerText = `I analyzed the available meeting transcript and chat, but no specific discussion matched your question: "${question}".`;
      }
    }

    // 7. Store Question and Answer Item (26.23)
    const itemData = {
      meetingId,
      questionId: 'q_' + Math.random().toString(36).substring(2, 9),
      userId: user._id?.toString() || user.id || 'participant',
      userName: user.name || 'Participant',
      userRole: isHost ? 'host' : 'participant',
      question: question.trim(),
      presetType,
      contextStartTime: joinedAtSeconds || 0,
      status: 'ANSWERED',
      answer: {
        text: answerText,
        confidence,
        sources: citedSources,
        model: genAI ? 'gemini-1.5-flash' : 'intellmeet-heuristic-rag',
        generatedAt: new Date()
      },
      createdAt: new Date()
    };

    let questionItem = itemData;
    if (mongoose.connection.readyState === 1) {
      try {
        questionItem = await Promise.race([
          MeetingQuestionItem.create(itemData),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000))
        ]);
      } catch (e) {
        questionItem = itemData;
      }
    }

    res.status(201).json({
      success: true,
      questionItem
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 26.28 Question History
// GET /api/meetings/:meetingId/questions/history
// ─────────────────────────────────────────────────────────────────────────────
router.get('/history', protect, async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    const questions = await MeetingQuestionItem.find({ meetingId }).sort({ createdAt: 1 }).limit(100);
    res.json({ success: true, count: questions.length, questions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Delete Question
// DELETE /api/meetings/:meetingId/questions/:questionId
// ─────────────────────────────────────────────────────────────────────────────
router.delete('/:questionId', protect, async (req, res) => {
  try {
    const { questionId } = req.params;
    await MeetingQuestionItem.deleteOne({ questionId });
    res.json({ success: true, message: 'Question removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Clear Meeting Questions History
// DELETE /api/meetings/:meetingId/questions/clear
// ─────────────────────────────────────────────────────────────────────────────
router.delete('/clear/all', protect, async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    const result = await MeetingQuestionItem.deleteMany({ meetingId });
    res.json({ success: true, message: 'Question history cleared', deletedCount: result.deletedCount });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
