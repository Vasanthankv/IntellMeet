import express from 'express';
import User from '../models/User.js';
import Meeting from '../models/Meeting.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Helper for memory store when DB is disconnected
const memoryStats = new Map();

// @route   GET /api/dashboard/stats
// @desc    Get live user dashboard statistics, tasks, and meetings from MongoDB
// @access  Private
router.get('/stats', protect, async (req, res) => {
  try {
    const isDbConnected = User.db && User.db.readyState === 1;
    const userId = req.user.id || req.user._id;

    let user = null;
    let meetings = [];

    if (isDbConnected) {
      [user, meetings] = await Promise.all([
        User.findById(userId).select('-password').lean(),
        Meeting.find({ host: userId }).select('title date time participants status meetingId createdAt').sort({ createdAt: -1 }).lean(),
      ]);
    }

    // Default stats if empty
    const totalMeetings = meetings.length || (user?.stats?.totalMeetings ?? 0);
    const hoursCollaborated = user?.stats?.hoursCollaborated ?? 0;
    const aiSummariesGenerated = user?.stats?.aiSummariesGenerated ?? 0;
    const tasks = user?.tasks || [];
    const pendingTasks = tasks.filter(t => !t.completed).length;

    const formattedMeetings = meetings.map(m => ({
      id: m._id || m.id,
      title: m.title,
      date: m.date || 'Today',
      time: m.time || '10:00 AM',
      attendees: m.participants?.length || 1,
      status: m.status || 'scheduled',
      meetingId: m.meetingId,
    }));

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
    const userId = req.user.id || req.user._id;
    const isDbConnected = User.db && User.db.readyState === 1;

    const p1 = Math.floor(100 + Math.random() * 900);
    const p2 = Math.floor(100 + Math.random() * 900);
    const p3 = Math.floor(1000 + Math.random() * 9000);
    const meetingId = `${p1}-${p2}-${p3}`;

    let newMeeting;
    if (isDbConnected) {
      newMeeting = await Meeting.create({
        title: title || 'New Scheduled Meeting',
        meetingId,
        host: userId,
        hostName: req.user.name || 'User',
        date: date || 'Today',
        time: time || '10:00 AM',
        status: 'scheduled',
        participants: [{ name: req.user.name || 'User', email: req.user.email }],
      });

      // Update user stats & weekly chart in MongoDB
      const user = await User.findById(userId);
      if (user) {
        user.stats.totalMeetings = (user.stats.totalMeetings || 0) + 1;
        // Increment current day of week in weekly activity
        const dayIndex = new Date().getDay(); // 0 is Sun, 1 is Mon...
        const chartIndex = dayIndex === 0 ? 6 : dayIndex - 1; // Map to Mon-Sun (0-6)
        user.weeklyActivity[chartIndex] = (user.weeklyActivity[chartIndex] || 0) + 1;

        user.recentActivity.unshift({
          type: 'meeting_created',
          title: `Scheduled "${title || 'New Scheduled Meeting'}"`,
          time: 'Just now',
        });
        await user.save();
      }
    } else {
      newMeeting = {
        id: 'mtg_' + Date.now(),
        title: title || 'New Scheduled Meeting',
        meetingId,
        date: date || 'Today',
        time: time || '10:00 AM',
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
    const isDbConnected = User.db && User.db.readyState === 1;

    if (!title) {
      return res.status(400).json({ message: 'Task title is required' });
    }

    let newTask;
    if (isDbConnected) {
      const user = await User.findById(userId);
      if (user) {
        user.tasks.push({
          title,
          priority: priority || 'Medium',
          dueDate: dueDate || 'Today',
          completed: false,
        });
        user.stats.pendingTasks = user.tasks.filter(t => !t.completed).length;
        user.recentActivity.unshift({
          type: 'task_created',
          title: `Added task "${title}"`,
          time: 'Just now',
        });
        await user.save();
        newTask = user.tasks[user.tasks.length - 1];
      }
    } else {
      newTask = {
        _id: 'task_' + Date.now(),
        title,
        priority: priority || 'Medium',
        dueDate: dueDate || 'Today',
        completed: false,
      };
    }

    return res.status(201).json({ success: true, task: newTask });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/dashboard/tasks/:taskId/toggle
// @desc    Toggle task completion status
// @access  Private
router.put('/tasks/:taskId/toggle', protect, async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id || req.user._id;
    const isDbConnected = User.db && User.db.readyState === 1;

    if (isDbConnected) {
      const user = await User.findById(userId);
      if (user) {
        const task = user.tasks.id(taskId);
        if (task) {
          task.completed = !task.completed;
          user.stats.pendingTasks = user.tasks.filter(t => !t.completed).length;
          await user.save();
          return res.json({ success: true, task, pendingTasks: user.stats.pendingTasks });
        }
      }
    }

    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

export default router;
