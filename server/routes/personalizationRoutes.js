import express from 'express';
import UserPreferences from '../models/UserPreferences.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

const DEFAULT_TOOLBAR_LAYOUT = [
  'audio',
  'video',
  'security',
  'participants',
  'chat',
  'share',
  'reactions',
  'aiQuestions',
  'myNotes',
  'agenda',
  'recording',
  'streaming',
  'whiteboard',
  'transcript',
  'polls',
  'interpretation'
];

const DEFAULT_HIDDEN_TOOLBAR_ITEMS = [
  'whiteboard',
  'transcript',
  'polls',
  'interpretation'
];

// Helper to get or create preferences
const getOrCreatePreferences = async (userId) => {
  let prefs = await UserPreferences.findOne({ userId });
  if (!prefs) {
    prefs = await UserPreferences.create({
      userId,
      theme: 'dark',
      customWallpaper: {
        preset: 'default',
        url: '',
        blur: 0,
        opacity: 100
      },
      toolbarLayout: DEFAULT_TOOLBAR_LAYOUT,
      hiddenToolbarItems: DEFAULT_HIDDEN_TOOLBAR_ITEMS,
      virtualBackground: {
        type: 'none',
        presetId: 'none',
        url: '',
        blurIntensity: 10
      },
      videoFilter: 'none',
      avatar: 'none',
      defaultVideoLayout: 'gallery',
      multiSpeakerCount: 2,
      hideNonVideoParticipants: false,
      galleryTileOrder: []
    });
  }
  return prefs;
};

// @route   GET /api/personalization/preferences
// @desc    Get current user's personalization preferences
// @access  Private
router.get(['/', '/preferences'], protect, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const preferences = await getOrCreatePreferences(userId);
    res.json({
      success: true,
      preferences
    });
  } catch (error) {
    console.error('Error fetching personalization preferences:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/personalization/preferences
// @desc    Update current user's personalization preferences
// @access  Private
router.put(['/', '/preferences'], protect, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    let preferences = await getOrCreatePreferences(userId);

    const {
      theme,
      customWallpaper,
      toolbarLayout,
      hiddenToolbarItems,
      virtualBackground,
      videoFilter,
      avatar,
      defaultVideoLayout,
      multiSpeakerCount,
      hideNonVideoParticipants,
      galleryTileOrder
    } = req.body;

    if (theme !== undefined) preferences.theme = theme;
    if (customWallpaper !== undefined) {
      preferences.customWallpaper = {
        ...preferences.customWallpaper.toObject?.() || preferences.customWallpaper,
        ...customWallpaper
      };
    }
    if (toolbarLayout !== undefined && Array.isArray(toolbarLayout)) {
      preferences.toolbarLayout = toolbarLayout;
    }
    if (hiddenToolbarItems !== undefined && Array.isArray(hiddenToolbarItems)) {
      preferences.hiddenToolbarItems = hiddenToolbarItems;
    }
    if (virtualBackground !== undefined) {
      preferences.virtualBackground = {
        ...preferences.virtualBackground.toObject?.() || preferences.virtualBackground,
        ...virtualBackground
      };
    }
    if (videoFilter !== undefined) preferences.videoFilter = videoFilter;
    if (avatar !== undefined) preferences.avatar = avatar;
    if (defaultVideoLayout !== undefined) preferences.defaultVideoLayout = defaultVideoLayout;
    if (multiSpeakerCount !== undefined) {
      preferences.multiSpeakerCount = Math.min(Math.max(Number(multiSpeakerCount) || 2, 2), 4);
    }
    if (hideNonVideoParticipants !== undefined) preferences.hideNonVideoParticipants = Boolean(hideNonVideoParticipants);
    if (galleryTileOrder !== undefined && Array.isArray(galleryTileOrder)) {
      preferences.galleryTileOrder = galleryTileOrder;
    }

    await preferences.save();

    res.json({
      success: true,
      message: 'Personalization preferences updated successfully',
      preferences
    });
  } catch (error) {
    console.error('Error updating personalization preferences:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/personalization/reset-toolbar
// @desc    Reset toolbar layout to default configuration
// @access  Private
router.post('/reset-toolbar', protect, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const preferences = await getOrCreatePreferences(userId);

    preferences.toolbarLayout = DEFAULT_TOOLBAR_LAYOUT;
    preferences.hiddenToolbarItems = DEFAULT_HIDDEN_TOOLBAR_ITEMS;
    await preferences.save();

    res.json({
      success: true,
      message: 'Toolbar layout reset to default',
      preferences
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/personalization/reset-all
// @desc    Reset all user personalization preferences to default
// @access  Private
router.post('/reset-all', protect, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    await UserPreferences.findOneAndDelete({ userId });
    const freshPreferences = await getOrCreatePreferences(userId);

    res.json({
      success: true,
      message: 'All personalization preferences reset to defaults',
      preferences: freshPreferences
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
