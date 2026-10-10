import express from 'express';
import mongoose from 'mongoose';
import { Poll, PollResponse } from '../models/Poll.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// ─── Helper: Compute aggregate results summary ────────────────────────────────
async function computeResults(pollId) {
  const poll = await Poll.findById(pollId).lean();
  if (!poll) return {};
  const responses = await PollResponse.find({ pollId }).lean();
  const summary = {};
  for (const q of poll.questions) {
    summary[q.questionId] = {
      questionId: q.questionId,
      questionText: q.questionText,
      questionType: q.questionType,
      totalAnswers: 0,
      optionCounts: {},   // optionId → count
      textAnswers: [],
      rankedScores: {},   // optionId → weighted rank score
    };
    // Prefill option counts
    (q.options || []).forEach(o => { summary[q.questionId].optionCounts[o.optionId] = 0; });
  }
  for (const resp of responses) {
    for (const ans of resp.answers) {
      const qs = summary[ans.questionId];
      if (!qs) continue;
      qs.totalAnswers++;
      // Single / Multiple / Rank options
      (ans.selectedOptions || []).forEach(oid => {
        qs.optionCounts[oid] = (qs.optionCounts[oid] || 0) + 1;
      });
      // Rank order — assign points: (n - rank) per option
      if (ans.rankedOrder && ans.rankedOrder.length) {
        const n = ans.rankedOrder.length;
        ans.rankedOrder.forEach((oid, idx) => {
          qs.rankedScores[oid] = (qs.rankedScores[oid] || 0) + (n - idx);
        });
      }
      // Text answers
      if (ans.textAnswer) qs.textAnswers.push(ans.textAnswer);
    }
  }
  // Compute percentages
  for (const qid of Object.keys(summary)) {
    const qs = summary[qid];
    qs.percentages = {};
    const total = qs.totalAnswers || 1;
    Object.keys(qs.optionCounts).forEach(oid => {
      qs.percentages[oid] = Math.round((qs.optionCounts[oid] / total) * 100);
    });
  }
  return { summary, totalResponses: responses.length };
}

