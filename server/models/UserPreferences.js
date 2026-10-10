import mongoose from 'mongoose';

const userPreferencesSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  // 37.1 Meeting Theme
  theme: {
    type: String,
    default: 'dark', // 'default' | 'light' | 'dark' | 'midnight' | 'obsidian' | 'sunset' | 'ocean' | 'cyberpunk'
    enum: ['default', 'light', 'dark', 'midnight', 'obsidian', 'sunset', 'ocean', 'cyberpunk']
  },
  // 37.2 Custom Wallpaper (Interface Canvas Backdrop)
  customWallpaper: {
    preset: {
      type: String,
      default: 'default', // 'default' | 'mesh' | 'galaxy' | 'aurora' | 'minimal' | 'waves' | 'custom'
    },
    url: {
      type: String,
      default: ''
    },
    blur: {
      type: Number,
      default: 0 // 0 to 20 px
    },
    opacity: {
      type: Number,
      default: 100 // 10 to 100 %
    }
  },
  // 37.3 Toolbar Customization (Order and visibility)
  toolbarLayout: {
    type: [String],
    default: [
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
    ]
  },
  hiddenToolbarItems: {
    type: [String],
    default: ['whiteboard', 'transcript', 'polls', 'interpretation'] // default tucked into More menu
  },
  // 37.4 Virtual Backgrounds
  virtualBackground: {
    type: {
      type: String,
      default: 'none' // 'none' | 'blur' | 'preset' | 'custom' | 'ai'
    },
    presetId: {
      type: String,
      default: 'none'
    },
    url: {
      type: String,
      default: ''
    },
    blurIntensity: {
      type: Number,
      default: 10
    }
  },
  // 37.5 Video Filters
  videoFilter: {
    type: String,
    default: 'none' // 'none' | 'warm' | 'sepia' | 'noir' | 'neon' | 'studio' | 'cool'
  },
  // 37.6 Avatars
  avatar: {
    type: String,
    default: 'none' // 'none' | 'fox' | 'cat' | 'panda' | 'robot' | 'owl' | 'astronaut'
  },
  // 37.7 Meeting View Personalization & Multi-Speaker
  defaultVideoLayout: {
    type: String,
    default: 'gallery', // 'gallery' | 'speaker' | 'multi' | 'dynamic-gallery' | 'immersive' | 'floating'
  },
  multiSpeakerCount: {
    type: Number,
    default: 2, // 2, 3, or 4
    min: 2,
    max: 4
  },
  hideNonVideoParticipants: {
    type: Boolean,
    default: false
  },
  galleryTileOrder: {
    type: [String],
    default: []
  }
}, {
  timestamps: true
});

const UserPreferences = mongoose.models.UserPreferences || mongoose.model('UserPreferences', userPreferencesSchema);

export default UserPreferences;
