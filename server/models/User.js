import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  completed: { type: Boolean, default: false },
  dueDate: { type: String, default: 'Today' },
  priority: { type: String, default: 'Medium' },
}, { timestamps: true });

const activitySchema = new mongoose.Schema({
  type: { type: String, required: true },
  title: { type: String, required: true },
  time: { type: String, default: 'Just now' },
}, { timestamps: true });

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
    },
    role: {
      type: String,
      default: 'Administrator', // Default first user as Admin or Account Owner
      enum: ['Account Owner', 'Administrator', 'User', 'Member'],
    },
    license: {
      type: String,
      default: 'Licensed',
      enum: ['Licensed', 'Basic', 'Enterprise'],
    },
    pronouns: {
      type: String,
      default: '',
    },
    jobTitle: {
      type: String,
      default: '',
    },
    userType: {
      type: String,
      default: 'professional',
    },
    department: {
      type: String,
      default: 'General',
    },
    company: {
      type: String,
      default: 'Independent',
    },
    phone: {
      type: String,
      default: '',
    },
    location: {
      type: String,
      default: '',
    },
    settings: {
      meeting: {
        hostVideo: { type: Boolean, default: true },
        participantVideo: { type: Boolean, default: true },
        joinBeforeHost: { type: Boolean, default: false },
        muteUponEntry: { type: Boolean, default: true },
        waitingRoom: { type: Boolean, default: true },
        requirePasscode: { type: Boolean, default: true },
        watermark: { type: Boolean, default: false },
      },
      audio: {
        microphone: { type: String, default: 'Default Microphone' },
        speaker: { type: String, default: 'Default Speaker' },
        micVolume: { type: Number, default: 80 },
        speakerVolume: { type: Number, default: 85 },
        noiseSuppression: { type: String, default: 'auto' }, // auto, low, medium, high
        originalSound: { type: Boolean, default: false },
      },
      video: {
        camera: { type: String, default: 'Default HD Camera' },
        hdVideo: { type: Boolean, default: true },
        mirrorVideo: { type: Boolean, default: true },
        touchUpAppearance: { type: Boolean, default: true },
        appearanceLevel: { type: Number, default: 50 },
        adjustLowLight: { type: Boolean, default: true },
      },
      background: {
        selected: { type: String, default: 'none' }, // none, blur, office, livingroom, nature
        blurIntensity: { type: Number, default: 10 },
        customBackgroundUrl: { type: String, default: '' },
      },
      recording: {
        localRecording: { type: Boolean, default: true },
        cloudRecording: { type: Boolean, default: true },
        autoRecording: { type: Boolean, default: false },
        recordingPath: { type: String, default: 'C:\\Users\\User\\Documents\\IntellMeet\\Recordings' },
      },
      accessibility: {
        closedCaptioning: { type: Boolean, default: true },
        fontSize: { type: String, default: 'medium' }, // small, medium, large
        screenReaderAlerts: { type: Boolean, default: true },
        highContrast: { type: Boolean, default: false },
      },
    },
    timezone: {
      type: String,
      default: '(GMT-07:00) Pacific Time (US & Canada)',
    },
    pmi: {
      type: String,
      unique: true,
      sparse: true,
    },
    vanityUrl: {
      type: String,
    },
    plan: {
      type: String,
      default: 'Free Plan',
    },
    avatar: {
      type: String,
      default: '',
    },
    stats: {
      totalMeetings: { type: Number, default: 0 },
      hoursCollaborated: { type: Number, default: 0 },
      aiSummariesGenerated: { type: Number, default: 0 },
      pendingTasks: { type: Number, default: 0 },
    },
    tasks: [taskSchema],
    weeklyActivity: {
      type: [Number],
      default: [0, 0, 0, 0, 0, 0, 0], // Mon to Sun
    },
    recentActivity: [activitySchema],
    lastLoginAt: { type: Date },
    lastLoginProvider: { type: String, default: 'local' },
    lastLoginIp: { type: String, default: '' },
    lastLoginUserAgent: { type: String, default: '' },
    lastLoginNotificationSentAt: { type: Date },
    welcomeEmailSentAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to generate PMI if missing
userSchema.pre('save', function (next) {
  if (!this.pmi) {
    const p1 = Math.floor(100 + Math.random() * 900);
    const p2 = Math.floor(100 + Math.random() * 900);
    const p3 = Math.floor(1000 + Math.random() * 9000);
    this.pmi = `${p1}-${p2}-${p3}`;
  }
  if (!this.vanityUrl && this.name) {
    const slug = this.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    this.vanityUrl = `https://intellmeet.io/m/${slug}`;
  }
  next();
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;
