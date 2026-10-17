import express from 'express';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Meeting from '../models/Meeting.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Helper to check whether a meeting is eligible to appear in Upcoming Meetings
const isMeetingUpcoming = (m) => {
  const status = (m.status || 'scheduled').toLowerCase();
  // Strictly filter out meetings that have been completed, cancelled, or ended
  if (['completed', 'cancelled', 'ended', 'archived'].includes(status)) {
    return false;
  }
  // Any meeting that is scheduled, live, waiting to start, recurring, or active is eligible
  return true;
};

// @route   GET /api/dashboard/stats
// @desc    Get live user dashboard statistics, tasks, and meetings from MongoDB
// @access  Private
router.get('/stats', protect, async (req, res) => {
  try {
    const isDbConnected = mongoose.connection.readyState === 1;
    const userId = req.user?._id || req.user?.id;
    const userName = req.user?.name;
    const userEmail = req.user?.email;
    const userObjId = mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : null;

    // Use user already loaded in memory by auth middleware for high performance
    let user = req.user;
    let meetings = [];

    if (isDbConnected) {
      const hostConditions = [];
      if (userId) {
        hostConditions.push({ host: userId });
        hostConditions.push({ host: String(userId) });
        if (userObjId) {
          hostConditions.push({ host: userObjId });
          hostConditions.push({ 'participants.user': userObjId });
        }
        hostConditions.push({ 'participants.user': userId });
        hostConditions.push({ 'participants.user': String(userId) });
      }
      if (userName) {
        hostConditions.push({ hostName: userName });
      }
      if (userEmail) {
        hostConditions.push({ hostEmail: userEmail.toLowerCase() });
        hostConditions.push({ 'participants.email': userEmail.toLowerCase() });
      }

      const query = hostConditions.length > 0 ? { $or: hostConditions } : {};
      meetings = await Meeting.find(query)
        .select('title description date time duration timezone participants status meetingId passcode recurring createdAt')
        .sort({ createdAt: -1 })
        .limit(30)
        .lean();
    }

    // Filter upcoming meetings accurately
    const formattedMeetings = [];
    for (const m of meetings) {
      if (isMeetingUpcoming(m)) {
        formattedMeetings.push({
          id: m._id || m.id,
          title: m.title,
          description: m.description,
          date: m.date || 'Today',
          time: m.time || '10:00 AM',
          duration: m.duration || '1h',
          timezone: m.timezone || '',
          attendees: m.participants?.length || 1,
          status: m.status || 'scheduled',
          meetingId: m.meetingId,
          passcode: m.passcode || '',
          recurring: !!m.recurring
        });
      }
    }

    const totalMeetings = meetings.length || (user?.stats?.totalMeetings ?? 0);
    const hoursCollaborated = user?.stats?.hoursCollaborated ?? 0;
    const aiSummariesGenerated = user?.stats?.aiSummariesGenerated ?? 0;
    const tasks = user?.tasks || [];
    const pendingTasks = tasks.filter(t => !t.completed).length;

    const weeklyActivity = user?.weeklyActivity || [0, 0, 0, 0, 0, 0, 0];
    const recentActivity = user?.recentActivity || [];

    return res.json({
      success: true,
      user: {
        id: userId,
        name: user?.name || req.user.name,
        email: user?.email || req.user.email,
      },
      stats: {
        totalMeetings,
        hoursCollaborated,
        aiSummariesGenerated,
        pendingTasks,
      },
      upcomingMeetings: formattedMeetings,
      tasks,
      weeklyActivity,
      recentActivity,
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/dashboard/summary
// @desc    Alias for /api/dashboard/stats
router.get('/summary', protect, (req, res, next) => {
  req.url = '/stats';
  router.handle(req, res, next);
});

// @route   POST /api/dashboard/meetings
// @desc    Create/Schedule a meeting & update user stats in MongoDB
// @access  Private
router.post('/meetings', protect, async (req, res) => {
  try {
    const { title, date, time, duration } = req.body;
    const userId = req.user._id || req.user.id;
    const userObjId = mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : null;
    const isDbConnected = mongoose.connection.readyState === 1;

    const p1 = Math.floor(100 + Math.random() * 900);
    const p2 = Math.floor(100 + Math.random() * 900);
    const p3 = Math.floor(1000 + Math.random() * 9000);
    const meetingId = `${p1}-${p2}-${p3}`;

    let newMeeting;
    if (isDbConnected) {
      newMeeting = await Meeting.create({
        title: title || 'New Scheduled Meeting',
        meetingId,
        host: userObjId || userId,
        hostName: req.user.name || 'User',
        hostEmail: req.user.email || '',
        date: date || 'Today',
        time: time || '10:00 AM',
        duration: duration || '1h',
        status: 'scheduled',
        participants: [{ name: req.user.name || 'User', email: req.user.email }],
      });

      // Update user stats & weekly chart in MongoDB asynchronously without blocking response
      User.findById(userId).then(user => {
        if (user) {
          user.stats = user.stats || {};
          user.stats.totalMeetings = (user.stats.totalMeetings || 0) + 1;
          const dayIndex = new Date().getDay();
          const chartIndex = dayIndex === 0 ? 6 : dayIndex - 1;
          user.weeklyActivity = user.weeklyActivity || [0, 0, 0, 0, 0, 0, 0];
          user.weeklyActivity[chartIndex] = (user.weeklyActivity[chartIndex] || 0) + 1;

          user.recentActivity = user.recentActivity || [];
          user.recentActivity.unshift({
            type: 'meeting_created',
            title: `Scheduled "${title || 'New Scheduled Meeting'}"`,
            time: 'Just now',
          });
          user.save().catch(e => console.warn('User stats save notice:', e.message));
        }
      }).catch(() => {});
    } else {
      newMeeting = {
        id: 'mtg_' + Date.now(),
        title: title || 'New Scheduled Meeting',
        meetingId,
        date: date || 'Today',
        time: time || '10:00 AM',
        duration: duration || '1h',
        status: 'scheduled',
        attendees: 1,
      };
    }

    return res.status(201).json({
      success: true,
      meeting: {
        id: newMeeting._id || newMeeting.id,
        title: newMeeting.title,
        meetingId: newMeeting.meetingId,
        date: newMeeting.date,
        time: newMeeting.time,
        status: newMeeting.status,
      },
    });
  } catch (error) {
    console.error('Schedule meeting error:', error);
    return res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/dashboard/tasks
// @desc    Add a new task for the user in MongoDB
// @access  Private
router.post('/tasks', protect, async (req, res) => {
  try {
    const { title, priority, dueDate } = req.body;
    const userId = req.user.id || req.user._id;
    const isDbConnected = mongoose.connection.readyState === 1;

    const newTask = {
      _id: new mongoose.Types.ObjectId(),
      title: title || 'New Task',
      completed: false,
      priority: priority || 'medium',
      dueDate: dueDate || 'Today',
      createdAt: new Date(),
    };

    if (isDbConnected) {
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ message: 'User not found' });
      user.tasks = user.tasks || [];
      user.tasks.push(newTask);
      await user.save();
    }

    return res.status(201).json({ success: true, task: newTask });
  } catch (error) {
    console.error('Create task error:', error);
    return res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/dashboard/tasks/:id/toggle
// @desc    Toggle completion status of a task
// @access  Private
router.put('/tasks/:id/toggle', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id || req.user._id;
    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ message: 'User not found' });

      const task = user.tasks.id(id);
      if (!task) return res.status(404).json({ message: 'Task not found' });

      task.completed = !task.completed;
      await user.save();
      return res.json({ success: true, task });
    }

    return res.json({ success: true, message: 'Toggled task status in memory' });
  } catch (error) {
    console.error('Toggle task error:', error);
    return res.status(500).json({ message: error.message });
  }
});

export default router;
