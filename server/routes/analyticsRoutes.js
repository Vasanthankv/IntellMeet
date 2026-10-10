import express from 'express';
import MeetingAnalytics from '../models/MeetingAnalytics.js';
import ParticipantAnalytics from '../models/ParticipantAnalytics.js';
import Meeting from '../models/Meeting.js';
import User from '../models/User.js';

const router = express.Router();

// Helper to calculate start date from range string
const getStartDateFromRange = (range = '30d') => {
  const now = new Date();
  switch (range) {
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case '90d':
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    case '1y':
      return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    default:
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
};

// Analytics tracking strictly for genuine meetings without synthetic seeding

// 1. Overview Dashboard KPIs & Trends
router.get('/overview', async (req, res) => {
  try {

    const range = req.query.range || '30d';
    const department = req.query.department || 'all';
    const startDate = getStartDateFromRange(range);

    const matchQuery = { startTime: { $gte: startDate } };
    if (department !== 'all') {
      matchQuery.department = department;
    }

    const meetings = await MeetingAnalytics.find(matchQuery).sort({ startTime: 1 });

    const totalMeetings = meetings.length;
    const meetingMinutes = meetings.reduce((acc, m) => acc + (m.durationMinutes || 0), 0);
    const totalParticipants = meetings.reduce((acc, m) => acc + (m.participantCount || 0), 0);
    const totalParticipantMinutes = meetings.reduce((acc, m) => acc + (m.totalParticipantMinutes || 0), 0);
    const uniqueHosts = new Set(meetings.map(m => m.hostEmail || m.hostName)).size;
    const avgMeetingDuration = totalMeetings > 0 ? Math.round(meetingMinutes / totalMeetings) : 0;
    const avgQualityScore = totalMeetings > 0 ? Math.round(meetings.reduce((acc, m) => acc + (m.quality?.overallScore || 90), 0) / totalMeetings) : 92;

    // Daily breakdown for trend charts
    const dailyMap = {};
    meetings.forEach(m => {
      const dateKey = new Date(m.startTime).toISOString().slice(0, 10);
      if (!dailyMap[dateKey]) {
        dailyMap[dateKey] = { date: dateKey, meetings: 0, minutes: 0, participants: 0 };
      }
      dailyMap[dateKey].meetings += 1;
      dailyMap[dateKey].minutes += m.durationMinutes || 0;
      dailyMap[dateKey].participants += m.participantCount || 0;
    });

    const trends = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));

    // Distribution by meeting type
    const typeDistribution = {
      scheduled: meetings.filter(m => m.meetingType === 'scheduled').length,
      recurring: meetings.filter(m => m.meetingType === 'recurring').length,
      webinar: meetings.filter(m => m.meetingType === 'webinar').length,
      instant: meetings.filter(m => m.meetingType === 'instant').length,
    };

    res.json({
      success: true,
      range,
      department,
      kpis: {
        totalMeetings,
        meetingMinutes,
        totalParticipants,
        totalParticipantMinutes,
        activeHosts: uniqueHosts,
        avgMeetingDuration,
        avgQualityScore,
      },
      trends,
      typeDistribution,
    });
  } catch (err) {
    console.error('Error fetching analytics overview:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch overview analytics' });
  }
});

