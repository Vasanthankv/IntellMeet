import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// @route   GET /api/users
// @desc    Get all users for Account Management / Admin Center
// @access  Private (Admin / Account Owner)
router.get('/', protect, async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.json({ success: true, count: users.length, users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/users
// @desc    Add / invite user (Admin Center)
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { name, email, role, license, department, jobTitle, pronouns } = req.body;
    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Name and email are required' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const defaultPassword = await bcrypt.hash('IntellMeet2026!', salt);

    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      password: defaultPassword,
      role: role || 'User',
      license: license || 'Licensed',
      department: department || 'General',
      jobTitle: jobTitle || '',
      pronouns: pronouns || '',
    });

    const userObj = newUser.toObject();
    delete userObj.password;

    res.status(201).json({ success: true, user: userObj });
  } catch (error) {
    console.error('Error adding user:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/users/:id & PATCH /api/users/:id
// @desc    Update user role, license, or personal information (Admin Center)
// @access  Private
const handleUpdateUser = async (req, res) => {
  try {
    const { role, license, department, jobTitle, name, pronouns } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (role) user.role = role;
    if (license) user.license = license;
    if (department) user.department = department;
    if (jobTitle) user.jobTitle = jobTitle;
    if (name) user.name = name;
    if (pronouns !== undefined) user.pronouns = pronouns;

    await user.save();
    const userObj = user.toObject();
    delete userObj.password;

    res.json({ success: true, user: userObj });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

router.put('/:id', protect, handleUpdateUser);
router.patch('/:id', protect, handleUpdateUser);

// @route   DELETE /api/users/:id
// @desc    Remove user (Admin Center)
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User removed successfully' });
  } catch (error) {
    console.error('Error removing user:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/users/me/settings
// @desc    Get current user settings (Meeting, Audio, Video, Background, Recording, Accessibility)
// @access  Private
router.get('/me/settings', protect, async (req, res) => {
  try {
    if (req.user && req.user.settings !== undefined) {
      return res.json({ success: true, settings: req.user.settings || {} });
    }
    const userId = req.user._id || req.user.id;
    const user = await User.findById(userId).select('settings').lean();
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, settings: user.settings || {} });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/users/me/settings
// @desc    Update current user settings
// @access  Private
router.put('/me/settings', protect, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { meeting, audio, video, background, recording, accessibility } = req.body;
    if (!user.settings) user.settings = {};

    if (meeting) user.settings.meeting = { ...user.settings.meeting, ...meeting };
    if (audio) user.settings.audio = { ...user.settings.audio, ...audio };
    if (video) user.settings.video = { ...user.settings.video, ...video };
    if (background) user.settings.background = { ...user.settings.background, ...background };
    if (recording) user.settings.recording = { ...user.settings.recording, ...recording };
    if (accessibility) user.settings.accessibility = { ...user.settings.accessibility, ...accessibility };

    await user.save();
    res.json({ success: true, settings: user.settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/users/me/profile
// @desc    Update personal information (Name, Pronouns, Job Title, Dept, Phone, Location, Avatar)
// @access  Private
router.put('/me/profile', protect, async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    let user = null;
    if (userId) {
      user = await User.findById(userId);
    }
    if (!user && req.user?.email) {
      user = await User.findOne({ email: req.user.email.toLowerCase() });
    }
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { name, pronouns, jobTitle, department, company, phone, location, avatar, timezone } = req.body;
    if (name) user.name = name;
    if (pronouns !== undefined) user.pronouns = pronouns;
    if (jobTitle !== undefined) user.jobTitle = jobTitle;
    if (department !== undefined) user.department = department;
    if (company !== undefined) user.company = company;
    if (phone !== undefined) user.phone = phone;
    if (location !== undefined) user.location = location;
    if (avatar !== undefined) user.avatar = avatar;
    if (timezone !== undefined) user.timezone = timezone;

    await user.save();
    const userObj = user.toObject();
    delete userObj.password;

    res.json({ success: true, user: userObj });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /groups (organization groups)
router.get('/groups', protect, async (req, res) => {
  try {
    const users = await User.find({}).select('department name');
    const groupMap = {};
    users.forEach(u => {
      const dept = u.department || 'General';
      if (!groupMap[dept]) {
        groupMap[dept] = { name: dept, memberCount: 0, members: [] };
      }
      groupMap[dept].memberCount += 1;
      groupMap[dept].members.push(u.name);
    });
    const groups = Object.values(groupMap);
    res.json({ success: true, count: groups.length, groups });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /roles (organization roles)
router.get('/roles', protect, async (req, res) => {
  res.json({
    success: true,
    roles: [
      { id: 'owner', name: 'Account Owner', description: 'Full access to all administrative settings and billing.' },
      { id: 'admin', name: 'Administrator', description: 'Can manage users, settings, and reports.' },
      { id: 'member', name: 'Member', description: 'Standard enterprise access to meetings and collaboration.' },
      { id: 'guest', name: 'Guest', description: 'Limited meeting participation access.' }
    ]
  });
});

export default router;
