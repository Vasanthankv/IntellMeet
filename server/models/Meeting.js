import mongoose from 'mongoose';

const meetingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    meetingId: {
      type: String,
      required: true,
      unique: true,
    },
    host: {
      type: mongoose.Schema.Types.Mixed,
      ref: 'User',
    },
    hostName: {
      type: String,
    },
    date: {
      type: String,
    },
    time: {
      type: String,
    },
    status: {
      type: String,
      enum: ['scheduled', 'live', 'completed', 'DRAFT', 'SCHEDULED', 'REGISTRATION_OPEN', 'WAITING_TO_START', 'LIVE', 'ENDING', 'PROCESSING', 'COMPLETED', 'ARCHIVED'],
      default: 'scheduled',
    },
    // Part 40: Complete Meeting Lifecycle Engine
    lifecycle: {
      stage: {
        type: String,
        enum: ['DRAFT', 'SCHEDULED', 'REGISTRATION_OPEN', 'WAITING_TO_START', 'LIVE', 'ENDING', 'PROCESSING', 'COMPLETED', 'ARCHIVED'],
        default: 'SCHEDULED',
      },
      stageHistory: [
        {
          stage: String,
          timestamp: { type: Date, default: Date.now },
          triggeredBy: String,
          notes: String,
        },
      ],
      startedAt: Date,
      endedAt: Date,
      pipeline: {
        recording: { type: String, enum: ['IDLE', 'PROCESSING', 'COMPLETED', 'FAILED'], default: 'IDLE' },
        transcript: { type: String, enum: ['IDLE', 'PROCESSING', 'COMPLETED', 'FAILED'], default: 'IDLE' },
        aiSummary: { type: String, enum: ['IDLE', 'PROCESSING', 'COMPLETED', 'FAILED'], default: 'IDLE' },
        smartRecording: { type: String, enum: ['IDLE', 'PROCESSING', 'COMPLETED', 'FAILED'], default: 'IDLE' },
        analytics: { type: String, enum: ['IDLE', 'PROCESSING', 'COMPLETED', 'FAILED'], default: 'IDLE' },
      },
      pipelineProgress: { type: Number, default: 0 },
      pipelineCompletedAt: Date,
      assetsReady: {
        hasRecording: { type: Boolean, default: false },
        hasTranscript: { type: Boolean, default: false },
        hasSummary: { type: Boolean, default: false },
        hasSmartChapters: { type: Boolean, default: false },
        hasAnalytics: { type: Boolean, default: false },
        hasKnowledgeLayer: { type: Boolean, default: false },
      },
    },
    description: String,
    duration: String,
    timezone: String,
    recurring: Boolean,
    passcodeEnabled: Boolean,
    passcode: String,
    waitingRoom: Boolean,
    isLocked: {
      type: Boolean,
      default: false,
    },
    securitySettings: {
      lockMeeting: { type: Boolean, default: false },
      enableWaitingRoom: { type: Boolean, default: true },
      allowShareScreen: { type: Boolean, default: true },
      allowChat: { type: String, default: 'everyone', enum: ['everyone', 'hostOnly', 'none'] },
      allowRename: { type: Boolean, default: true },
      allowUnmute: { type: Boolean, default: true },
      allowStartVideo: { type: Boolean, default: true },
      allowWhiteboard: { type: Boolean, default: true },
      allowAnnotation: { type: Boolean, default: true },
      screenCaptureProtection: { type: Boolean, default: false },
      watermark: { type: Boolean, default: false },
      watermarkSettings: {
        visualEnabled: { type: Boolean, default: false },
        visualMode: { type: String, enum: ['single', 'repeated'], default: 'repeated' },
        visibleOn: { type: String, enum: ['sharedContent', 'video', 'both'], default: 'both' },
        opacity: { type: Number, default: 25 },
        identityType: { type: String, enum: ['email', 'maskedEmail', 'participantId'], default: 'maskedEmail' },
        audioEnabled: { type: Boolean, default: false }
      },
      suspendActivities: { type: Boolean, default: false },
    },
    // Part 33: Live Streaming Settings (33.1 - 33.15)
    liveStreamSettings: {
      enabled: { type: Boolean, default: false },
      autoStart: { type: Boolean, default: false },
      destinations: [{
        platform: { type: String, enum: ['YOUTUBE', 'FACEBOOK', 'TWITCH', 'CUSTOM_RTMP'], default: 'YOUTUBE' },
        name: { type: String, default: '' },
        streamUrl: { type: String, default: '' },
        streamKey: { type: String, default: '' },
        streamPageUrl: { type: String, default: '' },
        resolution: { type: String, enum: ['720p', '1080p', '480p'], default: '720p' },
        requireAuthentication: { type: Boolean, default: false }
      }],
      branding: {
        watermarkEnabled: { type: Boolean, default: true },
        brandText: { type: String, default: 'Powered by IntelliMeet' },
        position: { type: String, default: 'bottom-right' }
      }
    },
    sharingSettings: {
      whoCanShare: { type: String, default: 'all', enum: ['hostOnly', 'all'] },
      mode: { type: String, default: 'oneParticipant', enum: ['oneParticipant', 'multiple'] },
      whoCanStartWhenSharing: { type: String, default: 'hostOnly', enum: ['hostOnly', 'all'] },
    },
    annotationSettings: {
      enableAnnotation: { type: Boolean, default: true },
      annotationPermission: { type: String, default: 'all', enum: ['all', 'presenterOnly', 'none'] },
      showAnnotatorNames: { type: Boolean, default: true },
      allowSaveAnnotation: { type: Boolean, default: true },
    },
    encryption: String,
    hostVideo: String,
    participantVideo: String,
    autoAI: Boolean,
    aiQuestions: Boolean,
    aiSummary: Boolean,
    myNotes: Boolean,
    meetingChat: Boolean,
    // Part 35: Continuous Meeting Chat Settings (35.1 - 35.23)
    continuousChatSettings: {
      enabled: { type: Boolean, default: true },
      beforeMeetingChat: { type: Boolean, default: true },
      duringMeetingChat: { type: Boolean, default: true },
      afterMeetingChat: { type: Boolean, default: true },
      whoCanChat: { type: String, enum: ['everyone', 'hostOnly', 'none'], default: 'everyone' },
      allowFileSharing: { type: Boolean, default: true },
      allowReplies: { type: Boolean, default: true },
      allowReactions: { type: Boolean, default: true },
      retentionDays: { type: Number, default: 0 }, // 0 = Keep forever
    },
    audioOption: {
      type: String,
      default: 'both',
      enum: ['telephony', 'voip', 'both'],
    },
    recurringDetails: {
      recurrenceType: { type: String, default: 'weekly' }, // daily, weekly, monthly, noFixedTime
      repeatEvery: { type: Number, default: 1 },
      daysOfWeek: { type: [String], default: [] },
      endDate: { type: String, default: '' },
      occurrences: { type: Number, default: 7 },
    },
    authentication: {
      required: { type: Boolean, default: false },
      type: { type: String, default: 'signedIn' }, // signedIn, organizationOnly
    },
    registration: {
      required: { type: Boolean, default: false },
      approvalType: { type: String, default: 'automatic' }, // automatic, manual
      allowedDomains: { type: [String], default: [] },
      customQuestions: [
        {
          question: String,
          questionType: { type: String, default: 'text' }, // text, singleChoice
          options: [String],
          required: { type: Boolean, default: false },
        }
      ],
    },
    preCreatedPolls: [
      {
        question: String,
        options: [String],
        allowMultiple: Boolean,
      }
    ],
    interpretation: {
      enabled: { type: Boolean, default: false },
      languages: { type: [String], default: [] },
    },
    signLanguage: {
      enabled: { type: Boolean, default: false },
      channels: { type: [String], default: [] },
    },
    options: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    alternativeHosts: {
      type: [String],
      default: [],
    },
    coHosts: {
      type: [String],
      default: [],
    },
    participants: [
      {
        name: String,
        email: String,
        avatar: String,
      },
    ],
    summary: {
      type: String,
    },
    transcript: [
      {
        speaker: String,
        time: String,
        text: String,
      },
    ],
  },
  { timestamps: true }
);

const Meeting = mongoose.models.Meeting || mongoose.model('Meeting', meetingSchema);

export default Meeting;