// ─────────────────────────────────────────────────────────────────────────────
// 19.2 / 19.3  Create Poll or Quiz
// POST /api/polls
// ─────────────────────────────────────────────────────────────────────────────
router.post('/', protect, async (req, res) => {
  try {
    const { meetingId, title, pollType = 'POLL', questions = [], isAnonymous, description,
            allowImagesInOptions, showResultsToParticipants, isLibraryItem, libraryName } = req.body;
    if (!meetingId) return res.status(400).json({ message: 'meetingId is required' });
    if (!title) return res.status(400).json({ message: 'title is required' });

    // Enforce limits: 100 polls / 50 quizzes per meeting; questions per poll/quiz
    const type = pollType === 'QUIZ' ? 'QUIZ' : 'POLL';
    const maxPolls = type === 'QUIZ' ? 50 : 100;
    const maxQs   = type === 'QUIZ' ? 50 : 100;
    const existingCount = await Poll.countDocuments({ meetingId, pollType: type, isLibraryItem: { $ne: true } });
    if (existingCount >= maxPolls)
      return res.status(400).json({ message: `Maximum ${maxPolls} ${type.toLowerCase()}s per meeting` });
    if (questions.length > maxQs)
      return res.status(400).json({ message: `Maximum ${maxQs} questions per ${type.toLowerCase()}` });

    const poll = await Poll.create({
      meetingId, title, pollType: type, questions, isAnonymous: !!isAnonymous,
      description, allowImagesInOptions, showResultsToParticipants,
      isLibraryItem: !!isLibraryItem, libraryName,
      createdBy: req.user._id?.toString() || req.user.id || 'unknown',
    });
    res.status(201).json({ success: true, poll });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─────────────────────────────────────────────────────────────────────────────
// List polls for a meeting — GET /api/polls?meetingId=X&tab=active|upcoming|completed
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', protect, async (req, res) => {
  try {
    const { meetingId, tab, pollType } = req.query;
    if (!meetingId) return res.status(400).json({ message: 'meetingId query param required' });
    const filter = { meetingId, isLibraryItem: { $ne: true } };
    if (pollType) filter.pollType = pollType;
    if (tab === 'active') filter.status = 'ACTIVE';
    else if (tab === 'completed') filter.status = { $in: ['ENDED', 'SHARED'] };
    else if (tab === 'upcoming') filter.status = 'DRAFT';
    const polls = await Poll.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, polls });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─────────────────────────────────────────────────────────────────────────────
// Get single poll  GET /api/polls/:pollId
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:pollId', protect, async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.pollId);
    if (!poll) return res.status(404).json({ message: 'Poll not found' });
    res.json({ success: true, poll });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─────────────────────────────────────────────────────────────────────────────
// Update poll (while DRAFT)  PUT /api/polls/:pollId
// ─────────────────────────────────────────────────────────────────────────────
router.put('/:pollId', protect, async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.pollId);
    if (!poll) return res.status(404).json({ message: 'Poll not found' });
    if (poll.status !== 'DRAFT') return res.status(400).json({ message: 'Only DRAFT polls can be edited' });
    const allowed = ['title','description','questions','isAnonymous','allowImagesInOptions','showResultsToParticipants','libraryName','isLibraryItem'];
    allowed.forEach(k => { if (req.body[k] !== undefined) poll[k] = req.body[k]; });
    await poll.save();
    res.json({ success: true, poll });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─────────────────────────────────────────────────────────────────────────────
// Delete poll  DELETE /api/polls/:pollId
// ─────────────────────────────────────────────────────────────────────────────
router.delete('/:pollId', protect, async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.pollId);
    if (!poll) return res.status(404).json({ message: 'Poll not found' });
    await PollResponse.deleteMany({ pollId: poll._id });
    await Poll.findByIdAndDelete(req.params.pollId);
    res.json({ success: true, message: 'Poll deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─────────────────────────────────────────────────────────────────────────────
// 19.5  Launch poll  PUT /api/polls/:pollId/launch
// ─────────────────────────────────────────────────────────────────────────────
router.put('/:pollId/launch', protect, async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.pollId);
    if (!poll) return res.status(404).json({ message: 'Poll not found' });
    if (poll.status === 'ACTIVE') return res.status(400).json({ message: 'Poll is already active' });
    poll.status = 'ACTIVE';
    poll.launchedAt = new Date();
    poll.totalResponses = 0;
    poll.resultsSummary = {};
    await poll.save();
    // Socket emission is handled by server.js
    res.json({ success: true, poll });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─────────────────────────────────────────────────────────────────────────────
// 19.6 / 19.11  Submit response  POST /api/polls/:pollId/respond
// ─────────────────────────────────────────────────────────────────────────────
router.post('/:pollId/respond', protect, async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.pollId);
    if (!poll) return res.status(404).json({ message: 'Poll not found' });
    if (poll.status !== 'ACTIVE') return res.status(400).json({ message: 'Poll is not active' });

    const { answers = [], participantName } = req.body;
    const participantId = poll.isAnonymous ? null : (req.user._id?.toString() || req.user.id);

    // Score quiz answers
    let totalScore = 0, maxScore = 0;
    const scoredAnswers = answers.map(ans => {
      const q = poll.questions.find(q => q.questionId === ans.questionId);
      let isCorrect = null, pointsEarned = 0;
      if (poll.pollType === 'QUIZ' && q && q.correctAnswers?.length) {
        maxScore += q.points || 1;
        const selected = (ans.selectedOptions || []).sort().join(',');
        const correct  = (q.correctAnswers || []).sort().join(',');
        isCorrect = selected === correct;
        if (isCorrect) { pointsEarned = q.points || 1; totalScore += pointsEarned; }
      }
      return { ...ans, isCorrect, pointsEarned };
    });

    const response = await PollResponse.create({
      pollId: poll._id, meetingId: poll.meetingId, participantId,
      participantName: poll.isAnonymous ? 'Anonymous' : (participantName || req.user.name || 'Participant'),
      answers: scoredAnswers, totalScore, maxScore,
    });

    // Update poll cached stats
    poll.totalResponses = (poll.totalResponses || 0) + 1;
    const { summary } = await computeResults(poll._id);
    poll.resultsSummary = summary;
    await poll.save();

    res.status(201).json({
      success: true,
      response,
      ...(poll.pollType === 'QUIZ' && poll.showResultsToParticipants ? { score: totalScore, maxScore, answers: scoredAnswers } : {})
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─────────────────────────────────────────────────────────────────────────────
// 19.7  Get live results  GET /api/polls/:pollId/results
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:pollId/results', protect, async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.pollId).lean();
    if (!poll) return res.status(404).json({ message: 'Poll not found' });
    const { summary, totalResponses } = await computeResults(req.params.pollId);
    res.json({ success: true, summary, totalResponses, pollType: poll.pollType, status: poll.status });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─────────────────────────────────────────────────────────────────────────────
// 19.8  End poll  PUT /api/polls/:pollId/end
// ─────────────────────────────────────────────────────────────────────────────
router.put('/:pollId/end', protect, async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.pollId);
    if (!poll) return res.status(404).json({ message: 'Poll not found' });
    if (poll.status !== 'ACTIVE') return res.status(400).json({ message: 'Poll is not active' });
    poll.status = 'ENDED';
    poll.endedAt = new Date();
    const { summary, totalResponses } = await computeResults(poll._id);
    poll.resultsSummary = summary;
    poll.totalResponses = totalResponses;
    await poll.save();
    res.json({ success: true, poll });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─────────────────────────────────────────────────────────────────────────────
// 19.8  Share results  PUT /api/polls/:pollId/share-results
// ─────────────────────────────────────────────────────────────────────────────
router.put('/:pollId/share-results', protect, async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.pollId);
    if (!poll) return res.status(404).json({ message: 'Poll not found' });
    poll.status = 'SHARED';
    poll.sharedAt = new Date();
    await poll.save();
    res.json({ success: true, poll });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─────────────────────────────────────────────────────────────────────────────
// 19.8  Re-launch poll  POST /api/polls/:pollId/relaunch
// ─────────────────────────────────────────────────────────────────────────────
router.post('/:pollId/relaunch', protect, async (req, res) => {
  try {
    const original = await Poll.findById(req.params.pollId).lean();
    if (!original) return res.status(404).json({ message: 'Poll not found' });
    const { _id, createdAt, updatedAt, launchedAt, endedAt, sharedAt, resultsSummary, totalResponses, ...rest } = original;
    const relaunched = await Poll.create({
      ...rest,
      status: 'ACTIVE',
      launchedAt: new Date(),
      endedAt: null, sharedAt: null,
      resultsSummary: {}, totalResponses: 0,
    });
    res.status(201).json({ success: true, poll: relaunched });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─────────────────────────────────────────────────────────────────────────────
// 19.10  Download report  GET /api/polls/:pollId/report
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:pollId/report', protect, async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.pollId).lean();
    if (!poll) return res.status(404).json({ message: 'Poll not found' });
    const responses = await PollResponse.find({ pollId: poll._id }).lean();
    const { summary, totalResponses } = await computeResults(req.params.pollId);
    res.json({ success: true, poll, responses, summary, totalResponses });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─────────────────────────────────────────────────────────────────────────────
// 19.13  Create Breakout Rooms from Poll results
// POST /api/polls/:pollId/create-breakout-rooms
// ─────────────────────────────────────────────────────────────────────────────
router.post('/:pollId/create-breakout-rooms', protect, async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.pollId).lean();
    if (!poll) return res.status(404).json({ message: 'Poll not found' });
    if (!['ENDED', 'SHARED'].includes(poll.status))
      return res.status(400).json({ message: 'Poll must be ended before creating breakout rooms' });

    const { questionId } = req.body;   // which question to group by
    const responses = await PollResponse.find({ pollId: poll._id }).lean();
    const q = poll.questions.find(q => q.questionId === questionId) || poll.questions[0];
    if (!q) return res.status(400).json({ message: 'Question not found' });

    // Build groups: option text → [ participantId ]
    const groups = {};
    for (const resp of responses) {
      const ans = resp.answers.find(a => a.questionId === q.questionId);
      if (!ans) continue;
      const key = (ans.selectedOptions || []).join('_') || ans.textAnswer || 'Other';
      if (!groups[key]) groups[key] = [];
      groups[key].push(resp.participantId || resp.participantName);
    }

    // Build room specs for the breakout creation API
    const rooms = Object.entries(groups).map(([optionKey, participants], idx) => {
      const opt = q.options?.find(o => o.optionId === optionKey);
      return {
        name: opt ? opt.text : `Group ${idx + 1}`,
        participants,
        order: idx + 1,
      };
    });

    res.json({ success: true, rooms, pollTitle: poll.title, questionText: q.questionText });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─────────────────────────────────────────────────────────────────────────────
// 19.14  Poll Library — list reusable polls (not tied to a specific meeting)
// GET /api/polls/library/list
// ─────────────────────────────────────────────────────────────────────────────
router.get('/library/list', protect, async (req, res) => {
  try {
    const { pollType } = req.query;
    const filter = { isLibraryItem: true, createdBy: req.user._id?.toString() || req.user.id };
    if (pollType) filter.pollType = pollType;
    const polls = await Poll.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, polls });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─────────────────────────────────────────────────────────────────────────────
// 19.14  Save poll to library  POST /api/polls/:pollId/save-to-library
// ─────────────────────────────────────────────────────────────────────────────
router.post('/:pollId/save-to-library', protect, async (req, res) => {
  try {
    const original = await Poll.findById(req.params.pollId).lean();
    if (!original) return res.status(404).json({ message: 'Poll not found' });
    const { _id, createdAt, updatedAt, launchedAt, endedAt, sharedAt, resultsSummary, totalResponses, meetingId, ...rest } = original;
    const libraryPoll = await Poll.create({
      ...rest,
      meetingId: 'library',
      status: 'DRAFT',
      isLibraryItem: true,
      libraryName: req.body.libraryName || original.title,
      launchedAt: null, endedAt: null, sharedAt: null,
      resultsSummary: {}, totalResponses: 0,
    });
    res.status(201).json({ success: true, poll: libraryPoll });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─────────────────────────────────────────────────────────────────────────────
// 19.14  Import library poll into a meeting  POST /api/polls/library/:pollId/import
// ─────────────────────────────────────────────────────────────────────────────
router.post('/library/:pollId/import', protect, async (req, res) => {
  try {
    const { meetingId } = req.body;
    if (!meetingId) return res.status(400).json({ message: 'meetingId is required' });
    const libPoll = await Poll.findById(req.params.pollId).lean();
    if (!libPoll) return res.status(404).json({ message: 'Library poll not found' });
    const { _id, createdAt, updatedAt, launchedAt, endedAt, sharedAt, resultsSummary, totalResponses, ...rest } = libPoll;
    const imported = await Poll.create({
      ...rest,
      meetingId,
      isLibraryItem: false,
      status: 'DRAFT',
      resultsSummary: {}, totalResponses: 0,
    });
    res.status(201).json({ success: true, poll: imported });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

export default router;