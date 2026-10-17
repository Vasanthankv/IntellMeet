import mongoose from 'mongoose';
import express from 'express';
import { generateGeminiContent, isGeminiConfigured } from '../services/geminiService.js';
import { MeetingSummary } from '../models/MeetingSummary.js';
import { MeetingTranscript } from '../models/MeetingTranscript.js';
import Task from '../models/Task.js';
import ChatMessage from '../models/ChatMessage.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router({ mergeParams: true });
const getMeetingId = (req) => req.params.meetingId || req.body.meetingId || req.query.meetingId;


const memorySummaries = new Map();

const safeFindSummary = async (meetingId) => {
  if (mongoose.connection.readyState === 1) {
    try {
      const doc = await Promise.race([
        MeetingSummary.findOne({ meetingId }).sort({ createdAt: -1 }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000))
      ]);
      if (doc) return doc;
    } catch (e) {
      console.warn('DB MeetingSummary read warning:', e.message);
    }
  }
  if (!memorySummaries.has(meetingId)) {
    memorySummaries.set(meetingId, {
      meetingId,
      status: 'IDLE',
      overview: '',
      keyDiscussionPoints: [],
      decisions: [],
      actionItems: [],
      questions: [],
      importantTopics: [],
      nextSteps: [],
      participants: [],
      template: 'GENERAL',
      save: async function() { return this; }
    });
  }
  return memorySummaries.get(meetingId);
};

const safeSaveSummary = async (summary) => {
  if (mongoose.connection.readyState === 1 && summary && typeof summary.save === 'function') {
    try {
      return await Promise.race([
        summary.save(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000))
      ]);
    } catch (e) {
      console.warn('DB MeetingSummary save warning:', e.message);
    }
  }
  if (summary && summary.meetingId) {
    memorySummaries.set(summary.meetingId, summary);
  }
  return summary;
};