// 2. Historical Meeting Records with Search, Filter & Pagination
router.get('/meetings', async (req, res) => {
  try {

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const search = req.query.search || '';
    const range = req.query.range || '30d';
    const department = req.query.department || 'all';
    const type = req.query.type || 'all';

    const startDate = getStartDateFromRange(range);
    const filter = { startTime: { $gte: startDate } };

    if (department !== 'all') filter.department = department;
    if (type !== 'all') filter.meetingType = type;

    if (search.trim()) {
      filter.$or = [
        { topic: { $regex: search, $options: 'i' } },
        { hostName: { $regex: search, $options: 'i' } },
        { hostEmail: { $regex: search, $options: 'i' } },
        { meetingNumericId: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await MeetingAnalytics.countDocuments(filter);
    const meetings = await MeetingAnalytics.find(filter)
      .sort({ startTime: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      success: true,
      meetings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('Error fetching meeting history analytics:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch meeting records' });
  }
});

// 3. Attendee Attendance Drill-Down for a Specific Meeting
router.get('/meetings/:meetingId/participants', async (req, res) => {
  try {
    const { meetingId } = req.params;
    const meeting = await MeetingAnalytics.findOne({ meetingId });
    const participants = await ParticipantAnalytics.find({ meetingId }).sort({ joinedAt: 1 });

    res.json({
      success: true,
      meeting,
      participants,
      totalAttendees: participants.length,
    });
  } catch (err) {
    console.error('Error fetching participant attendance analytics:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch participant attendance' });
  }
});

// 4. Host Usage Analytics
router.get('/hosts', async (req, res) => {
  try {
    const range = req.query.range || '30d';
    const startDate = getStartDateFromRange(range);

    const hosts = await MeetingAnalytics.aggregate([
      { $match: { startTime: { $gte: startDate } } },
      {
        $group: {
          _id: '$hostEmail',
          hostName: { $first: '$hostName' },
          department: { $first: '$department' },
          totalMeetings: { $sum: 1 },
          totalMinutes: { $sum: '$durationMinutes' },
          totalParticipants: { $sum: '$participantCount' },
          avgDuration: { $avg: '$durationMinutes' },
          avgScore: { $avg: '$quality.overallScore' },
        },
      },
      { $sort: { totalMeetings: -1 } },
    ]);

    res.json({ success: true, hosts });
  } catch (err) {
    console.error('Error fetching host analytics:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch host analytics' });
  }
});

// 5. Meeting Quality & Network Diagnostics
router.get('/quality', async (req, res) => {
  try {
    const range = req.query.range || '30d';
    const startDate = getStartDateFromRange(range);

    const meetings = await MeetingAnalytics.find({ startTime: { $gte: startDate } });
    const total = meetings.length;

    let goodCount = 0;
    let fairCount = 0;
    let poorCount = 0;
    let totalJitter = 0;
    let totalPacketLoss = 0;
    let totalLatency = 0;
    let reconnectCount = 0;

    meetings.forEach(m => {
      const q = m.quality || {};
      if (q.rating === 'Good') goodCount++;
      else if (q.rating === 'Fair') fairCount++;
      else if (q.rating === 'Poor') poorCount++;
      else goodCount++;

      totalJitter += q.avgJitterMs || 10;
      totalPacketLoss += q.avgPacketLossPct || 0.4;
      totalLatency += q.avgLatencyMs || 45;
      reconnectCount += q.reconnectionsCount || 0;
    });

    res.json({
      success: true,
      totalMeetings: total,
      ratings: {
        goodPct: total > 0 ? Math.round((goodCount / total) * 100) : 100,
        fairPct: total > 0 ? Math.round((fairCount / total) * 100) : 0,
        poorPct: total > 0 ? Math.round((poorCount / total) * 100) : 0,
        goodCount,
        fairCount,
        poorCount,
      },
      networkAverages: {
        avgJitterMs: total > 0 ? +(totalJitter / total).toFixed(1) : 10,
        avgPacketLossPct: total > 0 ? +(totalPacketLoss / total).toFixed(2) : 0.3,
        avgLatencyMs: total > 0 ? Math.round(totalLatency / total) : 45,
        totalReconnections: reconnectCount,
      },
    });
  } catch (err) {
    console.error('Error fetching quality analytics:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch quality analytics' });
  }
});

// 6. Feature Adoption Breakdown
router.get('/features', async (req, res) => {
  try {
    const range = req.query.range || '30d';
    const startDate = getStartDateFromRange(range);

    const meetings = await MeetingAnalytics.find({ startTime: { $gte: startDate } });
    const total = meetings.length;

    const featureKeys = [
      'audio', 'video', 'screenShare', 'recording', 'chat',
      'polls', 'breakoutRooms', 'whiteboard', 'captions',
      'interpretation', 'liveStreaming', 'aiSummary', 'aiQuestions'
    ];

    const featureStats = {};
    featureKeys.forEach(k => {
      const usedCount = meetings.filter(m => m.featureUsage && m.featureUsage[k]).length;
      featureStats[k] = {
        count: usedCount,
        percentage: total > 0 ? Math.round((usedCount / total) * 100) : 0,
      };
    });

    res.json({
      success: true,
      totalMeetings: total,
      features: featureStats,
    });
  } catch (err) {
    console.error('Error fetching feature analytics:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch feature analytics' });
  }
});

// 7. IntelliMeet AI Intelligence Metrics
router.get('/ai', async (req, res) => {
  try {
    const range = req.query.range || '30d';
    const startDate = getStartDateFromRange(range);

    const meetings = await MeetingAnalytics.find({ startTime: { $gte: startDate } });

    let summaries = 0;
    let questions = 0;
    let transcripts = 0;
    let actionItems = 0;
    let decisions = 0;

    meetings.forEach(m => {
      const ai = m.aiMetrics || {};
      summaries += ai.summariesGenerated || 0;
      questions += ai.questionsAsked || 0;
      transcripts += ai.transcriptsProcessed || 0;
      actionItems += ai.actionItemsDetected || 0;
      decisions += ai.decisionsRecorded || 0;
    });

    res.json({
      success: true,
      aiSummaryCount: summaries,
      aiQuestionsAnswered: questions,
      transcriptsProcessed: transcripts,
      actionItemsDetected: actionItems,
      decisionsRecorded: decisions,
      meetingsAnalyzed: meetings.length,
    });
  } catch (err) {
    console.error('Error fetching AI analytics:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch AI analytics' });
  }
});

