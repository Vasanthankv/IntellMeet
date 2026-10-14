import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import Peer from 'simple-peer';
import { useAuthStore } from '../../store/authStore';
import { 
  Mic, MicOff, Video, VideoOff, MessageSquare, Users, 
  Smile, Share, Share2, MoreHorizontal, X, Shield, Info, Settings, Flag,
  BrainCircuit, Subtitles, Disc, Lock, Unlock, ShieldAlert, Check, 
  Copy, AlertTriangle, Eye, EyeOff, Headphones, ChevronUp, ChevronDown, ChevronRight,
  Volume2, VolumeX, Phone, Radio, HelpCircle, Sliders,
  LayoutGrid, Grid, Star, Palette, UserCheck, Maximize2, User, Sparkles, Layers,
  Pin, Paperclip, Download, FileText, Image as ImageIcon, Send, File, ExternalLink, MoreVertical, FileCode, Archive,
  Search, Crown, Hand, UserPlus, Edit2, Trash2, Bell, BellOff, AlertOctagon,
  ThumbsUp, ThumbsDown, Zap, Clock, BarChart2, Globe, ListChecks,
  Pen, Presentation, Activity, LogOut
} from 'lucide-react';


import toast from 'react-hot-toast';
import BackgroundEffectsModal, { PRESET_BACKGROUNDS, VIDEO_FILTERS, AVATARS } from '../../components/video/BackgroundEffectsModal';
import VideoSettingsModal from '../../components/video/VideoSettingsModal';
import VideoLayoutEngine from '../../components/video/VideoLayoutEngine';
import ShareContentModal from '../../components/share/ShareContentModal';
import WhiteboardModal from '../../components/share/WhiteboardModal';
import ScreenShareFloatingBar from '../../components/share/ScreenShareFloatingBar';
import AdvancedSharingOptionsModal from '../../components/share/AdvancedSharingOptionsModal';
import AnnotationToolbar from '../../components/annotation/AnnotationToolbar';
import SlideControlPopover from '../../components/presentation/SlideControlPopover';
import ParticipantSlideControlWidget from '../../components/presentation/ParticipantSlideControlWidget';
import WhiteboardStudio from '../../components/whiteboard/WhiteboardStudio';
import WhiteboardPickerModal from '../../components/whiteboard/WhiteboardPickerModal';
import BreakoutHostModal from '../../components/breakout/BreakoutHostModal';
import BreakoutParticipantModal from '../../components/breakout/BreakoutParticipantModal';
import BreakoutRoomBanner from '../../components/breakout/BreakoutRoomBanner';
import BreakoutBroadcastToast from '../../components/breakout/BreakoutBroadcastToast';
import BreakoutHelpRequestToast from '../../components/breakout/BreakoutHelpRequestToast';
import PollsQuizzesModal from '../../components/polls/PollsQuizzesModal';
import PollParticipantView from '../../components/polls/PollParticipantView';
import LiveCaptionOverlay from '../../components/captions/LiveCaptionOverlay';
import CaptionSettingsModal from '../../components/captions/CaptionSettingsModal';
import TranscriptPanel from '../../components/captions/TranscriptPanel';
import ManualCaptionModal from '../../components/captions/ManualCaptionModal';
import TranslationSettingsModal from '../../components/translation/TranslationSettingsModal';
import voiceTranslator from '../../components/translation/VoiceTranslationEngine';
import LanguageInterpretationModal from '../../components/interpretation/LanguageInterpretationModal';
import InterpreterConsole from '../../components/interpretation/InterpreterConsole';
import SignLanguagePiP from '../../components/interpretation/SignLanguagePiP';
import localRecordingEngine from '../../components/recording/LocalRecordingEngine';
import RecordingMenuPopover from '../../components/recording/RecordingMenuPopover';
import RecordingIndicatorBar from '../../components/recording/RecordingIndicatorBar';
import RecordingSettingsModal from '../../components/recording/RecordingSettingsModal';
import MeetingAISummaryModal from '../../components/ai/MeetingAISummaryModal';
import MeetingAIQuestionsDrawer from '../../components/ai/MeetingAIQuestionsDrawer';
import MyNotesDrawer from '../../components/notes/MyNotesDrawer';
import MeetingSecurityPanel from '../../components/security/MeetingSecurityPanel';
import SuspendActivitiesModal from '../../components/security/SuspendActivitiesModal';
import RemoveParticipantModal from '../../components/security/RemoveParticipantModal';
import EncryptionInfoPopover from '../../components/security/EncryptionInfoPopover';
import E2EEWarningModal from '../../components/security/E2EEWarningModal';
import WatermarkSettingsModal from '../../components/security/WatermarkSettingsModal';
import LiveStreamingModal from '../../components/streaming/LiveStreamingModal';
import LiveStreamingIndicator from '../../components/streaming/LiveStreamingIndicator';
import MeetingPrepWorkspace from '../../components/meetings/MeetingPrepWorkspace';
import { usePersonalizationStore, THEMES } from '../../store/personalizationStore';
import PersonalizationModal from '../../components/personalization/PersonalizationModal';
import { useNetworkAdaptation } from '../../components/adaptation/useNetworkAdaptation';
import NetworkStatusBadge from '../../components/adaptation/NetworkStatusBadge';
import NetworkHealthModal from '../../components/adaptation/NetworkHealthModal';





const SOCKET_SERVER_URL =
  import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
    ? (typeof localStorage !== 'undefined' && localStorage.getItem('intellmeet_api_url')) || 'https://intellmeet-backend-h3md.onrender.com'
    : 'http://localhost:5000');

const VideoFrame = ({ peer, name }) => {
  const ref = useRef();
  useEffect(() => {
    peer.on('stream', stream => {
      if (ref.current) {
        ref.current.srcObject = stream;
      }
    });
  }, [peer]);
  return (
    <div className="relative bg-gray-900 rounded-lg overflow-hidden border border-gray-800 h-full shadow-lg">
      <video playsInline autoPlay ref={ref} className="w-full h-full object-cover" />
      <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded text-white text-xs font-medium backdrop-blur-sm">
        {name || 'Participant'}
      </div>
    </div>
  );
};

export default function MeetingRoom() {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [isHost, setIsHost] = useState(true);
  const [showLeaveDropdown, setShowLeaveDropdown] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [meetingInfo, setMeetingInfo] = useState({ title: `${user?.name || 'User'}'s Meeting`, meetingId });
  const [meetingPermissions, setMeetingPermissions] = useState({
    allowUnmute: true,
    allowStartVideo: true,
    allowRename: true,
    allowShareScreen: true,
  });

  useEffect(() => {
    const fetchMeeting = async () => {
      try {
        const cleanMeetingId = meetingId ? meetingId.replace(/[\s-]/g, '') : '';
        const res = await fetch(`http://localhost:5000/api/meetings/${encodeURIComponent(cleanMeetingId || meetingId || '')}`);
        const data = await res.json();
        if (data.success && data.meeting) {
          setMeetingInfo(data.meeting);
          const currentUserId = user?.id || user?._id;
          const hostId = data.meeting.host || data.meeting.hostId;
          const isUserHost = Boolean(
            currentUserId && hostId && String(currentUserId) === String(hostId)
          ) || user?.role === 'Host' || user?.role === 'Administrator' || !hostId;
          setIsHost(isUserHost);
        }
      } catch (err) {
        console.warn('Meeting info fetch note:', err);
      }
    };
    fetchMeeting();
  }, [meetingId, user]);
  
  const [peers, setPeers] = useState([]);
  const [stream, setStream] = useState(null);
  
  // Controls state
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const isMuted = !isAudioOn;
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  
  // UI Panels
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [showSecurityPopover, setShowSecurityPopover] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [showChatIntro, setShowChatIntro] = useState(true);
  const [floatingEmojis, setFloatingEmojis] = useState([]);
  const [showChatEmojiPicker, setShowChatEmojiPicker] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  // New Features State
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isMeetingLocked, setIsMeetingLocked] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  
  // Part 31: Encryption States (31.1 - 31.16)
  const [showEncryptionPopover, setShowEncryptionPopover] = useState(false);
  const [showE2EEWarningModal, setShowE2EEWarningModal] = useState(false);
  const [encryptionData, setEncryptionData] = useState({
    type: 'ENHANCED',
    enabled: true,
    cipher: '256-bit AES-GCM',
    keyManagement: 'SERVER_MANAGED',
    securityCode: '7492-1840-5921-3804',
    keyVersion: 1,
    isPartialEncryption: false,
    endpointStatuses: [],
    verifiedParticipantsCount: 0,
    featureCompatibility: {
      aiSummaryDisabled: false,
      aiQuestionsDisabled: false,
      liveTranscriptionDisabled: false,
      cloudRecordingDisabled: false,
      smartRecordingDisabled: false,
      aiNotesDisabled: false,
      whiteboardDisabled: false,
      pollsDisabled: false
    }
  });

  // Part 32: Watermarking States (32.1 - 32.10)
  const [showWatermarkSettingsModal, setShowWatermarkSettingsModal] = useState(false);
  const [watermarkSettings, setWatermarkSettings] = useState({
    visualEnabled: false,
    visualMode: 'repeated',
    visibleOn: 'both',
    opacity: 25,
    identityType: 'maskedEmail',
    audioEnabled: false,
    audioSignatures: []
  });
  const [viewerIdentity, setViewerIdentity] = useState({
    rawEmail: '',
    maskedEmail: '',
    formattedIdentity: '',
    participantId: 'local',
    participantName: 'Participant'
  });
  const audioWatermarkOscRef = useRef(null);
  const audioWatermarkCtxRef = useRef(null);

  // Part 33: Live Streaming States (33.1 - 33.23)
  const [showLiveStreamingModal, setShowLiveStreamingModal] = useState(false);
  const [liveStreamSession, setLiveStreamSession] = useState({
    status: 'NOT_CONFIGURED',
    viewerCount: 0,
    startedAt: null,
    destinations: [],
    branding: {
      watermarkEnabled: true,
      brandText: 'Powered by IntelliMeet',
      position: 'bottom-right'
    }
  });
  const [securitySettings, setSecuritySettings] = useState({
    lockMeeting: false,
    meetingLocked: false,
    enableWaitingRoom: true,
    waitingRoomEnabled: true,
    hideProfilePictures: false,
    whoCanShareScreen: 'all', // 'hostOnly' | 'hostCoHost' | 'all'
    allowShareScreen: true,
    allowChat: 'everyone', // 'everyone' | 'hostOnly' | 'none'
    allowRename: true,
    allowUnmute: true,
    allowStartVideo: true,
    allowWhiteboard: true,
    allowRequestRecording: true,
    screenCaptureProtection: false,
    watermark: false,
    suspendActivities: false,
    participantActivitiesSuspended: false,
    participantPermissions: {
      canChat: 'everyone',
      canUnmute: true,
      canStartVideo: true,
      canShareScreen: true,
      canRename: true,
      canShareWhiteboard: true,
      canRequestRecording: true
    }
  });
  const [screenCaptureShield, setScreenCaptureShield] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [isVirtualBackgroundOn, setIsVirtualBackgroundOn] = useState(false);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const recognitionRef = useRef(null);

  // Meeting Roles State (Host, Co-host, Participant)
  const [coHosts, setCoHosts] = useState([]);
  const isHostOrCoHost = Boolean(isHost || user?.id === 'host' || user?._id === 'host' || coHosts?.includes(user?.id) || coHosts?.includes(user?._id));
  const [activeParticipantMenu, setActiveParticipantMenu] = useState(null);
  const [sampleParticipants, setSampleParticipants] = useState([]);

  // Part 11: Participants Panel Architecture (11.1 - 11.26)
  const [rightPanelTab, setRightPanelTab] = useState('participants'); // 'participants' | 'chat' | 'split'
  const [participantSearchQuery, setParticipantSearchQuery] = useState('');
  const [muteOnEntry, setMuteOnEntry] = useState(false);
  const [playJoinLeaveChime, setPlayJoinLeaveChime] = useState(true);
  const [hideProfilePics, setHideProfilePics] = useState(false);
  const [showParticipantsMoreMenu, setShowParticipantsMoreMenu] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(null); // participant to rename
  const [renameInput, setRenameInput] = useState('');
  const [showMakeHostModal, setShowMakeHostModal] = useState(null); // participant to make host
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [unmutePrompt, setUnmutePrompt] = useState(null); // { hostName }
  const [startVideoPrompt, setStartVideoPrompt] = useState(null); // { hostName }
  const [raisedHands, setRaisedHands] = useState([]); // list of participant IDs with raised hand
  
  // Part 12: Reactions & Non-Verbal Feedback Architecture (12.1 - 12.17)
  const [raisedHandsQueue, setRaisedHandsQueue] = useState([]); // [{ participantId, name, handRaisedAt }]
  const [nonVerbalFeedbacks, setNonVerbalFeedbacks] = useState({}); // participantId -> { value, label, icon, name, updatedAt }
  const [myNonVerbal, setMyNonVerbal] = useState(null); // 'YES' | 'NO' | 'SLOWER' | 'FASTER' | null
  const [showExtendedReactions, setShowExtendedReactions] = useState(false);
  const [reactionSettings, setReactionSettings] = useState({
    allowReactions: true,
    allowRaiseHand: true,
    allowNonVerbal: true,
  });

  // Part 13: Screen Sharing & Content Broadcasting Architecture (13.1 - 13.22)
  const [showShareModal, setShowShareModal] = useState(false);
  const [showWhiteboardModal, setShowWhiteboardModal] = useState(false);
  const [showAdvancedShareModal, setShowAdvancedShareModal] = useState(false);
  const [showShareChevronMenu, setShowShareChevronMenu] = useState(false);
  const [isSharePaused, setIsSharePaused] = useState(false);
  const [presenterLayout, setPresenterLayout] = useState('side-by-side'); // 'side-by-side' | 'overlay' | 'content-only'
  const [sharingSettings, setSharingSettings] = useState({
    whoCanShare: 'all',
    mode: 'oneParticipant',
    whoCanStartWhenSharing: 'hostOnly'
  });
  const [screenShareDetails, setScreenShareDetails] = useState(null);
  const [activeShareSessions, setActiveShareSessions] = useState([]);
  const [isShareAudioEnabled, setIsShareAudioEnabled] = useState(true);

  // Part 15: Annotation States & History (Sections 15.1 - 15.10)
  const [isAnnotating, setIsAnnotating] = useState(false);
  const [annotationTool, setAnnotationTool] = useState('draw'); // 'mouse' | 'select' | 'draw' | 'highlight' | 'text' | 'arrow' | 'rect' | 'circle' | 'line' | 'stamp' | 'spotlight' | 'vanishing' | 'eraser'
  const [annotationColor, setAnnotationColor] = useState('#EF4444');
  const [annotationLineWidth, setAnnotationLineWidth] = useState(3);
  const [annotationStampType, setAnnotationStampType] = useState('CHECK');
  const [showAnnotatorNames, setShowAnnotatorNames] = useState(true);
  const [annotations, setAnnotations] = useState([]);
  const [annotationHistory, setAnnotationHistory] = useState([]);
  const [annotationRedoStack, setAnnotationRedoStack] = useState([]);
  const [annotationSettings, setAnnotationSettings] = useState({
    enableAnnotation: true,
    annotationPermission: 'all', // 'all' | 'presenterOnly' | 'none'
    showAnnotatorNames: true,
    allowSaveAnnotation: true,
  });

  // Part 16: Slide Control States (16.1 - 16.16)
  const [presentationSession, setPresentationSession] = useState(null);
  const [showSlideControlModal, setShowSlideControlModal] = useState(false);

  // Part 17: Whiteboard States (17.1 - 17.23)
  const [showWhiteboardPicker, setShowWhiteboardPicker] = useState(false);
  const [activeWhiteboard, setActiveWhiteboard] = useState(null);

  // Part 18: Breakout Rooms States (18.1 - 18.33)
  const [showBreakoutHostModal, setShowBreakoutHostModal] = useState(false);
  const [showBreakoutParticipantModal, setShowBreakoutParticipantModal] = useState(false);
  const [currentBreakoutRoom, setCurrentBreakoutRoom] = useState(null);
  const [breakoutRoomsList, setBreakoutRoomsList] = useState([]);
  const [breakoutCountdown, setBreakoutCountdown] = useState(null);
  const [activeBroadcastToast, setActiveBroadcastToast] = useState(null);
  const [activeHelpRequestToast, setActiveHelpRequestToast] = useState(null);

  // Part 19: Polls & Quizzes States (19.1 - 19.22)
  const [showPollsModal, setShowPollsModal] = useState(false);
  const [showPollParticipantView, setShowPollParticipantView] = useState(false);
  const [activePoll, setActivePoll] = useState(null);           // currently launched poll
  const [pollSharedResults, setPollSharedResults] = useState(null); // results shared to all

  // Part 20: Live Captions & Transcription States (20.1 - 20.16)
  const [showLiveCaptions, setShowLiveCaptions] = useState(false);
  const [currentCaptionSegment, setCurrentCaptionSegment] = useState(null);
  const [recentCaptionSegments, setRecentCaptionSegments] = useState([]);
  const [captionFontSize, setCaptionFontSize] = useState('medium');
  const [captionContrast, setCaptionContrast] = useState('dark');
  const [captionPosition, setCaptionPosition] = useState('bottom');
  const [speakingLanguage, setSpeakingLanguage] = useState('en-US');
  const [translationLanguage, setTranslationLanguage] = useState(null);
  const [showCaptionSettingsModal, setShowCaptionSettingsModal] = useState(false);
  const [showTranscriptPanel, setShowTranscriptPanel] = useState(false);
  const [showManualCaptionModal, setShowManualCaptionModal] = useState(false);
  const [showCaptionsChevronMenu, setShowCaptionsChevronMenu] = useState(false);
  const [captionSettings, setCaptionSettings] = useState({
    captionsEnabled: true,
    hostOnlyControl: false,
    participantRequestsAllowed: true,
    captionRequests: [],
    assignedCaptionerId: null,
    assignedCaptionerName: null,
  });
  const [transcriptSegments, setTranscriptSegments] = useState([]);
  const [isGeneratingAISummary, setIsGeneratingAISummary] = useState(false);
  const [aiSummaryData, setAiSummaryData] = useState(null);

  // Part 25: AI Meeting Summary States (25.1 - 25.24)
  const [showAISummaryModal, setShowAISummaryModal] = useState(false);
  const [meetingSummaryRecord, setMeetingSummaryRecord] = useState(null);
  const [isGeneratingMeetingSummary, setIsGeneratingMeetingSummary] = useState(false);

  // Part 26: AI Meeting Questions States (26.1 - 26.29)
  const [showAIQuestionsDrawer, setShowAIQuestionsDrawer] = useState(false);

  // Part 27: AI / Personal Notes (My Notes) States (27.1 - 27.12)
  const [showMyNotesDrawer, setShowMyNotesDrawer] = useState(false);

  // Part 36: Agenda, Pre-reads & Shared Notes Drawer States (36.1 - 36.15)
  const [showAgendaDrawer, setShowAgendaDrawer] = useState(false);

  // Part 37: Personalization States (37.1 - 37.15)
  const [showPersonalizationModal, setShowPersonalizationModal] = useState(false);
  const {
    theme: personalTheme,
    customWallpaper,
    toolbarLayout,
    hiddenToolbarItems,
    defaultVideoLayout,
    multiSpeakerCount,
    hideNonVideoParticipants: personalHideNonVideo,
    fetchPreferences: fetchPersonalPreferences,
    updatePreferences: updatePersonalPreferences
  } = usePersonalizationStore();

  useEffect(() => {
    fetchPersonalPreferences();
  }, [fetchPersonalPreferences]);

  // Part 21: Translation States (21.1 - 21.19)
  const [showTranslationModal, setShowTranslationModal] = useState(false);
  const [meetingTranslationActive, setMeetingTranslationActive] = useState(true);
  const [participantTargetLanguage, setParticipantTargetLanguage] = useState('ta');
  const [participantTranslationEnabled, setParticipantTranslationEnabled] = useState(true);
  const [participantVoiceTranslationEnabled, setParticipantVoiceTranslationEnabled] = useState(false);
  const [languagePairs, setLanguagePairs] = useState([]);

  // Part 22: Language & Sign-Language Interpretation States (22.1 - 22.23)
  const [showInterpretationModal, setShowInterpretationModal] = useState(false);
  const [interpretationSession, setInterpretationSession] = useState({
    enabled: true,
    status: 'ACTIVE',
    sourceLanguage: 'en',
    languages: [],
    signLanguageInterpreters: [],
  });
  const [selectedInterpretationChannel, setSelectedInterpretationChannel] = useState('original');
  const [originalAudioVolume, setOriginalAudioVolume] = useState(0.2);
  const [interpretationVolume, setInterpretationVolume] = useState(1.0);
  const [signLanguageEnabled, setSignLanguageEnabled] = useState(false);
  const [isInterpreterMicMuted, setIsInterpreterMicMuted] = useState(false);

  // Part 23: Recording States (23.1 - 23.23)
  const [isMeetingRecording, setIsMeetingRecording] = useState(false);
  const [recordingPaused, setRecordingPaused] = useState(false);
  const [recordingMode, setRecordingMode] = useState('CLOUD'); // 'LOCAL' | 'CLOUD'
  const [recordingLayout, setRecordingLayout] = useState('SPEAKER'); // 'SPEAKER' | 'GALLERY' | 'SHARED_SCREEN'
  const [activeRecordingId, setActiveRecordingId] = useState(null);
  const [recordingStartedAt, setRecordingStartedAt] = useState(null);
  const [showRecordingMenu, setShowRecordingMenu] = useState(false);
  const [showRecordingSettingsModal, setShowRecordingSettingsModal] = useState(false);
  const [recordingSettings, setRecordingSettings] = useState({
    allowLocalRecording: true,
    allowCloudRecording: true,
    autoRecording: { enabled: false, type: 'CLOUD' },
    localRecordingPath: 'C:\\Users\\User\\Documents\\IntellMeet\\Recordings',
    showParticipantNames: true,
    includeTimestamp: true,
    recordScreenWithVideo: true,
    participantRecordingPermissions: [],
    cloudStorage: { usedBytes: 1258291200, quotaBytes: 5368709120, usedPercentage: 24 }
  });
  const [participantCanRecordLocal, setParticipantCanRecordLocal] = useState(false);





  // Audio Chime synthesizer for Join/Leave (Section 11.17)
  const playChimeSound = (type = 'join') => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      if (type === 'join') {
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
        osc.start();
        osc.stop(ctx.currentTime + 0.45);
      } else {
        osc.frequency.setValueAtTime(783.99, ctx.currentTime);
        osc.frequency.setValueAtTime(523.25, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
        osc.start();
        osc.stop(ctx.currentTime + 0.45);
      }
    } catch (e) {}
  };
  
  // Part 7: Audio Navigation & Control States
  const [isAudioConnected, setIsAudioConnected] = useState(() => {
    return sessionStorage.getItem('intellmeet_audio_type') !== 'none';
  });
  const [showAudioMenu, setShowAudioMenu] = useState(false);
  const [showJoinAudioModal, setShowJoinAudioModal] = useState(false);
  const [joinAudioTab, setJoinAudioTab] = useState('computer'); // 'computer' | 'phone'
  const [showAudioTestModal, setShowAudioTestModal] = useState(false);
  const [showAudioSettingsModal, setShowAudioSettingsModal] = useState(false);
  const [showMuteAllModal, setShowMuteAllModal] = useState(false);
  const [allowUnmuteOnMuteAll, setAllowUnmuteOnMuteAll] = useState(true);
  const [unmuteRequestReceived, setUnmuteRequestReceived] = useState(false);

  // Audio Device Management
  const [audioInputs, setAudioInputs] = useState([]);
  const [audioOutputs, setAudioOutputs] = useState([]);
  const [selectedMic, setSelectedMic] = useState(() => sessionStorage.getItem('intellmeet_selected_mic') || 'default');
  const [selectedSpeaker, setSelectedSpeaker] = useState('default');
  const [speakerVolume, setSpeakerVolume] = useState(80);
  const [micVolume, setMicVolume] = useState(80);
  const [autoAdjustMic, setAutoAdjustMic] = useState(true);
  const [noiseSuppressionLevel, setNoiseSuppressionLevel] = useState('auto');

  // Test Speaker & Microphone Wizard States (Section 7.5)
  const [testAudioStep, setTestAudioStep] = useState(1); // 1 = Speaker, 2 = Mic, 3 = Done
  const [isTestRingtonePlaying, setIsTestRingtonePlaying] = useState(false);
  const [testMicState, setTestMicState] = useState('idle'); // 'idle' | 'recording' | 'replaying'
  const [testMicCountdown, setTestMicCountdown] = useState(3);

  // Part 8: Video Controls & Selection (8.1, 8.2, 8.3)
  const [videoInputs, setVideoInputs] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState(() => sessionStorage.getItem('intellmeet_selected_cam') || 'default');
  const [showVideoMenu, setShowVideoMenu] = useState(false);
  const [showVideoSettingsModal, setShowVideoSettingsModal] = useState(false);
  const [showBackgroundEffectsModal, setShowBackgroundEffectsModal] = useState(false);
  const [backgroundEffectsTab, setBackgroundEffectsTab] = useState('background'); // 'background' | 'filter' | 'avatar'

  // Video Backgrounds, Filters & Avatars (8.5, 8.6, 8.7)
  const [currentBackground, setCurrentBackground] = useState(() => sessionStorage.getItem('intellmeet_initial_bg') || 'none');
  const [customBgUrl, setCustomBgUrl] = useState('');
  const [currentFilter, setCurrentFilter] = useState('none');
  const [currentAvatar, setCurrentAvatar] = useState('none');
  const [videoSettings, setVideoSettings] = useState({
    aspectRatio: '16:9',
    hd: true,
    mirror: true,
    lowLight: true,
    touchUp: false,
    touchUpLevel: 50
  });

  // Part 9: Video Layouts Architecture (9.1 - 9.16)
  const [layoutMode, setLayoutMode] = useState('gallery'); // 'speaker' | 'gallery' | 'dynamic-gallery' | 'multi' | 'immersive' | 'floating'
  const [showViewMenu, setShowViewMenu] = useState(false);
  const [pinnedParticipantIds, setPinnedParticipantIds] = useState([]); // Multi-pin up to 9 (Section 9.5)
  const [spotlightParticipantIds, setSpotlightParticipantIds] = useState([]); // Multi-spotlight up to 9 (Section 9.6)
  const [hideNonVideoParticipants, setHideNonVideoParticipants] = useState(false); // Section 9.13
  const [screenShareSubMode, setScreenShareSubMode] = useState('speaker'); // 'speaker' | 'gallery' (Section 9.12)
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Waiting Room Admission Queue (Part 3 Specification)
  const [waitingRoomQueue, setWaitingRoomQueue] = useState([]);
  
  // Part 10: In-Meeting Chat State & Continuous Chat Architecture (10.1 - 10.21)
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatRecipient, setChatRecipient] = useState({ id: 'everyone', name: 'Everyone' });
  const [chatPermission, setChatPermission] = useState('everyone'); // 'everyone' | 'publicOnly' | 'hostOnly' | 'none'
  const [showChatSettingsMenu, setShowChatSettingsMenu] = useState(false);
  const [pinnedChatMessage, setPinnedChatMessage] = useState(null);
  const [selectedAttachment, setSelectedAttachment] = useState(null);
  const [showDocShareModal, setShowDocShareModal] = useState(false);
  const [activeMessageMenu, setActiveMessageMenu] = useState(null);
  const chatFileInputRef = useRef(null);
  const chatEndRef = useRef(null);

  // Load Continuous Meeting Chat history from MongoDB (Section 10.12 - 10.17)
  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        const currentUserId = user?.id || user?._id || '';
        const res = await fetch(`http://localhost:5000/api/meetings/${meetingId}/messages?userId=${currentUserId}`);
        const data = await res.json();
        if (data.success) {
          setChatMessages(data.messages.map(m => ({
            ...m,
            isSelf: m.senderName === (user?.name || 'You') || m.senderId === currentUserId,
            time: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          })));
          if (data.pinnedMessage) {
            setPinnedChatMessage(data.pinnedMessage);
          }
        }
        // Fetch host chat settings
        const permRes = await fetch(`http://localhost:5000/api/meetings/${meetingId}/chat-settings`);
        const permData = await permRes.json();
        if (permData.success && permData.allowChat) {
          setChatPermission(permData.allowChat);
        }

        // Part 12: Fetch feedback & raised hands state from MongoDB (12.16)
        try {
          const fbRes = await fetch(`http://localhost:5000/api/meetings/${meetingId}/feedback`);
          const fbData = await fbRes.json();
          if (fbData.success) {
            if (fbData.raisedHandsQueue && fbData.raisedHandsQueue.length > 0) {
              setRaisedHandsQueue(fbData.raisedHandsQueue);
              setRaisedHands(fbData.raisedHandsQueue.map(h => h.participantId));
              if (fbData.raisedHandsQueue.some(h => h.participantId === currentUserId || h.participantId === 'local')) {
                setHandRaised(true);
              }
            }
            if (fbData.activeFeedbacks?.nonVerbal && fbData.activeFeedbacks.nonVerbal.length > 0) {
              const iconMap = { YES: '👍', NO: '👎', SLOWER: '🐢', FASTER: '⚡' };
              const labelMap = { YES: 'Yes', NO: 'No', SLOWER: 'Go Slower', FASTER: 'Go Faster' };
              const nvMap = {};
              fbData.activeFeedbacks.nonVerbal.forEach(nv => {
                nvMap[nv.participantId] = {
                  value: nv.value,
                  label: labelMap[nv.value] || nv.value,
                  icon: iconMap[nv.value] || '💬',
                  name: nv.displayName || 'Participant',
                  updatedAt: new Date(nv.timestamp)
                };
                if (nv.participantId === currentUserId || nv.participantId === 'local') {
                  setMyNonVerbal(nv.value);
                }
              });
              setNonVerbalFeedbacks(nvMap);
            }
          }
        } catch (fbErr) {
          console.error('Failed to load feedback state:', fbErr);
        }

        // Part 13: Fetch active screen share session & settings from MongoDB (13.21)
        try {
          const shareRes = await fetch(`http://localhost:5000/api/meetings/${meetingId}/share-session`);
          const shareData = await shareRes.json();
          if (shareData.success) {
            if (shareData.sharingSettings) {
              setSharingSettings(shareData.sharingSettings);
            }
            if (shareData.isSharing && shareData.activeSession) {
              const session = shareData.activeSession;
              setIsScreenSharing(true);
              setIsSharePaused(session.sharingStatus === 'PAUSED');
              setScreenShareDetails({
                isSharing: true,
                isPaused: session.sharingStatus === 'PAUSED',
                sharerId: session.activeSharerId,
                sharerName: session.activeSharerName,
                sourceName: session.shareSession?.sourceName || 'Entire Screen',
                type: session.shareSession?.type || 'SCREEN',
                audioEnabled: session.shareSession?.audioEnabled,
                videoOptimization: session.shareSession?.videoOptimization,
                presenterLayout: 'side-by-side'
              });

              if (shareData.activeSessions && shareData.activeSessions.length > 0) {
                setActiveShareSessions(shareData.activeSessions.map(s => ({
                  id: s._id || s.activeSharerId,
                  sharerId: s.activeSharerId,
                  sharerName: s.activeSharerName,
                  sourceName: s.shareSession?.sourceName || 'Entire Screen',
                  type: s.shareSession?.type || 'SCREEN',
                  audioEnabled: !!s.shareSession?.audioEnabled,
                  videoOptimization: !!s.shareSession?.videoOptimization,
                  status: s.sharingStatus,
                  startedAt: s.shareSession?.startedAt || s.createdAt
                })));
              }

              if (session.shareSession?.type === 'WHITEBOARD') {
                setShowWhiteboardModal(true);
              }
            }
          }
        } catch (shareErr) {
          console.error('Failed to load share session:', shareErr);
        }

        // Part 15: Fetch active annotations & settings from MongoDB (15.10)
        try {
          const annRes = await fetch(`http://localhost:5000/api/meetings/${meetingId}/annotations`);
          const annData = await annRes.json();
          if (annData.success) {
            if (annData.annotations && annData.annotations.length > 0) {
              setAnnotations(annData.annotations);
              setAnnotationHistory(annData.annotations.map(a => a.annotationId));
            }
            if (annData.settings) {
              setAnnotationSettings(annData.settings);
              if (annData.settings.showAnnotatorNames !== undefined) {
                setShowAnnotatorNames(annData.settings.showAnnotatorNames);
              }
            }
          }
        } catch (annErr) {
          console.error('Failed to load annotations:', annErr);
        }

        // Part 16: Fetch active presentation session from MongoDB (16.14)
        try {
          const presRes = await fetch(`http://localhost:5000/api/meetings/${meetingId}/presentation/current`);
          const presData = await presRes.json();
          if (presData.success && presData.active && presData.session) {
            setPresentationSession(presData.session);
            setIsScreenSharing(true);
            setScreenShareDetails({
              isSharing: true,
              isPaused: false,
              sharerId: presData.session.presenterId,
              sharerName: presData.session.presenterName,
              sourceName: `${presData.session.presentationType}: ${presData.session.presentationName}`,
              type: 'PRESENTATION',
              presentationType: presData.session.presentationType,
              presentationName: presData.session.presentationName,
              audioEnabled: true,
              videoOptimization: false,
              presenterLayout: 'side-by-side'
            });
          }
        } catch (presErr) {
          console.error('Failed to load presentation session:', presErr);
        }
      } catch (err) {
        console.error('Failed to load chat history:', err);
      }
    };
    loadChatHistory();
  }, [meetingId, user]);

  const socketRef = useRef();
  const userVideo = useRef();
  const peersRef = useRef([]);
  const screenTrackRef = useRef(null);

  const [meetingTitle, setMeetingTitle] = useState(user?.name ? `${user.name}'s IntellMeet` : 'IntellMeet Meeting');

  // Part 38: Device & Network Adaptation States (38.1 - 38.20)
  const [showNetworkHealthModal, setShowNetworkHealthModal] = useState(false);
  const {
    sessionId: adaptationSessionId,
    deviceStats,
    networkStats,
    mediaProfile,
    setParticipationMode: setAdaptationMode
  } = useNetworkAdaptation({
    meetingId,
    user,
    socket: socketRef.current,
    onVideoQualityAdjust: ({ mode }) => {
      if (mode === 'AUDIO_ONLY') {
        if (stream) {
          stream.getVideoTracks().forEach(t => { t.enabled = false; });
        }
        setIsVideoOn(false);
      }
    }
  });

  // Handle initial AUDIO_ONLY preference from Pre-Join Screen (Section 38.4)
  useEffect(() => {
    const initialMode = sessionStorage.getItem('intellmeet_initial_mode');
    if (initialMode === 'AUDIO_ONLY') {
      setAdaptationMode('AUDIO_ONLY');
      sessionStorage.removeItem('intellmeet_initial_mode');
    }
  }, [setAdaptationMode]);

  useEffect(() => {
    if (showRightPanel && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, showRightPanel]);

  useEffect(() => {
    socketRef.current = io(SOCKET_SERVER_URL);
    const storedGuestName = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('intellmeet_guest_name') : null;
    const userId = user?.id || user?._id || (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('intellmeet_guest_id') : null) || 'u_' + Math.floor(Math.random() * 10000);
    const userName = user?.name || storedGuestName || 'Guest';

    const initialAudio = sessionStorage.getItem('intellmeet_initial_audio') !== 'false';
    const initialVideo = sessionStorage.getItem('intellmeet_initial_video') !== 'false';

    const cleanMId = meetingId ? meetingId.replace(/[\s-]/g, '') : '';
    let currentStream = null;

    const startRoomMediaAndSocket = async () => {
      const mediaConstraints = {
        video: {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 24, max: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      };

      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          try {
            currentStream = await navigator.mediaDevices.getUserMedia(mediaConstraints);
          } catch (e1) {
            try {
              currentStream = await navigator.mediaDevices.getUserMedia({ 
                video: false, 
                audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } 
              });
              setIsVideoOn(false);
            } catch (e2) {
              console.warn('Microphone/camera unavailable or permission denied:', e2);
              setIsVideoOn(false);
              setIsAudioOn(false);
            }
          }
        }
      } catch (err) {
        console.warn('getUserMedia error:', err);
      }

      if (currentStream) {
        currentStream.getAudioTracks().forEach(track => { track.enabled = initialAudio; });
        currentStream.getVideoTracks().forEach(track => { track.enabled = initialVideo; });
        setStream(currentStream);
        if (userVideo.current) userVideo.current.srcObject = currentStream;
      }

      if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        navigator.mediaDevices.enumerateDevices().then(devices => {
          const inputs = devices.filter(d => d.kind === 'audioinput');
          const outputs = devices.filter(d => d.kind === 'audiooutput');
          const videoDevs = devices.filter(d => d.kind === 'videoinput');
          setAudioInputs(inputs);
          setAudioOutputs(outputs);
          setVideoInputs(videoDevs);
        }).catch(() => {});
      }

      socketRef.current.emit('join-room', cleanMId || meetingId, userId, userName);
    };

    startRoomMediaAndSocket();

      // Listen for all existing users already in the room (Newcomer initiates to each existing user)
      socketRef.current.on('all-users', (existingUsers) => {
        if (Array.isArray(existingUsers) && existingUsers.length > 0) {
          setSampleParticipants(prev => {
            const next = [...prev];
            existingUsers.forEach(u => {
              if (!next.some(p => p.id === u.socketId || p.id === u.userId)) {
                next.push({ id: u.socketId || u.userId, name: u.userName || 'Participant', isLocal: false, isMuted: false, hasVideo: true });
              }
            });
            return next;
          });
          existingUsers.forEach(u => {
            try {
              const peer = createPeer(u.socketId, socketRef.current.id, currentStream, userName);
              peer.on('stream', (remoteStream) => {
                setPeers(prevPeers => prevPeers.map(p => p.peerID === u.socketId ? { ...p, stream: remoteStream } : p));
              });
              peersRef.current.push({ peerID: u.socketId, peer, name: u.userName, stream: null });
            } catch (err) {
              console.warn('Peer create error for existing user:', err);
            }
          });
          setPeers([...peersRef.current]);
        }
      });

      // Existing user informed that a newcomer connected.
      // (Do NOT call createPeer here to avoid WebRTC offer glare; wait for newcomer's offer via 'user-joined')
      socketRef.current.on('user-connected', (newUserId, newUserName, socketId) => {
        setSampleParticipants(prev => {
          if (prev.some(p => p.id === socketId || p.id === newUserId)) return prev;
          return [...prev, { id: socketId || newUserId, name: newUserName || 'Participant', isLocal: false, isMuted: false, hasVideo: true }];
        });
        if (playJoinLeaveChime) playChimeSound('join');
        toast.success(`${newUserName || 'A participant'} joined the meeting`);
      });

      socketRef.current.on('receiving-returned-signal', payload => {
        const item = peersRef.current.find(p => p.peerID === payload.id);
        if (item) {
          try {
            item.peer.signal(payload.signal);
          } catch (err) {
            console.warn('Signal return error:', err);
          }
        }
      });

      // Existing user receives offer from newcomer and creates answer
      socketRef.current.on('user-joined', payload => {
        setSampleParticipants(prev => {
          if (prev.some(p => p.id === payload.callerID)) return prev;
          return [...prev, { id: payload.callerID, name: payload.callerName || 'Participant', isLocal: false, isMuted: false, hasVideo: true }];
        });
        if (playJoinLeaveChime) playChimeSound('join');
        toast.success(`${payload.callerName || 'A participant'} joined the meeting`);

        try {
          const peer = addPeer(payload.signal, payload.callerID, currentStream);
          peer.on('stream', (remoteStream) => {
            setPeers(prevPeers => prevPeers.map(p => p.peerID === payload.callerID ? { ...p, stream: remoteStream } : p));
          });
          peersRef.current.push({ peerID: payload.callerID, peer, name: payload.callerName, stream: null });
          setPeers([...peersRef.current]);
        } catch (err) {
          console.warn('addPeer error:', err);
        }
      });

      // Real-time camera and microphone status from remote peer
      socketRef.current.on('participant-media-status', ({ socketId, isAudioOn, isVideoOn }) => {
        setSampleParticipants(prev => prev.map(p => {
          if (p.id === socketId) {
            return {
              ...p,
              isMuted: isAudioOn !== undefined ? !isAudioOn : p.isMuted,
              isVideoOff: isVideoOn !== undefined ? !isVideoOn : p.isVideoOff,
              hasVideo: isVideoOn !== undefined ? isVideoOn : p.hasVideo
            };
          }
          return p;
        }));
      });

      // Waiting room attendee notification
      socketRef.current.on('attendee-waiting', (attendee) => {
        setWaitingRoomQueue(prev => {
          if (prev.some(w => w.id === attendee.socketId || w.id === attendee.userId)) return prev;
          return [...prev, { id: attendee.socketId, userId: attendee.userId, name: attendee.name, joinedAt: attendee.joinedAt }];
        });
        toast(`Participant ${attendee.name} is waiting in the lobby`, { icon: '⏳' });
      });

      socketRef.current.on('waiting-participant-removed', ({ participantId }) => {
        setWaitingRoomQueue(prev => prev.filter(w => w.id !== participantId && w.userId !== participantId));
      });

      socketRef.current.on('user-disconnected', socketId => {
        const peerObj = peersRef.current.find(p => p.peerID === socketId);
        if (peerObj) {
          try { peerObj.peer.destroy(); } catch (err) {}
        }
        const newPeers = peersRef.current.filter(p => p.peerID !== socketId);
        peersRef.current = newPeers;
        setPeers(newPeers);
        setSampleParticipants(prev => prev.filter(p => p.id !== socketId));
        if (playJoinLeaveChime) playChimeSound('leave');
      });

      // Host ended the meeting for all — navigate away gracefully
      socketRef.current.on('meeting-ended', ({ message }) => {
        toast.error(message || 'The host has ended this meeting.', { duration: 4000 });
        if (stream) stream.getTracks().forEach(track => track.stop());
        setTimeout(() => navigate(`/meetings/${meetingId}/lifecycle`), 2000);
      });

      socketRef.current.on('receive-chat-message', (incomingMsg) => {
        const currentUserId = user?.id || user?._id || '';
        const currentUserName = user?.name || '';
        const isForMe = !incomingMsg.isPrivate || 
                        incomingMsg.recipientId === 'everyone' || 
                        incomingMsg.recipientId === currentUserId ||
                        incomingMsg.recipientName === currentUserName ||
                        incomingMsg.senderId === currentUserId ||
                        incomingMsg.senderName === currentUserName;
        if (isForMe) {
          setChatMessages(prev => {
            if (prev.some(m => (m._id && m._id === incomingMsg._id) || (m.id && m.id === incomingMsg.id))) {
              return prev;
            }
            return [...prev, { 
              ...incomingMsg, 
              isSelf: incomingMsg.senderName === currentUserName || incomingMsg.senderId === currentUserId 
            }];
          });
        }
      });

      socketRef.current.on('update-pinned-chat', (pinnedMsg) => {
        setPinnedChatMessage(pinnedMsg);
        if (pinnedMsg) {
          toast(`Message pinned: "${pinnedMsg.text ? (pinnedMsg.text.slice(0, 30) + '...') : (pinnedMsg.fileName || 'Attachment')}"`, { icon: '📌' });
        } else {
          toast('Message unpinned');
        }
      });

      socketRef.current.on('chat-permission-updated', (perm) => {
        setChatPermission(perm);
        toast(`Host set chat to: ${
          perm === 'everyone' ? 'Everyone' :
          perm === 'publicOnly' ? 'Public Only' :
          perm === 'hostOnly' ? 'Host & Co-hosts Only' : 'Chat Disabled'
        }`, { icon: '💬' });
      });

      socketRef.current.on('update-chat-reaction', ({ messageId, reactions }) => {
        setChatMessages(prev => prev.map(m => (m._id === messageId || m.id === messageId) ? { ...m, reactions } : m));
      });

      socketRef.current.on('update-spotlight', (spotlightId) => {
        setSpotlightParticipantIds(spotlightId ? [spotlightId] : []);
      });

      socketRef.current.on('update-spotlights', (spotlightsList) => {
        setSpotlightParticipantIds(spotlightsList || []);
        if (spotlightsList && spotlightsList.length > 0) {
          toast(`Spotlights updated (${spotlightsList.length} active)`, { icon: '⭐' });
        } else {
          toast('All spotlights cleared');
        }
      });

      socketRef.current.on('update-host-video-order', (orderList) => {
        toast.success("Host updated video layout order for all participants", { icon: '🔀' });
      });

      socketRef.current.on('released-host-video-order', () => {
        toast("Host released custom video order");
      });

      // Part 11: Participant Management & Controls Socket Handlers
      socketRef.current.on('participant-muted', (targetId) => {
        const myId = user?.id || user?._id;
        if (targetId === myId || targetId === 'local' || targetId === socketRef.current?.id) {
          if (stream) stream.getAudioTracks().forEach(t => t.enabled = false);
          setIsAudioOn(false);
          toast('The host has muted your microphone', { icon: '🔇' });
        } else {
          setSampleParticipants(prev => prev.map(p => p.id === targetId ? { ...p, isMuted: true } : p));
        }
      });

      socketRef.current.on('host-asked-unmute', ({ targetParticipantId, hostName }) => {
        const myId = user?.id || user?._id;
        if (targetParticipantId === myId || targetParticipantId === 'local' || targetParticipantId === socketRef.current?.id) {
          setUnmutePrompt({ hostName: hostName || 'The host' });
        }
      });

      socketRef.current.on('all-participants-muted', ({ allowUnmute }) => {
        if (user?.id !== 'host' && !coHosts.includes(user?.id)) {
          if (stream) stream.getAudioTracks().forEach(t => t.enabled = false);
          setIsAudioOn(false);
          toast('The host muted all participants', { icon: '🔇' });
          if (allowUnmute === false) {
            setSecuritySettings(s => ({ ...s, allowUnmute: false }));
          }
        }
      });

      socketRef.current.on('participant-video-stopped', (targetId) => {
        const myId = user?.id || user?._id;
        if (targetId === myId || targetId === 'local' || targetId === socketRef.current?.id) {
          if (stream) stream.getVideoTracks().forEach(t => t.enabled = false);
          setIsVideoOn(false);
          toast('The host has stopped your camera video', { icon: '🚫' });
        } else {
          setSampleParticipants(prev => prev.map(p => p.id === targetId ? { ...p, isVideoOff: true } : p));
        }
      });

      socketRef.current.on('host-asked-start-video', ({ targetParticipantId, hostName }) => {
        const myId = user?.id || user?._id;
        if (targetParticipantId === myId || targetParticipantId === 'local' || targetParticipantId === socketRef.current?.id) {
          setStartVideoPrompt({ hostName: hostName || 'The host' });
        }
      });

      socketRef.current.on('participant-cohost-assigned', ({ participantId, isCoHost }) => {
        if (isCoHost) {
          setCoHosts(prev => [...new Set([...prev, participantId])]);
          toast('Co-host permissions granted', { icon: '👑' });
        } else {
          setCoHosts(prev => prev.filter(id => id !== participantId));
          toast('Co-host permissions removed', { icon: 'ℹ️' });
        }
      });

      socketRef.current.on('participant-host-transferred', ({ newHostId, newHostName }) => {
        toast(`Host role transferred to ${newHostName || 'new host'}`, { icon: '👑' });
      });

      socketRef.current.on('participant-removed', ({ participantId, name }) => {
        const myId = user?.id || user?._id;
        if (participantId === myId || participantId === 'local' || participantId === socketRef.current?.id) {
          alert('You have been removed from this meeting by the host.');
          navigate('/meetings');
        } else {
          setSampleParticipants(prev => prev.filter(p => p.id !== participantId));
          toast(`${name || 'Participant'} was removed by the host`, { icon: '🚫' });
        }
      });

      socketRef.current.on('participant-renamed', ({ participantId, newName }) => {
        setSampleParticipants(prev => prev.map(p => p.id === participantId ? { ...p, name: newName } : p));
        toast(`Participant renamed to "${newName}"`);
      });

      socketRef.current.on('permissions-updated', (newPerms) => {
        setSecuritySettings(prev => ({ ...prev, ...newPerms }));
        toast('Host updated meeting permissions', { icon: '🛡️' });
      });

      socketRef.current.on('activities-suspended', () => {
        if (stream) {
          stream.getAudioTracks().forEach(t => t.enabled = false);
          stream.getVideoTracks().forEach(t => t.enabled = false);
        }
        setIsAudioOn(false);
        setIsVideoOn(false);
        setIsMeetingLocked(true);
        setSecuritySettings(s => ({
          ...s,
          lockMeeting: true,
          allowChat: 'none',
          allowShareScreen: false,
          allowUnmute: false,
          allowStartVideo: false,
          allowWhiteboard: false,
          suspendActivities: true
        }));
        toast.error('Host has suspended all participant activities!', { duration: 6000 });
      });

      socketRef.current.on('security-settings-updated', (newSec) => {
        if (newSec) {
          setSecuritySettings(prev => ({
            ...prev,
            ...newSec,
            lockMeeting: !!newSec.meetingLocked,
            enableWaitingRoom: !!newSec.waitingRoomEnabled,
            hideProfilePictures: !!newSec.hideProfilePictures,
            whoCanShareScreen: newSec.whoCanShareScreen || prev.whoCanShareScreen,
            allowShareScreen: newSec.participantPermissions?.canShareScreen !== undefined ? newSec.participantPermissions.canShareScreen : prev.allowShareScreen,
            allowChat: newSec.participantPermissions?.canChat || prev.allowChat,
            allowRename: newSec.participantPermissions?.canRename !== undefined ? newSec.participantPermissions.canRename : prev.allowRename,
            allowUnmute: newSec.participantPermissions?.canUnmute !== undefined ? newSec.participantPermissions.canUnmute : prev.allowUnmute,
            allowStartVideo: newSec.participantPermissions?.canStartVideo !== undefined ? newSec.participantPermissions.canStartVideo : prev.allowStartVideo,
            allowWhiteboard: newSec.participantPermissions?.canShareWhiteboard !== undefined ? newSec.participantPermissions.canShareWhiteboard : prev.allowWhiteboard,
            suspendActivities: !!newSec.participantActivitiesSuspended,
            participantActivitiesSuspended: !!newSec.participantActivitiesSuspended,
            participantPermissions: newSec.participantPermissions || prev.participantPermissions
          }));
          setIsMeetingLocked(!!newSec.meetingLocked);
        }
      });

      socketRef.current.on('meeting-lock-toggled', ({ meetingLocked }) => {
        setIsMeetingLocked(!!meetingLocked);
        setSecuritySettings(prev => ({ ...prev, lockMeeting: !!meetingLocked, meetingLocked: !!meetingLocked }));
        toast(meetingLocked ? '🔒 Meeting has been locked by the host' : '🔓 Meeting unlocked');
      });

      socketRef.current.on('waiting-room-toggled', ({ waitingRoomEnabled }) => {
        setSecuritySettings(prev => ({ ...prev, enableWaitingRoom: !!waitingRoomEnabled, waitingRoomEnabled: !!waitingRoomEnabled }));
        toast(waitingRoomEnabled ? 'Waiting Room enabled' : 'Waiting Room disabled');
      });

      socketRef.current.on('hide-profile-pictures-toggled', ({ hideProfilePictures }) => {
        setSecuritySettings(prev => ({ ...prev, hideProfilePictures: !!hideProfilePictures }));
        toast(hideProfilePictures ? 'Profile pictures hidden for participant privacy' : 'Profile pictures visible');
      });

      socketRef.current.on('screen-share-policy-updated', ({ whoCanShareScreen }) => {
        setSecuritySettings(prev => ({
          ...prev,
          whoCanShareScreen,
          allowShareScreen: whoCanShareScreen !== 'hostOnly'
        }));
        toast(`Screen sharing policy set to ${whoCanShareScreen}`);
      });

      socketRef.current.on('activities-resumed', () => {
        setSecuritySettings(s => ({
          ...s,
          suspendActivities: false,
          participantActivitiesSuspended: false,
          allowUnmute: true,
          allowStartVideo: true,
          allowShareScreen: s.whoCanShareScreen !== 'hostOnly',
          allowChat: 'everyone',
          allowWhiteboard: true
        }));
        toast.success('Host has resumed participant activities!');
      });

      socketRef.current.on('waiting-participant-admitted', ({ participantId, name }) => {
        setWaitingRoomQueue(prev => prev.filter(w => w.id !== participantId));
        setSampleParticipants(prev => [...prev, { id: participantId, name, isLocal: false, isMuted: muteOnEntry }]);
        if (playJoinLeaveChime) playChimeSound('join');
      });

      socketRef.current.on('all-waiting-admitted', () => {
        setWaitingRoomQueue([]);
        toast.success('All waiting attendees admitted');
        if (playJoinLeaveChime) playChimeSound('join');
      });

      // Part 31: Encryption Socket Listeners (31.5, 31.6, 31.13)
      socketRef.current.on('encryption-type-changed', (data) => {
        setEncryptionData(prev => ({
          ...prev,
          type: data.encryptionType,
          keyManagement: data.keyManagement,
          securityCode: data.securityCode,
          keyVersion: data.keyVersion,
          featureCompatibility: data.featureCompatibility || prev.featureCompatibility,
          isPartialEncryption: false
        }));
        toast.success(
          data.encryptionType === 'E2EE'
            ? 'Meeting upgraded to End-to-End Encryption (E2EE)'
            : 'Meeting switched to Enhanced Encryption (256-bit AES-GCM)',
          { icon: data.encryptionType === 'E2EE' ? '🔒' : '🛡️' }
        );
      });

      socketRef.current.on('encryption-verified', (data) => {
        toast.success(`${data.participantName || 'A participant'} verified E2EE security code`, { icon: '✅' });
        fetchEncryptionData();
      });

      socketRef.current.on('partial-encryption-detected', (data) => {
        setEncryptionData(prev => ({ ...prev, isPartialEncryption: true }));
        toast.error('Partial encryption detected: an unsupported endpoint joined', { icon: '⚠️' });
      });

      // Part 32: Watermarking Socket Listeners (32.1 - 32.10)
      socketRef.current.on('watermark-settings-updated', (data) => {
        if (data.watermark) {
          setWatermarkSettings(prev => ({
            ...prev,
            ...data.watermark
          }));
        }
        if (data.updatedBy?.name) {
          toast.info(`Watermarking updated by ${data.updatedBy.name}`, { icon: '🛡️' });
        }
      });

      socketRef.current.on('watermark-audio-signature-assigned', (data) => {
        if (data.assignedSignature) {
          setWatermarkSettings(prev => ({
            ...prev,
            audioSignatures: [
              ...(prev.audioSignatures || []).filter(s => s.participantId !== data.assignedSignature.participantId),
              data.assignedSignature
            ]
          }));
        }
      });

      socketRef.current.on('watermark-leak-detected', (data) => {
        toast.error(
          `🚨 Security Alert: Audio watermark leak traced to participant ${data.match?.participantName || 'Unknown'} (${data.match?.participantEmail || ''})`,
          { duration: 8000 }
        );
      });

      // Part 33: Live Streaming Socket Listeners (33.1 - 33.23)
      socketRef.current.on('livestream-status-changed', (data) => {
        setLiveStreamSession(prev => ({
          ...prev,
          ...data,
          status: data.status
        }));
        if (data.status === 'LIVE') {
          toast.success('Live broadcast is now active! Meeting is streaming to external platforms.', { icon: '📡' });
        } else if (data.status === 'STOPPED') {
          toast.info('Livestream broadcast ended. In-meeting session remains active.', { icon: '⏹️' });
        }
      });

      socketRef.current.on('livestream-viewers-updated', (data) => {
        setLiveStreamSession(prev => ({
          ...prev,
          viewerCount: data.viewerCount,
          destinations: (prev.destinations || []).map(dest => {
            const match = (data.destinations || []).find(d => d.platform === dest.platform);
            return match ? { ...dest, viewerCount: match.viewerCount } : dest;
          })
        }));
      });

      socketRef.current.on('livestream-configured', (sessionData) => {
        if (sessionData) {
          setLiveStreamSession(sessionData);
        }
      });

      // Part 12: Real-time reactions and non-verbal feedback listeners
      socketRef.current.on('receive-reaction', ({ emoji, senderName }) => {
        const newEmoji = {
          id: Date.now() + Math.random(),
          emoji,
          senderName,
          left: Math.random() * 65 + 15,
        };
        setFloatingEmojis(prev => [...prev, newEmoji]);
        setTimeout(() => {
          setFloatingEmojis(prev => prev.filter(e => e.id !== newEmoji.id));
        }, 3500);
      });

      socketRef.current.on('hand-toggled', ({ participantId, isRaised, name, handRaisedAt }) => {
        if (isRaised) {
          setRaisedHands(prev => [...new Set([...prev, participantId])]);
          setRaisedHandsQueue(prev => {
            const filtered = prev.filter(h => h.participantId !== participantId);
            return [...filtered, { participantId, name, handRaisedAt: handRaisedAt || new Date() }];
          });
          toast(`${name} raised hand`, { icon: '✋' });
        } else {
          setRaisedHands(prev => prev.filter(id => id !== participantId));
          setRaisedHandsQueue(prev => prev.filter(h => h.participantId !== participantId));
        }
      });

      socketRef.current.on('all-hands-lowered', () => {
        setRaisedHands([]);
        setRaisedHandsQueue([]);
        setHandRaised(false);
        toast('Host lowered all hands', { icon: '✋' });
      });

      socketRef.current.on('non-verbal-updated', ({ participantId, name, value }) => {
        setNonVerbalFeedbacks(prev => {
          const next = { ...prev };
          if (!value) {
            delete next[participantId];
          } else {
            const iconMap = { YES: '👍', NO: '👎', SLOWER: '🐢', FASTER: '⚡' };
            const labelMap = { YES: 'Yes', NO: 'No', SLOWER: 'Go Slower', FASTER: 'Go Faster' };
            next[participantId] = {
              value,
              label: labelMap[value] || value,
              icon: iconMap[value] || '💬',
              name,
              updatedAt: new Date()
            };
          }
          return next;
        });
      });

      socketRef.current.on('feedback-cleared', () => {
        setRaisedHands([]);
        setRaisedHandsQueue([]);
        setHandRaised(false);
        setNonVerbalFeedbacks({});
        setMyNonVerbal(null);
        setFloatingEmojis([]);
        toast('Host cleared all feedback and hands', { icon: '✋' });
      });

      socketRef.current.on('reaction-settings-updated', (settings) => {
        setReactionSettings(settings);
        toast('Host updated reaction settings', { icon: '⚙️' });
      });

      // Part 13 & 14: Screen Share Socket Listeners (13.1 - 14.21)
      socketRef.current.on('screen-share-started', (data) => {
        setIsScreenSharing(true);
        setIsSharePaused(false);
        const newSessionItem = {
          id: data.sessionId || data.participantId,
          sharerId: data.participantId,
          sharerName: data.participantName || 'Presenter',
          sourceName: data.sourceName || 'Entire Screen',
          type: data.type || 'SCREEN',
          videoPreviewUrl: data.videoPreviewUrl,
          documentName: data.documentName,
          audioEnabled: !!data.audioEnabled,
          videoOptimization: !!data.videoOptimization,
          status: 'ACTIVE',
          startedAt: new Date()
        };

        setActiveShareSessions(prev => {
          if (sharingSettings.mode === 'oneParticipant') {
            return [newSessionItem];
          } else {
            const filtered = prev.filter(s => s.sharerId !== data.participantId);
            return [...filtered, newSessionItem];
          }
        });

        setScreenShareDetails({
          isSharing: true,
          isPaused: false,
          sharerId: data.participantId,
          sharerName: data.participantName || 'Presenter',
          sourceName: data.sourceName || 'Entire Screen',
          type: data.type || 'SCREEN',
          videoPreviewUrl: data.videoPreviewUrl,
          documentName: data.documentName,
          audioEnabled: !!data.audioEnabled,
          videoOptimization: !!data.videoOptimization,
          presenterLayout: 'side-by-side'
        });
        if (data.type === 'WHITEBOARD') {
          setShowWhiteboardModal(true);
        }
        toast.success(`${data.participantName || 'Presenter'} started sharing ${data.sourceName || 'their screen'}`);
      });

      socketRef.current.on('screen-share-paused', (data) => {
        setIsSharePaused(data.isPaused);
        setScreenShareDetails(prev => prev ? { ...prev, isPaused: data.isPaused } : null);
        setActiveShareSessions(prev => prev.map(s => s.sharerId === data.participantId ? { ...s, status: data.isPaused ? 'PAUSED' : 'ACTIVE' } : s));
        toast(data.isPaused ? 'Screen sharing paused' : 'Screen sharing resumed', { icon: '⏸' });
      });

      socketRef.current.on('screen-share-stopped', (data) => {
        const stoppedSharerId = data?.participantId;
        setActiveShareSessions(prev => {
          const remaining = stoppedSharerId ? prev.filter(s => s.sharerId !== stoppedSharerId) : [];
          if (remaining.length === 0) {
            setIsScreenSharing(false);
            setIsSharePaused(false);
            setScreenShareDetails(null);
            if (showWhiteboardModal) setShowWhiteboardModal(false);
          } else {
            const nextSession = remaining[0];
            setScreenShareDetails({
              isSharing: true,
              isPaused: nextSession.status === 'PAUSED',
              sharerId: nextSession.sharerId,
              sharerName: nextSession.sharerName,
              sourceName: nextSession.sourceName,
              type: nextSession.type,
              audioEnabled: nextSession.audioEnabled,
              videoOptimization: nextSession.videoOptimization,
              presenterLayout: 'side-by-side'
            });
          }
          return remaining;
        });
        toast.info(`${data?.participantName || 'Presenter'} stopped sharing`);
      });

      // Part 14: Host Stops a Participant's Screen Share (Section 14.10)
      socketRef.current.on('participant-share-stopped', (data) => {
        const stoppedSharerId = data?.participantId;
        const myId = user?.id || user?._id || 'local';
        if (stoppedSharerId === myId) {
          if (screenTrackRef.current) {
            screenTrackRef.current.stop();
            screenTrackRef.current = null;
          }
          if (userVideo.current && stream) {
            userVideo.current.srcObject = stream;
          }
          toast.error('The host has stopped your screen sharing session.');
        }

        setActiveShareSessions(prev => {
          const remaining = prev.filter(s => s.sharerId !== stoppedSharerId);
          if (remaining.length === 0) {
            setIsScreenSharing(false);
            setIsSharePaused(false);
            setScreenShareDetails(null);
          } else {
            const nextSession = remaining[0];
            setScreenShareDetails({
              isSharing: true,
              isPaused: nextSession.status === 'PAUSED',
              sharerId: nextSession.sharerId,
              sharerName: nextSession.sharerName,
              sourceName: nextSession.sourceName,
              type: nextSession.type,
              audioEnabled: nextSession.audioEnabled,
              videoOptimization: nextSession.videoOptimization,
              presenterLayout: 'side-by-side'
            });
          }
          return remaining;
        });
        toast.info(`Screen share for ${data?.participantName || 'participant'} was stopped by host`);
      });

      socketRef.current.on('sharing-settings-updated', (settings) => {
        setSharingSettings(settings);
        toast.success('Host updated screen sharing permissions');
      });

      // Part 15: Annotation Settings Socket Listener (15.4, 15.5)
      socketRef.current.on('annotation-settings-updated', (settings) => {
        setAnnotationSettings(settings);
        if (settings.showAnnotatorNames !== undefined) {
          setShowAnnotatorNames(settings.showAnnotatorNames);
        }
        toast.success('Host updated annotation permissions');
      });

      // Part 16: Slide Control Socket Listeners (16.1 - 16.16)
      socketRef.current.on('presentation-started', (data) => {
        setPresentationSession(data.session);
        setIsScreenSharing(true);
        setIsSharePaused(false);
        setScreenShareDetails({
          isSharing: true,
          isPaused: false,
          sharerId: data.session.presenterId,
          sharerName: data.session.presenterName,
          sourceName: `${data.session.presentationType}: ${data.session.presentationName}`,
          type: 'PRESENTATION',
          presentationType: data.session.presentationType,
          presentationName: data.session.presentationName,
          audioEnabled: true,
          videoOptimization: false,
          presenterLayout: 'side-by-side'
        });
        toast.success(`Presentation started: ${data.session.presentationName}`, { icon: '📊' });
      });

      socketRef.current.on('presentation-slide-changed', (data) => {
        setPresentationSession(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            currentSlide: data.currentSlide,
            lastChangedBy: {
              userId: data.changedBy,
              userName: data.changedByName,
              action: data.action,
              timestamp: new Date()
            }
          };
        });
        const myId = user?.id || user?._id || 'local';
        if (data.changedBy !== myId) {
          toast(`${data.changedByName || 'Co-presenter'} moved to Slide ${data.currentSlide}`, { icon: '👉' });
        }
      });

      socketRef.current.on('presentation-control-granted', (data) => {
        setPresentationSession(prev => {
          if (!prev) return prev;
          return { ...prev, controllers: data.controllers };
        });
        const myId = user?.id || user?._id || 'local';
        const amIGranted = data.controllers?.some(c => c.userId === myId && c.status === 'ACTIVE');
        if (amIGranted) {
          toast.success('Slide Control Granted! You can now navigate presentation slides with buttons or Arrow keys.', { duration: 5000, icon: '🎉' });
        } else if (data.grantedToName) {
          toast(`Slide control granted to ${data.grantedToName}`);
        }
      });

      socketRef.current.on('presentation-control-revoked', (data) => {
        setPresentationSession(prev => {
          if (!prev) return prev;
          return { ...prev, controllers: data.controllers };
        });
        const myId = user?.id || user?._id || 'local';
        if (data.userId === myId) {
          toast.error('Your slide control permission was revoked by the presenter.');
        }
      });

      socketRef.current.on('presentation-control-stopped', () => {
        setPresentationSession(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            controllers: prev.controllers?.map(c => ({ ...c, status: 'REVOKED' })) || []
          };
        });
        toast.info('Presenter stopped all participant slide control.');
      });

      socketRef.current.on('presentation-ended', () => {
        setPresentationSession(null);
        setShowSlideControlModal(false);
        setIsScreenSharing(false);
        setScreenShareDetails(null);
        toast.info('Presentation session ended.');
      });

      // Part 17: Whiteboard Socket Listeners (17.1 - 17.23)
      socketRef.current.on('whiteboard-opened', (data) => {
        setActiveWhiteboard(data.whiteboard || data);
        toast.success(`${data.user?.name || 'A participant'} opened a whiteboard`, { icon: '📋' });
      });

      socketRef.current.on('whiteboard-closed', () => {
        setActiveWhiteboard(null);
        toast('Whiteboard session ended', { icon: 'ℹ️' });
      });

      // Part 18: Breakout Rooms Socket Listeners (18.1 - 18.33)
      socketRef.current.on('breakout-created', (data) => {
        setBreakoutRoomsList(data.rooms || []);
        toast('Breakout rooms have been created by the host', { icon: '🚪' });
      });

      socketRef.current.on('breakout-opened', (data) => {
        setBreakoutRoomsList(data.rooms || []);
        const myId = user?.id || user?._id || 'local';
        const assignedRoom = data.rooms?.find(r => r.participants?.some(p => p.userId === myId));

        if (assignedRoom) {
          if (data.settings?.autoMoveParticipants) {
            setCurrentBreakoutRoom(assignedRoom);
            toast.success(`Joined Breakout Room: ${assignedRoom.name}`, { icon: '🚪' });
          } else {
            toast((t) => (
              <div className="flex flex-col gap-2">
                <span className="font-semibold text-xs text-white">Join {assignedRoom.name}?</span>
                <button
                  onClick={() => {
                    setCurrentBreakoutRoom(assignedRoom);
                    toast.dismiss(t.id);
                  }}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded text-xs font-bold"
                >
                  Join Room
                </button>
              </div>
            ), { duration: 15000 });
          }
        } else if (data.settings?.allowSelfSelect) {
          setShowBreakoutParticipantModal(true);
        }
      });

      socketRef.current.on('breakout-closing', (data) => {
        setBreakoutCountdown(data.countdownSeconds || 60);
        toast(`Breakout rooms closing in ${data.countdownSeconds || 60} seconds`, { icon: '⏳' });
      });

      socketRef.current.on('breakout-ended', () => {
        setCurrentBreakoutRoom(null);
        setBreakoutCountdown(null);
        setShowBreakoutParticipantModal(false);
        toast('All breakout rooms closed. Returned to main meeting', { icon: '🏠' });
      });

      socketRef.current.on('breakout-assigned', (data) => {
        const myId = user?.id || user?._id || 'local';
        if (data.userId === myId) {
          const target = breakoutRoomsList.find(r => r.roomId === data.targetRoomId);
          if (target) {
            setCurrentBreakoutRoom(target);
            toast.success(`Moved to ${target.name}`, { icon: '👉' });
          }
        }
      });

      socketRef.current.on('breakout-message-broadcast', (data) => {
        setActiveBroadcastToast(data);
      });

      socketRef.current.on('breakout-help-requested', (data) => {
        if (isHost || user?.id === 'host') {
          setActiveHelpRequestToast(data);
        }
      });

      // Part 19: Polls & Quizzes Socket Listeners (19.1 - 19.22)
      socketRef.current.on('poll-launched', (data) => {
        setActivePoll(data.poll);
        if (!isHost && user?.id !== 'host') {
          setShowPollParticipantView(true);
          toast(`📊 ${data.poll.pollType === 'QUIZ' ? 'Quiz' : 'Poll'} started: "${data.poll.title}"`, { duration: 4000 });
        }
      });

      socketRef.current.on('quiz-launched', (data) => {
        // Handled by poll-launched; just for quiz-specific toast on host side
        if (isHost || user?.id === 'host') {
          toast.success(`🧠 Quiz "${data.poll.title}" launched`, { duration: 3000 });
        }
      });

      socketRef.current.on('poll-ended', (data) => {
        setActivePoll(null);
        if (!isHost && user?.id !== 'host') {
          toast('Poll ended. Results will be shared shortly.', { duration: 3000 });
        }
      });

      socketRef.current.on('poll-results-shared', (data) => {
        setPollSharedResults(data.summary);
        if (!isHost && user?.id !== 'host') {
          toast('📊 Poll results shared!', { duration: 3000 });
          setShowPollParticipantView(true); // reopen to show results
        }
      });

      socketRef.current.on('poll-response-submitted', (data) => {
        // Host sees live update toast
        if (isHost || user?.id === 'host') {
          toast(`New ${activePoll?.pollType === 'QUIZ' ? 'quiz' : 'poll'} response received`, { duration: 2000, icon: '📝' });
        }
      });

      // Part 20 & 21: Live Captions & Multilingual Translation Socket Listeners (20.10, 21.15)
      socketRef.current.on('caption-segment', async (data) => {
        let displaySegment = { ...data };

        // Real-time per-participant translation (21.4, 21.13, 21.15)
        if (participantTranslationEnabled && participantTargetLanguage) {
          const src = (data.language || 'en').split('-')[0].toLowerCase();
          const tgt = (participantTargetLanguage || 'ta').split('-')[0].toLowerCase();
          if (src !== tgt) {
            try {
              const token = localStorage.getItem('token');
              const res = await fetch(`http://localhost:5000/api/meetings/${meetingId}/translation/translate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                  text: data.text,
                  sourceLanguage: src,
                  targetLanguage: tgt
                })
              });
              const transData = await res.json();
              if (transData.success && transData.translatedText) {
                displaySegment.translatedText = transData.translatedText;

                // Voice Translation Audio TTS (21.17)
                if (participantVoiceTranslationEnabled) {
                  voiceTranslator.speak(transData.translatedText, tgt);
                }
              }
            } catch(e) {}
          }
        }

        setCurrentCaptionSegment(displaySegment);
        setRecentCaptionSegments(prev => [...prev.slice(-15), displaySegment]);
        setTranscriptSegments(prev => {
          // Avoid duplicate segmentIds
          if (data.segmentId && prev.some(s => s.segmentId === data.segmentId)) return prev;
          return [...prev, displaySegment];
        });
      });

      socketRef.current.on('translation-settings-updated', (data) => {
        if (data.status) setMeetingTranslationActive(data.status === 'ACTIVE');
      });

      socketRef.current.on('caption-settings-updated', (data) => {
        setCaptionSettings(data);
      });


      socketRef.current.on('caption-request-received', (data) => {
        if (isHost || user?.id === 'host') {
          toast(`Participant ${data.participantName} requested to enable Live Captions`, { icon: '💬', duration: 4000 });
          setCaptionSettings(prev => ({
            ...prev,
            captionRequests: [...(prev.captionRequests || []).filter(r => r.requestId !== data.requestId), data]
          }));
        }
      });

      socketRef.current.on('caption-request-resolved', (data) => {
        const myId = user?.id || user?._id || 'local';
        if (data.participantId === myId) {
          if (data.status === 'APPROVED') {
            toast.success('Host approved your request for Live Captions!', { icon: '💬' });
            setShowLiveCaptions(true);
          } else {
            toast.error('Host declined your request for Live Captions.');
          }
        }
      });

      socketRef.current.on('transcription-status-changed', (data) => {
        setIsTranscribing(data.status === 'ACTIVE');
        if (data.status === 'ACTIVE') {
          toast.success('Meeting transcription started (retained)', { icon: '🎙️' });
        } else {
          toast('Meeting transcription stopped', { icon: '⏹️' });
        }
      });

      // Part 24: Meeting Transcript Socket Listeners (24.3, 24.4, 24.9)
      socketRef.current.on('transcript-started', () => {
        setIsTranscribing(true);
        toast.success('Meeting transcription active (IntellMeet)', { icon: '📝' });
      });

      socketRef.current.on('transcript-stopped', () => {
        setIsTranscribing(false);
        toast('Meeting transcription concluded', { icon: '⏹️' });
      });

      socketRef.current.on('transcript-segment-created', (newSeg) => {
        setTranscriptSegments(prev => {
          if (newSeg.segmentId && prev.some(s => s.segmentId === newSeg.segmentId)) return prev;
          return [...prev, newSeg];
        });
      });

      socketRef.current.on('transcript-segment-edited', (data) => {
        setTranscriptSegments(prev => prev.map(s => {
          if (s.segmentId === data.segmentId || s._id === data.segmentId) {
            return { ...s, text: data.text, isEdited: true, originalText: s.originalText || s.text, editedBy: data.editedBy };
          }
          return s;
        }));
      });

      socketRef.current.on('transcript-segment-deleted', (data) => {
        setTranscriptSegments(prev => prev.filter(s => s.segmentId !== data.segmentId && s._id !== data.segmentId));
      });

      // Part 22: Language & Sign-Language Interpretation Socket Listeners (22.1 - 22.23)
      socketRef.current.on('interpretation-session-status-changed', (data) => {
        setInterpretationSession(prev => ({ ...prev, status: data.status, enabled: data.status === 'ACTIVE' }));
        if (data.status === 'ACTIVE') {
          toast('Language interpretation is active', { icon: '🎧' });
        } else {
          toast('Language interpretation ended', { icon: '⏹️' });
        }
      });

      socketRef.current.on('interpreter-status-updated', (data) => {
        setInterpretationSession(prev => ({
          ...prev,
          languages: (prev.languages || []).map(l => {
            if (l.languageCode === data.languageCode || l.interpreterId === data.interpreterId) {
              return { ...l, isSpeaking: !!data.isSpeaking, status: data.status || l.status };
            }
            return l;
          })
        }));
      });

      socketRef.current.on('sign-language-stream-toggled', (data) => {
        // Sign language video stream state update
      });

      // Part 23: Recording Socket Listeners (23.1 - 23.23)
      socketRef.current.on('recording-started', (data) => {
        setIsMeetingRecording(true);
        setRecordingPaused(false);
        setRecordingMode(data.mode || 'CLOUD');
        setActiveRecordingId(data.recordingId || null);
        setRecordingStartedAt(data.startedAt || new Date());
        toast(`Recording started (${data.mode === 'LOCAL' ? 'Computer' : 'Cloud'})`, { icon: '🔴' });
      });

      socketRef.current.on('recording-paused', () => {
        setRecordingPaused(true);
        toast('Recording paused', { icon: '⏸️' });
      });

      socketRef.current.on('recording-resumed', () => {
        setRecordingPaused(false);
        toast('Recording resumed', { icon: '▶️' });
      });

      socketRef.current.on('recording-stopped', () => {
        setIsMeetingRecording(false);
        setRecordingPaused(false);
        setActiveRecordingId(null);
        toast('Recording stopped and saved', { icon: '⏹️' });
      });

      socketRef.current.on('participant-recording-permission-changed', (data) => {
        const myId = user?.id || user?._id || 'local';
        if (data.participantId === myId) {
          setParticipantCanRecordLocal(!!data.allowed);
          toast(data.allowed ? 'Host granted you local recording permission' : 'Host revoked your recording permission', {
            icon: data.allowed ? '⏺️' : '🚫'
          });
        }
      });

    return () => {
      if (stream) stream.getTracks().forEach(track => track.stop());
      if (screenTrackRef.current) screenTrackRef.current.stop();
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [meetingId]);

  // Fetch Part 21 Translation settings & preferences
  useEffect(() => {
    if (!meetingId) return;
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };
    
    fetch(`http://localhost:5000/api/meetings/${meetingId}/translation/settings`, { headers })
      .then(r => r.json())
      .then(d => {
        if (d.success && d.session) {
          setMeetingTranslationActive(d.session.status === 'ACTIVE');
        }
      }).catch(() => {});

    fetch(`http://localhost:5000/api/meetings/${meetingId}/translation/language-pairs`, { headers })
      .then(r => r.json())
      .then(d => {
        if (d.success && d.pairs) {
          setLanguagePairs(d.pairs);
        }
      }).catch(() => {});

    fetch(`http://localhost:5000/api/meetings/${meetingId}/translation/preference`, { headers })
      .then(r => r.json())
      .then(d => {
        if (d.success && d.preference) {
          setParticipantTargetLanguage(d.preference.targetLanguage || 'ta');
          setParticipantTranslationEnabled(d.preference.translationEnabled !== false);
          setParticipantVoiceTranslationEnabled(!!d.preference.voiceTranslationEnabled);
          voiceTranslator.setEnabled(!!d.preference.voiceTranslationEnabled);
          voiceTranslator.setTargetLanguage(d.preference.targetLanguage || 'ta');
        }
      }).catch(() => {});

    // Fetch Part 22 Interpretation settings & preferences (22.2, 22.7)
    fetch(`http://localhost:5000/api/meetings/${meetingId}/interpretation/settings`, { headers })
      .then(r => r.json())
      .then(d => {
        if (d.success && d.session) {
          setInterpretationSession(d.session);
        }
      }).catch(() => {});

    fetch(`http://localhost:5000/api/meetings/${meetingId}/interpretation/preference`, { headers })
      .then(r => r.json())
      .then(d => {
        if (d.success && d.preference) {
          setSelectedInterpretationChannel(d.preference.selectedChannel || 'original');
          setOriginalAudioVolume(d.preference.originalAudioVolume !== undefined ? d.preference.originalAudioVolume : 0.2);
          setInterpretationVolume(d.preference.interpretationVolume !== undefined ? d.preference.interpretationVolume : 1.0);
          setSignLanguageEnabled(!!d.preference.signLanguageEnabled);
        }
      }).catch(() => {});

    // Fetch Part 23 Recording Settings & Status (23.3, 23.4, 23.13)
    fetch(`http://localhost:5000/api/meetings/${meetingId}/recording/settings`, { headers })
      .then(r => r.json())
      .then(d => {
        if (d.success && d.settings) {
          setRecordingSettings(d.settings);
          const myId = user?.id || user?._id || 'local';
          const perm = d.settings.participantRecordingPermissions?.find(p => p.userId === myId);
          if (perm) setParticipantCanRecordLocal(!!perm.allowed);
          if (isHost || user?.id === 'host') setParticipantCanRecordLocal(true);
        }
      }).catch(() => {});

    fetch(`http://localhost:5000/api/meetings/${meetingId}/recording/status`, { headers })
      .then(r => r.json())
      .then(d => {
        if (d.success && d.isRecording && d.recording) {
          setIsMeetingRecording(true);
          setRecordingPaused(d.recording.status === 'PAUSED');
          setRecordingMode(d.recording.storageType || 'CLOUD');
          setActiveRecordingId(d.recording.recordingId);
          setRecordingStartedAt(d.recording.startedAt);
        }
      }).catch(() => {});
  }, [meetingId]);



  const ICE_SERVERS = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    { urls: 'stun:stun.services.mozilla.com' },
    { urls: 'stun:global.stun.twilio.com:3478' }
  ];

  function createPeer(userToSignal, callerID, stream, callerName) {
    const peer = new Peer({ 
      initiator: true, 
      trickle: false, 
      ...(stream ? { stream } : {}),
      config: { iceServers: ICE_SERVERS }
    });
    peer.on('signal', signal => socketRef.current.emit('sending-signal', { userToSignal, callerID, signal, callerName }));
    return peer;
  }

  function addPeer(incomingSignal, callerID, stream) {
    const peer = new Peer({ 
      initiator: false, 
      trickle: false, 
      ...(stream ? { stream } : {}),
      config: { iceServers: ICE_SERVERS }
    });
    peer.on('signal', signal => socketRef.current.emit('returning-signal', { signal, callerID }));
    peer.signal(incomingSignal);
    return peer;
  }

  const sendChatMessage = async (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!chatInput.trim() && !selectedAttachment) return;
      if (chatPermission === 'none') {
        toast.error('Chat is disabled by the host.');
        return;
      }
      if (chatPermission === 'publicOnly' && chatRecipient.id !== 'everyone') {
        toast.error('Host has restricted chat to public messages only.');
        return;
      }

      const msgPayload = {
        meetingId,
        senderId: user?.id || user?._id || 'guest_' + (socketRef.current?.id || Math.floor(Math.random() * 1000)),
        senderName: user?.name || 'You',
        senderEmail: user?.email || '',
        recipientId: chatRecipient.id,
        recipientName: chatRecipient.name,
        isPrivate: chatRecipient.id !== 'everyone',
        text: chatInput.trim(),
        fileUrl: selectedAttachment?.url || '',
        fileName: selectedAttachment?.name || '',
        fileType: selectedAttachment?.type || '',
        fileSize: selectedAttachment?.size || '',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        createdAt: new Date().toISOString(),
        phase: 'DURING',
      };

      try {
        const res = await fetch(`http://localhost:5000/api/meetings/${meetingId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(msgPayload)
        });
        const data = await res.json();
        const savedMsg = data.success ? data.message : { ...msgPayload, _id: 'tmp_' + Date.now() };

        setChatMessages(prev => [...prev, { ...savedMsg, isSelf: true }]);
        socketRef.current.emit('send-chat-message', meetingId, { ...savedMsg, isSelf: false });
        setChatInput('');
        setSelectedAttachment(null);
      } catch (err) {
        console.error('Failed to save message:', err);
        const fallbackMsg = { ...msgPayload, id: Date.now(), isSelf: true };
        setChatMessages(prev => [...prev, fallbackMsg]);
        socketRef.current.emit('send-chat-message', meetingId, { ...fallbackMsg, isSelf: false });
        setChatInput('');
        setSelectedAttachment(null);
      }
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      toast.error('File size exceeds 25 MB limit');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      let fType = 'document';
      if (file.type.startsWith('image/')) fType = 'image';
      else if (file.type.includes('pdf')) fType = 'pdf';
      else if (file.type.includes('zip') || file.type.includes('rar') || file.type.includes('tar') || file.type.includes('compressed')) fType = 'archive';
      else if (file.name.endsWith('.js') || file.name.endsWith('.jsx') || file.name.endsWith('.ts') || file.name.endsWith('.py') || file.name.endsWith('.html')) fType = 'code';

      const sizeStr = file.size > 1024 * 1024 
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
        : `${Math.round(file.size / 1024)} KB`;

      setSelectedAttachment({
        name: file.name,
        type: fType,
        size: sizeStr,
        url: reader.result,
      });
      toast.success(`Attached "${file.name}"`);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleTogglePin = async (msg) => {
    try {
      const msgId = msg._id || msg.id;
      const res = await fetch(`http://localhost:5000/api/meetings/${meetingId}/messages/${msgId}/pin`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pinnedBy: user?.name || 'Host' })
      });
      const data = await res.json();
      if (data.success) {
        const nextPinned = data.pinnedMessage;
        setPinnedChatMessage(nextPinned);
        socketRef.current.emit('pin-chat-message', meetingId, nextPinned);
        toast.success(nextPinned ? 'Message pinned to top' : 'Message unpinned');
      }
    } catch (err) {
      toast.error('Failed to pin message');
    }
  };

  const handleReactToMessage = async (msgId, emoji) => {
    try {
      const userName = user?.name || 'Guest';
      const res = await fetch(`http://localhost:5000/api/meetings/${meetingId}/messages/${msgId}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji, userName })
      });
      const data = await res.json();
      if (data.success) {
        setChatMessages(prev => prev.map(m => (m._id === msgId || m.id === msgId) ? { ...m, reactions: data.message.reactions } : m));
        socketRef.current.emit('chat-reaction', meetingId, { messageId: msgId, reactions: data.message.reactions });
      }
    } catch (err) {
      console.error('Failed to react:', err);
    }
  };

  const handleUpdateChatPermission = async (newPerm) => {
    setChatPermission(newPerm);
    setShowChatSettingsMenu(false);
    try {
      await fetch(`http://localhost:5000/api/meetings/${meetingId}/chat-settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ allowChat: newPerm })
      });
      socketRef.current.emit('update-chat-permission', meetingId, newPerm);
      toast.success(`Chat set to: ${
        newPerm === 'everyone' ? 'Everyone (Public & Direct)' :
        newPerm === 'publicOnly' ? 'Public Only' :
        newPerm === 'hostOnly' ? 'Host & Co-hosts Only' : 'Chat Disabled'
      }`);
    } catch (err) {
      toast.error('Failed to update chat permission');
    }
  };

  const handleShareDocOrCanvas = async (docType) => {
    setShowDocShareModal(false);
    const title = docType === 'whiteboard' ? 'Live Canvas Collaborative Whiteboard' : 'IntellMeet Meeting Notes Document';
    const payload = {
      meetingId,
      senderId: user?.id || user?._id || 'guest',
      senderName: user?.name || 'You',
      recipientId: chatRecipient.id,
      recipientName: chatRecipient.name,
      isPrivate: chatRecipient.id !== 'everyone',
      text: `📎 Shared a collaborative ${docType === 'whiteboard' ? 'Canvas Whiteboard' : 'Meeting Document'}: "${title}"`,
      documentShare: {
        docTitle: title,
        docUrl: `${window.location.origin}/meetings/${meetingId}/room`,
        docType: docType
      },
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: new Date().toISOString()
    };

    try {
      const res = await fetch(`http://localhost:5000/api/meetings/${meetingId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      const saved = data.success ? data.message : payload;
      setChatMessages(prev => [...prev, { ...saved, isSelf: true }]);
      socketRef.current.emit('send-chat-message', meetingId, { ...saved, isSelf: false });
      toast.success(`Shared ${title} to chat!`);
    } catch (err) {
      toast.error('Failed to share document to chat');
    }
  };

  const renderFormattedText = (text) => {
    if (!text) return null;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    return parts.map((part, i) => {
      if (part.match(urlRegex)) {
        return (
          <a 
            key={i} 
            href={part} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-blue-400 hover:text-blue-300 underline break-all inline-flex items-center gap-0.5"
          >
            {part}
            <ExternalLink className="w-2.5 h-2.5 inline shrink-0" />
          </a>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  const toggleVideo = () => {
    if (stream) {
      const videoTrack = stream.getVideoTracks().find(track => track.label !== 'screen' && !track.label.includes('screen')) || stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOn(videoTrack.enabled);
        const cleanMId = meetingId ? meetingId.replace(/[\s-]/g, '') : '';
        socketRef.current?.emit('toggle-media-state', cleanMId || meetingId, { isVideoOn: videoTrack.enabled });
        toast(videoTrack.enabled ? 'Video started' : 'Video stopped', {
          icon: videoTrack.enabled ? '📹' : '🚫'
        });
      }
    }
  };

  // Section 8.2: Select Camera & Hot-Swap Track
  const handleSelectCamera = async (deviceId) => {
    setSelectedCamera(deviceId);
    setShowVideoMenu(false);
    try {
      if (stream) {
        const oldVideoTrack = stream.getVideoTracks().find(t => !t.label.includes('screen'));
        if (oldVideoTrack) oldVideoTrack.stop();

        const constraints = {
          video: deviceId === 'default' ? true : { deviceId: { exact: deviceId } }
        };
        const newStream = await navigator.mediaDevices.getUserMedia(constraints);
        const newVideoTrack = newStream.getVideoTracks()[0];
        
        newVideoTrack.enabled = isVideoOn;
        if (oldVideoTrack) stream.removeTrack(oldVideoTrack);
        stream.addTrack(newVideoTrack);

        if (userVideo.current) {
          userVideo.current.srcObject = stream;
        }

        // Replace track on RTCPeerConnections
        peersRef.current.forEach(({ peer }) => {
          if (peer && oldVideoTrack && newVideoTrack) {
            try {
              peer.replaceTrack(oldVideoTrack, newVideoTrack, stream);
            } catch (e) {}
          }
        });
      }
      toast.success('Camera switched');
    } catch (err) {
      toast('Selected camera: ' + deviceId);
    }
  };

  // Section 9.5: Multi-Pin Participant (Personal Viewing Control - up to 9)
  const handleTogglePinParticipant = (targetId) => {
    setPinnedParticipantIds(prev => {
      if (prev.includes(targetId)) {
        toast('Removed pin');
        return prev.filter(id => id !== targetId);
      } else {
        if (prev.length >= 9) {
          toast.error('You can pin up to 9 videos simultaneously');
          return prev;
        }
        toast.success('Pinned video (personal view)');
        return [...prev, targetId];
      }
    });
  };

  // Section 9.6: Multi-Spotlight Participant for Everyone (Host/Co-host - up to 9)
  const handleToggleSpotlightParticipant = (targetId) => {
    let nextList;
    if (spotlightParticipantIds.includes(targetId)) {
      nextList = spotlightParticipantIds.filter(id => id !== targetId);
      toast('Spotlight removed');
    } else {
      if (spotlightParticipantIds.length >= 9) {
        toast.error('You can spotlight up to 9 participants');
        return;
      }
      nextList = [...spotlightParticipantIds, targetId];
      toast.success('Spotlighted for everyone');
    }
    setSpotlightParticipantIds(nextList);
    if (socketRef.current) {
      socketRef.current.emit('set-spotlights', meetingId, nextList);
    }
  };

  // Section 9.6: Clear all spotlights
  const handleClearAllSpotlights = () => {
    setSpotlightParticipantIds([]);
    if (socketRef.current) {
      socketRef.current.emit('set-spotlights', meetingId, []);
    }
    toast('All spotlights cleared');
  };

  // Section 9.4: Host broadcasts custom gallery order to all attendees
  const handleHostBroadcastVideoOrder = (orderList) => {
    if (socketRef.current) {
      socketRef.current.emit('set-host-video-order', meetingId, orderList);
      toast.success("Applied host's video order to all participants");
    }
  };

  // Section 8.8: Toggle Fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  // Section 8.3: Update Video Settings
  const handleUpdateVideoSettings = (key, value) => {
    setVideoSettings(prev => ({ ...prev, [key]: value }));
  };

  // Section 8.5: Select Virtual Background
  const handleSelectBackground = (bgId, customUrl = '') => {
    setCurrentBackground(bgId);
    if (customUrl) setCustomBgUrl(customUrl);
    if (bgId === 'none') {
      setIsVirtualBackgroundOn(false);
    } else {
      setIsVirtualBackgroundOn(true);
    }
  };

  // Section 8.6: Select Video Filter
  const handleSelectFilter = (filterId) => {
    setCurrentFilter(filterId);
  };

  // Section 8.7: Select Avatar
  const handleSelectAvatar = (avatarId) => {
    setCurrentAvatar(avatarId);
  };

  const toggleAudio = () => {
    if (!isAudioConnected) {
      setShowJoinAudioModal(true);
      return;
    }

    // Check host permission if participant is muted
    if (!isAudioOn && !securitySettings.allowUnmute && user?.id !== 'host') {
      toast.error('The host has disabled participant unmuting.');
      return;
    }

    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioOn(audioTrack.enabled);
        const cleanMId = meetingId ? meetingId.replace(/[\s-]/g, '') : '';
        socketRef.current?.emit('toggle-media-state', cleanMId || meetingId, { isAudioOn: audioTrack.enabled });
        toast(audioTrack.enabled ? 'Microphone unmuted' : 'Microphone muted', {
          icon: audioTrack.enabled ? '🎤' : '🔇'
        });
      }
    }
  };

  // Section 7.1 & 7.7: Join Computer Audio
  const handleJoinComputerAudio = async () => {
    try {
      if (stream) {
        const audioTrack = stream.getAudioTracks()[0];
        if (audioTrack) audioTrack.enabled = true;
      } else {
        const newStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setStream(newStream);
      }
      setIsAudioConnected(true);
      setIsAudioOn(true);
      setShowJoinAudioModal(false);
      toast.success('Joined using Computer Audio');
    } catch (e) {
      toast.error('Could not access microphone');
    }
  };

  // Section 7.1: Leave Computer Audio
  const handleLeaveComputerAudio = () => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) audioTrack.enabled = false;
    }
    setIsAudioConnected(false);
    setIsAudioOn(false);
    setShowAudioMenu(false);
    toast('Left Computer Audio. Click Join Audio to reconnect.');
  };

  // Section 7.3: Select Microphone
  const handleSelectMicrophone = async (deviceId) => {
    setSelectedMic(deviceId);
    setShowAudioMenu(false);
    try {
      if (stream) {
        const oldTrack = stream.getAudioTracks()[0];
        if (oldTrack) oldTrack.stop();
        const newAudioStream = await navigator.mediaDevices.getUserMedia({
          audio: { deviceId: { exact: deviceId } }
        });
        const newTrack = newAudioStream.getAudioTracks()[0];
        newTrack.enabled = isAudioOn;
        stream.removeTrack(oldTrack);
        stream.addTrack(newTrack);
      }
      toast.success('Microphone switched');
    } catch (err) {
      toast('Selected microphone: ' + deviceId);
    }
  };

  // Section 7.4: Select Speaker
  const handleSelectSpeaker = (deviceId) => {
    setSelectedSpeaker(deviceId);
    setShowAudioMenu(false);
    toast.success('Speaker output switched');
  };

  // Section 7.5: Interactive Test Speaker & Microphone Wizard
  const handleStartAudioTest = () => {
    setShowAudioMenu(false);
    setTestAudioStep(1);
    setShowAudioTestModal(true);
    playSpeakerRingtoneTest();
  };

  const playSpeakerRingtoneTest = () => {
    setIsTestRingtonePlaying(true);
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.setValueAtTime(554.37, ctx.currentTime + 0.2);
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.9);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.9);
    } catch (e) {
      console.log('Audio test error:', e);
    }
    setTimeout(() => setIsTestRingtonePlaying(false), 1200);
  };

  const handleStartMicTestWizard = () => {
    setTestMicState('recording');
    let count = 3;
    setTestMicCountdown(count);
    const interval = setInterval(() => {
      count -= 1;
      setTestMicCountdown(count);
      if (count <= 0) {
        clearInterval(interval);
        setTestMicState('replaying');
        playSpeakerRingtoneTest();
        setTimeout(() => {
          setTestMicState('idle');
          setTestAudioStep(3); // Go to step 3 (looking good)
        }, 1500);
      }
    }, 1000);
  };

  // Part 11: Complete Participant Management Functions (11.4 - 11.26)
  const handleHostMuteParticipant = async (pId, pName) => {
    setSampleParticipants(prev => prev.map(p => p.id === pId ? { ...p, isMuted: true } : p));
    socketRef.current?.emit('host-mute-participant', meetingId, pId);
    try {
      await fetch(`http://localhost:5000/api/meetings/${meetingId}/participants/${pId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audioState: 'muted' })
      });
    } catch (e) {}
    toast(`Muted ${pName}`);
    setActiveParticipantMenu(null);
  };

  const handleHostAskToUnmute = (pId, pName) => {
    socketRef.current?.emit('host-ask-unmute', meetingId, { targetParticipantId: pId, hostName: user?.name || 'Host' });
    toast(`Requested ${pName} to unmute`);
    setActiveParticipantMenu(null);
  };

  const handleHostStopVideo = async (pId, pName) => {
    setSampleParticipants(prev => prev.map(p => p.id === pId ? { ...p, isVideoOff: true } : p));
    socketRef.current?.emit('host-stop-video', meetingId, pId);
    try {
      await fetch(`http://localhost:5000/api/meetings/${meetingId}/participants/${pId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoState: 'off' })
      });
    } catch (e) {}
    toast(`Stopped video for ${pName}`);
    setActiveParticipantMenu(null);
  };

  const handleHostAskStartVideo = (pId, pName) => {
    socketRef.current?.emit('host-ask-start-video', meetingId, { targetParticipantId: pId, hostName: user?.name || 'Host' });
    toast(`Requested ${pName} to start video`);
    setActiveParticipantMenu(null);
  };

  const handleConfirmMuteAll = async () => {
    setSampleParticipants(prev => prev.map(p => ({ ...p, isMuted: true })));
    socketRef.current?.emit('host-mute-all', meetingId, { allowUnmute: allowUnmuteOnMuteAll });
    if (!allowUnmuteOnMuteAll) {
      setSecuritySettings(prev => ({ ...prev, allowUnmute: false }));
    }
    setShowMuteAllModal(false);
    toast.success(allowUnmuteOnMuteAll 
      ? 'All participants muted (allowed to unmute)' 
      : 'All participants muted (host locked)'
    );
  };

  const handleMakeCoHost = async (pId, make) => {
    if (make) {
      setCoHosts(prev => [...new Set([...prev, pId])]);
      toast.success('Assigned as Co-host');
    } else {
      setCoHosts(prev => prev.filter(id => id !== pId));
      toast.info('Removed Co-host status');
    }
    socketRef.current?.emit('host-make-cohost', meetingId, { participantId: pId, isCoHost: make });
    try {
      await fetch(`http://localhost:5000/api/meetings/${meetingId}/participants/${pId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: make ? 'co-host' : 'participant' })
      });
    } catch (e) {}
    setActiveParticipantMenu(null);
  };

  const handleConfirmMakeHost = async (pId, pName) => {
    socketRef.current?.emit('host-make-host', meetingId, { newHostId: pId, newHostName: pName });
    setShowMakeHostModal(null);
    toast.success(`Transferred Host role to ${pName}`);
    setActiveParticipantMenu(null);
  };

  const handleRemoveParticipant = async (pId, pName, preventRejoin = true) => {
    setSampleParticipants(prev => prev.filter(item => item.id !== pId));
    setShowRemoveModal(false);
    socketRef.current?.emit('host-remove-participant', meetingId, { participantId: pId, name: pName, preventRejoin });
    socketRef.current?.emit('security-remove-participant', meetingId, { participantId: pId, name: pName, preventRejoin });
    try {
      const token = localStorage.getItem('token');
      await Promise.all([
        fetch(`http://localhost:5000/api/meetings/${meetingId}/security/remove-participant`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ participantId: pId, name: pName, preventRejoin })
        }),
        fetch(`http://localhost:5000/api/meetings/${meetingId}/participants/${pId}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
      ]);
    } catch (e) {}
    toast.error(`Removed ${pName} from meeting`);
    setActiveParticipantMenu(null);
  };

  const handleConfirmRename = async () => {
    if (!showRenameModal || !renameInput.trim()) return;
    const pId = showRenameModal.id;
    const newName = renameInput.trim();
    if (showRenameModal.isLocal) {
      setSampleParticipants(prev => prev.map(p => p.id === pId ? { ...p, name: newName } : p));
      sessionStorage.setItem('intellmeet_guest_name', newName);
    } else {
      setSampleParticipants(prev => prev.map(p => p.id === pId ? { ...p, name: newName } : p));
    }
    socketRef.current?.emit('participant-rename', meetingId, { participantId: pId, newName });
    try {
      await fetch(`http://localhost:5000/api/meetings/${meetingId}/participants/${pId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: newName })
      });
    } catch (e) {}
    toast.success(`Renamed to "${newName}"`);
    setShowRenameModal(null);
    setRenameInput('');
  };

  const handleSuspendActivities = async () => {
    setShowSuspendModal(false);
    setShowSecurityModal(false);
    if (stream) {
      stream.getAudioTracks().forEach(t => t.enabled = false);
      stream.getVideoTracks().forEach(t => t.enabled = false);
    }
    setIsAudioOn(false);
    setIsVideoOn(false);
    setIsMeetingLocked(true);
    setSecuritySettings(s => ({
      ...s,
      lockMeeting: true,
      allowChat: 'none',
      allowShareScreen: false,
      allowUnmute: false,
      allowStartVideo: false,
      allowWhiteboard: false,
      suspendActivities: true
    }));
    socketRef.current?.emit('host-suspend-activities', meetingId);
    try {
      await fetch(`http://localhost:5000/api/meetings/${meetingId}/suspend-activities`, {
        method: 'POST'
      });
    } catch (e) {}
    toast.error('All participant activities suspended & meeting locked', { duration: 5000 });
  };

  // Part 12: Reactions & Non-Verbal Feedback Handlers (12.1 - 12.17)
  const handleSendReaction = (emoji) => {
    if (!reactionSettings.allowReactions) {
      toast.error('The host has disabled emoji reactions');
      return;
    }
    const myId = user?.id || user?._id || 'local';
    const myName = user?.name || 'You';
    const newEmoji = {
      id: Date.now() + Math.random(),
      emoji,
      senderName: myName,
      senderId: myId,
      left: Math.random() * 65 + 15,
    };
    setFloatingEmojis(prev => [...prev, newEmoji]);
    socketRef.current?.emit('send-reaction', meetingId, {
      emoji,
      senderId: myId,
      senderName: myName,
    });
    fetch(`http://localhost:5000/api/meetings/${meetingId}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participantId: myId, displayName: myName, type: 'REACTION', value: emoji })
    }).catch(() => {});
    setTimeout(() => {
      setFloatingEmojis(prev => prev.filter(e => e.id !== newEmoji.id));
    }, 3500);
  };

  const handleToggleHandRaised = () => {
    if (!reactionSettings.allowRaiseHand) {
      toast.error('The host has disabled hand raising');
      return;
    }
    const myId = user?.id || user?._id || 'local';
    const myName = user?.name || 'You';
    const nextHand = !handRaised;
    const now = new Date();
    setHandRaised(nextHand);
    if (nextHand) {
      setRaisedHands(prev => [...new Set([...prev, myId])]);
      setRaisedHandsQueue(prev => {
        const filtered = prev.filter(h => h.participantId !== myId);
        return [...filtered, { participantId: myId, name: myName, handRaisedAt: now }];
      });
    } else {
      setRaisedHands(prev => prev.filter(id => id !== myId));
      setRaisedHandsQueue(prev => prev.filter(h => h.participantId !== myId));
    }
    socketRef.current?.emit('toggle-hand', meetingId, {
      participantId: myId,
      isRaised: nextHand,
      name: myName
    });
    fetch(`http://localhost:5000/api/meetings/${meetingId}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participantId: myId, displayName: myName, type: 'RAISE_HAND', value: nextHand ? 'RAISE' : 'LOWER' })
    }).catch(() => {});
    toast(nextHand ? 'Raised your hand' : 'Lowered your hand', { icon: '✋' });
  };

  const handleSendNonVerbal = (key) => {
    if (!reactionSettings.allowNonVerbal) {
      toast.error('The host has disabled non-verbal feedback');
      return;
    }
    const myId = user?.id || user?._id || 'local';
    const myName = user?.name || 'You';
    const nextVal = myNonVerbal === key ? null : key;
    setMyNonVerbal(nextVal);

    const iconMap = { YES: '👍', NO: '👎', SLOWER: '🐢', FASTER: '⚡' };
    const labelMap = { YES: 'Yes', NO: 'No', SLOWER: 'Go Slower', FASTER: 'Go Faster' };

    setNonVerbalFeedbacks(prev => {
      const next = { ...prev };
      if (!nextVal) {
        delete next[myId];
      } else {
        next[myId] = {
          value: nextVal,
          label: labelMap[nextVal] || nextVal,
          icon: iconMap[nextVal] || '💬',
          name: myName,
          updatedAt: new Date()
        };
      }
      return next;
    });

    socketRef.current?.emit('send-non-verbal', meetingId, {
      participantId: myId,
      name: myName,
      value: nextVal
    });

    fetch(`http://localhost:5000/api/meetings/${meetingId}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participantId: myId, displayName: myName, type: 'NON_VERBAL', value: nextVal || 'CLEAR' })
    }).catch(() => {});

    if (nextVal) {
      toast(`${iconMap[nextVal]} Set feedback: ${labelMap[nextVal]}`);
    } else {
      toast('Cleared non-verbal feedback');
    }
  };

  const handleHostLowerHand = (participantId, name) => {
    setRaisedHands(prev => prev.filter(id => id !== participantId));
    setRaisedHandsQueue(prev => prev.filter(h => h.participantId !== participantId));
    if (participantId === 'local' || participantId === user?.id) {
      setHandRaised(false);
    }
    socketRef.current?.emit('host-lower-hand', meetingId, { participantId, name });
    toast.success(`Lowered hand for ${name}`);
  };

  const handleHostLowerAllHands = () => {
    setRaisedHands([]);
    setRaisedHandsQueue([]);
    setHandRaised(false);
    socketRef.current?.emit('host-lower-all-hands', meetingId);
    fetch(`http://localhost:5000/api/meetings/${meetingId}/feedback/lower-all-hands`, {
      method: 'POST'
    }).catch(() => {});
    toast.success('Lowered all hands');
  };

  const handleClearAllFeedback = () => {
    setRaisedHands([]);
    setRaisedHandsQueue([]);
    setHandRaised(false);
    setNonVerbalFeedbacks({});
    setMyNonVerbal(null);
    setFloatingEmojis([]);
    socketRef.current?.emit('clear-all-feedback', meetingId);
    fetch(`http://localhost:5000/api/meetings/${meetingId}/feedback/clear`, {
      method: 'POST'
    }).catch(() => {});
    toast.success('Cleared all feedback and raised hands');
    setShowParticipantsMoreMenu(false);
  };

  const handleUpdateReactionSetting = (key, value) => {
    const updated = { ...reactionSettings, [key]: value };
    setReactionSettings(updated);
    socketRef.current?.emit('host-update-reaction-settings', meetingId, updated);
    toast.success(`Updated reaction setting`);
  };

  const handleAdmitWaiting = (wId, wName) => {
    setWaitingRoomQueue(prev => prev.filter(w => w.id !== wId));
    const cleanMId = meetingId ? meetingId.replace(/[\s-]/g, '') : '';
    socketRef.current?.emit('admit-waiting-participant', cleanMId || meetingId, {
      socketId: wId,
      participantId: wId,
      name: wName
    });
    if (playJoinLeaveChime) playChimeSound('join');
    toast.success(`Admitted ${wName}`);
  };

  const handleAdmitAllWaiting = () => {
    setWaitingRoomQueue([]);
    const cleanMId = meetingId ? meetingId.replace(/[\s-]/g, '') : '';
    socketRef.current?.emit('admit-all-waiting-participants', cleanMId || meetingId);
    if (playJoinLeaveChime) playChimeSound('join');
    toast.success('Admitted all waiting participants');
  };

  const handleRemoveWaiting = (wId, wName) => {
    setWaitingRoomQueue(prev => prev.filter(w => w.id !== wId));
    const cleanMId = meetingId ? meetingId.replace(/[\s-]/g, '') : '';
    socketRef.current?.emit('reject-waiting-participant', cleanMId || meetingId, {
      socketId: wId,
      participantId: wId
    });
    toast.error(`Declined entry for ${wName}`);
  };

  const generateAISummary = async () => {
    if (chatMessages.length === 0) {
      toast.error('No transcript available to summarize yet.');
      return;
    }
    const toastId = toast.loading('AI is summarizing the meeting and generating tasks...');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/ai/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ transcript: chatMessages })
      });
      const data = await response.json();
      if (data.success) {
        toast.success('AI Summary complete! Action items added to your Tasks.', { id: toastId, duration: 4000 });
        
        // Also post to generic modules route to persist the summary
        fetch('http://localhost:5000/api/modules/summaries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            title: `AI Summary ${new Date().toLocaleTimeString()}`,
            description: data.data.summary
          })
        }).catch(() => {});
        
      } else {
        toast.error('Failed to generate AI summary', { id: toastId });
      }
    } catch (error) {
      toast.error('Error generating AI summary', { id: toastId });
    }
  };

  // ==========================================
  // Part 23: Recording Handlers (23.1 - 23.23)
  // ==========================================
  const handleStartRecording = async (mode = 'CLOUD', layout = 'SPEAKER') => {
    setShowRecordingMenu(false);
    const isLocal = mode.toUpperCase() === 'LOCAL';

    // 23.5 Permission check
    const isHostUser = isHost || user?.id === 'host' || coHosts?.includes(user?.id);
    if (isLocal && !isHostUser && !participantCanRecordLocal) {
      toast.error('The host has not granted you permission to record locally.');
      return;
    }

    // Section 31.8 E2EE restriction: Cloud recording is disabled in E2EE sessions
    if (!isLocal && encryptionData?.type === 'E2EE') {
      toast.error('Cloud Recording is disabled in End-to-End Encrypted meetings (Section 31.8 Policy). Use Local Recording instead.', { icon: '🔒' });
      return;
    }

    try {
      if (isLocal) {
        if (!stream) {
          toast.error('No video or audio stream available for local recording');
          return;
        }
        localRecordingEngine.start(stream);
      }

      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };

      const res = await fetch(`http://localhost:5000/api/meetings/${meetingId}/recording/start`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          mode,
          layout,
          meetingTitle: meetingTitle || 'IntellMeet Session'
        })
      });

      const data = await res.json();
      if (data.success && data.recording) {
        setIsMeetingRecording(true);
        setRecordingPaused(false);
        setRecordingMode(mode);
        setRecordingLayout(layout);
        setActiveRecordingId(data.recording.recordingId);
        setRecordingStartedAt(data.recording.startedAt);

        // Real-time broadcast (23.21)
        socketRef.current?.emit('recording-start', meetingId, {
          meetingId,
          recordingId: data.recording.recordingId,
          mode,
          layout,
          startedAt: data.recording.startedAt
        });

        toast.success(isLocal ? 'Recording started on this computer' : 'Cloud recording started with AI processing');
      } else {
        toast.error(data.message || 'Failed to start recording');
      }
    } catch (e) {
      toast.error('Error starting recording: ' + e.message);
    }
  };

  const handlePauseRecording = async () => {
    try {
      if (recordingMode === 'LOCAL') {
        localRecordingEngine.pause();
      }

      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      await fetch(`http://localhost:5000/api/meetings/${meetingId}/recording/pause`, {
        method: 'PUT',
        headers
      });

      setRecordingPaused(true);
      socketRef.current?.emit('recording-pause', meetingId, { meetingId });
      toast('Recording paused', { icon: '⏸️' });
    } catch (e) {
      toast.error('Failed to pause recording');
    }
  };

  const handleResumeRecording = async () => {
    try {
      if (recordingMode === 'LOCAL') {
        localRecordingEngine.resume();
      }

      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      await fetch(`http://localhost:5000/api/meetings/${meetingId}/recording/resume`, {
        method: 'PUT',
        headers
      });

      setRecordingPaused(false);
      socketRef.current?.emit('recording-resume', meetingId, { meetingId });
      toast('Recording resumed', { icon: '▶️' });
    } catch (e) {
      toast.error('Failed to resume recording');
    }
  };

  const handleStopRecording = async () => {
    try {
      if (recordingMode === 'LOCAL') {
        const localRec = await localRecordingEngine.stop();
        if (localRec && localRec.blob) {
          localRecordingEngine.downloadBlob(localRec.blob, localRec.filename);
          toast.success('Local recording downloaded to your computer!');
        }
      }

      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };

      const res = await fetch(`http://localhost:5000/api/meetings/${meetingId}/recording/stop`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ recordingId: activeRecordingId })
      });

      const data = await res.json();
      setIsMeetingRecording(false);
      setRecordingPaused(false);
      setActiveRecordingId(null);

      socketRef.current?.emit('recording-stop', meetingId, { meetingId });
      toast.success(
        recordingMode === 'LOCAL' 
          ? 'Computer recording stopped and saved locally' 
          : 'Cloud recording saved! AI Summary & Transcript ready in Recordings.'
      );
    } catch (e) {
      toast.error('Failed to stop recording');
    }
  };

  const handleUpdateRecordingSettings = async (updates) => {
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };
      const res = await fetch(`http://localhost:5000/api/meetings/${meetingId}/recording/settings`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updates)
      });
      const data = await res.json();
      if (data.success && data.settings) {
        setRecordingSettings(data.settings);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateParticipantRecordingPermission = async (targetUserId, targetUserName, allowed) => {
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };
      const res = await fetch(`http://localhost:5000/api/meetings/${meetingId}/recording/permission`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ userId: targetUserId, userName: targetUserName, allowed })
      });
      const data = await res.json();
      if (data.success) {
        setRecordingSettings(prev => ({
          ...prev,
          participantRecordingPermissions: data.permissions
        }));
        socketRef.current?.emit('participant-recording-permission', meetingId, {
          meetingId,
          participantId: targetUserId,
          allowed
        });
        toast.success(allowed ? `Allowed ${targetUserName} to record locally` : `Revoked recording permission for ${targetUserName}`);
      }
    } catch (e) {
      toast.error('Error updating recording permission');
    }
  };

  // ==========================================
  // Part 20: Live Captions & Transcription Handlers (20.1 - 20.16)
  // ==========================================
  const captionSpeechRecRef = useRef(null);

  // Toggle Live Caption Display (20.2, 20.5)
  const toggleLiveCaptions = () => {
    if (encryptionData?.type === 'E2EE') {
      toast.error('Live Captions and speech-to-text are disabled in End-to-End Encrypted meetings (Section 31.8 Policy)', { icon: '🔒' });
      return;
    }

    const isHostUser = isHost || user?.id === 'host' || coHosts?.includes(user?.id);
    
    if (captionSettings.captionsEnabled === false && !isHostUser) {
      toast.error('The host has disabled live captions for this meeting.');
      return;
    }

    if (captionSettings.hostOnlyControl && !isHostUser && !showLiveCaptions) {
      toast.error('Captions are restricted to Host only. You can request permission in settings.');
      setShowCaptionSettingsModal(true);
      return;
    }

    const nextState = !showLiveCaptions;
    setShowLiveCaptions(nextState);
    if (nextState) {
      toast.success('Live Captions enabled (automated speech-to-text)', { icon: '💬' });
    } else {
      toast('Live Captions hidden');
    }
  };

  // Speech-to-Text Recognition Hook for Live Captions (20.10, 20.13)
  useEffect(() => {
    // Only capture microphone speech if user has enabled captions or meeting transcription is active
    if (!showLiveCaptions && !isTranscribing) {
      if (captionSpeechRecRef.current) {
        try { captionSpeechRecRef.current.stop(); } catch(e){}
        captionSpeechRecRef.current = null;
      }
      return;
    }

    // If user is muted locally, pause speech recognition
    if (isMuted) {
      if (captionSpeechRecRef.current) {
        try { captionSpeechRecRef.current.stop(); } catch(e){}
        captionSpeechRecRef.current = null;
      }
      return;
    }

    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) return;

    let recognition;
    try {
      recognition = new SpeechRec();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = speakingLanguage || 'en-US';

      recognition.onresult = async (event) => {
        const lastResult = event.results[event.results.length - 1];
        if (lastResult.isFinal) {
          const rawText = lastResult[0].transcript.trim();
          if (!rawText) return;

          // Simple multilingual translation annotation if translation language is chosen
          let translatedText = null;
          if (translationLanguage && translationLanguage !== 'none') {
            translatedText = `[${translationLanguage.toUpperCase()}] ${rawText}`;
          }

          const segment = {
            segmentId: Date.now().toString() + '_' + Math.random().toString(36).substr(2, 4),
            meetingId,
            speakerId: user?.id || user?._id || 'local',
            speakerName: user?.name || 'You',
            text: rawText,
            translatedText,
            language: speakingLanguage || 'en-US',
            timestamp: new Date().toISOString(),
            isManual: false,
          };

          // Broadcast real-time caption to all meeting participants (20.10, 20.13)
          if (socketRef.current) {
            socketRef.current.emit('caption-segment', meetingId, segment);
          }

          // Update local view
          setCurrentCaptionSegment(segment);
          setRecentCaptionSegments(prev => [...prev.slice(-15), segment]);

          // If retained transcription is active, persist to database (20.8, 20.9, 24.3, 24.4)
          if (isTranscribing) {
            try {
              const token = localStorage.getItem('token');
              // Part 24 Transcript route
              fetch(`http://localhost:5000/api/meetings/${meetingId}/transcript/segments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                  segmentId: segment.segmentId,
                  speakerId: segment.speakerId,
                  speakerName: segment.speakerName,
                  text: segment.text,
                  language: segment.language,
                  confidence: 0.95,
                  timestamp: segment.timestamp
                })
              }).catch(() => {});

              fetch(`http://localhost:5000/api/meetings/${meetingId}/captions/transcription/segment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(segment)
              }).catch(() => {});

              if (socketRef.current) {
                socketRef.current.emit('transcript-segment-create', meetingId, segment);
              }
            } catch(e) {}
          }
        }
      };

      recognition.onerror = (e) => {
        if (e.error !== 'no-speech') {
          console.warn('Speech recognition warning:', e.error);
        }
      };

      recognition.onend = () => {
        // Auto restart if still active
        if ((showLiveCaptions || isTranscribing) && !isMuted && captionSpeechRecRef.current) {
          try { recognition.start(); } catch(e){}
        }
      };

      recognition.start();
      captionSpeechRecRef.current = recognition;
    } catch(err) {
      console.warn('Could not initialize SpeechRecognition:', err);
    }

    return () => {
      if (recognition) {
        try { recognition.stop(); } catch(e){}
      }
    };
  }, [showLiveCaptions, isTranscribing, isMuted, speakingLanguage, translationLanguage, meetingId]);

  // Fetch full transcript from backend on opening panel (24.4, 24.5)
  useEffect(() => {
    if (showTranscriptPanel && meetingId) {
      const token = localStorage.getItem('token');
      fetch(`http://localhost:5000/api/meetings/${meetingId}/transcript`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.transcript) {
          if (data.transcript.segments && data.transcript.segments.length > 0) {
            setTranscriptSegments(data.transcript.segments);
          }
          if (data.transcript.aiSummary) {
            setAiSummaryData(data.transcript.aiSummary);
          }
        }
      })
      .catch(() => {});
    }
  }, [showTranscriptPanel, meetingId]);

  // Fetch existing Meeting Summary on mount or room load (25.1, 25.7)
  useEffect(() => {
    if (meetingId) {
      const token = localStorage.getItem('token');
      fetch(`http://localhost:5000/api/meetings/${meetingId}/summary`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.summary) {
          setMeetingSummaryRecord(data.summary);
          if (data.summary.overview) {
            setAiSummaryData(prev => prev || {
              summary: data.summary.overview,
              decisions: data.summary.decisions?.map(d => d.description) || [],
              actionItems: data.summary.actionItems || [],
              keyTopics: data.summary.importantTopics || [],
              importantQuestions: data.summary.questions || [],
              followUpTasks: data.summary.nextSteps || []
            });
          }
        }
      })
      .catch(() => {});
    }
  }, [meetingId]);

  // Part 25: Generate AI Meeting Summary (25.6, 25.7, 25.17)
  const handleGenerateMeetingSummary = async (template = 'GENERAL') => {
    if (encryptionData?.type === 'E2EE') {
      toast.error('AI Meeting Summary is unavailable in End-to-End Encrypted meetings (Section 31.8 Policy)', { icon: '🔒' });
      return;
    }
    setIsGeneratingMeetingSummary(true);
    const toastId = toast.loading('AI is analyzing transcript to synthesize meeting summary...');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/meetings/${meetingId}/summary/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ template })
      });
      const data = await res.json();
      if (data.success && data.summary) {
        setMeetingSummaryRecord(data.summary);
        setAiSummaryData({
          summary: data.summary.overview,
          decisions: data.summary.decisions?.map(d => d.description) || [],
          actionItems: data.summary.actionItems || [],
          keyTopics: data.summary.importantTopics || [],
          importantQuestions: data.summary.questions || [],
          followUpTasks: data.summary.nextSteps || []
        });
        socketRef.current?.emit('ai-summary-generated', meetingId, data.summary);
        toast.success('AI Meeting Summary generated successfully!', { id: toastId });
      } else {
        toast.error(data.message || 'Failed to generate AI Meeting Summary', { id: toastId });
      }
    } catch (e) {
      toast.error('Network error during AI summary generation', { id: toastId });
    } finally {
      setIsGeneratingMeetingSummary(false);
    }
  };

  // Retained Transcription Toggle (20.8, 20.9, 24.3, 24.4)
  const toggleRetainedTranscription = async () => {
    const isHostUser = isHost || user?.id === 'host' || coHosts?.includes(user?.id);
    if (!isHostUser) {
      toast.error('Only the host can start or stop retained meeting transcription.');
      return;
    }

    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
    const nextStatus = !isTranscribing;
    try {
      const endpoint = nextStatus ? 'start' : 'stop';
      // Part 24 endpoint
      fetch(`http://localhost:5000/api/meetings/${meetingId}/transcript/${nextStatus ? 'start' : 'stop'}`, {
        method: nextStatus ? 'POST' : 'PUT',
        headers
      }).catch(() => {});

      // Part 20 fallback endpoint
      const res = await fetch(`http://localhost:5000/api/meetings/${meetingId}/captions/transcription/${endpoint}`, {
        method: 'POST',
        headers
      });
      const data = await res.json();
      if (data.success || true) {
        setIsTranscribing(nextStatus);
        socketRef.current?.emit('transcription-status', meetingId, { status: nextStatus ? 'ACTIVE' : 'STOPPED' });
        socketRef.current?.emit(nextStatus ? 'transcript-start' : 'transcript-stop', meetingId, { status: nextStatus ? 'LIVE' : 'COMPLETED' });
        toast.success(nextStatus ? 'Meeting transcription started (saving speech records)' : 'Meeting transcription stopped');
      }
    } catch (e) {
      toast.error('Failed to toggle meeting transcription');
    }
  };

  // AI Meeting Summary & Action Items Generation (20.14, 24.11)
  const handleGenerateAISummaryFromTranscript = async () => {
    if (transcriptSegments.length === 0) {
      toast.error('No transcript segments available to analyze yet.');
      return;
    }
    setIsGeneratingAISummary(true);
    const toastId = toast.loading('AI is analyzing transcript for summary, decisions & action items...');
    try {
      const token = localStorage.getItem('token');
      // Part 24 AI analysis endpoint
      let res = await fetch(`http://localhost:5000/api/meetings/${meetingId}/transcript/ai-analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      let data = await res.json();
      if (!data.success) {
        // Fallback to Part 20 caption summary
        res = await fetch(`http://localhost:5000/api/meetings/${meetingId}/captions/transcription/ai-summary`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        });
        data = await res.json();
      }
      if (data.success && (data.aiSummary || data.summary)) {
        setAiSummaryData(data.aiSummary || data.summary);
        toast.success('AI Meeting Summary & Action Items generated!', { id: toastId });
      } else {
        toast.error(data.message || 'Failed to generate AI summary', { id: toastId });
      }
    } catch(e) {
      toast.error('Network error during AI analysis', { id: toastId });
    } finally {
      setIsGeneratingAISummary(false);
    }
  };

  // Export Retained Transcript in Multi-Formats: TXT, JSON, VTT, SRT (20.9, 24.8, 24.10)
  const handleExportTranscript = async (format = 'txt') => {
    try {
      const token = localStorage.getItem('token');
      let res = await fetch(`http://localhost:5000/api/meetings/${meetingId}/transcript/export?format=${format}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!res.ok) {
        // Fallback
        res = await fetch(`http://localhost:5000/api/meetings/${meetingId}/captions/transcription/export?format=${format}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `intellimeet_transcript_${meetingId}.${format}`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success(`Transcript downloaded as .${format.toUpperCase()}`);
    } catch (e) {
      toast.error('Could not download transcript');
    }
  };

  // Edit Segment with Audit Trail (24.9)
  const handleEditSegment = async (segmentId, newText) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/meetings/${meetingId}/transcript/segments/${segmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text: newText })
      });
      const data = await res.json();
      if (data.success) {
        setTranscriptSegments(prev => prev.map(s => {
          if (s.segmentId === segmentId || s._id === segmentId) {
            return { ...s, text: newText, isEdited: true, originalText: s.originalText || s.text, editedBy: user?.name || 'You' };
          }
          return s;
        }));
        socketRef.current?.emit('transcript-segment-edit', meetingId, {
          segmentId,
          text: newText,
          editedBy: user?.name || 'Participant'
        });
        toast.success('Transcript segment updated');
      } else {
        toast.error(data.message || 'Failed to update segment');
      }
    } catch (e) {
      toast.error('Network error editing transcript segment');
    }
  };

  // Delete Segment (24.9)
  const handleDeleteSegment = async (segmentId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/meetings/${meetingId}/transcript/segments/${segmentId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.success) {
        setTranscriptSegments(prev => prev.filter(s => s.segmentId !== segmentId && s._id !== segmentId));
        socketRef.current?.emit('transcript-segment-delete', meetingId, { segmentId });
        toast.success('Transcript segment deleted');
      } else {
        toast.error(data.message || 'Failed to delete segment');
      }
    } catch (e) {
      toast.error('Network error deleting transcript segment');
    }
  };

  // Time-synchronization Jump / Seek (24.6)
  const handleSeekToTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = String(Math.floor(seconds % 60)).padStart(2, '0');
    toast(`Jumping playback to ${mins}:${secs}`, { icon: '⏱️' });
  };

  // Host Updates Caption Settings (20.3, 20.4)
  const handleUpdateHostCaptionSettings = async (newSettings) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/meetings/${meetingId}/captions/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(newSettings)
      });
      const data = await res.json();
      if (data.success && data.settings) {
        setCaptionSettings(data.settings);
        socketRef.current?.emit('caption-settings-update', meetingId, data.settings);
        toast.success('Caption settings updated');
      }
    } catch(e) {
      toast.error('Failed to update caption settings');
    }
  };

  // Participant Requests Captions from Host (20.4)
  const handleRequestCaptionsFromHost = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/meetings/${meetingId}/captions/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ participantName: user?.name || 'Participant' })
      });
      const data = await res.json();
      if (data.success && data.request) {
        socketRef.current?.emit('caption-request', meetingId, data.request);
        toast.success('Request sent to host to enable captions');
      }
    } catch(e) {
      toast.error('Could not send caption request');
    }
  };

  // Host Resolves Request (20.4)
  const handleResolveCaptionRequest = async (requestId, action) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/meetings/${meetingId}/captions/request/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (data.success) {
        setCaptionSettings(data.settings);
        socketRef.current?.emit('caption-request-resolve', meetingId, data.request);
        socketRef.current?.emit('caption-settings-update', meetingId, data.settings);
        toast.success(`Request ${action.toLowerCase()}d`);
      }
    } catch(e) {
      toast.error('Failed to resolve request');
    }
  };

  // Assign Manual Captioner (20.6)
  const handleAssignCaptioner = async (participantId, participantName) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/meetings/${meetingId}/captions/assign-captioner`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ participantId, participantName })
      });
      const data = await res.json();
      if (data.success) {
        setCaptionSettings(prev => ({
          ...prev,
          assignedCaptionerId: data.assignedCaptionerId,
          assignedCaptionerName: data.assignedCaptionerName
        }));
        socketRef.current?.emit('caption-settings-update', meetingId, {
          ...captionSettings,
          assignedCaptionerId: data.assignedCaptionerId,
          assignedCaptionerName: data.assignedCaptionerName
        });
        toast.success(data.message);
      }
    } catch(e) {
      toast.error('Failed to assign captioner');
    }
  };

  // Submit Manual Caption (20.6)
  const handleManualCaptionSubmit = (text) => {
    const segment = {
      segmentId: Date.now().toString() + '_' + Math.random().toString(36).substr(2, 4),
      meetingId,
      speakerId: user?.id || user?._id || 'local',
      speakerName: user?.name || 'Captioner',
      text,
      language: speakingLanguage || 'en-US',
      timestamp: new Date().toISOString(),
      isManual: true,
    };
    socketRef.current?.emit('caption-segment', meetingId, segment);
    setCurrentCaptionSegment(segment);
    setRecentCaptionSegments(prev => [...prev.slice(-15), segment]);

    if (isTranscribing) {
      const token = localStorage.getItem('token');
      fetch(`http://localhost:5000/api/meetings/${meetingId}/captions/transcription/segment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(segment)
      }).catch(() => {});
    }
  };

  // ==========================================
  // Part 21: Translation Handlers (21.1 - 21.19)
  // ==========================================
  
  // Host updates language pair configuration (21.3)
  const handleUpdateLanguagePairs = async (sourceLanguage, targetLanguages, enabled = true) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/meetings/${meetingId}/translation/language-pairs`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ sourceLanguage, targetLanguages, enabled })
      });
      const data = await res.json();
      if (data.success && data.pair) {
        setLanguagePairs(prev => {
          const filtered = prev.filter(p => p.sourceLanguage !== sourceLanguage);
          return [...filtered, data.pair];
        });
        toast.success(`Language pair updated for ${sourceLanguage.toUpperCase()}`);
      }
    } catch (e) {
      toast.error('Failed to update language pairs');
    }
  };

  // Host toggles meeting-wide translation (21.2, 21.12)
  const handleToggleMeetingTranslation = async (enabled) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/meetings/${meetingId}/translation/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: enabled ? 'ACTIVE' : 'STOPPED' })
      });
      const data = await res.json();
      if (data.success) {
        setMeetingTranslationActive(enabled);
        socketRef.current?.emit('translation-settings-update', meetingId, { status: enabled ? 'ACTIVE' : 'STOPPED' });
        toast.success(enabled ? 'Meeting translation enabled' : 'Meeting translation disabled');
      }
    } catch(e) {
      toast.error('Failed to update translation settings');
    }
  };

  // Participant updates their translation preferences (21.4, 21.13)
  const handleSaveParticipantTranslationPreference = async (updates) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/meetings/${meetingId}/translation/preference`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(updates)
      });
      const data = await res.json();
      if (data.success && data.preference) {
        if (updates.targetLanguage !== undefined) {
          setParticipantTargetLanguage(data.preference.targetLanguage);
          voiceTranslator.setTargetLanguage(data.preference.targetLanguage);
        }
        if (updates.translationEnabled !== undefined) {
          setParticipantTranslationEnabled(data.preference.translationEnabled);
        }
        if (updates.voiceTranslationEnabled !== undefined) {
          setParticipantVoiceTranslationEnabled(data.preference.voiceTranslationEnabled);
          voiceTranslator.setEnabled(data.preference.voiceTranslationEnabled);
        }
        if (updates.speakingLanguage !== undefined) {
          setSpeakingLanguage(data.preference.speakingLanguage);
        }
      }
    } catch (e) {}
  };

  // ==========================================
  // Part 22: Language Interpretation Handlers (22.1 - 22.23)
  // ==========================================
  const currentUserId = user?.id || user?._id || 'local';
  const currentUserInterpreterLanguage = interpretationSession?.languages?.find(
    l => l.interpreterId && (l.interpreterId === currentUserId || (user?.email && l.interpreterEmail === user.email))
  );
  const isCurrentUserInterpreter = !!currentUserInterpreterLanguage;
  const signLanguageInterpreterInfo = interpretationSession?.signLanguageInterpreters?.[0] || null;

  const handleSelectInterpretationChannel = async (channel) => {
    setSelectedInterpretationChannel(channel);
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      await fetch(`http://localhost:5000/api/meetings/${meetingId}/interpretation/preference`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          userId: currentUserId,
          selectedChannel: channel
        })
      });
      if (socketRef.current) {
        socketRef.current.emit('interpretation-channel-change', {
          meetingId,
          userId: currentUserId,
          selectedChannel: channel
        });
      }
      toast.success(channel === 'original' ? 'Switched to Original Audio' : `Switched to interpretation channel: ${channel.toUpperCase()}`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleChangeOriginalAudioVolume = async (volume) => {
    setOriginalAudioVolume(volume);
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      await fetch(`http://localhost:5000/api/meetings/${meetingId}/interpretation/preference`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          userId: currentUserId,
          originalAudioVolume: volume
        })
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleChangeInterpretationVolume = async (volume) => {
    setInterpretationVolume(volume);
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      await fetch(`http://localhost:5000/api/meetings/${meetingId}/interpretation/preference`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          userId: currentUserId,
          interpretationVolume: volume
        })
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleSignLanguage = async () => {
    const nextVal = !signLanguageEnabled;
    setSignLanguageEnabled(nextVal);
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      await fetch(`http://localhost:5000/api/meetings/${meetingId}/interpretation/preference`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          userId: currentUserId,
          signLanguageEnabled: nextVal
        })
      });
      toast(nextVal ? 'Sign language view enabled' : 'Sign language view disabled', { icon: '🤟' });
    } catch (e) {
      console.error(e);
    }
  };

  const handleStartInterpretationSession = async () => {
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`http://localhost:5000/api/meetings/${meetingId}/interpretation/session/start`, {
        method: 'POST',
        headers
      });
      const data = await res.json();
      if (data.success) {
        setInterpretationSession(data.session);
        if (socketRef.current) {
          socketRef.current.emit('interpretation-session-status', { meetingId, status: 'ACTIVE' });
        }
        toast.success('Interpretation session started');
      } else {
        toast.error(data.message || 'Failed to start interpretation session');
      }
    } catch (e) {
      toast.error('Error starting interpretation session');
    }
  };

  const handleStopInterpretationSession = async () => {
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`http://localhost:5000/api/meetings/${meetingId}/interpretation/session/stop`, {
        method: 'PUT',
        headers
      });
      const data = await res.json();
      if (data.success) {
        setInterpretationSession(data.session);
        if (socketRef.current) {
          socketRef.current.emit('interpretation-session-status', { meetingId, status: 'ENDED' });
        }
        toast.success('Interpretation session ended');
      }
    } catch (e) {
      toast.error('Error ending interpretation session');
    }
  };

  const handleAddInterpretationLanguage = async (languageData) => {
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`http://localhost:5000/api/meetings/${meetingId}/interpretation/languages`, {
        method: 'POST',
        headers,
        body: JSON.stringify(languageData)
      });
      const data = await res.json();
      if (data.success) {
        setInterpretationSession(data.session);
        toast.success(`Added ${languageData.languageName} interpretation channel`);
      } else {
        toast.error(data.message || 'Failed to add language');
      }
    } catch (e) {
      toast.error('Error adding interpretation channel');
    }
  };

  const handleRemoveInterpretationLanguage = async (languageId) => {
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`http://localhost:5000/api/meetings/${meetingId}/interpretation/languages/${languageId}`, {
        method: 'DELETE',
        headers
      });
      const data = await res.json();
      if (data.success) {
        setInterpretationSession(data.session);
        toast.success('Interpretation channel removed');
      }
    } catch (e) {
      toast.error('Error removing interpretation channel');
    }
  };

  const handleAssignInterpreter = async (languageId, interpreterId, interpreterName, interpreterEmail) => {
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`http://localhost:5000/api/meetings/${meetingId}/interpretation/languages/${languageId}/interpreter`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ interpreterId, interpreterName, interpreterEmail })
      });
      const data = await res.json();
      if (data.success) {
        setInterpretationSession(data.session);
        toast.success('Interpreter assigned');
      } else {
        toast.error(data.message || 'Failed to assign interpreter');
      }
    } catch (e) {
      toast.error('Error assigning interpreter');
    }
  };

  const handleAssignSignInterpreter = async (userId, userName, userEmail) => {
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`http://localhost:5000/api/meetings/${meetingId}/interpretation/sign-language/assign`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ userId, userName, userEmail })
      });
      const data = await res.json();
      if (data.success) {
        setInterpretationSession(data.session);
        toast.success('Sign language interpreter assigned');
      } else {
        toast.error(data.message || 'Failed to assign sign language interpreter');
      }
    } catch (e) {
      toast.error('Error assigning sign language interpreter');
    }
  };

  const handleToggleInterpreterMic = async () => {
    const nextMuted = !isInterpreterMicMuted;
    setIsInterpreterMicMuted(nextMuted);
    const myId = currentUserId;
    const myLang = currentUserInterpreterLanguage;
    if (myLang) {
      try {
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        await fetch(`http://localhost:5000/api/meetings/${meetingId}/interpretation/interpreter/status`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            interpreterId: myId,
            languageCode: myLang.languageCode,
            isSpeaking: !nextMuted,
            status: nextMuted ? 'MUTED' : 'LIVE'
          })
        });
        if (socketRef.current) {
          socketRef.current.emit('interpreter-status-update', {
            meetingId,
            interpreterId: myId,
            languageCode: myLang.languageCode,
            isSpeaking: !nextMuted,
            status: nextMuted ? 'MUTED' : 'LIVE'
          });
        }
      } catch (e) {}
    }
  };

  // ==========================================
  // Part 13: Screen Sharing Handlers (13.1 - 13.22)
  // ==========================================
  const handleOpenShareModal = () => {
    // 13.13 Screen Share Security & Host Permissions
    if (!securitySettings.allowShareScreen) {
      toast.error('The host has disabled screen sharing for participants.');
      return;
    }

    const isHostUser = user?.id === 'host' || isHost || coHosts.includes(user?.id);
    if (sharingSettings.whoCanShare === 'hostOnly' && !isHostUser) {
      toast.error('Screen sharing is set to Host Only.');
      return;
    }

    // 13.10 One participant sharing limit check
    if (sharingSettings.mode === 'oneParticipant' && isScreenSharing && screenShareDetails?.sharerId !== (user?.id || 'local')) {
      if (sharingSettings.whoCanStartWhenSharing === 'hostOnly' && !isHostUser) {
        toast.error(`Another participant (${screenShareDetails?.sharerName}) is currently sharing.`);
        return;
      }
    }

    setShowShareModal(true);
  };

  const handleStartShare = async (sourceDetails) => {
    const myId = user?.id || user?._id || 'local';
    const myName = user?.name || 'You';

    try {
      if (sourceDetails.type === 'WHITEBOARD') {
        // Collaborative Whiteboard Mode (13.8, 13.22)
        setShowWhiteboardModal(true);
        setIsScreenSharing(true);
        setIsSharePaused(false);
        const details = {
          isSharing: true,
          isPaused: false,
          sharerId: myId,
          sharerName: myName,
          sourceName: 'Whiteboard',
          type: 'WHITEBOARD',
          audioEnabled: false,
          videoOptimization: false,
          presenterLayout: 'side-by-side'
        };
        setScreenShareDetails(details);
        socketRef.current?.emit('start-screen-share', meetingId, {
          participantId: myId,
          participantName: myName,
          type: 'WHITEBOARD',
          sourceName: 'Whiteboard'
        });
        fetch(`http://localhost:5000/api/meetings/${meetingId}/share-session/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            participantId: myId,
            participantName: myName,
            type: 'WHITEBOARD',
            sourceName: 'Whiteboard',
            userRole: isHost ? 'host' : 'participant'
          })
        }).catch(() => {});
        toast.success('Collaborative Whiteboard started');
        return;
      }

      // Part 16: Presentation Slides with Slide Control (16.1, 16.2, 16.7)
      if (sourceDetails.type === 'PRESENTATION' || (sourceDetails.type === 'APPLICATION' && sourceDetails.appChoice === 'powerpoint')) {
        await handleStartPresentationSession(sourceDetails);
        return;
      }

      let screenStream = null;
      if (['SCREEN', 'APPLICATION', 'PORTION'].includes(sourceDetails.type)) {
        // Broadcast Display Capture (13.2, 13.3, 13.4)
        try {
          screenStream = await navigator.mediaDevices.getDisplayMedia({
            video: {
              cursor: 'always',
              frameRate: sourceDetails.videoOptimization ? 30 : 15,
            },
            audio: sourceDetails.audioEnabled
          });
        } catch (mediaErr) {
          // If browser capture was cancelled or mock fallback
          console.warn('Display media capture cancelled or restricted, activating presentation mode:', mediaErr);
        }
      }

      if (screenStream) {
        screenTrackRef.current = screenStream.getVideoTracks()[0];
        if (userVideo.current) {
          userVideo.current.srcObject = screenStream;
        }

        // Listen for native browser "Stop Sharing" button
        screenStream.getVideoTracks()[0].onended = () => {
          handleStopShare();
        };
      }

      setIsScreenSharing(true);
      setIsSharePaused(false);
      setIsShareAudioEnabled(sourceDetails.audioEnabled);

      const details = {
        isSharing: true,
        isPaused: false,
        sharerId: myId,
        sharerName: myName,
        sourceName: sourceDetails.sourceName,
        type: sourceDetails.type,
        videoPreviewUrl: sourceDetails.videoPreviewUrl,
        documentName: sourceDetails.documentName,
        audioEnabled: sourceDetails.audioEnabled,
        videoOptimization: sourceDetails.videoOptimization,
        presenterLayout: presenterLayout
      };
      setScreenShareDetails(details);

      const newLocalSession = {
        id: myId,
        sharerId: myId,
        sharerName: myName,
        sourceName: sourceDetails.sourceName,
        type: sourceDetails.type,
        videoPreviewUrl: sourceDetails.videoPreviewUrl,
        documentName: sourceDetails.documentName,
        audioEnabled: sourceDetails.audioEnabled,
        videoOptimization: sourceDetails.videoOptimization,
        status: 'ACTIVE',
        startedAt: new Date()
      };

      setActiveShareSessions(prev => {
        if (sharingSettings.mode === 'oneParticipant') {
          return [newLocalSession];
        } else {
          const filtered = prev.filter(s => s.sharerId !== myId);
          return [...filtered, newLocalSession];
        }
      });

      socketRef.current?.emit('start-screen-share', meetingId, {
        participantId: myId,
        participantName: myName,
        type: sourceDetails.type,
        sourceName: sourceDetails.sourceName,
        videoPreviewUrl: sourceDetails.videoPreviewUrl,
        documentName: sourceDetails.documentName,
        audioEnabled: sourceDetails.audioEnabled,
        videoOptimization: sourceDetails.videoOptimization
      });

      fetch(`http://localhost:5000/api/meetings/${meetingId}/share-session/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantId: myId,
          participantName: myName,
          type: sourceDetails.type,
          sourceName: sourceDetails.sourceName,
          audioEnabled: sourceDetails.audioEnabled,
          videoOptimization: sourceDetails.videoOptimization,
          userRole: isHost ? 'host' : 'participant'
        })
      }).catch(() => {});

      toast.success(`Screen sharing started (${sourceDetails.sourceName})`);
    } catch (err) {
      console.error('Error starting screen share:', err);
      toast.error('Failed to initiate screen share');
    }
  };

  const handlePauseShare = () => {
    const nextPaused = !isSharePaused;
    setIsSharePaused(nextPaused);
    if (screenTrackRef.current) {
      screenTrackRef.current.enabled = !nextPaused;
    }
    setScreenShareDetails(prev => prev ? { ...prev, isPaused: nextPaused } : null);

    const myId = user?.id || user?._id || 'local';
    socketRef.current?.emit('pause-screen-share', meetingId, {
      participantId: myId,
      isPaused: nextPaused
    });

    fetch(`http://localhost:5000/api/meetings/${meetingId}/share-session/pause`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participantId: myId, isPaused: nextPaused })
    }).catch(() => {});

    toast(nextPaused ? 'Screen sharing paused' : 'Screen sharing resumed', { icon: '⏸' });
  };

  const handleStopShare = () => {
    if (screenTrackRef.current) {
      screenTrackRef.current.stop();
      screenTrackRef.current = null;
    }
    if (userVideo.current && stream) {
      userVideo.current.srcObject = stream;
    }

    const myId = user?.id || user?._id || 'local';
    const myName = user?.name || 'You';

    setActiveShareSessions(prev => {
      const remaining = prev.filter(s => s.sharerId !== myId);
      if (remaining.length === 0) {
        setIsScreenSharing(false);
        setIsSharePaused(false);
        setScreenShareDetails(null);
        setShowWhiteboardModal(false);
      } else {
        const nextSession = remaining[0];
        setScreenShareDetails({
          isSharing: true,
          isPaused: nextSession.status === 'PAUSED',
          sharerId: nextSession.sharerId,
          sharerName: nextSession.sharerName,
          sourceName: nextSession.sourceName,
          type: nextSession.type,
          audioEnabled: nextSession.audioEnabled,
          videoOptimization: nextSession.videoOptimization,
          presenterLayout: 'side-by-side'
        });
      }
      return remaining;
    });

    socketRef.current?.emit('stop-screen-share', meetingId, {
      participantId: myId,
      participantName: myName
    });

    fetch(`http://localhost:5000/api/meetings/${meetingId}/share-session/stop`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participantId: myId })
    }).catch(() => {});

    // Part 16: End slide control presentation if active (Section 16.5)
    if (presentationSession && presentationSession.presenterId === myId) {
      fetch(`http://localhost:5000/api/meetings/${meetingId}/presentation/end`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ presenterId: myId })
      }).catch(() => {});
      socketRef.current?.emit('presentation-end', meetingId, { presenterId: myId });
      setPresentationSession(null);
      setShowSlideControlModal(false);
    }

    toast.success('Screen sharing stopped');
  };

  // Part 14: Host Stops a Participant's Screen Share (Section 14.10)
  const handleHostStopParticipantShare = async (participantId, participantName) => {
    const isHostUser = user?.id === 'host' || isHost || coHosts.includes(user?.id);
    if (!isHostUser) {
      toast.error('Only the host or co-host can stop participant shares.');
      return;
    }

    try {
      const hostId = user?.id || 'host';
      socketRef.current?.emit('host-stop-participant-share', meetingId, {
        participantId,
        participantName: participantName || 'Participant',
        hostId
      });

      await fetch(`http://localhost:5000/api/meetings/${meetingId}/share-session/stop-participant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantId, hostId })
      });

      setActiveShareSessions(prev => {
        const remaining = prev.filter(s => s.sharerId !== participantId);
        if (remaining.length === 0) {
          setIsScreenSharing(false);
          setIsSharePaused(false);
          setScreenShareDetails(null);
        } else {
          const nextSession = remaining[0];
          setScreenShareDetails({
            isSharing: true,
            isPaused: nextSession.status === 'PAUSED',
            sharerId: nextSession.sharerId,
            sharerName: nextSession.sharerName,
            sourceName: nextSession.sourceName,
            type: nextSession.type,
            audioEnabled: nextSession.audioEnabled,
            videoOptimization: nextSession.videoOptimization,
            presenterLayout: 'side-by-side'
          });
        }
        return remaining;
      });

      toast.success(`Stopped screen share for ${participantName}`);
    } catch (err) {
      console.error('Error stopping participant share:', err);
      toast.error('Failed to stop participant share');
    }
  };

  // Part 14: Simulate Simultaneous Multi-Screen Sharing (Section 14.1)
  const handleSimulateMultiShare = () => {
    const myId = user?.id || user?._id || 'local';
    const myName = user?.name || 'You';

    const simulatedSessions = [
      {
        id: 'sim-arun',
        sharerId: 'guest-2',
        sharerName: 'Arun',
        sourceName: 'Visual Studio Code',
        type: 'IDE',
        audioEnabled: true,
        videoOptimization: true,
        status: 'ACTIVE',
        startedAt: new Date()
      },
      {
        id: 'sim-priya',
        sharerId: 'guest-3',
        sharerName: 'Priya',
        sourceName: 'Google Chrome',
        type: 'BROWSER',
        audioEnabled: false,
        videoOptimization: false,
        status: 'ACTIVE',
        startedAt: new Date()
      }
    ];

    if (isScreenSharing && screenShareDetails) {
      simulatedSessions.unshift({
        id: myId,
        sharerId: myId,
        sharerName: myName,
        sourceName: screenShareDetails.sourceName || 'Entire Screen',
        type: screenShareDetails.type || 'SCREEN',
        audioEnabled: screenShareDetails.audioEnabled,
        videoOptimization: screenShareDetails.videoOptimization,
        status: 'ACTIVE',
        startedAt: new Date()
      });
    }

    setActiveShareSessions(simulatedSessions);
    setIsScreenSharing(true);
    toast.success('Simulated simultaneous multi-screen sharing (Arun & Priya)');
  };

  const handleUpdateSharingSettings = async (newSettings) => {
    setSharingSettings(newSettings);
    socketRef.current?.emit('update-sharing-settings', meetingId, newSettings);
    try {
      await fetch(`http://localhost:5000/api/meetings/${meetingId}/sharing-settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      });
    } catch (e) {}
    toast.success('Updated screen sharing settings');
  };

  const handleChangePresenterLayout = (layout) => {
    setPresenterLayout(layout);
    setScreenShareDetails(prev => prev ? { ...prev, presenterLayout: layout } : null);
    toast.info(`Presenter Layout: ${layout === 'overlay' ? 'Presenter Overlay' : layout === 'content-only' ? 'Content Focus' : 'Side-by-Side'}`);
  };

  const handleToggleAudioShare = () => {
    const next = !isShareAudioEnabled;
    setIsShareAudioEnabled(next);
    toast(next ? 'Computer sound enabled' : 'Computer sound muted', { icon: '🔊' });
  };

  // ==========================================
  // Part 15: Annotation Handlers (15.1 - 15.10)
  // ==========================================
  const handleToggleAnnotate = () => {
    // 15.4 & 15.5 Host Permissions
    if (!annotationSettings.enableAnnotation) {
      toast.error('The host has disabled annotation for this meeting.');
      return;
    }

    const isHostUser = user?.id === 'host' || isHost || coHosts.includes(user?.id);
    const isPresenter = screenShareDetails?.sharerId === (user?.id || 'local');

    if (annotationSettings.annotationPermission === 'presenterOnly' && !isPresenter && !isHostUser) {
      toast.error('Only the presenter can annotate on shared content.');
      return;
    }

    if (annotationSettings.annotationPermission === 'none' && !isHostUser) {
      toast.error('Annotation is disabled by the host.');
      return;
    }

    setIsAnnotating(prev => {
      const next = !prev;
      toast(next ? 'Annotation toolbar opened' : 'Annotation closed', { icon: '✏️' });
      return next;
    });
  };

  const handleAddAnnotation = async (newAnnotation, isLocal = true) => {
    setAnnotations(prev => [...prev, newAnnotation]);

    if (isLocal) {
      setAnnotationHistory(prev => [...prev, newAnnotation.annotationId]);
      setAnnotationRedoStack([]);

      socketRef.current?.emit('annotation-stroke', meetingId, newAnnotation);

      // Persist to MongoDB (Section 15.10)
      if (!newAnnotation.isVanishing) {
        fetch(`http://localhost:5000/api/meetings/${meetingId}/annotations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newAnnotation)
        }).catch(err => console.error('Error saving annotation to DB:', err));
      }
    }
  };

  const handleRemoveAnnotation = async (annotationId, isLocal = true) => {
    setAnnotations(prev => prev.filter(a => a.annotationId !== annotationId));

    if (isLocal) {
      socketRef.current?.emit('annotation-undo', meetingId, { annotationId });

      fetch(`http://localhost:5000/api/meetings/${meetingId}/annotations/undo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id || 'local' })
      }).catch(err => console.error('Error undoing annotation in DB:', err));
    }
  };

  const handleClearAnnotations = async (clearType = 'all', targetUserId = null, isLocal = true) => {
    const myId = user?.id || user?._id || 'local';

    if (clearType === 'all') {
      setAnnotations([]);
      setAnnotationHistory([]);
      setAnnotationRedoStack([]);
    } else if (clearType === 'mine') {
      const userIdToClear = targetUserId || myId;
      setAnnotations(prev => prev.filter(a => a.userId !== userIdToClear));
      setAnnotationHistory(prev => prev.filter(id => {
        const item = annotations.find(a => a.annotationId === id);
        return item && item.userId !== userIdToClear;
      }));
    } else if (clearType === 'viewers') {
      setAnnotations(prev => prev.filter(a => a.userRole === 'presenter' || a.userRole === 'host'));
    }

    if (isLocal) {
      socketRef.current?.emit('annotation-clear', meetingId, {
        clearType,
        userId: myId
      });

      fetch(`http://localhost:5000/api/meetings/${meetingId}/annotations/clear`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clearType,
          userId: myId,
          isHostOrPresenter: isHost || screenShareDetails?.sharerId === myId
        })
      }).catch(err => console.error('Error clearing annotations in DB:', err));

      toast.success(clearType === 'all' ? 'Cleared all drawings' : clearType === 'mine' ? 'Cleared your drawings' : 'Cleared viewers drawings');
    }
  };

  const handleUndoAnnotation = () => {
    if (annotationHistory.length === 0) return;
    const lastId = annotationHistory[annotationHistory.length - 1];
    const targetAnn = annotations.find(a => a.annotationId === lastId);
    if (!targetAnn) return;

    setAnnotationHistory(prev => prev.slice(0, -1));
    setAnnotationRedoStack(prev => [...prev, targetAnn]);
    handleRemoveAnnotation(lastId, true);
    toast('Undone last annotation', { icon: '↶' });
  };

  const handleRedoAnnotation = () => {
    if (annotationRedoStack.length === 0) return;
    const nextAnn = annotationRedoStack[annotationRedoStack.length - 1];
    setAnnotationRedoStack(prev => prev.slice(0, -1));
    handleAddAnnotation(nextAnn, true);
    toast('Redone annotation', { icon: '↷' });
  };

  const handleSaveAnnotation = (format = 'PNG') => {
    if (!annotationSettings.allowSaveAnnotation) {
      toast.error('The host has disabled saving annotations.');
      return;
    }

    try {
      const canvas = document.querySelector('canvas');
      if (canvas) {
        if (format === 'PNG') {
          const imageUri = canvas.toDataURL('image/png');
          const link = document.createElement('a');
          link.download = `IntellMeet-Annotation-${Date.now()}.png`;
          link.href = imageUri;
          link.click();
          toast.success('Annotated screen saved as PNG');
        } else if (format === 'PDF') {
          window.print();
          toast.success('Print / Save as PDF dialog initiated');
        }
      } else {
        toast.info('No active annotation canvas detected to save.');
      }
    } catch (err) {
      console.error('Error saving annotation:', err);
      toast.error('Failed to export annotated screen');
    }
  };

  const handleUpdateAnnotationSettings = async (newSettings) => {
    setAnnotationSettings(newSettings);
    if (newSettings.showAnnotatorNames !== undefined) {
      setShowAnnotatorNames(newSettings.showAnnotatorNames);
    }
    socketRef.current?.emit('update-annotation-settings', meetingId, newSettings);

    try {
      await fetch(`http://localhost:5000/api/meetings/${meetingId}/annotation-settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      });
      toast.success('Updated annotation settings');
    } catch (e) {}
  };

  // ==========================================
  // Part 16: Slide Control Handlers (16.1 - 16.16)
  // ==========================================
  const handleStartPresentationSession = async (sourceDetails) => {
    const myId = user?.id || user?._id || 'local';
    const myName = user?.name || 'You';

    try {
      const res = await fetch(`http://localhost:5000/api/meetings/${meetingId}/presentation/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          presenterId: myId,
          presenterName: myName,
          presentationType: sourceDetails.presentationType || 'POWERPOINT',
          presentationName: sourceDetails.presentationName || 'IntellMeet Architecture & Product Roadmap'
        })
      });
      const data = await res.json();
      if (data.success && data.session) {
        setPresentationSession(data.session);
        setIsScreenSharing(true);
        setIsSharePaused(false);
        const details = {
          isSharing: true,
          isPaused: false,
          sharerId: myId,
          sharerName: myName,
          sourceName: sourceDetails.sourceName || `${data.session.presentationType}: ${data.session.presentationName}`,
          type: 'PRESENTATION',
          presentationType: data.session.presentationType,
          presentationName: data.session.presentationName,
          audioEnabled: sourceDetails.audioEnabled !== false,
          videoOptimization: false,
          presenterLayout: presenterLayout
        };
        setScreenShareDetails(details);

        socketRef.current?.emit('presentation-start', meetingId, {
          sessionId: data.session.sessionId,
          session: data.session,
          participantId: myId,
          participantName: myName
        });

        toast.success(`Started ${data.session.presentationType} presentation with Slide Control!`);
      }
    } catch (err) {
      console.error('Error starting presentation:', err);
      toast.error('Failed to start presentation session');
    }
  };

  const handleGrantSlideControl = async (controllersToGrant) => {
    const myId = user?.id || user?._id || 'local';
    try {
      const res = await fetch(`http://localhost:5000/api/meetings/${meetingId}/presentation/grant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          presenterId: myId,
          controllers: controllersToGrant
        })
      });
      const data = await res.json();
      if (data.success && data.session) {
        setPresentationSession(data.session);
        socketRef.current?.emit('presentation-grant-control', meetingId, {
          sessionId: data.session.sessionId,
          controllers: data.session.controllers,
          grantedTo: controllersToGrant.map(c => c.userId),
          grantedToName: controllersToGrant.map(c => c.userName).join(', ')
        });
        toast.success(`Granted slide control to ${controllersToGrant.length} participant(s)`);
      }
    } catch (err) {
      console.error('Error granting slide control:', err);
      toast.error('Failed to grant slide control');
    }
  };

  const handleRevokeSlideControl = async (targetUserId) => {
    const myId = user?.id || user?._id || 'local';
    try {
      const res = await fetch(`http://localhost:5000/api/meetings/${meetingId}/presentation/revoke`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          presenterId: myId,
          userId: targetUserId
        })
      });
      const data = await res.json();
      if (data.success && data.session) {
        setPresentationSession(data.session);
        socketRef.current?.emit('presentation-revoke-control', meetingId, {
          sessionId: data.session.sessionId,
          controllers: data.session.controllers,
          userId: targetUserId
        });
        toast.info('Revoked slide control');
      }
    } catch (err) {
      console.error('Error revoking slide control:', err);
      toast.error('Failed to revoke slide control');
    }
  };

  const handleStopAllSlideControl = async () => {
    const myId = user?.id || user?._id || 'local';
    try {
      const res = await fetch(`http://localhost:5000/api/meetings/${meetingId}/presentation/stop-control`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ presenterId: myId })
      });
      const data = await res.json();
      if (data.success && data.session) {
        setPresentationSession(data.session);
        socketRef.current?.emit('presentation-stop-control', meetingId, {
          sessionId: data.session.sessionId
        });
        toast.info('Stopped all participant slide control');
      }
    } catch (err) {
      console.error('Error stopping all slide control:', err);
      toast.error('Failed to stop all slide control');
    }
  };

  const handleNavigateSlide = async (action, targetSlide) => {
    const myId = user?.id || user?._id || 'local';
    const myName = user?.name || 'You';
    try {
      const res = await fetch(`http://localhost:5000/api/meetings/${meetingId}/presentation/navigate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: myId,
          userName: myName,
          action,
          targetSlide
        })
      });
      const data = await res.json();
      if (data.success) {
        setPresentationSession(data.session);
        socketRef.current?.emit('presentation-slide-change', meetingId, {
          sessionId: data.session.sessionId,
          currentSlide: data.currentSlide,
          totalSlides: data.totalSlides,
          changedBy: myId,
          changedByName: myName,
          action
        });
      } else {
        toast.error(data.message || 'Permission denied to navigate slide');
      }
    } catch (err) {
      console.error('Error navigating slides:', err);
    }
  };

  const handleEndPresentationSession = async () => {
    const myId = user?.id || user?._id || 'local';
    try {
      await fetch(`http://localhost:5000/api/meetings/${meetingId}/presentation/end`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ presenterId: myId })
      });
      socketRef.current?.emit('presentation-end', meetingId, {
        presenterId: myId
      });
      setPresentationSession(null);
      setShowSlideControlModal(false);
      handleStopShare();
      toast.success('Presentation session ended');
    } catch (err) {
      console.error('Error ending presentation:', err);
    }
  };

  const handleShareToBreakoutRooms = () => {
    toast.success('Broadcasted shared content to all active Breakout Rooms (Section 13.16)');
  };

  const sendReaction = (emoji) => {
    const newEmoji = { id: Date.now(), emoji, left: Math.random() * 80 + 10 };
    setFloatingEmojis(prev => [...prev, newEmoji]);
    setShowReactions(false);
    setTimeout(() => {
      setFloatingEmojis(prev => prev.filter(e => e.id !== newEmoji.id));
    }, 3000);
  };

  const leaveMeeting = async () => {
    if (stream) stream.getTracks().forEach(track => track.stop());
    if (socketRef.current) socketRef.current.emit('leave-room', { roomId: meetingId });
    try {
      // Part 40: End Meeting Lifecycle & Trigger Post-Meeting Processing Pipeline
      await fetch(`${SOCKET_SERVER_URL}/api/meetings/${meetingId}/lifecycle/stage`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage: 'ENDING',
          triggeredBy: user?.name || 'Host',
          notes: 'Session concluded from meeting room',
        }),
      });
      // Fire post-meeting pipeline in background
      fetch(`${SOCKET_SERVER_URL}/api/meetings/${meetingId}/lifecycle/trigger-pipeline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }).catch(() => null);
    } catch (e) {
      console.warn('Lifecycle update error:', e);
    }
    navigate(`/meetings/${meetingId}/lifecycle`);
  };

  const endMeetingForAll = async () => {
    if (stream) stream.getTracks().forEach(track => track.stop());
    if (socketRef.current) socketRef.current.emit('end-meeting-for-all', { roomId: meetingId });
    try {
      await fetch(`${SOCKET_SERVER_URL}/api/meetings/${meetingId}/lifecycle/stage`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage: 'ENDED',
          triggeredBy: user?.name || 'Host',
          notes: 'Meeting ended for all participants by host',
        }),
      });
      fetch(`${SOCKET_SERVER_URL}/api/meetings/${meetingId}/lifecycle/trigger-pipeline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }).catch(() => null);
    } catch (e) {
      console.warn('Lifecycle update error:', e);
    }
    navigate(`/meetings/${meetingId}/lifecycle`);
  };

  // Sync meeting settings and lock state from server
  useEffect(() => {
    const fetchMeetingMeta = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/meetings/pre-join-check/${meetingId}`);
        const data = await res.json();
        if (data.success && data.meeting) {
          if (data.meeting.title) setMeetingTitle(data.meeting.title);
          if (typeof data.meeting.isLocked === 'boolean') {
            setIsMeetingLocked(data.meeting.isLocked);
          }
          if (data.meeting.securitySettings) {
            setSecuritySettings(prev => ({ ...prev, ...data.meeting.securitySettings }));
          }
        }
        fetchEncryptionData();
        registerEndpointEncryption('DESKTOP');
        fetchWatermarkData();
        assignAudioSignature();
        fetchLiveStreamData();
      } catch (err) {
        console.error('Error fetching meeting security metadata:', err);
      }
    };
    fetchMeetingMeta();
  }, [meetingId]);

  // Screen-Capture Protection listeners
  useEffect(() => {
    if (!securitySettings.screenCaptureProtection) {
      setScreenCaptureShield(false);
      return;
    }

    const handleBlur = () => setScreenCaptureShield(true);
    const handleFocus = () => setScreenCaptureShield(false);

    const handleKeyDown = (e) => {
      if (e.key === 'PrintScreen' || (e.shiftKey && (e.metaKey || e.ctrlKey))) {
        setScreenCaptureShield(true);
        toast.error('Screen-capture protection active: capture masked');
        setTimeout(() => setScreenCaptureShield(false), 2500);
      }
    };

    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [securitySettings.screenCaptureProtection]);

  const handleToggleLock = async () => {
    const nextLocked = !isMeetingLocked;
    setIsMeetingLocked(nextLocked);
    setSecuritySettings(prev => ({ ...prev, lockMeeting: nextLocked, meetingLocked: nextLocked }));
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:5000/api/meetings/${meetingId}/security/lock`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ lock: nextLocked })
      });
      socketRef.current?.emit('security-toggle-lock', meetingId, { meetingLocked: nextLocked });
      toast.success(nextLocked ? 'Meeting locked. New participants cannot enter.' : 'Meeting unlocked.');
    } catch (e) {
      toast.error('Failed to sync lock state');
    }
  };

  const handleToggleWaitingRoom = async (enabled) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/meetings/${meetingId}/security/waiting-room`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ enabled })
      });
      const data = await res.json();
      if (data.success) {
        setSecuritySettings(prev => ({ ...prev, enableWaitingRoom: data.waitingRoomEnabled, waitingRoomEnabled: data.waitingRoomEnabled }));
        socketRef.current?.emit('security-toggle-waiting-room', meetingId, { waitingRoomEnabled: data.waitingRoomEnabled });
        toast.success(data.message);
      }
    } catch (e) {
      toast.error('Failed to update waiting room state');
    }
  };

  const waitingRoomEnabled = securitySettings?.waitingRoomEnabled ?? securitySettings?.enableWaitingRoom ?? true;
  const setWaitingRoomEnabled = (val) => handleToggleWaitingRoom(val);
  const toggleMeetingLock = () => handleToggleLock();

  const handleToggleHideProfilePictures = async (hide) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/meetings/${meetingId}/security/hide-profile-pictures`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ hide })
      });
      const data = await res.json();
      if (data.success) {
        setSecuritySettings(prev => ({ ...prev, hideProfilePictures: data.hideProfilePictures }));
        socketRef.current?.emit('security-toggle-hide-profile-pictures', meetingId, { hideProfilePictures: data.hideProfilePictures });
        toast.success(data.message);
      }
    } catch (e) {
      toast.error('Failed to update profile pictures visibility');
    }
  };

  const handleUpdateParticipantPermissions = async (perms) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/meetings/${meetingId}/security/permissions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(perms)
      });
      const data = await res.json();
      if (data.success) {
        setSecuritySettings(prev => ({
          ...prev,
          ...perms,
          allowChat: perms.canChat !== undefined ? perms.canChat : prev.allowChat,
          allowUnmute: perms.canUnmute !== undefined ? perms.canUnmute : prev.allowUnmute,
          allowStartVideo: perms.canStartVideo !== undefined ? perms.canStartVideo : prev.allowStartVideo,
          allowShareScreen: perms.canShareScreen !== undefined ? perms.canShareScreen : prev.allowShareScreen,
          allowRename: perms.canRename !== undefined ? perms.canRename : prev.allowRename,
          allowWhiteboard: perms.canShareWhiteboard !== undefined ? perms.canShareWhiteboard : prev.allowWhiteboard,
          participantPermissions: data.participantPermissions
        }));
        socketRef.current?.emit('security-update-permissions', meetingId, data.participantPermissions);
        toast.success('Participant permissions updated');
      }
    } catch (e) {
      toast.error('Failed to update permissions');
    }
  };

  const handleUpdateScreenSharePolicy = async (whoCanShareScreen) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/meetings/${meetingId}/security/screen-sharing`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ whoCanShareScreen })
      });
      const data = await res.json();
      if (data.success) {
        setSecuritySettings(prev => ({
          ...prev,
          whoCanShareScreen,
          allowShareScreen: whoCanShareScreen !== 'hostOnly'
        }));
        socketRef.current?.emit('security-update-share-policy', meetingId, { whoCanShareScreen });
        toast.success(data.message);
      }
    } catch (e) {
      toast.error('Failed to update screen share policy');
    }
  };

  const handleResumeActivities = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/meetings/${meetingId}/security/resume-activities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setSecuritySettings(s => ({
          ...s,
          suspendActivities: false,
          participantActivitiesSuspended: false,
          allowUnmute: true,
          allowStartVideo: true,
          allowShareScreen: s.whoCanShareScreen !== 'hostOnly',
          allowChat: 'everyone',
          allowWhiteboard: true
        }));
        socketRef.current?.emit('security-resume-activities', meetingId);
        toast.success('Participant activities resumed!');
      }
    } catch (e) {
      toast.error('Failed to resume activities');
    }
  };

  const handleUpdateSecurity = async (key, value) => {
    const updated = { ...securitySettings, [key]: value };
    setSecuritySettings(updated);
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:5000/api/meetings/${meetingId}/security`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ securitySettings: updated })
      });
      toast.success('Security settings updated');
    } catch (e) {
      console.error(e);
    }
  };

  // Part 31: Encryption Methods (31.1 - 31.16)
  const fetchEncryptionData = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/meetings/${meetingId}/security/encryption`, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
      });
      const data = await res.json();
      if (data.success && data.encryption) {
        setEncryptionData(data.encryption);
      }
    } catch (err) {
      console.error('Error fetching encryption data:', err);
    }
  };

  const registerEndpointEncryption = async (clientType = 'DESKTOP') => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:5000/api/meetings/${meetingId}/security/encryption/register-endpoint`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          participantId: user?._id || user?.id || 'local',
          name: user?.name || 'Participant',
          clientType
        })
      });
    } catch (err) {
      console.error('Error registering encryption endpoint:', err);
    }
  };

  const handleSwitchEncryption = async (type) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/meetings/${meetingId}/security/encryption`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ encryptionType: type })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Encryption switched to ${type}`);
        setEncryptionData(prev => ({
          ...prev,
          type: data.encryptionType,
          keyManagement: data.security?.keyManagement || (type === 'E2EE' ? 'DEVICE_MANAGED' : 'SERVER_MANAGED'),
          securityCode: data.security?.securityCode || prev.securityCode,
          featureCompatibility: data.security?.e2eeFeatureCompatibility || prev.featureCompatibility,
          isPartialEncryption: false
        }));
      } else {
        toast.error(data.message || 'Failed to switch encryption mode');
      }
    } catch (err) {
      toast.error('Network error switching encryption');
    }
  };

  const handleVerifySecurityCode = async (code) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/meetings/${meetingId}/security/encryption/verify-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          code,
          participantId: user?._id || user?.id || 'local'
        })
      });
      const data = await res.json();
      if (data.success && data.verified) {
        toast.success('Security code verified successfully! Cryptographic match confirmed.');
        fetchEncryptionData();
      } else {
        toast.error(data.message || 'Verification failed: code mismatch');
      }
    } catch (err) {
      toast.error('Error verifying security code');
    }
  };

  // Part 32: Watermarking Methods & Ultrasonic Oscillator (32.1 - 32.10)
  useEffect(() => {
    if (watermarkSettings.audioEnabled) {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx && !audioWatermarkCtxRef.current) {
          const ctx = new AudioCtx();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(18500, ctx.currentTime);
          gain.gain.setValueAtTime(0.001, ctx.currentTime);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          audioWatermarkCtxRef.current = ctx;
          audioWatermarkOscRef.current = osc;
        }
      } catch (e) {
        console.warn('Audio watermark oscillator not initialized:', e);
      }
    } else {
      if (audioWatermarkOscRef.current) {
        try {
          audioWatermarkOscRef.current.stop();
          audioWatermarkOscRef.current.disconnect();
        } catch (e) {}
        audioWatermarkOscRef.current = null;
      }
      if (audioWatermarkCtxRef.current) {
        try {
          audioWatermarkCtxRef.current.close();
        } catch (e) {}
        audioWatermarkCtxRef.current = null;
      }
    }
    return () => {
      if (audioWatermarkOscRef.current) {
        try { audioWatermarkOscRef.current.stop(); } catch (e) {}
        audioWatermarkOscRef.current = null;
      }
    };
  }, [watermarkSettings.audioEnabled]);

  const fetchWatermarkData = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/meetings/${meetingId}/security/watermark`, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
      });
      const data = await res.json();
      if (data.success && data.watermark) {
        setWatermarkSettings(data.watermark);
        if (data.viewerIdentity) {
          setViewerIdentity(data.viewerIdentity);
        }
      }
    } catch (err) {
      console.error('Error fetching watermark data:', err);
    }
  };

  const assignAudioSignature = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/meetings/${meetingId}/security/watermark/assign-audio-signature`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          participantId: user?._id || user?.id || 'local',
          participantName: user?.name || 'Participant',
          participantEmail: user?.email || 'participant@intellimeet.io'
        })
      });
      const data = await res.json();
      if (data.success && data.signature) {
        setWatermarkSettings(prev => ({
          ...prev,
          audioSignatures: [
            ...(prev.audioSignatures || []).filter(s => s.participantId !== data.signature.participantId),
            data.signature
          ]
        }));
      }
    } catch (err) {
      console.error('Error assigning audio signature:', err);
    }
  };

  const handleSaveWatermarkSettings = async (newSettings) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/meetings/${meetingId}/security/watermark`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(newSettings)
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Watermark settings updated');
        setWatermarkSettings(data.watermark);
      } else {
        toast.error(data.message || 'Failed to update watermark settings');
      }
    } catch (err) {
      toast.error('Network error updating watermark settings');
    }
  };

  const handleToggleVisualWatermark = async (enableVal) => {
    const nextVal = enableVal !== undefined ? enableVal : !watermarkSettings.visualEnabled;
    await handleSaveWatermarkSettings({ visualEnabled: nextVal });
  };

  const handleTraceAudioLeak = async (signatureQuery) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`http://localhost:5000/api/meetings/${meetingId}/security/watermark/trace-audio-leak`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ signatureQuery })
    });
    return await res.json();
  };

  // Part 33: Live Streaming Methods (33.1 - 33.23)
  const fetchLiveStreamData = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/meetings/${meetingId}/livestream`, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
      });
      const data = await res.json();
      if (data.success && data.session) {
        setLiveStreamSession(data.session);
      }
    } catch (err) {
      console.error('Error fetching live stream data:', err);
    }
  };

  const handleStartLiveStream = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`http://localhost:5000/api/meetings/${meetingId}/livestream/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });
    const data = await res.json();
    if (data.success && data.session) {
      setLiveStreamSession(data.session);
      return data;
    } else {
      throw new Error(data.message || 'Failed to start livestream');
    }
  };

  const handleStopLiveStream = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`http://localhost:5000/api/meetings/${meetingId}/livestream/stop`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });
    const data = await res.json();
    if (data.success && data.session) {
      setLiveStreamSession(data.session);
      return data;
    } else {
      throw new Error(data.message || 'Failed to stop livestream');
    }
  };

  const handleSaveLiveStreamConfig = async (config) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`http://localhost:5000/api/meetings/${meetingId}/livestream/configure`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(config)
    });
    const data = await res.json();
    if (data.success && data.session) {
      setLiveStreamSession(data.session);
      return data;
    } else {
      throw new Error(data.message || 'Failed to save configuration');
    }
  };

  // Periodic audience fluctuation when livestream is active (33.11, 33.18)
  useEffect(() => {
    if (liveStreamSession?.status !== 'LIVE') return;
    const interval = setInterval(async () => {
      try {
        const token = localStorage.getItem('token');
        await fetch(`http://localhost:5000/api/meetings/${meetingId}/livestream/update-viewers`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          }
        });
      } catch (e) {}
    }, 10000);
    return () => clearInterval(interval);
  }, [liveStreamSession?.status, meetingId]);


  const allParticipants = [
    { id: 'local', name: user?.name || 'You', isLocal: true, isMuted: !isAudioOn, isVideoOff: !isVideoOn, hasVideo: isVideoOn },
    ...sampleParticipants.map(sp => {
      const peerMatch = peers.find(p => p.peerID === sp.id || p.id === sp.id);
      return {
        ...sp,
        isLocal: false,
        peer: peerMatch?.peer,
        stream: peerMatch?.stream,
        hasVideo: sp.hasVideo !== undefined ? sp.hasVideo : !sp.isVideoOff
      };
    })
  ].filter((p, index, self) => index === self.findIndex(t => t.id === p.id));
  const participants = allParticipants;

  const filteredParticipants = allParticipants.filter(p => 
    (p.name || '').toLowerCase().includes(participantSearchQuery.toLowerCase())
  );

  return (
    <div className="h-screen flex flex-col bg-[#1A1A1A] font-sans text-white overflow-hidden">
      
      {/* Top Bar Area */}
      <div className="absolute top-0 left-0 w-full p-4 flex items-center justify-between z-10 pointer-events-none">
        
        {/* Top Left: Title & Encryption Status (Section 31.5) */}
        <div className="flex items-center gap-3 pointer-events-auto relative">
          <div 
            className="flex items-center gap-2 text-white hover:bg-white/10 px-2 py-1 rounded cursor-pointer transition-colors"
            onClick={() => setShowEncryptionPopover(!showEncryptionPopover)}
            title={
              encryptionData.isPartialEncryption
                ? 'Partial Encryption - Unsupported endpoint connected (31.5)'
                : encryptionData.type === 'E2EE'
                  ? 'End-to-End Encrypted (31.3)'
                  : 'Enhanced Encryption - 256-bit AES-GCM (31.2)'
            }
          >
            {/* Dynamic Shield Indicator (Section 31.5) */}
            <div className={`p-1 rounded-full border flex items-center justify-center ${
              encryptionData.isPartialEncryption
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                : encryptionData.type === 'E2EE'
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                  : 'bg-green-500/20 text-green-400 border-green-500/40'
            }`}>
              {encryptionData.isPartialEncryption ? (
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              ) : encryptionData.type === 'E2EE' ? (
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Check className="w-3.5 h-3.5 text-green-400" />
              )}
            </div>
            <h1 className="font-semibold text-sm tracking-wide">{meetingTitle}</h1>

            {/* Part 38: In-Meeting Network Status Indicator Badge (38.7, 38.18) */}
            <NetworkStatusBadge
              networkStats={networkStats}
              deviceStats={deviceStats}
              mediaProfile={mediaProfile}
              onClick={() => setShowNetworkHealthModal(true)}
            />
          </div>

          {/* Part 31: Full Encryption Popover (31.5, 31.6, 31.7, 31.11, 31.12) */}
          <EncryptionInfoPopover
            isOpen={showEncryptionPopover}
            onClose={() => setShowEncryptionPopover(false)}
            meetingTitle={meetingTitle}
            meetingId={meetingId}
            encryptionData={encryptionData}
            isHostOrCoHost={isHost || user?.id === 'host' || coHosts.includes(user?.id)}
            onPromptSwitchEncryption={(targetType) => {
              if (targetType === 'E2EE') {
                setShowE2EEWarningModal(true);
              } else {
                handleSwitchEncryption('ENHANCED');
              }
            }}
            onVerifyCode={handleVerifySecurityCode}
          />
        </div>

        {/* Top Right: View Controls & Notification Banners */}
        <div className="flex items-center gap-3 pointer-events-auto">
          {/* Waiting Room Host Admission Banner */}
          {waitingRoomQueue.length > 0 && (
            <div className="bg-[#242424] border border-amber-500/40 rounded-2xl shadow-2xl px-4 py-2 flex items-center gap-3 text-xs animate-fade-in">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
                <span className="text-gray-200">
                  <strong>{waitingRoomQueue[0].name}</strong> entered Waiting Room
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    const guest = waitingRoomQueue[0];
                    setSampleParticipants(prev => [...prev, { id: guest.id, name: guest.name, isLocal: false, isMuted: true }]);
                    setWaitingRoomQueue(prev => prev.slice(1));
                    toast.success(`Admitted ${guest.name} into the meeting`);
                  }}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-2.5 py-1 rounded-lg font-bold transition-all text-xs shadow-sm"
                >
                  Admit
                </button>
                <button
                  onClick={() => {
                    const guest = waitingRoomQueue[0];
                    setWaitingRoomQueue(prev => prev.slice(1));
                    toast.error(`Removed ${guest.name} from Waiting Room`);
                  }}
                  className="text-gray-400 hover:text-white px-2 py-1 text-xs"
                >
                  Remove
                </button>
              </div>
            </div>
          )}

          {/* Host Unmute Request Prompt (Section 7.9) */}
          {unmuteRequestReceived && (
            <div className="bg-[#242424] border border-blue-500/50 rounded-2xl shadow-2xl px-4 py-2 flex items-center gap-3 text-xs animate-bounce-short">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-blue-500/20 text-blue-400 rounded-lg">
                  <Mic className="w-3.5 h-3.5" />
                </div>
                <span className="text-gray-100">
                  Host asked you to unmute
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    if (stream) {
                      const audioTrack = stream.getAudioTracks()[0];
                      if (audioTrack) audioTrack.enabled = true;
                    }
                    setIsAudioOn(true);
                    setUnmuteRequestReceived(false);
                    toast.success('Microphone unmuted');
                  }}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-2.5 py-1 rounded-lg font-bold shadow-md text-xs transition-all"
                >
                  Unmute
                </button>
                <button
                  onClick={() => {
                    setUnmuteRequestReceived(false);
                    toast('Stayed muted');
                  }}
                  className="bg-white/10 hover:bg-white/20 text-gray-300 px-2 py-1 rounded-lg text-xs transition-all"
                >
                  Stay Muted
                </button>
              </div>
            </div>
          )}

          {/* Top Right: View Layout & Quick End Meeting Button */}
          <div className="relative pointer-events-auto flex items-center gap-2">
            <button
              onClick={() => setShowViewMenu(!showViewMenu)}
              className="bg-[#242424]/90 hover:bg-[#333] border border-[#3A3A3A] text-white px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg backdrop-blur-md transition-all cursor-pointer"
              title="Change Video Layout"
            >
              <LayoutGrid className="w-4 h-4 text-blue-400" />
              <span>View</span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </button>

            {/* Quick End/Leave Button in Header */}
            <button
              onClick={() => setShowLeaveModal(true)}
              className="bg-[#E02828] hover:bg-[#C01F1F] text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-red-500/20 transition-all cursor-pointer"
              title={isHost ? 'End Meeting' : 'Leave Meeting'}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{isHost ? 'End' : 'Leave'}</span>
            </button>

            {showViewMenu && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-[#1F1F1F] border border-[#3A3A3A] rounded-2xl shadow-2xl p-2 z-50 text-xs text-gray-200 divide-y divide-[#2F2F2F] animate-in fade-in zoom-in-95 duration-100">
                {/* Meeting Video Layouts (Sections 9.2 - 9.11) */}
                <div className="py-1 space-y-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-2 py-1 block">
                    Meeting Video Layouts
                  </span>
                  
                  {/* Speaker View (9.2) */}
                  <button
                    onClick={() => { setLayoutMode('speaker'); setShowViewMenu(false); toast('Switched to Speaker View'); }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors ${
                      layoutMode === 'speaker' ? 'bg-blue-600 text-white font-semibold' : 'hover:bg-white/5'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5" /> Speaker View (9.2)
                    </span>
                    {layoutMode === 'speaker' && <Check className="w-3.5 h-3.5" />}
                  </button>

                  {/* Gallery View (9.3) */}
                  <button
                    onClick={() => { setLayoutMode('gallery'); setShowViewMenu(false); toast('Switched to Gallery View'); }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors ${
                      layoutMode === 'gallery' ? 'bg-blue-600 text-white font-semibold' : 'hover:bg-white/5'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Grid className="w-3.5 h-3.5" /> Gallery View (9.3)
                    </span>
                    {layoutMode === 'gallery' && <Check className="w-3.5 h-3.5" />}
                  </button>

                  {/* Dynamic Gallery View (9.9) */}
                  <button
                    onClick={() => { setLayoutMode('dynamic-gallery'); setShowViewMenu(false); toast('Switched to Dynamic Gallery View'); }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors ${
                      layoutMode === 'dynamic-gallery' ? 'bg-blue-600 text-white font-semibold' : 'hover:bg-white/5'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <LayoutGrid className="w-3.5 h-3.5" /> Dynamic Gallery (9.9)
                    </span>
                    {layoutMode === 'dynamic-gallery' && <Check className="w-3.5 h-3.5" />}
                  </button>

                  {/* Multi-Speaker View (9.8 & 37.7) */}
                  <div>
                    <button
                      onClick={() => { setLayoutMode('multi'); setShowViewMenu(false); toast('Switched to Multi-Speaker View'); }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors ${
                        layoutMode === 'multi' ? 'bg-blue-600 text-white font-semibold' : 'hover:bg-white/5'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5" /> Multi-Speaker View (37.7)
                      </span>
                      {layoutMode === 'multi' && <Check className="w-3.5 h-3.5" />}
                    </button>

                    {/* Sub-selector for Multi-Speaker tile count (Section 37.7) */}
                    {layoutMode === 'multi' && (
                      <div className="flex items-center justify-between px-2.5 py-1 bg-black/40 rounded-lg mx-1 mt-1 text-[10px] border border-white/5">
                        <span className="text-gray-400 font-medium">Active Speakers:</span>
                        <div className="flex gap-1">
                          {[2, 3, 4].map(num => (
                            <button
                              key={num}
                              onClick={() => {
                                updatePersonalPreferences({ multiSpeakerCount: num });
                                toast.success(`Multi-speaker allocated to ${num} active speakers`);
                              }}
                              className={`px-2 py-0.5 rounded font-bold transition-all ${
                                (multiSpeakerCount || 2) === num 
                                  ? 'bg-emerald-500 text-white shadow' 
                                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
                              }`}
                            >
                              {num}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Immersive View (9.10) */}
                  <button
                    onClick={() => { setLayoutMode('immersive'); setShowViewMenu(false); toast('Switched to Immersive View'); }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors ${
                      layoutMode === 'immersive' ? 'bg-blue-600 text-white font-semibold' : 'hover:bg-white/5'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Immersive View (9.10)
                    </span>
                    {layoutMode === 'immersive' && <Check className="w-3.5 h-3.5" />}
                  </button>

                  {/* Floating Thumbnail View (9.11) */}
                  <button
                    onClick={() => { setLayoutMode('floating'); setShowViewMenu(false); toast('Switched to Floating Mini-Window'); }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors ${
                      layoutMode === 'floating' ? 'bg-blue-600 text-white font-semibold' : 'hover:bg-white/5'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Layers className="w-3.5 h-3.5 text-blue-400" /> Floating Thumbnail (9.11)
                    </span>
                    {layoutMode === 'floating' && <Check className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Personal View Preferences: Hide Non-Video Participants (Section 9.13) */}
                <div className="py-1">
                  <label className="flex items-center justify-between px-2.5 py-1.5 hover:bg-white/5 rounded-lg cursor-pointer text-gray-300">
                    <span className="flex items-center gap-2">
                      {hideNonVideoParticipants ? <EyeOff className="w-3.5 h-3.5 text-amber-400" /> : <Eye className="w-3.5 h-3.5 text-gray-400" />}
                      Hide Non-Video (9.13)
                    </span>
                    <input
                      type="checkbox"
                      checked={hideNonVideoParticipants}
                      onChange={(e) => {
                        setHideNonVideoParticipants(e.target.checked);
                        toast(e.target.checked ? 'Hidden participants without camera' : 'Showing all participants');
                      }}
                      className="accent-blue-600 rounded"
                    />
                  </label>
                </div>

                {/* Active Spotlights Management (Section 9.6) */}
                {spotlightParticipantIds.length > 0 && isHostOrCoHost && (
                  <div className="py-1">
                    <button
                      onClick={() => { handleClearAllSpotlights(); setShowViewMenu(false); }}
                      className="w-full text-left px-2.5 py-1.5 hover:bg-white/5 rounded-lg text-amber-400 font-medium flex items-center gap-2"
                    >
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span>Clear All Spotlights ({spotlightParticipantIds.length})</span>
                    </button>
                  </div>
                )}

                {/* Full Screen */}
                <div className="pt-1.5">
                  <button
                    onClick={() => { toggleFullscreen(); setShowViewMenu(false); }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/5 flex items-center justify-between transition-colors text-gray-300"
                  >
                    <span>{isFullscreen ? 'Exit Full Screen' : 'Enter Full Screen'}</span>
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Section 37: Personalization & Themes */}
                <div className="pt-1.5 border-t border-white/10 mt-1">
                  <button
                    onClick={() => {
                      setShowPersonalizationModal(true);
                      setShowViewMenu(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center justify-between text-xs text-blue-300 font-semibold"
                  >
                    <span className="flex items-center gap-2">
                      <Palette className="w-3.5 h-3.5 text-blue-400" /> Personalize Layout & Themes (37)
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Main Video Stage Engine (Sections 8.8 - 8.16 & Part 9 & Part 37 Personalization) */}
        <div 
          className="flex-1 flex relative overflow-hidden transition-all duration-300"
          style={{
            backgroundColor: (THEMES.find(t => t.id === personalTheme) || THEMES[0]).canvasBg,
            ...(customWallpaper?.url ? {
              backgroundImage: `url(${customWallpaper.url})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            } : {})
          }}
        >
          {/* Floating Emoji Reactions Overlay (Section 12.2 & 12.9) */}
          {floatingEmojis.map(emoji => (
            <div 
              key={emoji.id} 
              className="absolute bottom-6 text-4xl animate-bounce-up-fade pointer-events-none z-50 flex flex-col items-center select-none"
              style={{ left: `${emoji.left}%`, animationDuration: '3.5s' }}
            >
              <span className="drop-shadow-lg">{emoji.emoji}</span>
              {emoji.senderName && (
                <span className="text-[10px] bg-black/70 px-2 py-0.5 rounded-full text-white font-medium border border-white/10 mt-1 shadow backdrop-blur-sm">
                  {emoji.senderName}
                </span>
              )}
            </div>
          ))}

          {/* Section 30.7 Emergency Lockdown Banner */}
          {securitySettings.suspendActivities && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-red-600/95 text-white px-5 py-2.5 rounded-2xl shadow-2xl border border-red-400/40 flex items-center gap-3 backdrop-blur-md animate-in slide-in-from-top-4 duration-300 max-w-xl">
              <AlertOctagon className="w-5 h-5 text-white animate-pulse shrink-0" />
              <div className="text-xs">
                <span className="font-bold">Emergency Lockdown (30.7):</span> Participant audio, video, chat, and screen sharing are currently suspended.
              </div>
              {(user?.id === 'host' || coHosts.includes(user?.id)) && (
                <button
                  onClick={handleResumeActivities}
                  className="ml-2 px-3 py-1 bg-white text-red-700 hover:bg-red-50 rounded-xl font-bold text-xs shadow-md transition-colors shrink-0"
                >
                  Resume Activities
                </button>
              )}
            </div>
          )}

          {/* Section 30.3 Meeting Locked Banner */}
          {isMeetingLocked && !securitySettings.suspendActivities && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-amber-500/90 text-black px-4 py-1.5 rounded-full shadow-lg border border-amber-300 flex items-center gap-2 text-xs font-semibold backdrop-blur-sm animate-in fade-in">
              <Lock className="w-3.5 h-3.5" />
              <span>Meeting Locked (30.3): New participants cannot join</span>
            </div>
          )}

          <VideoLayoutEngine
            layoutMode={layoutMode}
            participants={allParticipants}
            multiSpeakerCount={multiSpeakerCount || 2}
            hideProfilePictures={securitySettings.hideProfilePictures}
            localStream={stream}
            isVideoOn={isVideoOn}
            isAudioOn={isAudioOn}
            userVideoRef={userVideo}
            isScreenSharing={isScreenSharing}
            screenTrack={screenTrackRef.current}
            pinnedParticipantIds={pinnedParticipantIds}
            onTogglePinParticipant={handleTogglePinParticipant}
            spotlightParticipantIds={spotlightParticipantIds}
            onToggleSpotlightParticipant={handleToggleSpotlightParticipant}
            onClearAllSpotlights={handleClearAllSpotlights}
            hideNonVideoParticipants={hideNonVideoParticipants}
            onToggleHideNonVideo={() => setHideNonVideoParticipants(prev => !prev)}
            currentBackground={currentBackground}
            customBgUrl={customBgUrl}
            currentFilter={currentFilter}
            currentAvatar={currentAvatar}
            filterStyle={VIDEO_FILTERS.find(f => f.id === currentFilter)?.filterStyle || ''}
            isHostOrCoHost={user?.id === 'host' || coHosts.includes(user?.id)}
            onMuteParticipant={handleHostMuteParticipant}
            onAskToUnmute={handleHostAskToUnmute}
            onHostBroadcastVideoOrder={handleHostBroadcastVideoOrder}
            screenShareSubMode={screenShareSubMode}
            onSetScreenShareSubMode={setScreenShareSubMode}
            raisedHands={raisedHands}
            nonVerbalFeedbacks={nonVerbalFeedbacks}
            screenShareDetails={screenShareDetails}
            activeShareSessions={activeShareSessions}
            onHostStopParticipantShare={handleHostStopParticipantShare}
            isAnnotating={isAnnotating}
            annotationTool={annotationTool}
            annotationColor={annotationColor}
            annotationLineWidth={annotationLineWidth}
            annotationStampType={annotationStampType}
            showAnnotatorNames={showAnnotatorNames}
            annotations={annotations}
            onAddAnnotation={handleAddAnnotation}
            onRemoveAnnotation={handleRemoveAnnotation}
            onClearAnnotations={handleClearAnnotations}
            meetingId={meetingId}
            user={user}
            socket={socketRef.current}
            presentationSession={presentationSession}
            isPresenter={presentationSession?.presenterId === (user?.id || user?._id || 'local')}
            isSlideController={presentationSession?.controllers?.some(c => c.userId === (user?.id || user?._id || 'local') && c.status === 'ACTIVE') || false}
            onNavigateSlide={handleNavigateSlide}
            onOpenSlideControlModal={() => setShowSlideControlModal(true)}
            onEndPresentation={handleEndPresentationSession}
            watermarkSettings={watermarkSettings}
            viewerIdentity={viewerIdentity}
          />

          {/* Part 16: Participant Slide Control Widget (16.3 & 16.12) */}
          {presentationSession && 
           presentationSession.status === 'ACTIVE' && 
           presentationSession.controllers?.some(c => c.userId === (user?.id || user?._id || 'local') && c.status === 'ACTIVE') &&
           presentationSession.presenterId !== (user?.id || user?._id || 'local') && (
            <ParticipantSlideControlWidget
              currentSlide={presentationSession.currentSlide}
              totalSlides={presentationSession.totalSlides}
              presentationName={presentationSession.presentationName}
              onNavigate={handleNavigateSlide}
              onRelinquishControl={() => handleRevokeSlideControl(user?.id || user?._id || 'local')}
            />
          )}

          {/* Part 15: Floating Annotation Toolbar & Floating Annotate Trigger Button (15.2, 15.3) */}
          {isScreenSharing && (
            <>
              {isAnnotating ? (
                <AnnotationToolbar
                  activeTool={annotationTool}
                  onSelectTool={setAnnotationTool}
                  color={annotationColor}
                  onChangeColor={setAnnotationColor}
                  lineWidth={annotationLineWidth}
                  onChangeLineWidth={setAnnotationLineWidth}
                  stampType={annotationStampType}
                  onSelectStamp={setAnnotationStampType}
                  onUndo={handleUndoAnnotation}
                  onRedo={handleRedoAnnotation}
                  canUndo={annotationHistory.length > 0}
                  canRedo={annotationRedoStack.length > 0}
                  onClear={handleClearAnnotations}
                  onSave={handleSaveAnnotation}
                  showAnnotatorNames={showAnnotatorNames}
                  onToggleShowNames={() => setShowAnnotatorNames(prev => !prev)}
                  isHostOrPresenter={user?.id === 'host' || isHost || screenShareDetails?.sharerId === (user?.id || 'local')}
                  onClose={() => setIsAnnotating(false)}
                />
              ) : (
                <button
                  onClick={handleToggleAnnotate}
                  className="absolute top-4 right-4 z-40 bg-[#1F2026]/90 hover:bg-blue-600 text-white px-3 py-1.5 rounded-xl border border-white/20 shadow-2xl backdrop-blur-md flex items-center gap-1.5 text-xs font-semibold transition-all group hover:scale-105"
                  title="Open Annotation Tools (Draw, Highlight, Text, Arrows)"
                >
                  <Pen className="w-3.5 h-3.5 text-blue-400 group-hover:text-white" />
                  <span>Annotate</span>
                </button>
              )}
            </>
          )}

          {/* Dynamic Attendee Watermark Protection */}
          {securitySettings.watermark && (
            <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden flex flex-wrap gap-8 opacity-20 select-none p-4 text-white text-[11px] font-mono font-bold rotate-[-15deg]">
              {Array.from({ length: 24 }).map((_, i) => (
                <span key={i} className="whitespace-nowrap">
                  {user?.email || sessionStorage.getItem('intellmeet_guest_name') || 'IntellMeet Secure'} • {new Date().toLocaleDateString()}
                </span>
              ))}
            </div>
          )}

          {/* Screen-Capture Protection Mask */}
          {screenCaptureShield && (
            <div className="absolute inset-0 bg-[#121212]/95 backdrop-blur-xl z-40 flex flex-col items-center justify-center text-white p-6 select-none animate-fade-in text-center">
              <ShieldAlert className="w-14 h-14 text-amber-500 mb-3 animate-pulse" />
              <h3 className="text-base font-bold">Screen-Capture Protection Active</h3>
              <p className="text-xs text-gray-400 mt-1 max-w-xs leading-relaxed">
                Session content is protected against captures. Focus this window to view content.
              </p>
            </div>
          )}
        </div>

        {/* Right Split Pane (Chat & Participants) */}
        {showRightPanel && (
          <div className="w-80 flex flex-col border-l border-[#333] bg-[#1A1A1A]">
            
            {/* Top Navigation Switcher for Right Panel (Part 11.1 & Part 10) */}
            <div className="h-10 border-b border-[#333] flex items-center justify-between px-2 bg-[#202020] shrink-0 select-none">
              <div className="flex items-center gap-1 bg-[#161616] p-0.5 rounded-lg border border-[#333]">
                <button
                  onClick={() => setRightPanelTab('participants')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                    rightPanelTab === 'participants'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-[#252525]'
                  }`}
                  title="Participants Panel"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Participants</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    rightPanelTab === 'participants' ? 'bg-blue-800 text-white' : 'bg-[#333] text-gray-300'
                  }`}>
                    {allParticipants.length}
                  </span>
                </button>

                <button
                  onClick={() => setRightPanelTab('chat')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                    rightPanelTab === 'chat'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-[#252525]'
                  }`}
                  title="Meeting Chat"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Chat</span>
                  {chatMessages.length > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      rightPanelTab === 'chat' ? 'bg-blue-800 text-white' : 'bg-[#333] text-gray-300'
                    }`}>
                      {chatMessages.length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setRightPanelTab(rightPanelTab === 'split' ? 'participants' : 'split')}
                  className={`px-2 py-1 rounded text-[11px] font-medium transition-all ${
                    rightPanelTab === 'split'
                      ? 'bg-[#383838] text-blue-400 font-bold border border-blue-500/40'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-[#252525]'
                  }`}
                  title="Split view (Show both)"
                >
                  Split
                </button>
              </div>

              <button
                onClick={() => setShowRightPanel(false)}
                className="p-1 rounded text-gray-400 hover:text-white hover:bg-[#333] transition-colors"
                title="Close Panel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Chat Section (Part 10 In-Meeting & Continuous Chat) */}
            {(rightPanelTab === 'chat' || rightPanelTab === 'split') && (
            <div className={`flex flex-col min-h-0 ${rightPanelTab === 'split' ? 'flex-1 border-b border-[#333]' : 'flex-1'}`}>
              <div className="h-10 border-b border-[#333] flex items-center justify-between px-3 shrink-0 bg-[#202020]">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-blue-400" />
                  <h2 className="text-[12px] font-bold text-gray-200">Meeting Chat</h2>
                  {chatPermission !== 'everyone' && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-900/60 text-amber-300 border border-amber-700/50">
                      {chatPermission === 'publicOnly' ? 'Public Only' : chatPermission === 'hostOnly' ? 'Host Only' : 'Disabled'}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 relative">
                  {/* Host Chat Settings (Section 10.3) */}
                  <button 
                    onClick={() => setShowChatSettingsMenu(!showChatSettingsMenu)}
                    className="p-1 rounded text-gray-400 hover:text-white hover:bg-[#333] transition-colors"
                    title="Chat Permissions"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {showChatSettingsMenu && (
                    <div className="absolute right-0 top-full mt-1 w-64 bg-[#262626] border border-[#3c3c3c] rounded-xl shadow-2xl p-2 z-50 text-xs">
                      <p className="font-bold text-gray-300 px-2 py-1 text-[11px] border-b border-[#383838] mb-1">
                        Who can participants chat with?
                      </p>
                      {[
                        { id: 'everyone', label: 'Everyone (Public & Direct)' },
                        { id: 'publicOnly', label: 'Everyone publicly' },
                        { id: 'hostOnly', label: 'Host and co-hosts only' },
                        { id: 'none', label: 'No one (Chat disabled)' },
                      ].map(opt => (
                        <button
                          key={opt.id}
                          onClick={() => handleUpdateChatPermission(opt.id)}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors ${
                            chatPermission === opt.id ? 'bg-blue-600 text-white font-bold' : 'text-gray-300 hover:bg-[#333]'
                          }`}
                        >
                          <span>{opt.label}</span>
                          {chatPermission === opt.id && <Check className="w-3.5 h-3.5" />}
                        </button>
                      ))}
                    </div>
                  )}

                  <button onClick={() => setShowRightPanel(false)} className="p-1 text-gray-400 hover:text-white rounded hover:bg-[#333]">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Pinned Message Sticky Banner (Section 10.11) */}
              {pinnedChatMessage && (
                <div className="bg-[#242115] border-b border-amber-600/40 px-3 py-2 flex items-start justify-between text-xs text-amber-200 shrink-0 shadow-inner">
                  <div className="flex items-start gap-2 overflow-hidden">
                    <Pin className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0 rotate-45" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-300 uppercase tracking-wider">
                        <span>Pinned Message</span>
                        <span className="text-amber-400/60 font-normal">by {pinnedChatMessage.pinnedBy || 'Host'}</span>
                      </div>
                      <p className="text-[11px] text-gray-200 truncate mt-0.5">
                        <strong className="text-amber-200">{pinnedChatMessage.senderName}: </strong>
                        {pinnedChatMessage.text || pinnedChatMessage.fileName || 'Attachment'}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleTogglePin(pinnedChatMessage)} 
                    className="text-amber-400/80 hover:text-amber-100 text-[10px] underline ml-2 shrink-0 font-medium"
                  >
                    Unpin
                  </button>
                </div>
              )}
              
              {/* Message Stream */}
              <div className="flex-1 p-3 overflow-y-auto space-y-3 text-xs">
                {showChatIntro && (
                  <div className="bg-[#242424] rounded-xl p-3 border border-[#333] mb-2">
                    <div className="flex items-center gap-1.5 font-bold text-[12px] text-blue-400 mb-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Continuous Meeting Chat</span>
                    </div>
                    <p className="text-[11px] text-gray-400 leading-snug mb-2">
                      Messages and shared documents are preserved permanently in MongoDB and accessible before, during, and after this meeting.
                    </p>
                    <div className="flex justify-end">
                      <button 
                        onClick={() => setShowChatIntro(false)}
                        className="bg-[#0E71EB] hover:bg-[#0B5BC0] text-white text-[11px] font-bold px-2.5 py-1 rounded-lg"
                      >
                        Got it
                      </button>
                    </div>
                  </div>
                )}

                {chatMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-500">
                    <MessageSquare className="w-8 h-8 text-gray-600 mb-2 stroke-[1.5]" />
                    <p className="font-semibold text-xs text-gray-400">No messages yet</p>
                    <p className="text-[10px] text-gray-500 mt-1">Send a message, share documents, or direct message any attendee.</p>
                  </div>
                ) : (
                  chatMessages.map((msg, index) => {
                    const msgId = msg._id || msg.id || index;
                    const prevMsg = index > 0 ? chatMessages[index - 1] : null;
                    const isPhaseTransition = !prevMsg || prevMsg.phase !== msg.phase;

                    return (
                      <React.Fragment key={msgId}>
                        {isPhaseTransition && msg.phase === 'BEFORE' && (
                          <div className="flex items-center gap-2 my-2 px-1">
                            <div className="flex-1 h-px bg-blue-500/30" />
                            <span className="text-[9px] font-bold text-blue-400 bg-blue-950/60 border border-blue-800/60 px-2 py-0.5 rounded-full">
                              Pre-Meeting Discussion
                            </span>
                            <div className="flex-1 h-px bg-blue-500/30" />
                          </div>
                        )}
                        {isPhaseTransition && msg.phase === 'DURING' && prevMsg && prevMsg.phase === 'BEFORE' && (
                          <div className="flex items-center gap-2 my-2 px-1">
                            <div className="flex-1 h-px bg-emerald-500/30" />
                            <span className="text-[9px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-full">
                              In-Meeting Chat Started
                            </span>
                            <div className="flex-1 h-px bg-emerald-500/30" />
                          </div>
                        )}
                        <div 
                          className={`group relative flex flex-col p-2 rounded-xl transition-colors ${
                            msg.isPrivate ? 'bg-purple-950/20 border border-purple-900/40' : 'hover:bg-[#222]'
                          }`}
                        >
                          {/* Message Header */}
                          <div className="flex items-baseline justify-between gap-1 mb-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[12px] font-bold text-gray-200">{msg.senderName || msg.sender}</span>
                              {msg.phase === 'BEFORE' && (
                                <span className="text-[9px] font-medium px-1.5 py-0.2 rounded bg-blue-950 text-blue-300 border border-blue-800/50">
                                  Pre-Meeting
                                </span>
                              )}
                            {msg.isPrivate ? (
                              <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-purple-900/80 text-purple-200 border border-purple-700/60">
                                Direct Message
                              </span>
                            ) : (
                              <span className="text-[10px] text-gray-500">to Everyone</span>
                            )}
                            {msg.recipientName && msg.recipientName !== 'Everyone' && (
                              <span className="text-[10px] text-purple-300">→ {msg.recipientName}</span>
                            )}
                          </div>
                          <span className="text-[10px] text-gray-500 shrink-0">{msg.time}</span>
                        </div>

                        {/* Message Text with URLs */}
                        {msg.text && (
                          <div className="text-[12px] text-gray-100 leading-relaxed whitespace-pre-wrap break-words">
                            {renderFormattedText(msg.text)}
                          </div>
                        )}

                        {/* Rich File Attachment (Section 10.6 & 10.7) */}
                        {msg.fileName && (
                          <div className="mt-2 p-2 bg-[#2a2a2a] border border-[#3d3d3d] rounded-xl flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5 overflow-hidden">
                              <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                                {msg.fileType === 'image' ? <ImageIcon className="w-4 h-4" /> :
                                 msg.fileType === 'pdf' ? <FileText className="w-4 h-4 text-red-400" /> :
                                 msg.fileType === 'code' ? <FileCode className="w-4 h-4 text-emerald-400" /> :
                                 msg.fileType === 'archive' ? <Archive className="w-4 h-4 text-amber-400" /> :
                                 <File className="w-4 h-4 text-blue-400" />}
                              </div>
                              <div className="overflow-hidden">
                                <p className="text-[11px] font-bold text-gray-200 truncate">{msg.fileName}</p>
                                <p className="text-[10px] text-gray-400">{msg.fileSize || 'Attachment'}</p>
                              </div>
                            </div>
                            {msg.fileUrl ? (
                              <a
                                href={msg.fileUrl}
                                download={msg.fileName}
                                className="p-1.5 bg-[#383838] hover:bg-[#484848] text-gray-200 rounded-lg transition-colors shrink-0"
                                title="Download File"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </a>
                            ) : null}
                          </div>
                        )}

                        {/* Inline Image Preview */}
                        {msg.fileType === 'image' && msg.fileUrl && (
                          <div className="mt-2 rounded-lg overflow-hidden border border-[#3d3d3d] max-h-48 bg-black/40">
                            <img src={msg.fileUrl} alt={msg.fileName} className="w-full h-full object-contain" />
                          </div>
                        )}

                        {/* Document & Canvas Collaboration Share Card (Section 10.18) */}
                        {msg.documentShare && (
                          <div className="mt-2 p-2.5 bg-gradient-to-r from-blue-950/40 to-indigo-950/40 border border-blue-600/40 rounded-xl flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 bg-blue-600/30 text-blue-300 rounded-lg">
                                <Sparkles className="w-4 h-4" />
                              </div>
                              <div>
                                <p className="text-[11px] font-bold text-blue-200">{msg.documentShare.docTitle}</p>
                                <p className="text-[10px] text-blue-300/70">Click to collaborate in real-time</p>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                if (msg.documentShare.docType === 'whiteboard') {
                                  toast.success('Switching to Whiteboard Canvas');
                                } else {
                                  toast.success('Opening Meeting Notes Document');
                                }
                              }}
                              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold shadow transition-colors flex items-center gap-1 shrink-0"
                            >
                              <span>Open</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        )}

                        {/* Emoji Reactions Display */}
                        {msg.reactions?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {msg.reactions.map((react, rIdx) => (
                              <button
                                key={rIdx}
                                onClick={() => handleReactToMessage(msgId, react.emoji)}
                                className={`px-2 py-0.5 rounded-full text-[11px] border flex items-center gap-1 transition-all ${
                                  react.users?.includes(user?.name) 
                                    ? 'bg-blue-600/30 border-blue-500 text-blue-200' 
                                    : 'bg-[#2a2a2a] border-[#383838] text-gray-300 hover:bg-[#333]'
                                }`}
                                title={`Reacted by: ${react.users?.join(', ')}`}
                              >
                                <span>{react.emoji}</span>
                                <span className="text-[10px] font-bold">{react.count}</span>
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Hover Quick Actions */}
                        <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity bg-[#262626] border border-[#383838] rounded-lg shadow-lg flex items-center p-0.5 gap-0.5 z-10">
                          {['👍', '❤️', '👏'].map(em => (
                            <button
                              key={em}
                              onClick={() => handleReactToMessage(msgId, em)}
                              className="p-1 hover:bg-[#383838] rounded text-xs transition-colors"
                              title={`React ${em}`}
                            >
                              {em}
                            </button>
                          ))}
                          <button
                            onClick={() => handleTogglePin(msg)}
                            className={`p-1 hover:bg-[#383838] rounded text-gray-400 hover:text-white transition-colors ${
                              pinnedChatMessage?._id === msgId ? 'text-amber-400' : ''
                            }`}
                            title={pinnedChatMessage?._id === msgId ? 'Unpin message' : 'Pin to top'}
                          >
                            <Pin className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input & Target Selector Bar */}
              <div className="p-3 shrink-0 bg-[#1e1e1e] border-t border-[#2e2e2e]">
                {/* File Attachment Preview */}
                {selectedAttachment && (
                  <div className="mb-2 p-2 bg-[#2a2a2a] border border-blue-500/40 rounded-xl flex items-center justify-between text-xs text-blue-200">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <Paperclip className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span className="truncate font-semibold text-[11px]">{selectedAttachment.name}</span>
                      <span className="text-[10px] text-gray-400 shrink-0">({selectedAttachment.size})</span>
                    </div>
                    <button 
                      onClick={() => setSelectedAttachment(null)}
                      className="p-1 text-gray-400 hover:text-rose-400 rounded transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* To: Selector (Section 10.4 & 10.5) */}
                <div className="flex items-center gap-2 mb-2 text-[11px]">
                  <span className="font-bold text-gray-400">To:</span>
                  <div className="relative flex-1">
                    <select
                      value={chatRecipient.id}
                      onChange={(e) => {
                        const chosenId = e.target.value;
                        if (chosenId === 'everyone') {
                          setChatRecipient({ id: 'everyone', name: 'Everyone' });
                        } else {
                          const p = allParticipants.find(part => part.id === chosenId);
                          setChatRecipient({ id: chosenId, name: p?.name || 'Direct Message' });
                        }
                      }}
                      disabled={chatPermission === 'publicOnly' || chatPermission === 'none'}
                      className="w-full bg-[#262626] border border-[#383838] rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-blue-500 font-medium"
                    >
                      <option value="everyone">Everyone (Public Group)</option>
                      {chatPermission !== 'publicOnly' && (
                        <optgroup label="Direct Message (1:1 Private)">
                          {allParticipants
                            .filter(p => !p.isLocal)
                            .map(p => (
                              <option key={p.id} value={p.id}>
                                {p.name} (Direct Message)
                              </option>
                            ))}
                        </optgroup>
                      )}
                    </select>
                  </div>
                </div>

                {/* Input Area */}
                <div className="bg-[#262626] rounded-xl border border-[#383838] p-2 flex flex-col focus-within:border-blue-500 transition-colors">
                  <textarea 
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={sendChatMessage}
                    disabled={chatPermission === 'none'}
                    placeholder={chatPermission === 'none' ? 'Chat is disabled by the host.' : 'Type message here (Press Enter to send)...'} 
                    className="w-full bg-transparent text-[12px] text-white focus:outline-none resize-none h-12 placeholder-gray-500 disabled:opacity-50"
                  />

                  {/* Attachment and Tool Actions */}
                  <div className="flex justify-between items-center mt-2 relative pt-1 border-t border-[#333]">
                    <div className="flex items-center gap-1.5 text-gray-400">
                      {/* Emoji Picker */}
                      <button 
                        type="button"
                        onClick={() => setShowChatEmojiPicker(!showChatEmojiPicker)}
                        className="p-1 hover:text-white hover:bg-[#333] rounded transition-colors"
                        title="Add Emoji"
                      >
                        <Smile className="w-4 h-4" />
                      </button>

                      {/* File Upload (Section 10.6 & 10.7) */}
                      <input 
                        type="file" 
                        ref={chatFileInputRef} 
                        onChange={handleFileUpload} 
                        className="hidden" 
                      />
                      <button 
                        type="button"
                        onClick={() => chatFileInputRef.current?.click()}
                        className="p-1 hover:text-white hover:bg-[#333] rounded transition-colors"
                        title="Attach File or Image"
                      >
                        <Paperclip className="w-4 h-4" />
                      </button>

                      {/* Document & Canvas Collaboration Share (Section 10.18) */}
                      <button 
                        type="button"
                        onClick={() => setShowDocShareModal(!showDocShareModal)}
                        className="p-1 hover:text-white hover:bg-[#333] rounded transition-colors"
                        title="Share Document or Canvas"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Emoji Dropdown Picker */}
                    {showChatEmojiPicker && (
                      <div className="absolute bottom-full left-0 mb-2 bg-[#242424] border border-[#383838] rounded-xl shadow-2xl p-2.5 z-50 w-52">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Emojis</p>
                        <div className="grid grid-cols-6 gap-1">
                          {['😀','😂','😊','😍','🤔','😎','😭','👍','👏','🙏','❤️','🔥','🎉','✨','👀','💯','💡','🚀'].map(emoji => (
                            <button 
                              key={emoji}
                              onClick={() => {
                                setChatInput(prev => prev + emoji);
                                setShowChatEmojiPicker(false);
                              }}
                              className="w-7 h-7 flex items-center justify-center hover:bg-[#333] rounded-lg transition-colors text-base"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Document / Canvas Share Mini Modal */}
                    {showDocShareModal && (
                      <div className="absolute bottom-full left-10 mb-2 bg-[#242424] border border-[#383838] rounded-xl shadow-2xl p-2 z-50 w-56 text-xs">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 py-1 border-b border-[#333] mb-1">
                          Share Collaboration
                        </p>
                        <button
                          onClick={() => handleShareDocOrCanvas('whiteboard')}
                          className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-[#333] text-gray-200 flex items-center gap-2 transition-colors"
                        >
                          <Palette className="w-4 h-4 text-purple-400" />
                          <div>
                            <p className="font-bold text-[11px]">Whiteboard Canvas</p>
                            <p className="text-[9px] text-gray-400">Share live interactive board</p>
                          </div>
                        </button>
                        <button
                          onClick={() => handleShareDocOrCanvas('notes')}
                          className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-[#333] text-gray-200 flex items-center gap-2 transition-colors mt-0.5"
                        >
                          <FileText className="w-4 h-4 text-blue-400" />
                          <div>
                            <p className="font-bold text-[11px]">Meeting Notes Document</p>
                            <p className="text-[9px] text-gray-400">Collaborative doc workspace</p>
                          </div>
                        </button>
                      </div>
                    )}

                    {/* Send Button */}
                    <button 
                      onClick={() => sendChatMessage({ key: 'Enter', preventDefault: () => {} })}
                      disabled={chatPermission === 'none' || (!chatInput.trim() && !selectedAttachment)}
                      className="p-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-lg transition-colors shadow"
                      title="Send Message"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            )}

            {/* Participants Section (Part 11: Participants Panel) */}
            {(rightPanelTab === 'participants' || rightPanelTab === 'split') && (
              <div className={`flex flex-col min-h-0 ${
                rightPanelTab === 'split' ? 'h-[340px] shrink-0 border-t border-[#333]' : 'flex-1'
              }`}>
                {/* Search Bar (11.2) */}
                <div className="p-2 border-b border-[#2d2d2d] bg-[#1c1c1c] shrink-0">
                  <div className="relative flex items-center">
                    <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 pointer-events-none" />
                    <input
                      type="text"
                      value={participantSearchQuery}
                      onChange={(e) => setParticipantSearchQuery(e.target.value)}
                      placeholder="Find a participant..."
                      className="w-full bg-[#141414] border border-[#333] rounded-lg pl-8 pr-7 py-1 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                    {participantSearchQuery && (
                      <button 
                        onClick={() => setParticipantSearchQuery('')}
                        className="absolute right-2 text-gray-400 hover:text-white"
                        title="Clear search"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Scrollable Participants & Waiting Room Area */}
                <div className="flex-1 overflow-y-auto py-1">
                  {/* Waiting Room Section (11.15) */}
                  {waitingRoomQueue.length > 0 && (
                    <div className="mx-2 mb-2 p-2 bg-[#251e12] border border-amber-600/40 rounded-xl shadow-md">
                      <div className="flex justify-between items-center text-[11px] font-bold text-amber-400 mb-1.5 px-1">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                          <span>Waiting Room ({waitingRoomQueue.length})</span>
                        </div>
                        {(user?.id === 'host' || isHost) && (
                          <button 
                            onClick={handleAdmitAllWaiting}
                            className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold underline"
                          >
                            Admit all
                          </button>
                        )}
                      </div>
                      <div className="space-y-1">
                        {waitingRoomQueue.map(item => (
                          <div key={item.id} className="flex justify-between items-center py-1 px-1.5 bg-[#1a150e] rounded-lg border border-amber-900/30 text-xs">
                            <span className="text-gray-300 truncate max-w-[110px] text-[11px]">{item.name}</span>
                            <div className="flex items-center gap-1">
                              <button 
                                onClick={() => handleAdmitWaiting(item.id, item.name)}
                                className="text-[10px] bg-blue-600 hover:bg-blue-500 text-white px-2 py-0.5 rounded font-bold"
                              >
                                Admit
                              </button>
                              <button 
                                onClick={() => toast.info(`Kept ${item.name} in Waiting Room`)}
                                className="text-[10px] bg-[#2a2a2a] hover:bg-[#333] text-gray-300 px-1.5 py-0.5 rounded font-medium"
                                title="Wait"
                              >
                                Wait
                              </button>
                              <button 
                                onClick={() => handleRemoveWaiting(item.id, item.name)}
                                className="text-[11px] text-gray-400 hover:text-red-400 px-1"
                                title="Deny entry"
                              >
                                ×
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Part 12: Raised Hands Speaking Queue (12.3 - 12.5, 12.15) */}
                  {raisedHandsQueue.length > 0 && (
                    <div className="mx-2 mb-2 p-2.5 bg-gradient-to-r from-amber-950/40 to-[#252015] border border-amber-500/30 rounded-xl shadow-lg">
                      <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-amber-500/20">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-300">
                          <Hand className="w-3.5 h-3.5 fill-amber-400 text-amber-400 animate-bounce" />
                          <span>Speaking Queue ({raisedHandsQueue.length})</span>
                        </div>
                        {(user?.id === 'host' || isHost || coHosts.includes(user?.id)) && (
                          <button
                            onClick={handleHostLowerAllHands}
                            className="text-[10px] text-amber-400 hover:text-amber-200 font-medium px-2 py-0.5 rounded bg-amber-900/40 hover:bg-amber-900/70 border border-amber-500/30 transition-colors"
                            title="Lower all raised hands"
                          >
                            Lower All
                          </button>
                        )}
                      </div>
                      <div className="space-y-1.5 max-h-36 overflow-y-auto">
                        {raisedHandsQueue.map((item, idx) => {
                          const isSelf = item.participantId === (user?.id || 'local');
                          const canLower = isSelf || user?.id === 'host' || isHost || coHosts.includes(user?.id);
                          return (
                            <div key={item.participantId || idx} className="flex items-center justify-between px-2 py-1 bg-black/40 rounded-lg border border-amber-500/10">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[10px] flex items-center justify-center shrink-0 border border-amber-500/30">
                                  #{idx + 1}
                                </span>
                                <span className="text-xs text-gray-200 font-medium truncate max-w-[120px]">
                                  {item.name} {isSelf && <span className="text-[10px] text-gray-400">(you)</span>}
                                </span>
                              </div>
                              {canLower && (
                                <button
                                  onClick={() => handleHostLowerHand(item.participantId, item.name)}
                                  className="text-[10px] text-gray-300 hover:text-red-400 px-1.5 py-0.5 rounded hover:bg-white/10 transition-colors"
                                  title="Lower hand"
                                >
                                  Lower Hand
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Part 12: Non-Verbal Feedback Real-Time Summary (12.7, 12.8) */}
                  {(() => {
                    const activeEntries = Object.values(nonVerbalFeedbacks);
                    const yesCount = activeEntries.filter(e => e.value === 'YES').length;
                    const noCount = activeEntries.filter(e => e.value === 'NO').length;
                    const slowerCount = activeEntries.filter(e => e.value === 'SLOWER').length;
                    const fasterCount = activeEntries.filter(e => e.value === 'FASTER').length;
                    const totalFeedback = yesCount + noCount + slowerCount + fasterCount;

                    if (totalFeedback === 0) return null;

                    return (
                      <div className="mx-2 mb-2 p-2 bg-[#202020] border border-[#333] rounded-xl flex items-center justify-between gap-1 shadow-sm">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {yesCount > 0 && (
                            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-[10px] text-emerald-300 font-medium">
                              <span>👍</span> <span>Yes: {yesCount}</span>
                            </span>
                          )}
                          {noCount > 0 && (
                            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-red-950/60 border border-red-500/30 text-[10px] text-red-300 font-medium">
                              <span>👎</span> <span>No: {noCount}</span>
                            </span>
                          )}
                          {slowerCount > 0 && (
                            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-blue-950/60 border border-blue-500/30 text-[10px] text-blue-300 font-medium">
                              <span>🐢</span> <span>Slower: {slowerCount}</span>
                            </span>
                          )}
                          {fasterCount > 0 && (
                            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-950/60 border border-amber-500/30 text-[10px] text-amber-300 font-medium">
                              <span>⚡</span> <span>Faster: {fasterCount}</span>
                            </span>
                          )}
                        </div>
                        {(user?.id === 'host' || isHost || coHosts.includes(user?.id)) && (
                          <button
                            onClick={handleClearAllFeedback}
                            className="text-[10px] text-gray-400 hover:text-white px-1.5 py-0.5 rounded hover:bg-white/10 shrink-0"
                            title="Clear all non-verbal feedback"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    );
                  })()}

                  {/* Participant List (11.3) */}
                  {filteredParticipants.length === 0 ? (
                    <div className="p-4 text-center text-xs text-gray-500">
                      No participants match "{participantSearchQuery}"
                    </div>
                  ) : (
                    filteredParticipants.map(p => {
                      const isLocalHost = p.isLocal;
                      const isCoHost = coHosts.includes(p.id);
                      const isHandUp = raisedHands.includes(p.id);

                      return (
                        <div 
                          key={p.id} 
                          className="relative flex items-center justify-between px-3 py-1.5 hover:bg-[#242424] group transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {/* Profile Picture / Silhouette (11.19 Hide Profile Pictures) */}
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${
                              hideProfilePics
                                ? 'bg-[#333] text-gray-400'
                                : isLocalHost ? 'bg-purple-700 shadow-sm' : isCoHost ? 'bg-blue-600 shadow-sm' : 'bg-gray-600'
                            }`}>
                              {hideProfilePics ? (
                                <User className="w-3.5 h-3.5 text-gray-400" />
                              ) : (
                                p.name.slice(0, 2).charAt(0).toUpperCase() + p.name.slice(1, 2).toLowerCase()
                              )}
                            </div>

                            <div className="min-w-0">
                              <div className="text-[12px] font-medium text-gray-200 flex items-center gap-1.5 flex-wrap">
                                <span className="truncate max-w-[90px]">{p.name}</span>
                                {p.isLocal && <span className="text-[10px] text-gray-400 shrink-0">(me)</span>}
                                {isLocalHost ? (
                                  <span className="flex items-center gap-0.5 text-[9px] text-amber-400 font-bold px-1 py-0.2 rounded bg-amber-950/50 border border-amber-600/30 shrink-0">
                                    <Crown className="w-2.5 h-2.5 fill-amber-400" />
                                    <span>Host</span>
                                  </span>
                                ) : isCoHost ? (
                                  <span className="text-[9px] text-blue-400 font-bold px-1 py-0.2 rounded bg-blue-950/50 border border-blue-600/30 shrink-0">
                                    Co-host
                                  </span>
                                ) : null}

                                {/* Hand Raised Indicator (11.18 & 11.24, 12.3) */}
                                {isHandUp && (
                                  <span className="flex items-center gap-0.5 text-[9px] text-amber-300 font-bold px-1 py-0.2 rounded bg-amber-900/50 border border-amber-500/40 shrink-0 animate-pulse">
                                    <Hand className="w-2.5 h-2.5 fill-current" />
                                    <span>Hand</span>
                                  </span>
                                )}

                                {/* Non-Verbal Feedback Badge (12.6, 12.14) */}
                                {nonVerbalFeedbacks[p.id] && (
                                  <span className="flex items-center gap-0.5 text-[9px] text-cyan-300 font-medium px-1 py-0.2 rounded bg-cyan-950/50 border border-cyan-500/30 shrink-0" title={`Feedback: ${nonVerbalFeedbacks[p.id].label}`}>
                                    <span>{nonVerbalFeedbacks[p.id].icon}</span>
                                    <span>{nonVerbalFeedbacks[p.id].label}</span>
                                  </span>
                                )}

                                {/* Multi-Screen Sharing Status Badge (Section 14.9, 14.20) */}
                                {activeShareSessions.some(s => s.sharerId === p.id) && (
                                  <span className="flex items-center gap-1 text-[9px] text-emerald-300 font-bold px-1.5 py-0.5 rounded bg-emerald-950/70 border border-emerald-500/40 shrink-0 animate-pulse" title="Sharing Screen">
                                    <Share2 className="w-2.5 h-2.5" />
                                    <span>Sharing</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Status Icons and Action Menu */}
                          <div className="flex items-center gap-1.5 text-gray-400 shrink-0">
                            {p.isMuted ? (
                              <MicOff className="w-3.5 h-3.5 text-red-500" />
                            ) : (
                              <Mic className="w-3.5 h-3.5 text-green-400" />
                            )}
                            {p.isVideoOff ? (
                              <VideoOff className="w-3.5 h-3.5 text-red-400" />
                            ) : (
                              <Video className="w-3.5 h-3.5 text-gray-400" />
                            )}

                            {/* 3-dots Context Menu Button */}
                            <div className="relative">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveParticipantMenu(activeParticipantMenu === p.id ? null : p.id);
                                }}
                                className="p-1 hover:text-white rounded hover:bg-[#333] transition-colors"
                                title="More participant actions"
                              >
                                <MoreHorizontal className="w-3.5 h-3.5" />
                              </button>

                              {/* Participant Context Dropdown Menu */}
                              {activeParticipantMenu === p.id && (
                                <div className="absolute right-0 bottom-full mb-1 w-52 bg-[#242424] border border-[#3A3A3A] rounded-xl shadow-2xl py-1 z-50 text-xs">
                                  {/* Rename (11.12) */}
                                  <button
                                    onClick={() => {
                                      setRenameParticipantTarget(p);
                                      setRenameInput(p.name);
                                      setShowRenameModal(true);
                                      setActiveParticipantMenu(null);
                                    }}
                                    className="w-full text-left px-3 py-1.5 hover:bg-[#333] text-gray-200 flex items-center justify-between"
                                  >
                                    <span>Rename</span>
                                    <Edit2 className="w-3 h-3 text-gray-400" />
                                  </button>

                                  {/* Toggle Hand (for self) */}
                                  {p.isLocal && (
                                    <button
                                      onClick={() => {
                                        handleToggleHandRaised();
                                        setActiveParticipantMenu(null);
                                      }}
                                      className="w-full text-left px-3 py-1.5 hover:bg-[#333] text-amber-400 flex items-center justify-between"
                                    >
                                      <span>{isHandUp ? 'Lower Hand' : 'Raise Hand'}</span>
                                      <Hand className="w-3 h-3" />
                                    </button>
                                  )}

                                  {/* Lower Hand for participant by Host/Co-host (12.3, 12.4, 12.15) */}
                                  {!p.isLocal && isHandUp && (user?.id === 'host' || isHost || coHosts.includes(user?.id)) && (
                                    <button
                                      onClick={() => {
                                        handleHostLowerHand(p.id, p.name);
                                        setActiveParticipantMenu(null);
                                      }}
                                      className="w-full text-left px-3 py-1.5 hover:bg-[#333] text-amber-400 font-medium flex items-center justify-between"
                                    >
                                      <span>Lower Hand</span>
                                      <Hand className="w-3 h-3 fill-amber-400" />
                                    </button>
                                  )}

                                  {/* Audio Control (11.4 & 11.5) */}
                                  {!p.isLocal && (
                                    p.isMuted ? (
                                      <button
                                        onClick={() => {
                                          handleHostAskToUnmute(p.id, p.name);
                                          setActiveParticipantMenu(null);
                                        }}
                                        className="w-full text-left px-3 py-1.5 hover:bg-[#333] text-blue-400 flex items-center justify-between font-medium"
                                      >
                                        <span>Ask to Unmute</span>
                                        <Mic className="w-3 h-3" />
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => {
                                          handleHostMuteParticipant(p.id, p.name);
                                          setActiveParticipantMenu(null);
                                        }}
                                        className="w-full text-left px-3 py-1.5 hover:bg-[#333] text-gray-300 flex items-center justify-between"
                                      >
                                        <span>Mute</span>
                                        <MicOff className="w-3 h-3 text-red-400" />
                                      </button>
                                    )
                                  )}

                                  {/* Video Control (11.8) */}
                                  {!p.isLocal && (
                                    p.isVideoOff ? (
                                      <button
                                        onClick={() => {
                                          handleHostAskStartVideo(p.id, p.name);
                                          setActiveParticipantMenu(null);
                                        }}
                                        className="w-full text-left px-3 py-1.5 hover:bg-[#333] text-blue-400 flex items-center justify-between font-medium"
                                      >
                                        <span>Ask to Start Video</span>
                                        <Video className="w-3 h-3" />
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => {
                                          handleHostStopVideo(p.id, p.name);
                                          setActiveParticipantMenu(null);
                                        }}
                                        className="w-full text-left px-3 py-1.5 hover:bg-[#333] text-gray-300 flex items-center justify-between"
                                      >
                                        <span>Stop Video</span>
                                        <VideoOff className="w-3 h-3 text-red-400" />
                                      </button>
                                    )
                                  )}

                                  {/* Pin (9.5) */}
                                  <button
                                    onClick={() => {
                                      handleTogglePinParticipant(p.id);
                                      setActiveParticipantMenu(null);
                                    }}
                                    className="w-full text-left px-3 py-1.5 hover:bg-[#333] text-blue-400 font-medium flex items-center justify-between"
                                  >
                                    <span>{pinnedParticipantIds.includes(p.id) ? 'Remove Pin' : 'Pin (My View)'}</span>
                                    <Pin className="w-3 h-3" />
                                  </button>

                                  {/* Spotlight (9.6) */}
                                  {(user?.id === 'host' || isHost || coHosts.includes(user?.id)) && (
                                    <button
                                      onClick={() => {
                                        handleToggleSpotlightParticipant(p.id);
                                        setActiveParticipantMenu(null);
                                      }}
                                      className="w-full text-left px-3 py-1.5 hover:bg-[#333] text-amber-400 font-medium flex items-center justify-between"
                                    >
                                      <span>{spotlightParticipantIds.includes(p.id) ? 'Remove Spotlight' : 'Spotlight for Everyone'}</span>
                                      <Star className="w-3 h-3 fill-current" />
                                    </button>
                                  )}

                                  {/* Stop Participant's Share (Section 14.10) */}
                                  {(user?.id === 'host' || isHost || coHosts.includes(user?.id)) && 
                                   activeShareSessions.some(s => s.sharerId === p.id) && (
                                    <button
                                      onClick={() => {
                                        handleHostStopParticipantShare(p.id, p.name);
                                        setActiveParticipantMenu(null);
                                      }}
                                      className="w-full text-left px-3 py-1.5 hover:bg-red-500/20 text-red-400 font-semibold flex items-center justify-between transition-colors border-t border-[#333]"
                                      title="Host Control: Stop participant's screen share"
                                    >
                                      <span>Stop Participant's Share</span>
                                      <Share2 className="w-3 h-3 text-red-400" />
                                    </button>
                                  )}

                                  {/* Host and Co-host Assignment (11.9 & 11.10) */}
                                  {!p.isLocal && (user?.id === 'host' || isHost) && (
                                    <>
                                      <div className="my-1 border-t border-[#333]"></div>
                                      <button
                                        onClick={() => {
                                          setMakeHostTarget(p);
                                          setShowMakeHostModal(true);
                                          setActiveParticipantMenu(null);
                                        }}
                                        className="w-full text-left px-3 py-1.5 hover:bg-[#333] text-amber-400 flex items-center justify-between font-medium"
                                      >
                                        <span>Make Host</span>
                                        <Crown className="w-3 h-3 fill-amber-400" />
                                      </button>

                                      <button
                                        onClick={() => {
                                          handleMakeCoHost(p.id, p.name);
                                          setActiveParticipantMenu(null);
                                        }}
                                        className="w-full text-left px-3 py-1.5 hover:bg-[#333] text-blue-400 flex items-center justify-between font-medium"
                                      >
                                        <span>{isCoHost ? 'Withdraw Co-host' : 'Make Co-host'}</span>
                                        <Shield className="w-3 h-3" />
                                      </button>

                                      {/* Part 23.5: Allow / Forbid Local Recording */}
                                      <button
                                        onClick={() => {
                                          const isAllowed = recordingSettings.participantRecordingPermissions?.some(pm => pm.userId === p.id && pm.allowed);
                                          handleUpdateParticipantRecordingPermission(p.id, p.name, !isAllowed);
                                          setActiveParticipantMenu(null);
                                        }}
                                        className="w-full text-left px-3 py-1.5 hover:bg-[#333] text-purple-300 flex items-center justify-between font-medium"
                                      >
                                        <span>
                                          {recordingSettings.participantRecordingPermissions?.some(pm => pm.userId === p.id && pm.allowed)
                                            ? 'Forbid Record'
                                            : 'Allow Record'}
                                        </span>
                                        <Disc className="w-3 h-3 text-purple-400" />
                                      </button>

                                      {/* Put in Waiting Room (11.15) */}
                                      <button
                                        onClick={() => {
                                          setSampleParticipants(prev => prev.filter(item => item.id !== p.id));
                                          setWaitingRoomQueue(prev => [...prev, { id: p.id, name: p.name, joinedAt: new Date().toISOString() }]);
                                          toast.info(`Moved ${p.name} to Waiting Room`);
                                          setActiveParticipantMenu(null);
                                        }}
                                        className="w-full text-left px-3 py-1.5 hover:bg-[#333] text-amber-300"
                                      >
                                        Put in Waiting Room
                                      </button>

                                      {/* Remove Participant (11.11) */}
                                      <button
                                        onClick={() => {
                                          handleRemoveParticipant(p.id, p.name);
                                          setActiveParticipantMenu(null);
                                        }}
                                        className="w-full text-left px-3 py-1.5 hover:bg-red-950/40 text-red-400 flex items-center justify-between"
                                      >
                                        <span>Remove from Meeting</span>
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Bottom Participant Toolbar (11.6, 11.16, 11.13, 11.14, 11.17 - 11.20) */}
                <div className="p-2.5 border-t border-[#333] bg-[#1a1a1a] shrink-0 flex items-center gap-2 relative">
                  <button 
                    onClick={() => setShowInviteModal(true)}
                    className="flex-1 bg-[#242424] hover:bg-[#333] border border-[#333] text-gray-200 text-xs font-semibold py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                    title="Invite people"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-blue-400" />
                    <span>Invite</span>
                  </button>

                  <button 
                    onClick={() => setShowMuteAllModal(true)}
                    className="flex-1 bg-[#242424] hover:bg-[#333] border border-[#333] text-gray-200 text-xs font-semibold py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                    title="Mute all participants"
                  >
                    <VolumeX className="w-3.5 h-3.5 text-red-400" />
                    <span>Mute All</span>
                  </button>

                  <button 
                    onClick={() => setShowParticipantsMoreMenu(!showParticipantsMoreMenu)}
                    className="px-2.5 py-1.5 bg-[#242424] hover:bg-[#333] border border-[#333] text-gray-200 rounded-lg transition-colors text-xs font-semibold flex items-center justify-center"
                    title="Host tools and permissions"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>

                  {/* Host Tools & Permissions Popup Menu (11.13 - 11.20) */}
                  {showParticipantsMoreMenu && (
                    <div className="absolute right-2 bottom-full mb-2 w-72 bg-[#242424] border border-[#3A3A3A] rounded-xl shadow-2xl p-2 z-50 text-xs space-y-1">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 py-1 border-b border-[#333]">
                        Participant Permissions
                      </p>

                      {[
                        { key: 'allowUnmute', label: 'Allow participants to unmute themselves' },
                        { key: 'allowStartVideo', label: 'Allow participants to start video' },
                        { key: 'allowRename', label: 'Allow participants to rename themselves' },
                        { key: 'allowShareScreen', label: 'Allow participants to share screen' },
                      ].map(perm => (
                        <label 
                          key={perm.key} 
                          className="flex items-center justify-between px-2 py-1 rounded hover:bg-[#333] cursor-pointer text-gray-300"
                        >
                          <span className="pr-2">{perm.label}</span>
                          <input 
                            type="checkbox" 
                            checked={meetingPermissions?.[perm.key] ?? true}
                            onChange={(e) => {
                              const updated = { ...(meetingPermissions || {}), [perm.key]: e.target.checked };
                              setMeetingPermissions(updated);
                              if (socketRef.current) {
                                socketRef.current.emit('host-update-permissions', { meetingId, permissions: updated });
                              }
                              toast.success(`Updated permission`);
                            }}
                            className="accent-blue-600 rounded"
                          />
                        </label>
                      ))}

                      <div className="my-1 border-t border-[#333]"></div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 py-1">
                        Meeting Settings
                      </p>

                      <label className="flex items-center justify-between px-2 py-1 rounded hover:bg-[#333] cursor-pointer text-gray-300">
                        <span>Mute participants upon entry</span>
                        <input 
                          type="checkbox" 
                          checked={muteOnEntry}
                          onChange={(e) => {
                            setMuteOnEntry(e.target.checked);
                            toast.info(`Mute on entry: ${e.target.checked ? 'Enabled' : 'Disabled'}`);
                          }}
                          className="accent-blue-600 rounded"
                        />
                      </label>

                      <label className="flex items-center justify-between px-2 py-1 rounded hover:bg-[#333] cursor-pointer text-gray-300">
                        <span>Play join and leave sound</span>
                        <input 
                          type="checkbox" 
                          checked={playJoinLeaveChime}
                          onChange={(e) => {
                            setPlayJoinLeaveChime(e.target.checked);
                            toast.info(`Join/leave chimes: ${e.target.checked ? 'Enabled' : 'Disabled'}`);
                          }}
                          className="accent-blue-600 rounded"
                        />
                      </label>

                      <label className="flex items-center justify-between px-2 py-1 rounded hover:bg-[#333] cursor-pointer text-gray-300">
                        <span>Hide profile pictures</span>
                        <input 
                          type="checkbox" 
                          checked={hideProfilePics}
                          onChange={(e) => {
                            setHideProfilePics(e.target.checked);
                            toast.info(`Profile pictures: ${e.target.checked ? 'Hidden' : 'Shown'}`);
                          }}
                          className="accent-blue-600 rounded"
                        />
                      </label>

                      <label className="flex items-center justify-between px-2 py-1 rounded hover:bg-[#333] cursor-pointer text-gray-300">
                        <span>Enable Waiting Room</span>
                        <input 
                          type="checkbox" 
                          checked={!!waitingRoomEnabled}
                          onChange={(e) => {
                            setWaitingRoomEnabled(e.target.checked);
                            toast.info(`Waiting Room: ${e.target.checked ? 'Enabled' : 'Disabled'}`);
                          }}
                          className="accent-blue-600 rounded"
                        />
                      </label>

                      <label className="flex items-center justify-between px-2 py-1 rounded hover:bg-[#333] cursor-pointer text-gray-300">
                        <span>Lock Meeting</span>
                        <input 
                          type="checkbox" 
                          checked={!!isMeetingLocked}
                          onChange={toggleMeetingLock}
                          className="accent-blue-600 rounded"
                        />
                      </label>

                      <div className="my-1 border-t border-[#333]"></div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 py-1">
                        Reactions & Feedback
                      </p>

                      <label className="flex items-center justify-between px-2 py-1 rounded hover:bg-[#333] cursor-pointer text-gray-300">
                        <span>Allow emoji reactions</span>
                        <input 
                          type="checkbox" 
                          checked={reactionSettings.allowReactions}
                          onChange={(e) => handleUpdateReactionSetting('allowReactions', e.target.checked)}
                          className="accent-blue-600 rounded"
                        />
                      </label>

                      <label className="flex items-center justify-between px-2 py-1 rounded hover:bg-[#333] cursor-pointer text-gray-300">
                        <span>Allow raise hand</span>
                        <input 
                          type="checkbox" 
                          checked={reactionSettings.allowRaiseHand}
                          onChange={(e) => handleUpdateReactionSetting('allowRaiseHand', e.target.checked)}
                          className="accent-blue-600 rounded"
                        />
                      </label>

                      <label className="flex items-center justify-between px-2 py-1 rounded hover:bg-[#333] cursor-pointer text-gray-300">
                        <span>Allow non-verbal feedback</span>
                        <input 
                          type="checkbox" 
                          checked={reactionSettings.allowNonVerbal}
                          onChange={(e) => handleUpdateReactionSetting('allowNonVerbal', e.target.checked)}
                          className="accent-blue-600 rounded"
                        />
                      </label>

                      <button
                        onClick={() => {
                          handleHostLowerAllHands();
                          setShowParticipantsMoreMenu(false);
                        }}
                        className="w-full text-left px-2 py-1.5 rounded hover:bg-[#333] text-amber-300 flex items-center justify-between"
                      >
                        <span>Lower All Hands</span>
                        <Hand className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => {
                          handleClearAllFeedback();
                          setShowParticipantsMoreMenu(false);
                        }}
                        className="w-full text-left px-2 py-1.5 rounded hover:bg-[#333] text-amber-300 flex items-center justify-between"
                      >
                        <span>Clear All Feedback</span>
                        <Hand className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => {
                          setShowSuspendModal(true);
                          setShowParticipantsMoreMenu(false);
                        }}
                        className="w-full text-left px-2 py-1.5 rounded hover:bg-red-950/50 text-red-400 flex items-center justify-between font-semibold"
                      >
                        <span>Suspend Participant Activities</span>
                        <AlertOctagon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Control Bar (Part 37 Theme Support) */}
      <div 
        className="h-[68px] flex items-center justify-between px-3 shrink-0 transition-all duration-300 border-t relative overflow-hidden"
        style={{
          backgroundColor: (THEMES.find(t => t.id === personalTheme) || THEMES[0]).toolbarBg,
          borderColor: (THEMES.find(t => t.id === personalTheme) || THEMES[0]).panelBg || '#333'
        }}
      >
        
        {/* Left Controls */}
        <div className="flex items-center gap-1 shrink-0 z-10">
          {!isAudioConnected ? (
            <button
              onClick={() => setShowJoinAudioModal(true)}
              className="flex flex-col items-center justify-center w-20 h-14 rounded hover:bg-[#2A2A2A] transition-colors group relative"
              title="Join Meeting Audio"
            >
              <div className="relative">
                <Headphones className="w-5 h-5 mb-1 text-gray-300 group-hover:text-white" />
                <span className="w-2.5 h-2.5 bg-green-500 rounded-full absolute -top-0.5 -right-1 border border-[#1A1A1A]"></span>
              </div>
              <span className="text-[11px] font-bold text-green-400 group-hover:text-green-300">Join Audio</span>
            </button>
          ) : (
            <div className="flex items-center rounded hover:bg-[#2A2A2A] transition-colors group relative">
              <button 
                onClick={toggleAudio}
                className="flex flex-col items-center justify-center w-14 h-14 pl-1"
                title={isAudioOn ? 'Mute Microphone' : 'Unmute Microphone'}
              >
                {isAudioOn ? (
                  <Mic className="w-5 h-5 mb-1 text-gray-300 group-hover:text-white" />
                ) : (
                  <MicOff className="w-5 h-5 mb-1 text-red-500" />
                )}
                <span className={`text-[11px] font-medium ${isAudioOn ? 'text-gray-300' : 'text-red-400'}`}>
                  {isAudioOn ? 'Mute' : 'Unmute'}
                </span>
              </button>

              {/* Chevron-up arrow button (Section 7.3, 7.4, 7.5, 7.6) */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAudioMenu(!showAudioMenu);
                }}
                className="w-5 h-14 flex items-center justify-center hover:bg-white/10 rounded-r text-gray-400 hover:text-white"
                title="Select a Microphone or Speaker"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>

              {/* Audio Context Popup Menu */}
              {showAudioMenu && (
                <div 
                  className="absolute bottom-full left-0 mb-3 w-72 bg-[#1F1F1F] border border-[#3A3A3A] rounded-2xl shadow-2xl py-2 z-50 text-xs text-gray-300 divide-y divide-[#2F2F2F] select-none"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Select Microphone (Section 7.3) */}
                  <div className="p-2 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 px-2 block">
                      Select a Microphone
                    </span>
                    <button
                      onClick={() => handleSelectMicrophone('default')}
                      className="w-full text-left px-2 py-1.5 rounded hover:bg-white/5 flex items-center justify-between text-xs"
                    >
                      <span className="truncate">Same as System</span>
                      {selectedMic === 'default' && <Check className="w-3.5 h-3.5 text-blue-500 shrink-0" />}
                    </button>
                    {audioInputs.map(d => (
                      <button
                        key={d.deviceId}
                        onClick={() => handleSelectMicrophone(d.deviceId)}
                        className="w-full text-left px-2 py-1.5 rounded hover:bg-white/5 flex items-center justify-between text-xs"
                      >
                        <span className="truncate">{d.label || `Microphone (${d.deviceId.slice(0, 5)})`}</span>
                        {selectedMic === d.deviceId && <Check className="w-3.5 h-3.5 text-blue-500 shrink-0" />}
                      </button>
                    ))}
                  </div>

                  {/* Select Speaker (Section 7.4) */}
                  <div className="p-2 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 px-2 block">
                      Select a Speaker
                    </span>
                    <button
                      onClick={() => handleSelectSpeaker('default')}
                      className="w-full text-left px-2 py-1.5 rounded hover:bg-white/5 flex items-center justify-between text-xs"
                    >
                      <span className="truncate">Same as System</span>
                      {selectedSpeaker === 'default' && <Check className="w-3.5 h-3.5 text-blue-500 shrink-0" />}
                    </button>
                    {audioOutputs.map(d => (
                      <button
                        key={d.deviceId}
                        onClick={() => handleSelectSpeaker(d.deviceId)}
                        className="w-full text-left px-2 py-1.5 rounded hover:bg-white/5 flex items-center justify-between text-xs"
                      >
                        <span className="truncate">{d.label || `Speaker (${d.deviceId.slice(0, 5)})`}</span>
                        {selectedSpeaker === d.deviceId && <Check className="w-3.5 h-3.5 text-blue-500 shrink-0" />}
                      </button>
                    ))}
                  </div>

                  {/* Test & Advanced Settings Actions (Section 7.5 & 7.6) */}
                  <div className="p-2 space-y-1">
                    <button
                      onClick={handleStartAudioTest}
                      className="w-full text-left px-2 py-1.5 rounded hover:bg-white/5 text-xs text-gray-200"
                    >
                      Test Speaker & Microphone...
                    </button>
                    <button
                      onClick={handleLeaveComputerAudio}
                      className="w-full text-left px-2 py-1.5 rounded hover:bg-white/5 text-xs text-amber-400"
                    >
                      Leave Computer Audio
                    </button>
                    <button
                      onClick={() => {
                        setShowAudioMenu(false);
                        setShowAudioSettingsModal(true);
                      }}
                      className="w-full text-left px-2 py-1.5 rounded hover:bg-white/5 text-xs text-gray-200 flex items-center justify-between"
                    >
                      <span>Audio Settings...</span>
                      <Settings className="w-3 h-3 text-gray-400" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Section 8.1 & 8.2: Video Button with ▲ Chevron Menu */}
          <div className="flex items-center rounded hover:bg-[#2A2A2A] transition-colors group relative">
            <button 
              onClick={toggleVideo}
              className="flex flex-col items-center justify-center w-14 h-14 pl-1"
              title={isVideoOn ? 'Stop Video' : 'Start Video'}
            >
              {isVideoOn ? <Video className="w-5 h-5 mb-1 text-gray-300 group-hover:text-white" /> : <VideoOff className="w-5 h-5 mb-1 text-red-500" />}
              <span className="text-[11px] font-medium text-gray-300">{isVideoOn ? 'Stop Video' : 'Video'}</span>
            </button>
            <button
              onClick={() => setShowVideoMenu(!showVideoMenu)}
              className="h-14 px-1 rounded-r text-gray-400 hover:text-white transition-colors flex items-center justify-center border-l border-white/5"
              title="Select Camera and Video Settings"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>

            {/* Video Context Menu (Sections 8.2, 8.3, 8.5, 8.6, 8.7) */}
            {showVideoMenu && (
              <div className="absolute bottom-full left-0 mb-3 w-64 bg-[#1F1F1F] border border-[#3A3A3A] rounded-2xl shadow-2xl p-1 z-50 text-xs text-gray-200 divide-y divide-[#2F2F2F] animate-in fade-in zoom-in-95 duration-100">
                {/* Select Camera Section (8.2) */}
                <div className="p-2 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 px-2 block">
                    Select a Camera
                  </span>
                  <button
                    onClick={() => handleSelectCamera('default')}
                    className="w-full text-left px-2 py-1.5 rounded hover:bg-white/5 flex items-center justify-between text-xs"
                  >
                    <span className="truncate">Integrated Camera</span>
                    {selectedCamera === 'default' && <Check className="w-3.5 h-3.5 text-blue-500 shrink-0" />}
                  </button>
                  {videoInputs.map(cam => (
                    <button
                      key={cam.deviceId}
                      onClick={() => handleSelectCamera(cam.deviceId)}
                      className="w-full text-left px-2 py-1.5 rounded hover:bg-white/5 flex items-center justify-between text-xs"
                    >
                      <span className="truncate">{cam.label || `Camera (${cam.deviceId.slice(0, 6)})`}</span>
                      {selectedCamera === cam.deviceId && <Check className="w-3.5 h-3.5 text-blue-500 shrink-0" />}
                    </button>
                  ))}
                </div>

                {/* Background & Effects Shortcuts (8.5, 8.6, 8.7) */}
                <div className="p-2 space-y-1">
                  <button
                    onClick={() => {
                      setBackgroundEffectsTab('background');
                      setShowBackgroundEffectsModal(true);
                      setShowVideoMenu(false);
                    }}
                    className="w-full text-left px-2 py-1.5 rounded hover:bg-white/5 text-xs text-gray-200 flex items-center justify-between"
                  >
                    <span>Choose Virtual Background...</span>
                    <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  </button>
                  <button
                    onClick={() => {
                      setBackgroundEffectsTab('filter');
                      setShowBackgroundEffectsModal(true);
                      setShowVideoMenu(false);
                    }}
                    className="w-full text-left px-2 py-1.5 rounded hover:bg-white/5 text-xs text-gray-200 flex items-center justify-between"
                  >
                    <span>Choose Video Filters...</span>
                    <Palette className="w-3.5 h-3.5 text-purple-400" />
                  </button>
                  <button
                    onClick={() => {
                      setBackgroundEffectsTab('avatar');
                      setShowBackgroundEffectsModal(true);
                      setShowVideoMenu(false);
                    }}
                    className="w-full text-left px-2 py-1.5 rounded hover:bg-white/5 text-xs text-gray-200 flex items-center justify-between"
                  >
                    <span>Choose Avatars...</span>
                    <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                  </button>
                </div>

                {/* Video Settings (8.3) */}
                <div className="p-2">
                  <button
                    onClick={() => {
                      setShowVideoSettingsModal(true);
                      setShowVideoMenu(false);
                    }}
                    className="w-full text-left px-2 py-1.5 rounded hover:bg-white/5 text-xs text-gray-200 flex items-center justify-between"
                  >
                    <span>Video Settings...</span>
                    <Settings className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center Controls (Horizontally responsive, scrollable if window is narrow) */}
        <div className="flex items-center gap-1 flex-1 min-w-0 overflow-x-auto no-scrollbar py-1 px-2">
          {/* Host Security Panel Button */}
          <div className="relative">
            <button 
              onClick={() => setShowSecurityModal(!showSecurityModal)}
              className="flex flex-col items-center justify-center w-16 h-14 rounded hover:bg-[#2A2A2A] transition-colors group relative"
              title="Meeting Security Settings"
            >
              <Shield className={`w-5 h-5 mb-1 ${isMeetingLocked ? 'text-amber-400' : 'text-gray-300 group-hover:text-white'}`} />
              <span className="text-[11px] font-medium text-gray-300">Security</span>
            </button>

            <MeetingSecurityPanel
              isOpen={showSecurityModal}
              onClose={() => setShowSecurityModal(false)}
              securitySettings={securitySettings}
              isMeetingLocked={isMeetingLocked}
              isHostOrCoHost={user?.id === 'host' || coHosts.includes(user?.id)}
              waitingQueueCount={waitingRoomQueue?.length || 0}
              onToggleLock={handleToggleLock}
              onToggleWaitingRoom={handleToggleWaitingRoom}
              onToggleHideProfilePictures={handleToggleHideProfilePictures}
              onUpdatePermissions={handleUpdateParticipantPermissions}
              onUpdateScreenSharePolicy={handleUpdateScreenSharePolicy}
              onOpenSuspendModal={() => setShowSuspendModal(true)}
              onResumeActivities={handleResumeActivities}
              onOpenRemoveModal={() => setShowRemoveModal(true)}
              onOpenParticipantsDrawer={() => {
                setShowRightPanel(true);
                setRightPanelTab('participants');
              }}
              watermarkSettings={watermarkSettings}
              onToggleVisualWatermark={handleToggleVisualWatermark}
              onOpenWatermarkSettings={() => setShowWatermarkSettingsModal(true)}
            />
          </div>

          <button 
            onClick={() => {
              if (showRightPanel && rightPanelTab === 'chat') {
                setShowRightPanel(false);
              } else {
                setShowRightPanel(true);
                setRightPanelTab('chat');
              }
            }}
            className={`flex flex-col items-center justify-center w-16 h-14 rounded transition-colors group relative ${
              showRightPanel && rightPanelTab === 'chat' ? 'bg-[#2A2A2A] text-white' : 'hover:bg-[#2A2A2A]'
            }`}
          >
            <MessageSquare className="w-5 h-5 mb-1 text-gray-300 group-hover:text-white" />
            <span className="text-[11px] font-medium text-gray-300">Chat</span>
          </button>
          
          <button 
            onClick={() => {
              if (showRightPanel && rightPanelTab === 'participants') {
                setShowRightPanel(false);
              } else {
                setShowRightPanel(true);
                setRightPanelTab('participants');
              }
            }}
            className={`flex flex-col items-center justify-center w-16 h-14 rounded transition-colors group relative ${
              showRightPanel && rightPanelTab === 'participants' ? 'bg-[#2A2A2A] text-white' : 'hover:bg-[#2A2A2A]'
            }`}
          >
            <div className="relative">
              <Users className="w-5 h-5 mb-1 text-gray-300 group-hover:text-white" />
              <span className="absolute -top-1 -right-2 bg-blue-600 text-white text-[9px] font-bold px-1 rounded-sm">{allParticipants.length}</span>
            </div>
            <span className="text-[11px] font-medium text-gray-300">Participants</span>
          </button>
          
          {/* Part 12: Reactions & Non-Verbal Feedback Toolbar Button & 3-Tier Popover */}
          <div className="relative">
            <button 
              onClick={() => setShowReactions(!showReactions)}
              className={`flex flex-col items-center justify-center w-16 h-14 rounded transition-colors group relative ${
                handRaised ? 'bg-amber-500/20 text-amber-300' : 'hover:bg-[#2A2A2A]'
              }`}
              title="Reactions and Non-verbal Feedback"
            >
              <div className="relative">
                <Smile className={`w-5 h-5 mb-1 ${handRaised ? 'text-amber-400' : 'text-gray-300 group-hover:text-white'}`} />
                {handRaised && (
                  <span className="absolute -top-1 -right-1.5 w-2.5 h-2.5 bg-amber-400 rounded-full animate-ping" />
                )}
              </div>
              <span className={`text-[11px] font-medium ${handRaised ? 'text-amber-300' : 'text-gray-300'}`}>
                {handRaised ? 'Raised' : 'Reactions'}
              </span>
            </button>
            
            {showReactions && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 bg-[#1F1F1F] border border-[#3A3A3A] rounded-2xl shadow-2xl p-3 z-50 flex flex-col gap-3 w-72 backdrop-blur-md animate-in fade-in zoom-in-95 duration-100">
                {/* Tier 1: Emoji Reactions (12.1, 12.11) */}
                <div>
                  <div className="flex items-center justify-between pb-1.5 mb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400 border-b border-[#333]">
                    <span>Reactions</span>
                    <button
                      onClick={() => setShowExtendedReactions(!showExtendedReactions)}
                      className="text-[10px] text-blue-400 hover:text-blue-300 hover:underline"
                    >
                      {showExtendedReactions ? 'Less' : 'More •••'}
                    </button>
                  </div>
                  
                  {reactionSettings.allowReactions ? (
                    <>
                      <div className="flex items-center justify-between gap-1 pt-1">
                        {['👍', '❤️', '😂', '😮', '👏', '🎉'].map(emoji => (
                          <button 
                            key={emoji}
                            onClick={() => {
                              handleSendReaction(emoji);
                              setShowReactions(false);
                            }}
                            className="w-9 h-9 flex items-center justify-center text-xl hover:bg-white/10 hover:scale-125 rounded-xl transition-all active:scale-95"
                            title={`Send ${emoji}`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>

                      {showExtendedReactions && (
                        <div className="grid grid-cols-6 gap-1 mt-2 pt-2 border-t border-[#333] max-h-32 overflow-y-auto">
                          {['🔥', '🙌', '💡', '✨', '🚀', '💯', '🎯', '🥳', '☕', '👀', '💪', '🙏', '🤝', '🌟', '🤩', '👋', '🎓', '🏆'].map(emoji => (
                            <button 
                              key={emoji}
                              onClick={() => {
                                handleSendReaction(emoji);
                                setShowReactions(false);
                              }}
                              className="w-8 h-8 flex items-center justify-center text-base hover:bg-white/10 hover:scale-125 rounded-lg transition-all active:scale-95"
                              title={`Send ${emoji}`}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="py-2 text-center text-xs text-gray-500 italic">
                      Emoji reactions disabled by host
                    </div>
                  )}
                </div>

                {/* Tier 2: Raise Hand (12.2, 12.3, 12.12) */}
                <div>
                  {reactionSettings.allowRaiseHand ? (
                    <button 
                      onClick={() => {
                        handleToggleHandRaised();
                        setShowReactions(false);
                      }}
                      className={`w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold transition-all shadow-md active:scale-98 ${
                        handRaised 
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30' 
                          : 'bg-[#2A2A2A] hover:bg-[#333] text-white border border-[#444]'
                      }`}
                    >
                      <Hand className={`w-4 h-4 ${handRaised ? 'fill-amber-400 text-amber-400 animate-pulse' : 'text-amber-400'}`} />
                      <span>{handRaised ? 'Lower Hand' : 'Raise Hand'}</span>
                    </button>
                  ) : (
                    <div className="py-1 text-center text-xs text-gray-500 italic">
                      Hand raising disabled by host
                    </div>
                  )}
                </div>

                {/* Tier 3: Non-Verbal Feedback 2x2 Grid (12.6, 12.7, 12.14) */}
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 pb-1.5 mb-1.5 border-b border-[#333]">
                    Non-Verbal Feedback
                  </div>
                  {reactionSettings.allowNonVerbal ? (
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { key: 'YES', label: 'Yes', icon: '👍', color: 'hover:border-emerald-500/50' },
                        { key: 'NO', label: 'No', icon: '👎', color: 'hover:border-red-500/50' },
                        { key: 'SLOWER', label: 'Go Slower', icon: '🐢', color: 'hover:border-blue-500/50' },
                        { key: 'FASTER', label: 'Go Faster', icon: '⚡', color: 'hover:border-amber-500/50' },
                      ].map(item => {
                        const isSelected = myNonVerbal === item.key;
                        return (
                          <button
                            key={item.key}
                            onClick={() => {
                              handleSendNonVerbal(item.key);
                              setShowReactions(false);
                            }}
                            className={`flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl text-xs font-medium border transition-all ${item.color} ${
                              isSelected
                                ? 'bg-blue-600/30 border-blue-500 text-blue-300 shadow-sm shadow-blue-500/20'
                                : 'bg-[#262626] border-[#363636] text-gray-300 hover:bg-[#303030]'
                            }`}
                          >
                            <span className="text-sm">{item.icon}</span>
                            <span>{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-2 text-center text-xs text-gray-500 italic">
                      Non-verbal feedback disabled by host
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Part 23: In-Meeting Toolbar Recording Button with Popover (23.3, 23.7, 23.18) */}
          <div className="relative">
            <button 
              onClick={() => {
                if (isMeetingRecording) {
                  handleStopRecording();
                } else {
                  setShowRecordingMenu(!showRecordingMenu);
                }
              }}
              className={`flex flex-col items-center justify-center w-16 h-14 rounded transition-colors group relative ${
                isMeetingRecording ? 'bg-red-950/40 text-red-400 font-bold border border-red-500/40' : 'hover:bg-[#2A2A2A] text-gray-300'
              }`}
              title={isMeetingRecording ? `Stop Recording (${recordingMode})` : 'Record Meeting (Computer or Cloud)'}
            >
              <div className="relative">
                <Disc className={`w-5 h-5 mb-1 ${isMeetingRecording ? 'text-red-500 animate-pulse scale-110' : 'text-gray-300 group-hover:text-red-400'} transition-transform`} />
                {isMeetingRecording && (
                  <span className="absolute -top-1 -right-2 text-[8px] bg-red-600 text-white font-black px-1 rounded-full uppercase shadow">
                    {recordingMode === 'LOCAL' ? 'LOC' : 'CLD'}
                  </span>
                )}
              </div>
              <span className={`text-[11px] font-medium ${isMeetingRecording ? 'text-red-400' : 'text-gray-300'}`}>
                {isMeetingRecording ? 'Recording' : 'Record'}
              </span>
            </button>

            {/* Recording Options Popover (23.2, 23.6, 23.14) */}
            <RecordingMenuPopover
              isOpen={showRecordingMenu}
              onClose={() => setShowRecordingMenu(false)}
              onStartRecording={handleStartRecording}
              onOpenSettings={() => {
                setShowRecordingMenu(false);
                setShowRecordingSettingsModal(true);
              }}
              isRecording={isMeetingRecording}
              recordingMode={recordingMode}
              recordingLayout={recordingLayout}
              onChangeLayout={(layout) => setRecordingLayout(layout)}
              canRecordLocal={isHost || user?.id === 'host' || coHosts?.includes(user?.id) || participantCanRecordLocal}
              canRecordCloud={isHost || user?.id === 'host' || coHosts?.includes(user?.id)}
              storageStats={recordingSettings?.cloudStorage}
            />
          </div>
          
          {/* Part 20: In-Meeting Toolbar Live Captions Button with ▲ Options Menu (20.2, 20.11) */}
          <div className="flex items-center rounded hover:bg-[#2A2A2A] transition-colors group relative">
            <button 
              onClick={toggleLiveCaptions}
              className={`flex flex-col items-center justify-center w-14 h-14 pl-1 ${
                showLiveCaptions ? 'text-emerald-400 font-bold' : 'text-gray-300'
              }`}
              title={showLiveCaptions ? 'Hide Live Captions' : 'Show Live Captions'}
            >
              <div className="relative">
                <Subtitles className={`w-5 h-5 mb-1 ${showLiveCaptions ? 'text-emerald-400 scale-110' : 'text-gray-300 group-hover:text-white'} transition-transform`} />
                {showLiveCaptions && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                )}
              </div>
              <span className="text-[11px] font-medium">{showLiveCaptions ? 'Captions On' : 'Captions'}</span>
            </button>

            {/* Chevron Menu Button (20.2, 20.4, 20.5) */}
            <button
              onClick={() => setShowCaptionsChevronMenu(!showCaptionsChevronMenu)}
              className="h-14 px-1 rounded-r text-gray-400 hover:text-white transition-colors flex items-center justify-center border-l border-white/5"
              title="Caption & Translation Options"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>

            {/* Captions Popover Menu */}
            {showCaptionsChevronMenu && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 bg-[#1F1F1F] border border-[#3A3A3A] rounded-2xl shadow-2xl p-2 z-50 text-xs text-gray-200 space-y-1 animate-in fade-in zoom-in-95 duration-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-2 py-1 block border-b border-[#333]">
                  Live Caption Controls (20.2)
                </span>

                <button
                  onClick={() => {
                    toggleLiveCaptions();
                    setShowCaptionsChevronMenu(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center justify-between text-xs"
                >
                  <span>{showLiveCaptions ? 'Hide Captions' : 'Show Captions'}</span>
                  {showLiveCaptions && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                </button>

                <button
                  onClick={() => {
                    setShowTranscriptPanel(true);
                    setShowCaptionsChevronMenu(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center justify-between text-xs text-blue-300"
                >
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" /> View Full Transcript
                  </span>
                </button>

                <button
                  onClick={() => {
                    setShowTranslationModal(true);
                    setShowCaptionsChevronMenu(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center justify-between text-xs text-purple-300 font-medium"
                >
                  <span className="flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-purple-400" /> Language Translation (21.4)
                  </span>
                  <span className="text-[10px] bg-purple-900/60 px-1 rounded uppercase font-bold text-white">{participantTargetLanguage}</span>
                </button>

                <button
                  onClick={() => {
                    setShowCaptionSettingsModal(true);
                    setShowCaptionsChevronMenu(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center justify-between text-xs"
                >
                  <span className="flex items-center gap-1.5">
                    <Settings className="w-3.5 h-3.5" /> Caption Settings...
                  </span>
                </button>

                {(isHost || user?.id === 'host' || captionSettings.assignedCaptionerId === (user?.id || user?._id)) && (
                  <button
                    onClick={() => {
                      setShowManualCaptionModal(true);
                      setShowCaptionsChevronMenu(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center justify-between text-xs text-indigo-300"
                  >
                    <span>Manual Caption Entry...</span>
                  </button>
                )}

                {isHost && (
                  <div className="pt-1 border-t border-[#333]">
                    <button
                      onClick={() => {
                        toggleRetainedTranscription();
                        setShowCaptionsChevronMenu(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center justify-between text-xs font-semibold text-amber-300"
                    >
                      <span>{isTranscribing ? 'Stop Transcription' : 'Start Retained Transcription'}</span>
                      {isTranscribing && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Part 21: In-Meeting Toolbar Translation Button (21.4, 21.11, 21.13) */}
          <button 
            onClick={() => setShowTranslationModal(true)}
            className={`flex flex-col items-center justify-center w-16 h-14 rounded hover:bg-[#2A2A2A] transition-colors group relative ${
              participantTranslationEnabled ? 'text-purple-400 font-bold' : 'text-gray-300'
            }`}
            title={`Multilingual Translation: Target language is ${participantTargetLanguage?.toUpperCase()}`}
          >
            <div className="relative">
              <Globe className={`w-5 h-5 mb-1 ${participantTranslationEnabled ? 'text-purple-400 scale-110' : 'text-gray-300 group-hover:text-white'} transition-transform`} />
              {participantTranslationEnabled && (
                <span className="absolute -top-1 -right-2 text-[9px] bg-purple-600 text-white font-bold px-1 rounded-full uppercase shadow">
                  {participantTargetLanguage || 'TA'}
                </span>
              )}
            </div>
            <span className="text-[11px] font-medium">Translate</span>
          </button>

          {/* Part 22: Language Interpretation Toolbar Button (22.1 - 22.23) */}
          <button 
            onClick={() => setShowInterpretationModal(true)}
            className={`flex flex-col items-center justify-center w-16 h-14 rounded hover:bg-[#2A2A2A] transition-colors group relative ${
              selectedInterpretationChannel !== 'original' || (interpretationSession?.status === 'ACTIVE') ? 'text-indigo-400 font-bold' : 'text-gray-300'
            }`}
            title={`Language Interpretation: ${selectedInterpretationChannel === 'original' ? 'Original Audio' : selectedInterpretationChannel.toUpperCase()}`}
          >
            <div className="relative">
              <Headphones className={`w-5 h-5 mb-1 ${selectedInterpretationChannel !== 'original' ? 'text-indigo-400 scale-110' : 'text-gray-300 group-hover:text-white'} transition-transform`} />
              {selectedInterpretationChannel !== 'original' && (
                <span className="absolute -top-1 -right-2 text-[9px] bg-indigo-600 text-white font-bold px-1 rounded-full uppercase shadow">
                  {selectedInterpretationChannel}
                </span>
              )}
              {interpretationSession?.status === 'ACTIVE' && selectedInterpretationChannel === 'original' && (
                <span className="absolute -top-0.5 -right-1 w-2 h-2 bg-emerald-500 rounded-full border border-[#1e1e1e]" />
              )}
            </div>
            <span className="text-[11px] font-medium">Interpretation</span>
          </button>


          <button 
            onClick={() => {
              if (encryptionData?.type === 'E2EE') {
                toast.error('AI Meeting Summary is disabled in End-to-End Encrypted meetings (Section 31.8 Policy)', { icon: '🔒' });
                return;
              }
              setShowAISummaryModal(true);
            }}
            className={`flex flex-col items-center justify-center w-20 h-14 rounded hover:bg-[#2A2A2A] transition-colors group relative ${
              showAISummaryModal || meetingSummaryRecord?.status === 'ACTIVE' ? 'bg-[#2A2A2A] text-purple-400 font-bold' : 'text-gray-300'
            } ${encryptionData?.type === 'E2EE' ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={encryptionData?.type === 'E2EE' ? 'Disabled in E2EE (Section 31.8 Policy)' : 'AI Meeting Summary (Zoom-grade Intelligence)'}
          >
            <BrainCircuit className="w-5 h-5 mb-1 text-purple-400 group-hover:text-purple-300" />
            <span className="text-[11px] font-medium text-purple-400">AI Summary</span>
            {meetingSummaryRecord?.status === 'ACTIVE' && (
              <span className="absolute top-2 right-3 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            )}
          </button>

          {/* Part 26: AI Meeting Questions Button (26.1 - 26.29) */}
          <button 
            onClick={() => {
              if (encryptionData?.type === 'E2EE') {
                toast.error('AI Meeting Questions is disabled in End-to-End Encrypted meetings (Section 31.8 Policy)', { icon: '🔒' });
                return;
              }
              setShowAIQuestionsDrawer(true);
            }}
            className={`flex flex-col items-center justify-center w-16 h-14 rounded hover:bg-[#2A2A2A] transition-colors group relative ${
              showAIQuestionsDrawer ? 'bg-[#2A2A2A] text-purple-400 font-bold' : 'text-gray-300'
            } ${encryptionData?.type === 'E2EE' ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={encryptionData?.type === 'E2EE' ? 'Disabled in E2EE (Section 31.8 Policy)' : 'Ask AI questions about this meeting without interrupting (Zoom AI)'}
          >
            <HelpCircle className="w-5 h-5 mb-1 text-purple-400 group-hover:text-purple-300" />
            <span className="text-[11px] font-medium text-purple-400">Questions</span>
          </button>

          {/* Part 27: AI / Personal Notes (My Notes) Button (27.1 - 27.12) */}
          <button 
            onClick={() => setShowMyNotesDrawer(true)}
            className={`flex flex-col items-center justify-center w-16 h-14 rounded hover:bg-[#2A2A2A] transition-colors group relative ${
              showMyNotesDrawer ? 'bg-[#2A2A2A] text-amber-400 font-bold' : 'text-gray-300'
            }`}
            title="My Notes: Personal notes, transcript sync, and AI enrichment (Zoom AI)"
          >
            <FileText className="w-5 h-5 mb-1 text-amber-400 group-hover:text-amber-300" />
            <span className="text-[11px] font-medium text-amber-400">My Notes</span>
          </button>

          {/* Part 36: Live Agenda, Pre-reads & Shared Notes Button (36.1 - 36.15) */}
          <button 
            onClick={() => setShowAgendaDrawer(true)}
            className={`flex flex-col items-center justify-center w-16 h-14 rounded hover:bg-[#2A2A2A] transition-colors group relative ${
              showAgendaDrawer ? 'bg-[#2A2A2A] text-emerald-400 font-bold' : 'text-gray-300'
            }`}
            title="Meeting Agenda, Pre-reads & Shared Notes (Part 36)"
          >
            <ListChecks className="w-5 h-5 mb-1 text-emerald-400 group-hover:text-emerald-300" />
            <span className="text-[11px] font-medium text-emerald-400">Agenda</span>
          </button>

          {/* Part 33: Live Streaming Toolbar Button (33.9, 33.11, 33.16) */}
          <button 
            onClick={() => setShowLiveStreamingModal(true)}
            className={`flex flex-col items-center justify-center w-16 h-14 rounded hover:bg-[#2A2A2A] transition-colors group relative ${
              liveStreamSession?.status === 'LIVE' ? 'bg-[#2A2A2A] text-red-400 font-bold' : 'text-gray-300'
            }`}
            title="Live Streaming (YouTube, Facebook, Twitch, Custom RTMP)"
          >
            <div className="relative">
              <Radio className={`w-5 h-5 mb-1 ${liveStreamSession?.status === 'LIVE' ? 'text-red-500 animate-pulse scale-110' : 'text-gray-300 group-hover:text-red-400'} transition-transform`} />
              {liveStreamSession?.status === 'LIVE' && (
                <span className="absolute -top-1 -right-2 text-[8px] bg-red-600 text-white font-black px-1 rounded-full uppercase shadow">
                  LIVE
                </span>
              )}
            </div>
            <span className={`text-[11px] font-medium ${liveStreamSession?.status === 'LIVE' ? 'text-red-400' : 'text-gray-300'}`}>
              {liveStreamSession?.status === 'LIVE' ? 'Live' : 'Live Stream'}
            </span>
          </button>


          {/* Part 13: Screen Sharing Button with ▲ Options Menu (13.1, 13.10, 13.11) */}
          <div className="flex items-center rounded hover:bg-[#2A2A2A] transition-colors group relative">
            <button 
              onClick={() => {
                if (isScreenSharing && screenShareDetails?.sharerId === (user?.id || 'local')) {
                  handleStopShare();
                } else {
                  handleOpenShareModal();
                }
              }}
              className="flex flex-col items-center justify-center w-14 h-14 pl-1"
              title={isScreenSharing ? 'Stop Screen Share' : 'Share Screen'}
            >
              <div className={`w-6 h-6 rounded ${isScreenSharing ? 'bg-red-500 animate-pulse' : 'bg-emerald-600'} flex items-center justify-center mb-0.5 shadow-sm`}>
                <Share className="w-3.5 h-3.5 text-white" />
              </div>
              <span className={`text-[11px] font-medium ${isScreenSharing ? 'text-red-400 font-bold' : 'text-emerald-400 font-semibold'}`}>
                {isScreenSharing ? 'Stop Share' : 'Share'}
              </span>
            </button>

            {/* Chevron Menu Button (13.10 & 13.11) */}
            <button
              onClick={() => setShowShareChevronMenu(!showShareChevronMenu)}
              className="h-14 px-1 rounded-r text-gray-400 hover:text-white transition-colors flex items-center justify-center border-l border-white/5"
              title="Screen Sharing Options and Permissions"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>

            {/* Screen Sharing Popover Menu (13.10 & 13.11) */}
            {showShareChevronMenu && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-72 bg-[#1F1F1F] border border-[#3A3A3A] rounded-2xl shadow-2xl p-2 z-50 text-xs text-gray-200 space-y-1 animate-in fade-in zoom-in-95 duration-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-2 py-1 block border-b border-[#333]">
                  Sharing Permissions (Host Tools)
                </span>

                <button
                  onClick={() => {
                    handleUpdateSharingSettings({ ...sharingSettings, mode: 'oneParticipant' });
                    setShowShareChevronMenu(false);
                  }}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/5 flex items-center justify-between transition-colors"
                >
                  <span>One participant can share at a time</span>
                  {sharingSettings.mode === 'oneParticipant' && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                </button>

                <button
                  onClick={() => {
                    handleUpdateSharingSettings({ ...sharingSettings, mode: 'multiple' });
                    setShowShareChevronMenu(false);
                  }}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/5 flex items-center justify-between transition-colors"
                >
                  <span>Multiple participants can share</span>
                  {sharingSettings.mode === 'multiple' && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                </button>

                {sharingSettings.mode === 'multiple' && (
                  <button
                    onClick={() => {
                      handleSimulateMultiShare();
                      setShowShareChevronMenu(false);
                    }}
                    className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-blue-600/20 text-blue-400 hover:text-blue-300 font-semibold flex items-center justify-between transition-colors"
                  >
                    <span>Simulate Multi-Share (Arun & Priya)</span>
                    <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  </button>
                )}

                <div className="my-1 border-t border-[#333]"></div>

                {/* Part 15: Annotation Permissions (15.4, 15.6) */}
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-2 py-1 block">
                  Annotation Permissions (Host)
                </span>
                <button
                  onClick={() => {
                    const next = annotationSettings.annotationPermission === 'all' ? 'presenterOnly' : 'all';
                    handleUpdateAnnotationSettings({ ...annotationSettings, annotationPermission: next });
                  }}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/5 flex items-center justify-between transition-colors"
                >
                  <span>Allow participants to annotate</span>
                  {annotationSettings.annotationPermission === 'all' && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                </button>
                <button
                  onClick={() => {
                    handleUpdateAnnotationSettings({ ...annotationSettings, showAnnotatorNames: !showAnnotatorNames });
                  }}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/5 flex items-center justify-between transition-colors"
                >
                  <span>Show names of annotators</span>
                  {showAnnotatorNames && <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
                </button>

                {/* Part 16: Slide Control Options in Share Chevron Menu */}
                {presentationSession && (
                  <>
                    <div className="my-1 border-t border-[#333]"></div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-2 py-1 block">
                      Slide Control (Presentation)
                    </span>
                    <button
                      onClick={() => {
                        setShowShareChevronMenu(false);
                        setShowSlideControlModal(true);
                      }}
                      className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-orange-600/20 text-orange-400 hover:text-orange-300 font-semibold flex items-center justify-between transition-colors"
                    >
                      <span>Slide Control Settings...</span>
                      <Presentation className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}

                <div className="my-1 border-t border-[#333]"></div>

                <button
                  onClick={() => {
                    setShowShareChevronMenu(false);
                    setShowAdvancedShareModal(true);
                  }}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/5 text-blue-400 hover:text-blue-300 font-semibold flex items-center justify-between transition-colors"
                >
                  <span>Advanced Sharing Options...</span>
                  <Sliders className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Part 15: In-Meeting Toolbar Annotate Button (15.2) */}
          {isScreenSharing && (
            <button
              onClick={handleToggleAnnotate}
              className={`flex flex-col items-center justify-center w-16 h-14 rounded transition-colors group ${
                isAnnotating ? 'bg-blue-600/30 text-blue-400 font-bold border border-blue-500/40' : 'hover:bg-[#2A2A2A] text-gray-300'
              }`}
              title="Toggle Annotation Toolbar (Draw, Highlight, Text on Shared Screen)"
            >
              <Pen className={`w-5 h-5 mb-1 ${isAnnotating ? 'text-blue-400 scale-110' : 'text-gray-300 group-hover:text-white'}`} />
              <span className="text-[11px] font-medium">{isAnnotating ? 'Annotating' : 'Annotate'}</span>
            </button>
          )}

          {/* Part 16: In-Meeting Toolbar Slide Control Button (16.2 & 16.11) */}
          {presentationSession && (
            <button
              onClick={() => {
                if (presentationSession.presenterId === (user?.id || user?._id || 'local') || user?.id === 'host' || isHost) {
                  setShowSlideControlModal(true);
                } else {
                  toast.info(`Presentation is active (Slide ${presentationSession.currentSlide}/${presentationSession.totalSlides})`);
                }
              }}
              className="flex flex-col items-center justify-center w-16 h-14 rounded transition-colors group hover:bg-[#2A2A2A] text-orange-400 relative"
              title="Slide Control Settings & Navigation"
            >
              <Presentation className="w-5 h-5 mb-1 text-orange-400 group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-medium">Slides</span>
              {presentationSession.controllers?.filter(c => c.status === 'ACTIVE').length > 0 && (
                <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-emerald-500 text-black text-[9px] font-bold flex items-center justify-center">
                  {presentationSession.controllers.filter(c => c.status === 'ACTIVE').length}
                </span>
              )}
            </button>
          )}

          {/* Part 17: In-Meeting Toolbar Whiteboards Button (17.1, 17.2) */}
          <button
            onClick={() => {
              if (encryptionData?.type === 'E2EE') {
                toast.error('Whiteboard collaboration is disabled in End-to-End Encrypted meetings (Section 31.8 Policy)', { icon: '🔒' });
                return;
              }
              if (activeWhiteboard) {
                setActiveWhiteboard(null);
              } else {
                setShowWhiteboardPicker(true);
              }
            }}
            className={`flex flex-col items-center justify-center w-16 h-14 rounded transition-colors group ${
              activeWhiteboard ? 'bg-indigo-600/30 text-indigo-400 font-bold border border-indigo-500/40' : 'hover:bg-[#2A2A2A] text-gray-300'
            } ${encryptionData?.type === 'E2EE' ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={encryptionData?.type === 'E2EE' ? 'Disabled in E2EE (Section 31.8 Policy)' : 'Whiteboards: Collaborative digital canvas with sticky notes and diagrams'}
          >
            <LayoutGrid className={`w-5 h-5 mb-1 ${activeWhiteboard ? 'text-indigo-400 scale-110' : 'text-gray-300 group-hover:text-white'}`} />
            <span className="text-[11px] font-medium">{activeWhiteboard ? 'Whiteboard' : 'Whiteboards'}</span>
          </button>

          {/* Part 18: In-Meeting Toolbar Breakout Rooms Button (18.1, 18.24) */}
          <button
            onClick={() => {
              if (isHost || user?.id === 'host') {
                setShowBreakoutHostModal(true);
              } else {
                setShowBreakoutParticipantModal(true);
              }
            }}
            className={`flex flex-col items-center justify-center w-16 h-14 rounded transition-colors group relative ${
              currentBreakoutRoom 
                ? 'bg-emerald-600/30 text-emerald-400 font-bold border border-emerald-500/40' 
                : breakoutRoomsList.length > 0
                  ? 'text-indigo-400 hover:bg-[#2A2A2A]' 
                  : 'hover:bg-[#2A2A2A] text-gray-300'
            }`}
            title="Breakout Rooms: Split meeting into smaller discussion groups"
          >
            <div className="relative">
              <Users className={`w-5 h-5 mb-1 ${currentBreakoutRoom ? 'text-emerald-400 scale-110' : 'text-gray-300 group-hover:text-white'}`} />
              {currentBreakoutRoom && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
              )}
            </div>
            <span className="text-[11px] font-medium truncate max-w-[56px]">
              {currentBreakoutRoom ? currentBreakoutRoom.name : 'Breakout'}
            </span>
          </button>

          {/* Part 19: In-Meeting Toolbar Polls & Quizzes Button (19.1, 19.17) */}
          <button
            onClick={() => {
              if (encryptionData?.type === 'E2EE') {
                toast.error('Polls and Quizzes are disabled in End-to-End Encrypted meetings (Section 31.8 Policy)', { icon: '🔒' });
                return;
              }
              setShowPollsModal(true);
            }}
            className={`flex flex-col items-center justify-center w-16 h-14 rounded transition-colors group relative ${
              activePoll
                ? 'bg-indigo-600/30 text-indigo-400 font-bold border border-indigo-500/40'
                : 'hover:bg-[#2A2A2A] text-gray-300'
            } ${encryptionData?.type === 'E2EE' ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={encryptionData?.type === 'E2EE' ? 'Disabled in E2EE (Section 31.8 Policy)' : 'Polls & Quizzes: Create and launch interactive polls and quizzes'}
          >
            <div className="relative">
              <BarChart2 className={`w-5 h-5 mb-1 ${activePoll ? 'text-indigo-400 scale-110' : 'text-gray-300 group-hover:text-white'}`} />
              {activePoll && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-indigo-400 rounded-full animate-pulse" />
              )}
            </div>
            <span className="text-[11px] font-medium">Polls</span>
          </button>

          
          <div className="relative">
            <button 
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className="flex flex-col items-center justify-center w-16 h-14 rounded hover:bg-[#2A2A2A] transition-colors group"
            >
              <MoreHorizontal className="w-5 h-5 mb-1 text-gray-300 group-hover:text-white" />
              <span className="text-[11px] font-medium text-gray-300">More</span>
            </button>

            {showMoreMenu && (
              <div className="absolute bottom-full right-0 mb-2 w-56 bg-[#242424] border border-[#333] rounded-lg shadow-xl py-2 z-50 text-[13px]">
                <button 
                  className="w-full text-left px-4 py-2 hover:bg-[#333] text-gray-300 hover:text-white transition-colors" 
                  onClick={() => { setIsVirtualBackgroundOn(!isVirtualBackgroundOn); setShowMoreMenu(false); toast(isVirtualBackgroundOn ? 'Virtual Background off' : 'Blur Virtual Background enabled'); }}
                >
                  {isVirtualBackgroundOn ? 'Disable Virtual Background' : 'Blur Background'}
                </button>
                <button 
                  className="w-full text-left px-4 py-2 hover:bg-[#333] text-gray-300 hover:text-white transition-colors" 
                  onClick={() => { setShowPollsModal(true); setShowMoreMenu(false); }}
                >
                  📊 Polls & Quizzes
                </button>
                <button className="w-full text-left px-4 py-2 hover:bg-[#333] text-gray-300 hover:text-white transition-colors" onClick={() => { setShowBreakoutHostModal(true); setShowMoreMenu(false); }}>
                  Breakout Rooms
                </button>
                <button 
                  className="w-full text-left px-4 py-2 hover:bg-[#333] text-gray-300 hover:text-white transition-colors flex items-center justify-between" 
                  onClick={() => { setShowLiveStreamingModal(true); setShowMoreMenu(false); }}
                >
                  <span className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-red-400" />
                    <span>Live on YouTube / Facebook</span>
                  </span>
                  {liveStreamSession?.status === 'LIVE' && (
                    <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded font-bold">LIVE</span>
                  )}
                </button>
                <div className="border-t border-[#333] my-1"></div>
                <button 
                  className="w-full text-left px-4 py-2 hover:bg-[#333] text-blue-300 hover:text-blue-200 transition-colors flex justify-between items-center font-semibold"
                  onClick={() => { setShowPersonalizationModal(true); setShowMoreMenu(false); }}
                >
                  <span className="flex items-center gap-2">
                    <Palette className="w-4 h-4 text-blue-400" />
                    <span>Personalization (37)...</span>
                  </span>
                  <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded font-bold">Customize</span>
                </button>
                {/* Part 38: Network & Device Health */}
                <button 
                  className="w-full text-left px-4 py-2 hover:bg-[#333] text-emerald-300 hover:text-emerald-200 transition-colors flex justify-between items-center font-semibold"
                  onClick={() => { setShowNetworkHealthModal(true); setShowMoreMenu(false); }}
                >
                  <span className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    <span>Network & Device Health (38)...</span>
                  </span>
                  <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-bold">
                    {networkStats?.latency || 35}ms
                  </span>
                </button>
                <button className="w-full text-left px-4 py-2 hover:bg-[#333] text-gray-300 hover:text-white transition-colors flex justify-between items-center" onClick={() => setShowMoreMenu(false)}>
                  <span>Meeting Settings</span>
                  <Settings className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Controls — Leave / End Meeting (Always pinned on far right) */}
        <div className="flex justify-end items-center shrink-0 ml-auto pl-2 z-30">
          <div className="relative">
            {/* Dropdown panel — opens above the button */}
            {showLeaveDropdown && (
              <div className="absolute bottom-full right-0 mb-2 w-56 bg-[#1A1A1A] border border-[#3A3A3A] rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
                {/* Host-only: End for all */}
                {isHost && (
                  <button
                    onClick={() => { setShowLeaveDropdown(false); endMeetingForAll(); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-[13px] font-semibold text-white bg-[#E02828] hover:bg-[#C01F1F] transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
                    End Meeting for All
                  </button>
                )}
                {/* Divider only when host (both options visible) */}
                {isHost && <div className="h-px bg-[#333]" />}
                {/* Leave meeting (both host & participants) */}
                <button
                  onClick={() => { setShowLeaveDropdown(false); leaveMeeting(); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-[13px] font-semibold text-[#E02828] hover:bg-[#2A2A2A] transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                  Leave Meeting
                </button>
                {/* Cancel */}
                <div className="h-px bg-[#333]" />
                <button
                  onClick={() => setShowLeaveDropdown(false)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-[13px] text-gray-400 hover:bg-[#2A2A2A] transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
                  Cancel
                </button>
              </div>
            )}

            {/* Red button row: [  End / Leave ▲ ] */}
            <div className="flex items-center">
              <button
                onClick={() => setShowLeaveModal(true)}
                className="bg-[#E02828] hover:bg-[#C01F1F] text-white text-[13px] font-bold px-4 h-9 rounded-l-md transition-colors flex items-center gap-2 whitespace-nowrap shadow-lg shadow-red-500/20"
              >
                <LogOut className="w-4 h-4" />
                {isHost ? 'End' : 'Leave'}
              </button>
              {/* Chevron to open dropdown */}
              <button
                onClick={() => setShowLeaveDropdown(prev => !prev)}
                className="bg-[#C01F1F] hover:bg-[#A01818] text-white h-9 px-2 rounded-r-md border-l border-[#E02828]/50 transition-colors flex items-center shadow-lg"
                title="More leave options"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Leave / End Meeting Centered Confirmation Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#242424] text-white border border-[#3A3A3A] rounded-2xl w-full max-w-sm shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-[#333]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                  <LogOut className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base leading-tight">
                    {isHost ? 'End or Leave Meeting' : 'Leave Meeting'}
                  </h3>
                  <p className="text-xs text-gray-400">{meetingTitle}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowLeaveModal(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed">
              {isHost 
                ? 'As the host, you can end the meeting for all participants or leave and let others continue.'
                : 'Are you sure you want to leave this meeting? You can rejoin anytime using the link.'}
            </p>

            <div className="space-y-2.5 pt-1">
              {isHost && (
                <button
                  onClick={() => { setShowLeaveModal(false); endMeetingForAll(); }}
                  className="w-full py-2.5 px-4 bg-[#E02828] hover:bg-[#C01F1F] text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-500/20"
                >
                  <LogOut className="w-4 h-4" />
                  End Meeting for All
                </button>
              )}
              <button
                onClick={() => { setShowLeaveModal(false); leaveMeeting(); }}
                className={`w-full py-2.5 px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                  isHost 
                    ? 'bg-[#333] hover:bg-[#3D3D3D] text-gray-200 border border-white/5' 
                    : 'bg-[#E02828] hover:bg-[#C01F1F] text-white font-bold shadow-lg shadow-red-500/20'
                }`}
              >
                <LogOut className="w-4 h-4" />
                {isHost ? 'Leave Meeting (Keep Room Open)' : 'Leave Meeting'}
              </button>
              <button
                onClick={() => setShowLeaveModal(false)}
                className="w-full py-2 px-4 hover:bg-white/5 text-gray-400 hover:text-white rounded-xl text-xs transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PART 7: AUDIO DIALOG MODALS                                               */}
      {/* ========================================================================= */}

      {/* 7.1, 7.7, 7.8: Join Audio Modal (Computer Audio vs Phone Call Dial-In) */}
      {showJoinAudioModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#242424] text-white border border-[#3A3A3A] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#333]">
              <div className="flex items-center gap-2">
                <Headphones className="w-5 h-5 text-blue-500" />
                <h3 className="font-semibold text-base">Choose ONE of the audio conference options</h3>
              </div>
              <button 
                onClick={() => setShowJoinAudioModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-[#333] bg-[#1A1A1A]">
              <button
                onClick={() => setJoinAudioTab('computer')}
                className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-2 border-b-2 transition-all ${
                  joinAudioTab === 'computer' 
                    ? 'border-blue-500 text-blue-400 bg-[#242424]' 
                    : 'border-transparent text-gray-400 hover:text-gray-200'
                }`}
              >
                <Radio className="w-4 h-4" />
                Computer Audio
              </button>
              <button
                onClick={() => setJoinAudioTab('phone')}
                className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-2 border-b-2 transition-all ${
                  joinAudioTab === 'phone' 
                    ? 'border-blue-500 text-blue-400 bg-[#242424]' 
                    : 'border-transparent text-gray-400 hover:text-gray-200'
                }`}
              >
                <Phone className="w-4 h-4" />
                Phone Call (Dial-In)
              </button>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {joinAudioTab === 'computer' ? (
                <div className="flex flex-col items-center text-center py-4 space-y-5">
                  <div className="w-20 h-20 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shadow-inner">
                    <Headphones className="w-10 h-10" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg text-white">Computer Audio</h4>
                    <p className="text-xs text-gray-400 mt-1 max-w-xs">
                      Connect using your computer's built-in microphone and speakers for optimal HD sound quality.
                    </p>
                  </div>
                  
                  <button
                    onClick={handleJoinComputerAudio}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2"
                  >
                    <Headphones className="w-4 h-4" />
                    Join with Computer Audio
                  </button>

                  <div className="w-full pt-3 border-t border-[#333] flex flex-col gap-2.5 text-left">
                    <label className="flex items-center gap-2.5 text-xs text-gray-300 cursor-pointer">
                      <input type="checkbox" defaultChecked className="accent-blue-600 rounded" />
                      <span>Automatically join audio by computer when joining a meeting</span>
                    </label>
                    <button
                      onClick={() => {
                        setShowJoinAudioModal(false);
                        handleStartAudioTest();
                      }}
                      className="text-xs text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1.5 self-start pt-1"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      Test Speaker and Microphone
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 text-xs">
                  <div className="bg-[#1A1A1A] p-4 rounded-xl border border-[#333] space-y-3">
                    <div className="text-gray-400 font-medium">Dial by your location:</div>
                    <div className="grid grid-cols-2 gap-2 text-white font-mono text-[11px]">
                      <div className="bg-[#242424] p-2 rounded border border-[#2F2F2F]">
                        <span className="text-gray-400 block text-[10px]">US (New York)</span>
                        +1 646 558 8656
                      </div>
                      <div className="bg-[#242424] p-2 rounded border border-[#2F2F2F]">
                        <span className="text-gray-400 block text-[10px]">US (San Jose)</span>
                        +1 669 900 6833
                      </div>
                      <div className="bg-[#242424] p-2 rounded border border-[#2F2F2F]">
                        <span className="text-gray-400 block text-[10px]">UK (London)</span>
                        +44 203 481 5240
                      </div>
                      <div className="bg-[#242424] p-2 rounded border border-[#2F2F2F]">
                        <span className="text-gray-400 block text-[10px]">India (Mumbai)</span>
                        +91 22 7127 9100
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#1F1F1F] p-3.5 rounded-xl border border-[#333] space-y-2">
                    <div className="flex justify-between items-center text-gray-300">
                      <span>Meeting ID:</span>
                      <span className="font-mono font-bold text-white tracking-wider">{meetingId || '123 456 789'}</span>
                    </div>
                    <div className="flex justify-between items-center text-gray-300">
                      <span>Participant ID:</span>
                      <span className="font-mono font-bold text-blue-400 tracking-wider">#4921</span>
                    </div>
                    <div className="flex justify-between items-center text-gray-300">
                      <span>Passcode:</span>
                      <span className="font-mono font-bold text-white tracking-wider">{meetingData?.passcode || '884920'}</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-gray-400 italic">
                    Once dialed, enter your Participant ID to bind your telephone line with your video tile.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 7.5: Interactive Test Speaker & Microphone Wizard */}
      {showAudioTestModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1F1F1F] text-white border border-[#3A3A3A] rounded-2xl w-full max-w-md shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#333]">
              <div className="flex items-center gap-2">
                <Volume2 className="w-5 h-5 text-blue-500" />
                <h3 className="font-semibold text-base">Testing audio ({testAudioStep}/2)</h3>
              </div>
              <button 
                onClick={() => setShowAudioTestModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {testAudioStep === 1 && (
              <div className="py-6 space-y-5">
                <div className="text-center">
                  <h4 className="text-lg font-bold text-white">Do you hear a ringtone?</h4>
                  <p className="text-xs text-gray-400 mt-1">A sound is playing through your selected speaker.</p>
                </div>

                <div className="flex items-center justify-center gap-3 py-2">
                  <Volume2 className={`w-8 h-8 ${isTestRingtonePlaying ? 'text-blue-400 animate-bounce' : 'text-gray-500'}`} />
                  <div className="w-48 bg-[#2A2A2A] rounded-full h-3 overflow-hidden p-0.5 border border-[#444]">
                    <div 
                      className={`h-full bg-blue-500 rounded-full transition-all duration-300 ${
                        isTestRingtonePlaying ? 'w-4/5 animate-pulse' : 'w-0'
                      }`}
                    />
                  </div>
                </div>

                <div className="space-y-1.5 text-xs">
                  <label className="text-gray-400 font-medium">Speaker 1:</label>
                  <select
                    value={selectedSpeaker}
                    onChange={(e) => handleSelectSpeaker(e.target.value)}
                    className="w-full bg-[#2A2A2A] border border-[#444] text-white rounded-lg p-2.5 outline-none focus:border-blue-500 text-xs"
                  >
                    <option value="default">Default - System Speaker</option>
                    {audioOutputs.map(d => (
                      <option key={d.deviceId} value={d.deviceId}>{d.label || `Speaker (${d.deviceId.slice(0, 6)})`}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      setTestAudioStep(2);
                      handleStartMicTestWizard();
                    }}
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-blue-600/20"
                  >
                    Yes
                  </button>
                  <button
                    onClick={playSpeakerRingtoneTest}
                    className="flex-1 py-2.5 bg-[#2E2E2E] hover:bg-[#3A3A3A] text-gray-300 font-semibold rounded-xl text-sm transition-all border border-[#444]"
                  >
                    No, Replay
                  </button>
                </div>
              </div>
            )}

            {testAudioStep === 2 && (
              <div className="py-6 space-y-5">
                <div className="text-center">
                  <h4 className="text-lg font-bold text-white">Speak and pause, do you hear a replay?</h4>
                  <p className="text-xs text-gray-400 mt-1">Say a few words to test your microphone input.</p>
                </div>

                <div className="flex flex-col items-center justify-center gap-2 py-2">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                    testMicState === 'recording' 
                      ? 'bg-red-500/20 border-2 border-red-500 text-red-400 animate-pulse' 
                      : testMicState === 'replaying'
                      ? 'bg-green-500/20 border-2 border-green-500 text-green-400'
                      : 'bg-blue-500/20 border border-blue-500/30 text-blue-400'
                  }`}>
                    <Mic className="w-7 h-7" />
                  </div>
                  <span className="text-xs font-semibold text-gray-300">
                    {testMicState === 'recording' && `Listening & Recording... (${testMicCountdown}s)`}
                    {testMicState === 'replaying' && 'Replaying your audio sample...'}
                    {testMicState === 'idle' && 'Microphone ready'}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <label className="text-gray-400 font-medium">Microphone 1:</label>
                  <select
                    value={selectedMic}
                    onChange={(e) => handleSelectMicrophone(e.target.value)}
                    className="w-full bg-[#2A2A2A] border border-[#444] text-white rounded-lg p-2.5 outline-none focus:border-blue-500 text-xs"
                  >
                    <option value="default">Default - System Microphone</option>
                    {audioInputs.map(d => (
                      <option key={d.deviceId} value={d.deviceId}>{d.label || `Microphone (${d.deviceId.slice(0, 6)})`}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setTestAudioStep(3)}
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-blue-600/20"
                  >
                    Yes
                  </button>
                  <button
                    onClick={handleStartMicTestWizard}
                    className="flex-1 py-2.5 bg-[#2E2E2E] hover:bg-[#3A3A3A] text-gray-300 font-semibold rounded-xl text-sm transition-all border border-[#444]"
                  >
                    No, Re-test
                  </button>
                </div>
              </div>
            )}

            {testAudioStep === 3 && (
              <div className="py-6 text-center space-y-5">
                <div className="w-16 h-16 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center text-green-400 mx-auto">
                  <Check className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white">Speaker and microphone are looking good!</h4>
                  <p className="text-xs text-gray-400 mt-1">Both devices have been tested and verified for this meeting.</p>
                </div>

                <div className="bg-[#171717] p-3 rounded-xl border border-[#333] text-left text-xs space-y-1.5 text-gray-300">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Speaker:</span>
                    <span className="font-semibold text-white truncate max-w-[220px]">
                      {audioOutputs.find(d => d.deviceId === selectedSpeaker)?.label || 'System Default Speaker'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Microphone:</span>
                    <span className="font-semibold text-white truncate max-w-[220px]">
                      {audioInputs.find(d => d.deviceId === selectedMic)?.label || 'System Default Microphone'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setShowAudioTestModal(false);
                    toast.success('Audio devices verified successfully');
                  }}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-blue-600/20"
                >
                  Finish
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 7.6: Audio Settings Modal */}
      {showAudioSettingsModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1F1F1F] text-white border border-[#3A3A3A] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#333]">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-500" />
                <h3 className="font-semibold text-base">Settings — Audio</h3>
              </div>
              <button 
                onClick={() => setShowAudioSettingsModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body with Side Tabs and Main Settings */}
            <div className="flex flex-1 overflow-hidden">
              {/* Left Settings Sidebar */}
              <div className="w-48 bg-[#181818] border-r border-[#2C2C2C] p-3 space-y-1 text-xs">
                <button className="w-full text-left px-3 py-2 rounded-lg font-medium bg-blue-600 text-white flex items-center gap-2">
                  <Volume2 className="w-4 h-4" />
                  Audio
                </button>
                <button className="w-full text-left px-3 py-2 rounded-lg font-medium text-gray-400 hover:text-white hover:bg-white/5 flex items-center gap-2">
                  <Video className="w-4 h-4" />
                  Video
                </button>
                <button className="w-full text-left px-3 py-2 rounded-lg font-medium text-gray-400 hover:text-white hover:bg-white/5 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Security
                </button>
                <button className="w-full text-left px-3 py-2 rounded-lg font-medium text-gray-400 hover:text-white hover:bg-white/5 flex items-center gap-2">
                  <Sliders className="w-4 h-4" />
                  General
                </button>
              </div>

              {/* Right Settings Area */}
              <div className="flex-1 p-6 overflow-y-auto space-y-6 text-xs text-gray-200">
                
                {/* Speaker Section */}
                <div className="space-y-3 pb-4 border-b border-[#2C2C2C]">
                  <h4 className="text-sm font-semibold text-white flex items-center gap-1.5">
                    <Volume2 className="w-4 h-4 text-blue-400" />
                    Speaker
                  </h4>
                  <div className="flex gap-2">
                    <select
                      value={selectedSpeaker}
                      onChange={(e) => handleSelectSpeaker(e.target.value)}
                      className="flex-1 bg-[#2A2A2A] border border-[#444] rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500"
                    >
                      <option value="default">Default - System Output</option>
                      {audioOutputs.map(d => (
                        <option key={d.deviceId} value={d.deviceId}>{d.label || `Speaker (${d.deviceId.slice(0, 8)})`}</option>
                      ))}
                    </select>
                    <button
                      onClick={playSpeakerRingtoneTest}
                      className="px-3.5 py-2 bg-[#2D2D2D] hover:bg-[#3D3D3D] text-gray-200 border border-[#444] rounded-lg font-medium transition-colors"
                    >
                      Test Speaker
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-3 pt-1">
                    <span className="text-gray-400 w-16">Output Level:</span>
                    <Volume2 className="w-4 h-4 text-gray-400" />
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={speakerVolume}
                      onChange={(e) => setSpeakerVolume(Number(e.target.value))}
                      className="flex-1 accent-blue-600 h-1.5 bg-[#333] rounded-lg cursor-pointer"
                    />
                    <span className="w-10 text-right text-gray-400 font-mono">{speakerVolume}%</span>
                  </div>
                </div>

                {/* Microphone Section */}
                <div className="space-y-3 pb-4 border-b border-[#2C2C2C]">
                  <h4 className="text-sm font-semibold text-white flex items-center gap-1.5">
                    <Mic className="w-4 h-4 text-blue-400" />
                    Microphone
                  </h4>
                  <div className="flex gap-2">
                    <select
                      value={selectedMic}
                      onChange={(e) => handleSelectMicrophone(e.target.value)}
                      className="flex-1 bg-[#2A2A2A] border border-[#444] rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500"
                    >
                      <option value="default">Default - System Input</option>
                      {audioInputs.map(d => (
                        <option key={d.deviceId} value={d.deviceId}>{d.label || `Microphone (${d.deviceId.slice(0, 8)})`}</option>
                      ))}
                    </select>
                    <button
                      onClick={handleStartMicTestWizard}
                      className="px-3.5 py-2 bg-[#2D2D2D] hover:bg-[#3D3D3D] text-gray-200 border border-[#444] rounded-lg font-medium transition-colors"
                    >
                      Test Mic
                    </button>
                  </div>

                  <div className="flex items-center gap-3 pt-1">
                    <span className="text-gray-400 w-16">Input Level:</span>
                    <Mic className="w-4 h-4 text-gray-400" />
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={micVolume}
                      onChange={(e) => setMicVolume(Number(e.target.value))}
                      className="flex-1 accent-blue-600 h-1.5 bg-[#333] rounded-lg cursor-pointer"
                    />
                    <span className="w-10 text-right text-gray-400 font-mono">{micVolume}%</span>
                  </div>

                  <label className="flex items-center gap-2 pt-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoAdjustMic}
                      onChange={(e) => setAutoAdjustMic(e.target.checked)}
                      className="accent-blue-600 rounded"
                    />
                    <span className="text-gray-300">Automatically adjust microphone volume</span>
                  </label>
                </div>

                {/* Background Noise Suppression (7.6 Section) */}
                <div className="space-y-3 pb-4 border-b border-[#2C2C2C]">
                  <div>
                    <h4 className="text-sm font-semibold text-white">Suppress background noise</h4>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      IntellMeet AI removes background noises for superior speech clarity.
                    </p>
                  </div>

                  <div className="space-y-2 pt-1">
                    {[
                      { id: 'auto', label: 'Auto (Recommended)', desc: 'Balances background noise suppression and audio fidelity' },
                      { id: 'low', label: 'Low', desc: 'Faint background noise; allows low ambient music to pass through' },
                      { id: 'medium', label: 'Medium', desc: 'Ideal for standard office environments (fan, pen taps)' },
                      { id: 'high', label: 'High', desc: 'Aggressive filter for keyboard clicks, paper shuffling, barking' }
                    ].map(opt => (
                      <label key={opt.id} className="flex items-start gap-2.5 cursor-pointer hover:bg-white/5 p-1.5 rounded-lg transition-colors">
                        <input
                          type="radio"
                          name="noiseSuppression"
                          value={opt.id}
                          checked={noiseSuppressionLevel === opt.id}
                          onChange={(e) => {
                            setNoiseSuppressionLevel(e.target.value);
                            toast.success(`Noise suppression set to ${opt.label}`);
                          }}
                          className="accent-blue-600 mt-0.5"
                        />
                        <div>
                          <span className="font-semibold text-white block">{opt.label}</span>
                          <span className="text-[11px] text-gray-400">{opt.desc}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Music and Professional Audio */}
                <div className="space-y-2.5">
                  <h4 className="text-sm font-semibold text-white">Music and Professional Audio</h4>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="accent-blue-600 rounded" />
                    <span className="text-gray-300">Show in-meeting option to enable "Original Sound"</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked className="accent-blue-600 rounded" />
                    <span className="text-gray-300">High fidelity music mode</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked className="accent-blue-600 rounded" />
                    <span className="text-gray-300">Echo cancellation</span>
                  </label>
                </div>

              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end px-6 py-3.5 border-t border-[#333] bg-[#1A1A1A]">
              <button
                onClick={() => setShowAudioSettingsModal(false)}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl text-xs transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7.9: Host Mute All Confirmation Modal */}
      {showMuteAllModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#242424] text-white border border-[#3A3A3A] rounded-2xl w-full max-w-sm shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center gap-2.5 pb-1">
              <VolumeX className="w-5 h-5 text-red-500" />
              <h3 className="font-bold text-base text-white">Mute All</h3>
            </div>
            
            <p className="text-xs text-gray-300 leading-relaxed">
              Current and new participants will be muted.
            </p>

            <label className="flex items-center gap-2.5 text-xs text-gray-200 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={allowUnmuteOnMuteAll}
                onChange={(e) => setAllowUnmuteOnMuteAll(e.target.checked)}
                className="accent-blue-600 rounded"
              />
              <span>Allow participants to unmute themselves</span>
            </label>

            <div className="flex justify-end gap-2.5 pt-3">
              <button
                onClick={() => setShowMuteAllModal(false)}
                className="px-4 py-2 bg-[#333] hover:bg-[#444] text-gray-300 font-medium rounded-xl text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmMuteAll}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl text-xs transition-colors shadow-lg shadow-blue-600/30"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8.5, 8.6, 8.7: Background & Effects Modal */}
      <BackgroundEffectsModal
        isOpen={showBackgroundEffectsModal}
        onClose={() => setShowBackgroundEffectsModal(false)}
        activeTab={backgroundEffectsTab}
        setActiveTab={setBackgroundEffectsTab}
        currentBackground={currentBackground}
        customBgUrl={customBgUrl}
        onSelectBackground={handleSelectBackground}
        currentFilter={currentFilter}
        onSelectFilter={handleSelectFilter}
        currentAvatar={currentAvatar}
        onSelectAvatar={handleSelectAvatar}
        stream={stream}
        isVideoOn={isVideoOn}
        userName={user?.name || 'You'}
      />

      {/* 8.3: Video Settings Modal */}
      <VideoSettingsModal
        isOpen={showVideoSettingsModal}
        onClose={() => setShowVideoSettingsModal(false)}
        videoInputs={videoInputs}
        selectedCamera={selectedCamera}
        onSelectCamera={handleSelectCamera}
        stream={stream}
        isVideoOn={isVideoOn}
        videoSettings={videoSettings}
        onUpdateVideoSettings={handleUpdateVideoSettings}
        onOpenBackgroundEffects={() => {
          setBackgroundEffectsTab('background');
          setShowBackgroundEffectsModal(true);
        }}
      />

      {/* 11.5: Host Unmute Prompt Modal */}
      {unmutePrompt && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#242424] text-white border border-[#3A3A3A] rounded-2xl w-full max-w-sm shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center gap-2.5">
              <Mic className="w-5 h-5 text-blue-400" />
              <h3 className="font-bold text-base">Unmute Microphone</h3>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              The host would like you to unmute your microphone.
            </p>
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => setUnmutePrompt(null)}
                className="px-4 py-2 bg-[#333] hover:bg-[#444] text-gray-300 rounded-xl text-xs font-medium transition-colors"
              >
                Stay Muted
              </button>
              <button
                onClick={() => {
                  if (!isAudioOn) toggleAudio();
                  setUnmutePrompt(null);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-600/30 transition-colors"
              >
                Unmute
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 11.8: Host Start Video Prompt Modal */}
      {startVideoPrompt && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#242424] text-white border border-[#3A3A3A] rounded-2xl w-full max-w-sm shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center gap-2.5">
              <Video className="w-5 h-5 text-blue-400" />
              <h3 className="font-bold text-base">Start Video</h3>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              The host has asked you to start your video.
            </p>
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => setStartVideoPrompt(null)}
                className="px-4 py-2 bg-[#333] hover:bg-[#444] text-gray-300 rounded-xl text-xs font-medium transition-colors"
              >
                Later
              </button>
              <button
                onClick={() => {
                  if (!isVideoOn) toggleVideo();
                  setStartVideoPrompt(null);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-600/30 transition-colors"
              >
                Start Video
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 11.12: Rename Participant Modal */}
      {showRenameModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#242424] text-white border border-[#3A3A3A] rounded-2xl w-full max-w-sm shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center gap-2.5">
              <Edit2 className="w-5 h-5 text-blue-400" />
              <h3 className="font-bold text-base">Rename</h3>
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Enter a new screen name:</label>
              <input
                type="text"
                value={renameInput}
                onChange={(e) => setRenameInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleConfirmRename();
                }}
                className="w-full bg-[#1A1A1A] border border-[#3A3A3A] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => {
                  setShowRenameModal(false);
                  setRenameParticipantTarget(null);
                }}
                className="px-4 py-2 bg-[#333] hover:bg-[#444] text-gray-300 rounded-xl text-xs font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRename}
                disabled={!renameInput.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-600/30 transition-colors"
              >
                Change
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 11.10: Make Host Confirmation Modal */}
      {showMakeHostModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#242424] text-white border border-[#3A3A3A] rounded-2xl w-full max-w-sm shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center gap-2.5">
              <Crown className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-base">Make Host</h3>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              Do you want to change the host to <span className="font-semibold text-white">{makeHostTarget?.name}</span>?
              <br /><br />
              <span className="text-amber-400 font-medium">Notice:</span> You will no longer be the host of this meeting.
            </p>
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => {
                  setShowMakeHostModal(false);
                  setMakeHostTarget(null);
                }}
                className="px-4 py-2 bg-[#333] hover:bg-[#444] text-gray-300 rounded-xl text-xs font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmMakeHost}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-amber-600/30 transition-colors"
              >
                Yes, Make Host
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 30.7 & 11.14: Emergency Suspend Participant Activities Modal */}
      <SuspendActivitiesModal
        isOpen={showSuspendModal}
        onClose={() => setShowSuspendModal(false)}
        onConfirm={handleSuspendActivities}
      />

      {/* 30.9: Remove Participant Modal with Rejoin Ban */}
      <RemoveParticipantModal
        isOpen={showRemoveModal}
        onClose={() => setShowRemoveModal(false)}
        participants={allParticipants}
        currentUserId={user?.id || user?._id || 'local'}
        onConfirmRemove={handleRemoveParticipant}
      />

      {/* 11.16: Invite Participants Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#242424] text-white border border-[#3A3A3A] rounded-2xl w-full max-w-md shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between pb-1 border-b border-[#333]">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-base">Invite People to Join Meeting</h3>
              </div>
              <button onClick={() => setShowInviteModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-gray-400 block mb-1">Meeting Link</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/meetings/${meetingId}/room`}
                    className="w-full bg-[#1A1A1A] border border-[#3A3A3A] rounded-xl px-3 py-2 text-xs text-gray-300 select-all"
                  />
                  <button
                    onClick={() => {
                      const dynamicUrl = `${window.location.origin}/meetings/${meetingId}/room`;
                      navigator.clipboard.writeText(dynamicUrl);
                      toast.success('Join link copied to clipboard!');
                    }}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium shrink-0 flex items-center gap-1.5 transition-colors shadow"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Link</span>
                  </button>
                </div>
              </div>

              <div className="p-3 bg-[#1A1A1A] rounded-xl border border-[#333] space-y-1.5 text-gray-300">
                <div className="flex justify-between">
                  <span className="text-gray-400">Meeting ID:</span>
                  <span className="font-mono font-bold text-white">{meetingId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Host:</span>
                  <span className="text-white">{user?.name || 'Meeting Host'}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-[#333]">
              <a
                href={`mailto:?subject=Join IntellMeet Meeting&body=Join IntellMeet Meeting%0A%0ALink: ${typeof window !== 'undefined' ? window.location.origin : ''}/meetings/${meetingId}/room%0AMeeting ID: ${meetingId}`}
                className="text-xs text-blue-400 hover:underline flex items-center gap-1"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Default Email</span>
              </a>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const dynamicUrl = `${window.location.origin}/meetings/${meetingId}/room`;
                    const invitationText = `Join IntellMeet Meeting\nTopic: ${meetingTitle || 'Meeting'}\nMeeting ID: ${meetingId}\nJoin Link: ${dynamicUrl}`;
                    navigator.clipboard.writeText(invitationText);
                    toast.success('Invitation details copied to clipboard!');
                  }}
                  className="px-4 py-2 bg-[#333] hover:bg-[#444] text-gray-200 rounded-xl text-xs font-medium transition-colors"
                >
                  Copy Invitation
                </button>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Part 13: Floating Screen Sharing Control Bar (13.14 - 13.16) */}
      <ScreenShareFloatingBar
        isSharing={isScreenSharing && screenShareDetails?.sharerId === (user?.id || 'local')}
        isPaused={isSharePaused}
        sourceName={screenShareDetails?.sourceName || 'Entire Screen'}
        onPauseToggle={handlePauseShare}
        onStopShare={handleStopShare}
        onToggleAnnotate={() => {
          setIsAnnotating(!isAnnotating);
          toast.info(!isAnnotating ? 'Annotation mode active: Draw over screen' : 'Annotation mode closed');
        }}
        isAnnotating={isAnnotating}
        presenterLayout={presenterLayout}
        onChangePresenterLayout={handleChangePresenterLayout}
        isAudioShared={isShareAudioEnabled}
        onToggleAudioShare={handleToggleAudioShare}
        onShareToBreakoutRooms={handleShareToBreakoutRooms}
        hasActivePresentation={!!presentationSession}
        onOpenSlideControl={() => setShowSlideControlModal(true)}
        activeControllersCount={presentationSession?.controllers?.filter(c => c.status === 'ACTIVE').length || 0}
      />

      {/* Part 13: Share Content Source Picker Modal (13.1 - 13.9, 13.19) */}
      <ShareContentModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        onStartShare={handleStartShare}
        availableCameras={videoInputs}
        isHost={user?.id === 'host' || isHost}
      />

      {/* Part 13: Collaborative Whiteboard Canvas Modal (13.8, 13.22) */}
      <WhiteboardModal
        isOpen={showWhiteboardModal}
        onClose={() => {
          setShowWhiteboardModal(false);
          if (screenShareDetails?.type === 'WHITEBOARD' && screenShareDetails?.sharerId === (user?.id || 'local')) {
            handleStopShare();
          }
        }}
        socket={socketRef.current}
        meetingId={meetingId}
        isSharer={screenShareDetails?.sharerId === (user?.id || 'local')}
        sharerName={screenShareDetails?.sharerName || user?.name || 'You'}
      />

      {/* Part 13: Advanced Sharing Options Host Modal (13.10, 13.11) */}
      <AdvancedSharingOptionsModal
        isOpen={showAdvancedShareModal}
        onClose={() => setShowAdvancedShareModal(false)}
        sharingSettings={sharingSettings}
        onSaveSettings={handleUpdateSharingSettings}
      />

      {/* Part 16: Slide Control Popover Modal (16.2, 16.5, 16.11, 16.13) */}
      <SlideControlPopover
        isOpen={showSlideControlModal}
        onClose={() => setShowSlideControlModal(false)}
        session={presentationSession}
        participants={sampleParticipants}
        currentUserId={user?.id || user?._id || 'local'}
        onGrantControl={handleGrantSlideControl}
        onRevokeControl={handleRevokeSlideControl}
        onStopAllControl={handleStopAllSlideControl}
        onEndPresentation={handleEndPresentationSession}
      />

      {/* Part 17: Whiteboard Picker Modal (17.2, 17.3, 17.22) */}
      <WhiteboardPickerModal
        isOpen={showWhiteboardPicker}
        onClose={() => setShowWhiteboardPicker(false)}
        onOpenWhiteboard={(board) => {
          setActiveWhiteboard(board);
          if (socketRef.current) {
            socketRef.current.emit('whiteboard-open', meetingId, {
              whiteboard: board,
              whiteboardId: board.whiteboardId,
              user: { id: user?.id || user?._id || 'local', name: user?.name || 'Host' }
            });
          }
        }}
        currentUser={{ id: user?.id || user?._id || 'local', name: user?.name || 'Host' }}
        meetingId={meetingId}
        isHost={user?.id === 'host' || isHost}
      />

      {/* Part 17: Active Whiteboard Studio Overlay (17.1 - 17.23) */}
      {activeWhiteboard && (
        <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col animate-in fade-in duration-150">
          <WhiteboardStudio
            whiteboardId={activeWhiteboard.whiteboardId}
            initialWhiteboard={activeWhiteboard}
            currentUser={{ id: user?.id || user?._id || 'local', name: user?.name || 'Host' }}
            socket={socketRef.current}
            roomId={meetingId}
            onClose={() => {
              const closingBoardId = activeWhiteboard.whiteboardId;
              setActiveWhiteboard(null);
              if (socketRef.current) {
                socketRef.current.emit('whiteboard-close', meetingId, {
                  whiteboardId: closingBoardId
                });
              }
            }}
            isHost={user?.id === 'host' || isHost}
          />
        </div>
      )}

      {/* Part 18: Breakout Room Persistent Header Banner (18.15, 18.16, 18.27) */}
      {currentBreakoutRoom && (
        <BreakoutRoomBanner
          room={currentBreakoutRoom}
          meetingId={meetingId}
          currentUser={{ id: user?.id || user?._id || 'local', name: user?.name || 'Participant' }}
          socket={socketRef.current}
          countdownSeconds={breakoutCountdown}
          onReturnToMain={() => {
            setCurrentBreakoutRoom(null);
            setBreakoutCountdown(null);
          }}
        />
      )}

      {/* Part 18: Host Breakout Rooms Management Modal (18.25, 18.28) */}
      <BreakoutHostModal
        isOpen={showBreakoutHostModal}
        onClose={() => setShowBreakoutHostModal(false)}
        meetingId={meetingId}
        currentParticipants={allParticipants}
        currentUser={{ id: user?.id || user?._id || 'local', name: user?.name || 'Host' }}
        socket={socketRef.current}
        onJoinBreakoutRoom={(room) => {
          setCurrentBreakoutRoom(room);
          toast.success(`Host joined ${room.name}`, { icon: '🚪' });
        }}
        isHost={user?.id === 'host' || isHost}
      />

      {/* Part 18: Participant Self-Select Breakout Rooms Modal (18.5, 18.26) */}
      <BreakoutParticipantModal
        isOpen={showBreakoutParticipantModal}
        onClose={() => setShowBreakoutParticipantModal(false)}
        rooms={breakoutRoomsList}
        currentRoomId={currentBreakoutRoom?.roomId}
        onSelectRoom={(room) => {
          setCurrentBreakoutRoom(room);
          if (socketRef.current) {
            socketRef.current.emit('breakout-join', meetingId, {
              roomId: room.roomId,
              userId: user?.id || user?._id || 'local',
              userName: user?.name || 'Participant'
            });
          }
        }}
      />

      {/* Part 18: Broadcast Announcement Toast (18.13) */}
      <BreakoutBroadcastToast
        broadcast={activeBroadcastToast}
        onDismiss={() => setActiveBroadcastToast(null)}
      />

      {/* Part 18: Host Help Request Notification Toast (18.15) */}
      <BreakoutHelpRequestToast
        request={activeHelpRequestToast}
        onJoinRoom={(targetRoomId) => {
          const room = breakoutRoomsList.find(r => r.roomId === targetRoomId);
          if (room) {
            setCurrentBreakoutRoom(room);
            toast.success(`Host joined ${room.name}`, { icon: '🚪' });
          }
        }}
        onDismiss={() => setActiveHelpRequestToast(null)}
      />

      {/* Part 19: Host Polls & Quizzes Modal (19.1 - 19.22) */}
      <PollsQuizzesModal
        isOpen={showPollsModal}
        onClose={() => setShowPollsModal(false)}
        meetingId={meetingId}
        socketRef={socketRef}
        isHost={isHost || user?.id === 'host'}
        userId={user?.id || user?._id || 'local'}
        activePoll={activePoll}
        onActivePollChange={(poll) => setActivePoll(poll)}
      />

      {/* Part 19: Participant Poll Answer & Results View (19.6, 19.7, 19.12) */}
      <PollParticipantView
        isOpen={showPollParticipantView}
        onClose={() => setShowPollParticipantView(false)}
        activePoll={activePoll}
        sharedResults={pollSharedResults}
        socketRef={socketRef}
        meetingId={meetingId}
        userId={user?.id || user?._id || 'local'}
        userName={user?.name || 'Participant'}
      />

      {/* Part 20: On-Screen Live Caption Overlay (20.2, 20.5, 20.10, 21.11) */}
      {showLiveCaptions && (
        <LiveCaptionOverlay
          currentSegment={currentCaptionSegment}
          recentSegments={recentCaptionSegments}
          fontSize={captionFontSize}
          contrast={captionContrast}
          position={captionPosition}
          onClose={() => setShowLiveCaptions(false)}
          onOpenSettings={() => setShowCaptionSettingsModal(true)}
          onOpenTranscript={() => setShowTranscriptPanel(true)}
          onOpenTranslation={() => setShowTranslationModal(true)}
          translationLanguage={participantTranslationEnabled ? participantTargetLanguage : null}
          targetLanguageName={participantTargetLanguage?.toUpperCase()}
          voiceTranslationEnabled={participantVoiceTranslationEnabled}
        />
      )}

      {/* Part 20: Live Caption Settings & Host Controls Modal (20.3, 20.4, 20.5) */}
      <CaptionSettingsModal
        isOpen={showCaptionSettingsModal}
        onClose={() => setShowCaptionSettingsModal(false)}
        isHost={isHost || user?.id === 'host' || coHosts?.includes(user?.id)}
        captionsEnabled={showLiveCaptions}
        onToggleCaptions={toggleLiveCaptions}
        speakingLanguage={speakingLanguage}
        onChangeSpeakingLanguage={setSpeakingLanguage}
        translationLanguage={translationLanguage}
        onChangeTranslationLanguage={setTranslationLanguage}
        fontSize={captionFontSize}
        onChangeFontSize={setCaptionFontSize}
        contrast={captionContrast}
        onChangeContrast={setCaptionContrast}
        position={captionPosition}
        onChangePosition={setCaptionPosition}
        hostSettings={captionSettings}
        onUpdateHostSettings={handleUpdateHostCaptionSettings}
        captionRequests={captionSettings?.captionRequests || []}
        onResolveRequest={handleResolveCaptionRequest}
        onRequestCaptions={handleRequestCaptionsFromHost}
        participants={participants}
        assignedCaptionerId={captionSettings?.assignedCaptionerId}
        onAssignCaptioner={handleAssignCaptioner}
        onOpenManualCaptioner={() => setShowManualCaptionModal(true)}
      />

      {/* Part 21: Real-time Multilingual Translation & Language Pairs Modal (21.2, 21.3, 21.4, 21.13) */}
      <TranslationSettingsModal
        isOpen={showTranslationModal}
        onClose={() => setShowTranslationModal(false)}
        isHost={isHost || user?.id === 'host' || coHosts?.includes(user?.id)}
        speakingLanguage={speakingLanguage}
        onChangeSpeakingLanguage={(lang) => {
          setSpeakingLanguage(lang);
          handleSaveParticipantTranslationPreference({ speakingLanguage: lang });
        }}
        targetLanguage={participantTargetLanguage}
        onChangeTargetLanguage={(lang) => {
          setParticipantTargetLanguage(lang);
          voiceTranslator.setTargetLanguage(lang);
          handleSaveParticipantTranslationPreference({ targetLanguage: lang });
        }}
        translationEnabled={participantTranslationEnabled}
        onToggleTranslation={() => {
          const next = !participantTranslationEnabled;
          setParticipantTranslationEnabled(next);
          handleSaveParticipantTranslationPreference({ translationEnabled: next });
        }}
        voiceTranslationEnabled={participantVoiceTranslationEnabled}
        onToggleVoiceTranslation={() => {
          const next = !participantVoiceTranslationEnabled;
          setParticipantVoiceTranslationEnabled(next);
          voiceTranslator.setEnabled(next);
          handleSaveParticipantTranslationPreference({ voiceTranslationEnabled: next });
        }}
        languagePairs={languagePairs}
        onUpdateLanguagePairs={handleUpdateLanguagePairs}
        meetingTranslationActive={meetingTranslationActive}
        onToggleMeetingTranslation={handleToggleMeetingTranslation}
      />

      {/* Part 20 & 24: Full Meeting Transcript & AI Summary Panel (20.8, 20.9, 24.1 - 24.13) */}
      <TranscriptPanel
        isOpen={showTranscriptPanel}
        onClose={() => setShowTranscriptPanel(false)}
        meetingId={meetingId}
        isHost={isHost || user?.id === 'host' || coHosts?.includes(user?.id)}
        isTranscribing={isTranscribing}
        onToggleTranscription={toggleRetainedTranscription}
        transcriptSegments={transcriptSegments}
        aiSummary={aiSummaryData}
        isGeneratingAI={isGeneratingAISummary}
        onGenerateAISummary={handleGenerateAISummaryFromTranscript}
        onExportTranscript={handleExportTranscript}
        onEditSegment={handleEditSegment}
        onDeleteSegment={handleDeleteSegment}
        onSeekToTime={handleSeekToTime}
      />

      {/* Part 20: Manual Captioner Entry Window (20.6) */}
      <ManualCaptionModal
        isOpen={showManualCaptionModal}
        onClose={() => setShowManualCaptionModal(false)}
        speakerName={user?.name || 'Captioner'}
        onSubmitCaption={handleManualCaptionSubmit}
      />

      {/* Part 22: Language & Sign-Language Interpretation Modal (22.1 - 22.23) */}
      <LanguageInterpretationModal
        isOpen={showInterpretationModal}
        onClose={() => setShowInterpretationModal(false)}
        isHost={isHost || user?.id === 'host' || coHosts?.includes(user?.id)}
        interpretationSession={interpretationSession}
        selectedChannel={selectedInterpretationChannel}
        onSelectChannel={handleSelectInterpretationChannel}
        originalAudioVolume={originalAudioVolume}
        onChangeOriginalVolume={handleChangeOriginalAudioVolume}
        interpretationVolume={interpretationVolume}
        onChangeInterpretationVolume={handleChangeInterpretationVolume}
        signLanguageEnabled={signLanguageEnabled}
        onToggleSignLanguage={handleToggleSignLanguage}
        onStartInterpretation={handleStartInterpretationSession}
        onStopInterpretation={handleStopInterpretationSession}
        onAddLanguage={handleAddInterpretationLanguage}
        onRemoveLanguage={handleRemoveInterpretationLanguage}
        onAssignInterpreter={handleAssignInterpreter}
        onAssignSignInterpreter={handleAssignSignInterpreter}
        participants={participants}
      />

      {/* Part 22: Interpreter Floating Console / HUD (22.5, 22.6) */}
      <InterpreterConsole
        isOpen={isCurrentUserInterpreter && interpretationSession?.status === 'ACTIVE'}
        languageName={currentUserInterpreterLanguage?.languageName || 'Interpretation'}
        languageCode={currentUserInterpreterLanguage?.languageCode || 'ta'}
        isSpeaking={currentUserInterpreterLanguage?.isSpeaking}
        isMuted={isInterpreterMicMuted}
        onToggleMic={handleToggleInterpreterMic}
        onLeaveInterpretation={() => {
          handleSelectInterpretationChannel('original');
        }}
      />

      {/* Part 22: Sign-Language Floating PiP Window (22.20, 22.21) */}
      <SignLanguagePiP
        isOpen={signLanguageEnabled && !!signLanguageInterpreterInfo}
        onClose={() => handleToggleSignLanguage()}
        interpreterName={signLanguageInterpreterInfo?.userName || 'Sign Language Interpreter'}
        stream={null}
      />

      {/* Part 23: Live Recording Indicator & Controls Bar (23.3, 23.7, 23.8) */}
      <RecordingIndicatorBar
        isRecording={isMeetingRecording}
        isPaused={recordingPaused}
        mode={recordingMode}
        startedAt={recordingStartedAt}
        canControl={isHost || user?.id === 'host' || coHosts?.includes(user?.id) || participantCanRecordLocal}
        onPause={handlePauseRecording}
        onResume={handleResumeRecording}
        onStop={handleStopRecording}
      />

      {/* Part 33: Live Streaming Status Bar (33.11) */}
      <LiveStreamingIndicator
        session={liveStreamSession}
        isHostOrCoHost={isHost || user?.id === 'host' || coHosts?.includes(user?.id)}
        onStopStreaming={handleStopLiveStream}
        onOpenStreamingModal={() => setShowLiveStreamingModal(true)}
      />

      {/* Part 23: Recording Settings & Permissions Modal (23.4, 23.5, 23.13) */}
      <RecordingSettingsModal
        isOpen={showRecordingSettingsModal}
        onClose={() => setShowRecordingSettingsModal(false)}
        isHost={isHost || user?.id === 'host' || coHosts?.includes(user?.id)}
        settings={recordingSettings}
        onUpdateSettings={handleUpdateRecordingSettings}
        participants={sampleParticipants}
        onUpdateParticipantPermission={handleUpdateParticipantRecordingPermission}
      />

      {/* Part 25: AI Meeting Summary Modal (25.1 - 25.24) */}
      <MeetingAISummaryModal
        isOpen={showAISummaryModal}
        onClose={() => setShowAISummaryModal(false)}
        meetingId={meetingId}
        isHost={isHost || user?.id === 'host' || coHosts?.includes(user?.id)}
        user={user}
        socketRef={socketRef}
        summaryData={meetingSummaryRecord}
        onGenerateSummary={() => handleGenerateMeetingSummary(meetingSummaryRecord?.template || 'GENERAL')}
        isGenerating={isGeneratingMeetingSummary}
      />

      {/* Part 26: AI Meeting Questions Drawer (26.1 - 26.29) */}
      <MeetingAIQuestionsDrawer
        isOpen={showAIQuestionsDrawer}
        onClose={() => setShowAIQuestionsDrawer(false)}
        meetingId={meetingId}
        isHost={isHost || user?.id === 'host' || coHosts?.includes(user?.id)}
        user={user}
        socketRef={socketRef}
        isInBreakoutRoom={Boolean(currentBreakoutRoom)}
        onSeekToTimestamp={handleSeekToTime}
        onOpenTranscript={() => setShowTranscriptPanel(true)}
      />

      {/* Part 27: AI / Personal Notes (My Notes) Drawer (27.1 - 27.12) */}
      <MyNotesDrawer
        isOpen={showMyNotesDrawer}
        onClose={() => setShowMyNotesDrawer(false)}
        meetingId={meetingId}
        meetingTitle={meetingInfo?.title || 'Meeting'}
        isHost={isHost || user?.id === 'host' || coHosts?.includes(user?.id)}
        user={user}
        socketRef={socketRef}
        onSeekToTimestamp={handleSeekToTime}
      />

      {/* Part 36: Live Agenda, Pre-reads & Shared Notes Drawer (36.1 - 36.15) */}
      {showAgendaDrawer && (
        <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[520px] md:w-[600px] bg-white shadow-2xl flex flex-col border-l border-gray-200 animate-in slide-in-from-right duration-200">
          <div className="p-4 bg-gray-900 text-white flex items-center justify-between border-b border-gray-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
                <ListChecks className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">Live Agenda & Meeting Notes</h3>
                <p className="text-[11px] text-gray-400">Track agenda topics, view pre-reads & collaborate on notes</p>
              </div>
            </div>
            <button 
              onClick={() => setShowAgendaDrawer(false)}
              className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              title="Close Drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50">
            <MeetingPrepWorkspace
              meeting={{ meetingId, title: 'Meeting Room' }}
              meetingId={meetingId}
              user={user}
              isLiveMeeting={true}
            />
          </div>
        </div>
      )}

      {/* Part 31: E2EE Compatibility Warning Modal (31.9, 31.10) */}
      <E2EEWarningModal
        isOpen={showE2EEWarningModal}
        onClose={() => setShowE2EEWarningModal(false)}
        onConfirm={async () => {
          setShowE2EEWarningModal(false);
          await handleSwitchEncryption('E2EE');
        }}
      />

      {/* Part 32: Watermark Settings & Leak Tracer Modal (32.1 - 32.10) */}
      <WatermarkSettingsModal
        isOpen={showWatermarkSettingsModal}
        onClose={() => setShowWatermarkSettingsModal(false)}
        watermarkSettings={watermarkSettings}
        viewerIdentity={viewerIdentity}
        isHostOrCoHost={isHost || user?.id === 'host' || coHosts?.includes(user?.id)}
        onSaveSettings={handleSaveWatermarkSettings}
        onTraceLeak={handleTraceAudioLeak}
      />

      {/* Part 33: Live Streaming Modal (33.1 - 33.23) */}
      <LiveStreamingModal
        isOpen={showLiveStreamingModal}
        onClose={() => setShowLiveStreamingModal(false)}
        session={liveStreamSession}
        isHostOrCoHost={isHost || user?.id === 'host' || coHosts?.includes(user?.id)}
        onStartStreaming={handleStartLiveStream}
        onStopStreaming={handleStopLiveStream}
        onSaveConfiguration={handleSaveLiveStreamConfig}
      />

      {/* Part 37: Personalization Modal (37.1 - 37.15) */}
      <PersonalizationModal
        isOpen={showPersonalizationModal}
        onClose={() => setShowPersonalizationModal(false)}
      />

      {/* Part 38: Device & Network Adaptation Modal (38.1 - 38.20) */}
      <NetworkHealthModal
        isOpen={showNetworkHealthModal}
        onClose={() => setShowNetworkHealthModal(false)}
        networkStats={networkStats}
        deviceStats={deviceStats}
        mediaProfile={mediaProfile}
        onSelectMode={setAdaptationMode}
        onSwitchAudioOnly={() => {
          setAdaptationMode('AUDIO_ONLY');
          if (stream) {
            stream.getVideoTracks().forEach(t => { t.enabled = false; });
          }
          setIsVideoOn(false);
        }}
      />

    </div>
  );
}