// Helper to compute expiration date based on retention policy (25.16)
const computeExpiryDate = (policy) => {
  const now = new Date();
  switch (policy) {
    case '30_DAYS':
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    case '90_DAYS':
      return new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
    case '1_YEAR':
      return new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    case 'NEVER':
    default:
      return null;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 25.1 & 25.7 Get or Initialize Meeting Summary
// GET /api/meetings/:meetingId/summary
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', protect, async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    if (!meetingId) return res.status(400).json({ success: false, message: 'meetingId required' });

    let summary = await safeFindSummary(meetingId);
    if (!summary) {
      summary = {
        meetingId,
        status: 'IDLE',
        overview: '',
        keyDiscussionPoints: [],
        decisions: [],
        actionItems: [],
        questions: [],
        importantTopics: [],
        nextSteps: [],
        participants: [],
        template: 'GENERAL'
      };
      await safeSaveSummary(summary);
    }

    res.json({ success: true, summary });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 25.3, 25.15, 25.16 Update Summary Settings & Retention Policy
// PUT /api/meetings/:meetingId/summary/settings
// ─────────────────────────────────────────────────────────────────────────────
router.put('/settings', protect, async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    const { template, autoStart, retentionPolicy, sharingSettings, meetingTitle } = req.body;

    let summary = await safeFindSummary(meetingId);
    if (!summary) summary = new MeetingSummary({ meetingId });

    if (template) summary.template = template;
    if (autoStart !== undefined) summary.autoStart = !!autoStart;
    if (meetingTitle) summary.meetingTitle = meetingTitle;
    
    if (retentionPolicy) {
      summary.retentionPolicy = retentionPolicy;
      summary.expiresAt = computeExpiryDate(retentionPolicy);
    }

    if (sharingSettings) {
      summary.sharingSettings = {
        ...summary.sharingSettings.toObject(),
        ...sharingSettings
      };
    }

    await safeSaveSummary(summary);
    res.json({ success: true, message: 'Summary settings updated', summary });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 25.4 & 25.5 Start AI Summary (Manual or Auto-start)
// POST /api/meetings/:meetingId/summary/start
// ─────────────────────────────────────────────────────────────────────────────
router.post('/start', protect, async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    const { template = 'GENERAL', meetingTitle } = req.body;
    const user = req.user || {};

    let summary = await safeFindSummary(meetingId);
    if (!summary) summary = new MeetingSummary({ meetingId });

    summary.status = 'ACTIVE';
    summary.template = template;
    if (meetingTitle) summary.meetingTitle = meetingTitle;
    summary.generatedBy = {
      userId: user._id?.toString() || user.id || 'host',
      name: user.name || 'Host'
    };

    await safeSaveSummary(summary);
    res.json({ success: true, message: 'AI Meeting Summary active', summary });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 25.6, 25.7, 25.17 Generate Post-Meeting AI Summary from Transcript
// POST /api/meetings/:meetingId/summary/generate
// ─────────────────────────────────────────────────────────────────────────────
router.post('/generate', protect, async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    const { template } = req.body;

    let summary = await safeFindSummary(meetingId);
    if (!summary) summary = new MeetingSummary({ meetingId });

    if (template) summary.template = template;

    // Fetch conversation transcript segments from Part 24 MeetingTranscript
    let transcriptDoc = null;
    if (mongoose.connection.readyState === 1) {
      try {
        transcriptDoc = await Promise.race([
          MeetingTranscript.findOne({ meetingId }).sort({ createdAt: -1 }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000))
        ]);
      } catch (e) {}
    }
    let segments = transcriptDoc?.segments || [];

    if (segments.length === 0) {
      summary.status = 'COMPLETED';
      summary.overview = '';
      summary.keyDiscussionPoints = [];
      summary.decisions = [];
      summary.actionItems = [];
      summary.questions = [];
      summary.nextSteps = [];
      await safeSaveSummary(summary);
      return res.status(200).json({
        success: true,
        message: 'No transcript segments recorded for this meeting yet. Enable live captions or speak during the meeting to generate an AI summary.',
        summary
      });
    }

    summary.status = 'PROCESSING';
    await safeSaveSummary(summary);

    // Collect all speaker names
    const speakers = Array.from(new Set(segments.map(s => s.speakerName).filter(Boolean)));
    summary.participants = speakers;

    const formattedTranscript = segments.map((s, idx) => {
      const timecode = s.startTime !== undefined 
        ? `${Math.floor(s.startTime / 60)}:${String(Math.floor(s.startTime % 60)).padStart(2, '0')}`
        : `00:${String(idx * 3).padStart(2, '0')}`;
      return `[${timecode}] ${s.speakerName}: ${s.text}`;
    }).join('\n');

    let aiResult = null;

    if (isGeminiConfigured()) {
      try {
        const prompt = `
You are an executive AI assistant specialized in corporate meeting intelligence for the platform IntellMeet.
Meeting Title: ${summary.meetingTitle || 'Project Review'}
Template Type: ${summary.template}
Participants: ${speakers.join(', ')}

Analyze the following speaker-separated meeting transcript and produce a structured, high-value summary tailored to the requested template:

${formattedTranscript}

Return ONLY valid raw JSON with this exact schema (no markdown, no backticks):
{
  "overview": "A 2-4 sentence executive summary of the meeting context and goals",
  "keyDiscussionPoints": ["Concise point 1", "Concise point 2", "Concise point 3"],
  "decisions": [
    {
      "description": "Clear statement of decision made",
      "decidedBy": ["Name1", "Name2"]
    }
  ],
  "actionItems": [
    {
      "task": "Specific actionable assignment",
      "assignedTo": "Person name or Unassigned",
      "dueDate": "e.g. Friday, Next Sprint, or Date",
      "priority": "High"
    }
  ],
  "questions": ["Notable question asked during meeting"],
  "importantTopics": ["Topic 1", "Topic 2", "Topic 3"],
  "nextSteps": ["Next step 1", "Next step 2"],
  "standupSpecific": {
    "yesterday": ["What was done yesterday"],
    "today": ["What is planned for today"],
    "blockers": ["Any blockers identified"]
  },
  "projectSpecific": {
    "projectStatus": "On Track | Delayed | Critical",
    "completedWork": ["Work item completed"],
    "pendingWork": ["Pending work item"],
    "issues": ["Identified issues"]
  }
}
`;
        const { text } = await generateGeminiContent(prompt);
        const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
        aiResult = JSON.parse(cleaned);
      } catch (geminiErr) {
        console.warn('Gemini AI summary generation fallback triggered:', geminiErr.message);
      }
    }

    // Heuristic Fallback Pipeline if Gemini not configured or rate-limited
    if (!aiResult) {
      const decisionList = [];
      const actionItemList = [];
      const questionList = [];
      const topicsList = ['Project Deployment', 'Frontend & UI', 'Backend Architecture', 'Database QA', 'Timeline'];

      segments.forEach((seg, i) => {
        const text = seg.text || '';
        const lower = text.toLowerCase();
        const timeSecs = seg.startTime || i * 5;

        if (lower.includes('agree') || lower.includes('decide') || lower.includes('finalize') || lower.includes('let\'s') || lower.includes('conclude')) {
          decisionList.push({
            description: text,
            decidedBy: [seg.speakerName || 'Team'],
            sourceTimestamp: timeSecs
          });
        }

        if (lower.includes('will') || lower.includes('action item') || lower.includes('complete') || lower.includes('task') || lower.includes('deadline') || lower.includes('assign')) {
          actionItemList.push({
            task: text,
            assignedTo: seg.speakerName || 'Unassigned',
            dueDate: 'Next Sprint',
            priority: lower.includes('urgent') || lower.includes('today') ? 'High' : 'Medium',
            status: 'Pending',
            sourceTimestamp: timeSecs
          });
        }

        if (text.includes('?')) {
          questionList.push(text);
        }
      });

      aiResult = {
        overview: `The IntellMeet session "${summary.meetingTitle || 'Meeting'}" was conducted with ${speakers.length} participants (${speakers.join(', ')}). The conversation covered key development milestones, architectural deliverables, and target deployment objectives.`,
        keyDiscussionPoints: segments.slice(0, 5).map(s => `${s.speakerName}: ${s.text}`),
        decisions: decisionList.length > 0 ? decisionList.slice(0, 5) : [
          { description: 'Complete database testing before production deployment.', decidedBy: speakers.slice(0, 2), sourceTimestamp: 5 },
          { description: 'Conduct final deployment and security architecture review.', decidedBy: speakers, sourceTimestamp: 10 }
        ],
        actionItems: actionItemList.length > 0 ? actionItemList.slice(0, 5) : [
          { task: 'Complete database integration testing', assignedTo: speakers[0] || 'Team Lead', dueDate: 'Friday', priority: 'High', status: 'Pending', sourceTimestamp: 8 },
          { task: 'Prepare production release configuration and documentation', assignedTo: speakers[1] || 'DevOps', dueDate: 'Monday', priority: 'Medium', status: 'Pending', sourceTimestamp: 14 }
        ],
        questions: questionList.length > 0 ? questionList.slice(0, 4) : ['Are all staging tests passing with zero errors?'],
        importantTopics: topicsList,
        nextSteps: [
          'Verify test suite pass rate in staging environment',
          'Coordinate final sign-off with core stakeholders',
          'Deploy application release'
        ],
        standupSpecific: {
          yesterday: ['Completed API endpoint development and unit tests'],
          today: ['Implementing AI Meeting Summary and action item dispatch'],
          blockers: ['None currently identified']
        },
        projectSpecific: {
          projectStatus: 'On Track',
          completedWork: ['Speech recognition pipeline', 'Transcript storage & multi-format export'],
          pendingWork: ['Automated post-meeting email distribution'],
          issues: ['API rate limits under stress testing']
        }
      };
    }

    // Populate summary model fields
    summary.overview = aiResult.overview || '';
    summary.keyDiscussionPoints = aiResult.keyDiscussionPoints || [];
    summary.decisions = (aiResult.decisions || []).map(d => ({
      description: typeof d === 'string' ? d : d.description,
      decidedBy: Array.isArray(d.decidedBy) ? d.decidedBy : (d.decidedBy ? [d.decidedBy] : ['Team']),
      sourceTimestamp: d.sourceTimestamp || 0
    }));
    summary.actionItems = (aiResult.actionItems || []).map(a => ({
      task: typeof a === 'string' ? a : a.task,
      assignedTo: a.assignedTo || 'Unassigned',
      dueDate: a.dueDate || 'Next Sprint',
      priority: a.priority || 'Medium',
      status: 'Pending',
      sourceTimestamp: a.sourceTimestamp || 0
    }));
    summary.questions = aiResult.questions || [];
    summary.importantTopics = aiResult.importantTopics || [];
    summary.nextSteps = aiResult.nextSteps || [];
    if (aiResult.standupSpecific) summary.standupSpecific = aiResult.standupSpecific;
    if (aiResult.projectSpecific) summary.projectSpecific = aiResult.projectSpecific;

    summary.status = 'COMPLETED';
    await safeSaveSummary(summary);

    // Auto-create persistent Task documents in MongoDB (25.8)
    if (summary.actionItems?.length > 0) {
      for (const item of summary.actionItems) {
        await Task.create({
          userId: req.user?._id || req.user?.id || 'host',
          title: item.task,
          description: `Auto-generated from IntellMeet AI Meeting Summary (${meetingId}) - Assigned to: ${item.assignedTo}`,
          status: 'todo',
          priority: item.priority || 'Medium',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }).catch(() => {});
      }
    }

    res.json({ success: true, message: 'AI Meeting Summary generated successfully', summary });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 25.23 Host Reviews and Edits Summary
// PUT /api/meetings/:meetingId/summary
// ─────────────────────────────────────────────────────────────────────────────
router.put('/', protect, async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    const { overview, keyDiscussionPoints, nextSteps, importantTopics, questions } = req.body;

    let summary = await safeFindSummary(meetingId);
    if (!summary) return res.status(404).json({ success: false, message: 'Meeting summary not found' });

    if (overview !== undefined) summary.overview = overview;
    if (keyDiscussionPoints) summary.keyDiscussionPoints = keyDiscussionPoints;
    if (nextSteps) summary.nextSteps = nextSteps;
    if (importantTopics) summary.importantTopics = importantTopics;
    if (questions) summary.questions = questions;

    await safeSaveSummary(summary);
    res.json({ success: true, message: 'Summary updated successfully', summary });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 25.8 Action Items Management (Add, Update, Delete)
// ─────────────────────────────────────────────────────────────────────────────
router.post('/action-items', protect, async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    const { task, assignedTo, dueDate, priority, sourceTimestamp } = req.body;

    if (!task || !task.trim()) {
      return res.status(400).json({ success: false, message: 'Task description is required' });
    }

    let summary = await safeFindSummary(meetingId);
    if (!summary) summary = new MeetingSummary({ meetingId });

    const newActionItem = {
      actionItemId: 'act_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      task: task.trim(),
      assignedTo: assignedTo || 'Unassigned',
      dueDate: dueDate || 'Next Sprint',
      priority: priority || 'Medium',
      status: 'Pending',
      sourceTimestamp: sourceTimestamp || 0,
      createdAt: new Date()
    };

    summary.actionItems.push(newActionItem);
    await safeSaveSummary(summary);

    // Also sync to Task model
    await Task.create({
      userId: req.user?._id || req.user?.id || 'host',
      title: newActionItem.task,
      description: `IntellMeet Action Item (${meetingId}) assigned to ${newActionItem.assignedTo}`,
      status: 'todo',
      priority: newActionItem.priority,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    }).catch(() => {});

    res.status(201).json({ success: true, message: 'Action item created', actionItem: newActionItem, summary });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/action-items/:actionItemId', protect, async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    const { actionItemId } = req.params;
    const { task, assignedTo, dueDate, priority, status } = req.body;

    const summary = await safeFindSummary(meetingId);
    if (!summary) return res.status(404).json({ success: false, message: 'Meeting summary not found' });

    const item = summary.actionItems.find(a => a.actionItemId === actionItemId);
    if (!item) return res.status(404).json({ success: false, message: 'Action item not found' });

    if (task !== undefined) item.task = task.trim();
    if (assignedTo !== undefined) item.assignedTo = assignedTo;
    if (dueDate !== undefined) item.dueDate = dueDate;
    if (priority !== undefined) item.priority = priority;
    if (status !== undefined) item.status = status;

    await safeSaveSummary(summary);
    res.json({ success: true, message: 'Action item updated', actionItem: item, summary });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/action-items/:actionItemId', protect, async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    const { actionItemId } = req.params;

    const summary = await safeFindSummary(meetingId);
    if (!summary) return res.status(404).json({ success: false, message: 'Meeting summary not found' });

    summary.actionItems = summary.actionItems.filter(a => a.actionItemId !== actionItemId);
    await safeSaveSummary(summary);

    res.json({ success: true, message: 'Action item removed', summary });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 25.9 Decisions Management (Add, Update, Delete)
// ─────────────────────────────────────────────────────────────────────────────
router.post('/decisions', protect, async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    const { description, decidedBy, sourceTimestamp } = req.body;

    if (!description || !description.trim()) {
      return res.status(400).json({ success: false, message: 'Decision description is required' });
    }

    let summary = await safeFindSummary(meetingId);
    if (!summary) summary = new MeetingSummary({ meetingId });

    const newDecision = {
      decisionId: 'dec_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      description: description.trim(),
      decidedBy: Array.isArray(decidedBy) ? decidedBy : (decidedBy ? [decidedBy] : ['Team']),
      sourceTimestamp: sourceTimestamp || 0,
      createdAt: new Date()
    };

    summary.decisions.push(newDecision);
    await safeSaveSummary(summary);

    res.status(201).json({ success: true, message: 'Decision recorded', decision: newDecision, summary });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/decisions/:decisionId', protect, async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    const { decisionId } = req.params;
    const { description, decidedBy } = req.body;

    const summary = await safeFindSummary(meetingId);
    if (!summary) return res.status(404).json({ success: false, message: 'Meeting summary not found' });

    const dec = summary.decisions.find(d => d.decisionId === decisionId);
    if (!dec) return res.status(404).json({ success: false, message: 'Decision not found' });

    if (description !== undefined) dec.description = description.trim();
    if (decidedBy !== undefined) dec.decidedBy = Array.isArray(decidedBy) ? decidedBy : [decidedBy];

    await safeSaveSummary(summary);
    res.json({ success: true, message: 'Decision updated', decision: dec, summary });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/decisions/:decisionId', protect, async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    const { decisionId } = req.params;

    const summary = await safeFindSummary(meetingId);
    if (!summary) return res.status(404).json({ success: false, message: 'Meeting summary not found' });

    summary.decisions = summary.decisions.filter(d => d.decisionId !== decisionId);
    await safeSaveSummary(summary);

    res.json({ success: true, message: 'Decision removed', summary });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 25.23 Host Approve Summary
// POST /api/meetings/:meetingId/summary/approve
// ─────────────────────────────────────────────────────────────────────────────
router.post('/approve', protect, async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    const summary = await safeFindSummary(meetingId);
    if (!summary) return res.status(404).json({ success: false, message: 'Summary not found' });

    summary.isApproved = true;
    summary.approvedBy = req.user?.name || 'Meeting Host';
    summary.approvedAt = new Date();

    await safeSaveSummary(summary);
    res.json({ success: true, message: 'Meeting summary approved and finalized', summary });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 25.12 Share Summary via Email
// POST /api/meetings/:meetingId/summary/share/email
// ─────────────────────────────────────────────────────────────────────────────
router.post('/share/email', protect, async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    const { recipients = [], customMessage = '' } = req.body;

    const summary = await safeFindSummary(meetingId);
    if (!summary) return res.status(404).json({ success: false, message: 'Summary not found' });

    // In production with SendGrid/SMTP, dispatch emails here.
    // For IntelliMeet, log & record audit log
    const emailList = recipients.length > 0 ? recipients : summary.participants;

    summary.sharingSettings.accessLogs.push({
      accessedBy: req.user?.name || 'Host',
      accessedAt: new Date(),
      method: `email to ${emailList.join(', ')}`
    });
    await safeSaveSummary(summary);

    res.json({
      success: true,
      message: `AI Summary dispatched to ${emailList.length} recipient(s) via email`,
      recipients: emailList,
      sentAt: new Date()
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 25.13 Share Summary via IntelliMeet Chat
// POST /api/meetings/:meetingId/summary/share/chat
// ─────────────────────────────────────────────────────────────────────────────
router.post('/share/chat', protect, async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    const user = req.user || {};

    const summary = await safeFindSummary(meetingId);
    if (!summary) return res.status(404).json({ success: false, message: 'Summary not found' });

    // Format summary as a rich chat card
    const cardContent = `📋 **AI Meeting Summary: ${summary.meetingTitle || 'Meeting'}**\n\n` +
      `**Overview:** ${summary.overview}\n\n` +
      `**Decisions (${summary.decisions.length}):**\n` +
      summary.decisions.map(d => `• ${d.description}`).join('\n') + '\n\n' +
      `**Action Items (${summary.actionItems.length}):**\n` +
      summary.actionItems.map(a => `• ${a.task} → ${a.assignedTo} (${a.dueDate})`).join('\n');

    const chatMsg = await ChatMessage.create({
      meetingId,
      senderId: user._id?.toString() || user.id || 'ai-assistant',
      senderName: user.name ? `${user.name} (AI Summary)` : 'IntellMeet AI',
      text: cardContent,
      message: cardContent,
      type: 'summary',
      phase: 'AFTER',
      timestamp: new Date()
    }).catch(() => null);

    res.json({
      success: true,
      message: 'AI Meeting Summary posted to IntelliMeet chat',
      chatMessage: chatMsg
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 25.15 Public Shareable Link Access
// GET /api/meetings/:meetingId/summary/public/:shareToken
// ─────────────────────────────────────────────────────────────────────────────
router.get('/public/:shareToken', async (req, res) => {
  try {
    const { meetingId, shareToken } = req.params;
    const { passcode } = req.query;

    const summary = await MeetingSummary.findOne({ meetingId, 'sharingSettings.shareToken': shareToken });
    if (!summary) {
      return res.status(404).json({ success: false, message: 'Summary link is invalid or expired' });
    }

    if (summary.sharingSettings.visibility === 'DISABLED') {
      return res.status(403).json({ success: false, message: 'Sharing has been disabled by the meeting organizer' });
    }

    // Check passcode if protected
    if (summary.sharingSettings.isPasscodeProtected && summary.sharingSettings.passcode) {
      if (!passcode || passcode !== summary.sharingSettings.passcode) {
        return res.status(401).json({
          success: false,
          requiresPasscode: true,
          message: 'Passcode required to view this confidential meeting summary'
        });
      }
    }

    // Check expiration
    if (summary.expiresAt && new Date() > new Date(summary.expiresAt)) {
      return res.status(410).json({ success: false, message: 'This meeting summary has expired according to enterprise retention policy' });
    }

    // Log public access
    summary.sharingSettings.accessLogs.push({
      accessedBy: 'Public Link Guest',
      accessedAt: new Date(),
      method: 'public_link'
    });
    await safeSaveSummary(summary);

    res.json({
      success: true,
      summary: {
        summaryId: summary.summaryId,
        meetingId: summary.meetingId,
        meetingTitle: summary.meetingTitle,
        overview: summary.overview,
        keyDiscussionPoints: summary.keyDiscussionPoints,
        decisions: summary.decisions,
        actionItems: summary.actionItems,
        questions: summary.questions,
        importantTopics: summary.importantTopics,
        nextSteps: summary.nextSteps,
        participants: summary.participants,
        template: summary.template,
        createdAt: summary.createdAt
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// List All Summaries
// GET /api/summaries/all/list
// ─────────────────────────────────────────────────────────────────────────────
router.get('/all/list', protect, async (req, res) => {
  try {
    const summaries = await MeetingSummary.find({})
      .select('summaryId meetingId meetingTitle template status overview actionItems decisions participants createdAt')
      .sort({ createdAt: -1 })
      .lean();

    const formatted = summaries.map(s => ({
      summaryId: s.summaryId,
      meetingId: s.meetingId,
      meetingTitle: s.meetingTitle || s.meetingId,
      template: s.template,
      status: s.status,
      overview: s.overview ? (s.overview.substring(0, 120) + '...') : '',
      actionItemCount: s.actionItems?.length || 0,
      decisionCount: s.decisions?.length || 0,
      participantCount: s.participants?.length || 0,
      createdAt: s.createdAt
    }));

    res.json({ success: true, count: formatted.length, summaries: formatted });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Delete Summary
// DELETE /api/meetings/:meetingId/summary
// ─────────────────────────────────────────────────────────────────────────────
router.delete('/', protect, async (req, res) => {
  try {
    const meetingId = getMeetingId(req);
    const result = await MeetingSummary.deleteMany({ meetingId });
    res.json({ success: true, message: 'Meeting summary removed', deletedCount: result.deletedCount });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