// 8. CSV Export for Meeting History
router.get('/export/meetings.csv', async (req, res) => {
  try {
    const range = req.query.range || '30d';
    const department = req.query.department || 'all';
    const startDate = getStartDateFromRange(range);

    const filter = { startTime: { $gte: startDate } };
    if (department !== 'all') filter.department = department;

    const meetings = await MeetingAnalytics.find(filter).sort({ startTime: -1 });

    const headers = [
      'Meeting ID',
      'Topic',
      'Host Name',
      'Host Email',
      'Department',
      'Meeting Type',
      'Start Time',
      'End Time',
      'Duration (Mins)',
      'Participants',
      'Total Participant Minutes',
      'Quality Score',
      'Quality Rating',
      'Recording Used',
      'AI Summary Used',
      'Live Stream Used',
    ];

    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = meetings.map(m => [
      escapeCsv(m.meetingNumericId || m.meetingId),
      escapeCsv(m.topic),
      escapeCsv(m.hostName),
      escapeCsv(m.hostEmail),
      escapeCsv(m.department),
      escapeCsv(m.meetingType),
      escapeCsv(new Date(m.startTime).toLocaleString()),
      escapeCsv(new Date(m.endTime).toLocaleString()),
      escapeCsv(m.durationMinutes),
      escapeCsv(m.participantCount),
      escapeCsv(m.totalParticipantMinutes),
      escapeCsv(m.quality?.overallScore || 90),
      escapeCsv(m.quality?.rating || 'Good'),
      escapeCsv(m.featureUsage?.recording ? 'Yes' : 'No'),
      escapeCsv(m.featureUsage?.aiSummary ? 'Yes' : 'No'),
      escapeCsv(m.featureUsage?.liveStreaming ? 'Yes' : 'No'),
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="intellmeet_meeting_report_${range}.csv"`);
    res.send(csvContent);
  } catch (err) {
    console.error('Error generating meetings CSV export:', err);
    res.status(500).json({ success: false, message: 'Failed to generate CSV export' });
  }
});

// 9. CSV Export for Participant Attendance Drill-Down
router.get('/export/participants/:meetingId.csv', async (req, res) => {
  try {
    const { meetingId } = req.params;
    const meeting = await MeetingAnalytics.findOne({ meetingId });
    const participants = await ParticipantAnalytics.find({ meetingId }).sort({ joinedAt: 1 });

    const headers = [
      'Participant Name',
      'Email',
      'Join Time',
      'Leave Time',
      'Duration (Mins)',
      'Waiting Room Time (Mins)',
      'Device',
      'Network Type',
      'Client Version',
      'Audio Used',
      'Video Used',
      'Screen Share Used',
      'Guest',
      'Quality Rating',
      'Packet Loss (%)',
      'Jitter (ms)',
      'Rejoined Times',
    ];

    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = participants.map(p => [
      escapeCsv(p.displayName),
      escapeCsv(p.email),
      escapeCsv(new Date(p.joinedAt).toLocaleString()),
      escapeCsv(new Date(p.leftAt).toLocaleString()),
      escapeCsv(p.durationMinutes),
      escapeCsv(p.waitingRoomDurationMinutes || 0),
      escapeCsv(p.device),
      escapeCsv(p.networkType),
      escapeCsv(p.clientVersion),
      escapeCsv(p.audioUsed ? 'Yes' : 'No'),
      escapeCsv(p.videoUsed ? 'Yes' : 'No'),
      escapeCsv(p.screenShareUsed ? 'Yes' : 'No'),
      escapeCsv(p.isGuest ? 'Yes' : 'No'),
      escapeCsv(p.qualityRating),
      escapeCsv(p.packetLossPct),
      escapeCsv(p.jitterMs),
      escapeCsv(p.consolidatedEntries),
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="attendance_${meetingId}.csv"`);
    res.send(csvContent);
  } catch (err) {
    console.error('Error generating participants CSV export:', err);
    res.status(500).json({ success: false, message: 'Failed to generate attendee CSV export' });
  }
});

// 10. Manual Analytics Reset (Clears records without synthetic seeding)
router.post('/seed', async (req, res) => {
  try {
    await MeetingAnalytics.deleteMany({});
    await ParticipantAnalytics.deleteMany({});
    res.json({ success: true, message: 'Analytics data cleared successfully' });
  } catch (err) {
    console.error('Error resetting analytics:', err);
    res.status(500).json({ success: false, message: 'Failed to reset analytics' });
  }
});

export default router;
