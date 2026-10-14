import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { useMeetingStore } from '../../store/meetingStore';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';
import { 
  ChevronLeft, Info, Plus, Calendar, Clock, Globe, Shield, 
  Video, Mic, Users, HelpCircle, BarChart2, Languages, Settings2, Copy, Check,
  ListChecks, Trash2
} from 'lucide-react';
import E2EEWarningModal from '../../components/security/E2EEWarningModal';

// Zoom standard meeting start time options (15-min intervals)
const TIME_OPTIONS = [
  '12:00', '12:15', '12:30', '12:45',
  '1:00', '1:15', '1:30', '1:45',
  '2:00', '2:15', '2:30', '2:45',
  '3:00', '3:15', '3:30', '3:45',
  '4:00', '4:15', '4:30', '4:45',
  '5:00', '5:15', '5:30', '5:45',
  '6:00', '6:15', '6:30', '6:45',
  '7:00', '7:15', '7:30', '7:45',
  '8:00', '8:15', '8:30', '8:45',
  '9:00', '9:15', '9:30', '9:45',
  '10:00', '10:15', '10:30', '10:45',
  '11:00', '11:15', '11:30', '11:45',
];

export default function ScheduleMeeting() {
  const navigate = useNavigate();
  const { addMeeting } = useMeetingStore();
  const { user } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCustomTime, setIsCustomTime] = useState(false);

  // Polls pre-creation state
  const [polls, setPolls] = useState([]);
  const [newPollQuestion, setNewPollQuestion] = useState('');
  const [newPollOptions, setNewPollOptions] = useState(['', '']);
  const [showPollModal, setShowPollModal] = useState(false);
  const [showE2EEModal, setShowE2EEModal] = useState(false);

  // Part 36: Agenda topics pre-creation state (36.1 - 36.15)
  const [enableAgenda, setEnableAgenda] = useState(true);
  const [agendaTopics, setAgendaTopics] = useState([
    { title: 'Project Overview & Objectives', durationMinutes: 10, presenterName: '' },
    { title: 'Technical Review & Demo', durationMinutes: 20, presenterName: '' },
    { title: 'Q&A, Decisions & Next Steps', durationMinutes: 15, presenterName: '' }
  ]);

  // Part 39: Workplace & Calendar Integration states
  const [syncCalendar, setSyncCalendar] = useState(true);
  const [notifySlack, setNotifySlack] = useState(false);

  // Form State matching complete Part 2 specification
  const [formData, setFormData] = useState({
    // Basic Information
    topic: 'IntelliMeet Project Discussion',
    description: '',
    date: new Date().toISOString().split('T')[0],
    time: '10:00',
    ampm: 'AM',
    durationHours: '1',
    durationMinutes: '0',
    timezone: '(UTC+05:30) Chennai, Kolkata, Mumbai, New Delhi',
    
    // Recurring Meeting
    recurring: false,
    recurrenceType: 'weekly', // daily, weekly, monthly, noFixedTime
    repeatEvery: 1,
    daysOfWeek: ['Mon'],
    endDate: '2026-12-31',
    occurrences: 10,
    endType: 'byDate', // byDate, afterOccurrences

    // Meeting Identity
    meetingIdType: 'automatic', // automatic, pmi
    passcodeEnabled: true,
    passcode: 'ABC123',

    // Security
    waitingRoom: true,
    requireAuth: false,
    authType: 'signedIn', // signedIn, organizationOnly
    registrationRequired: false,
    registrationApprovalType: 'automatic', // automatic, manual
    registrationAllowedDomains: '',
    registrationCustomQuestions: [
      { question: 'What is your role?', required: true },
      { question: 'What topic would you like us to discuss?', required: false }
    ],
    encryption: 'enhanced', // enhanced, e2ee
    // Part 32: Watermarking
    visualWatermarkEnabled: false,
    watermarkMode: 'repeated', // 'single' | 'repeated'
    watermarkVisibleOn: 'both', // 'sharedContent' | 'video' | 'both'
    watermarkOpacity: 25,
    watermarkIdentityType: 'maskedEmail', // 'maskedEmail' | 'email' | 'participantId'
    audioWatermarkEnabled: false,

    // Part 33: Live Streaming (33.3, 33.8, 33.13)
    liveStreamEnabled: false,
    liveStreamPlatform: 'YOUTUBE',
    liveStreamUrl: 'rtmp://a.rtmp.youtube.com/live2',
    liveStreamKey: '',
    liveStreamPageUrl: 'https://youtube.com/live',
    liveStreamResolution: '720p',
    liveStreamWatermark: true,

    // Video
    hostVideo: 'on',
    participantVideo: 'on',

    // Audio
    audioOption: 'both', // telephony, voip, both

    // People & Roles
    alternativeHosts: '',

    // Accessibility
    interpretationEnabled: false,
    interpretationLanguages: ['English', 'Tamil'],
    signLanguageEnabled: false,

    // Other Meeting Options
    allowJoinBeforeHost: false,
    muteUponEntry: true,
    autoRecord: 'local', // none, local, cloud
    geminiAISummary: true,
    requestPermissionToUnmute: false,
    continuousChatEnabled: true,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleDayToggle = (day) => {
    setFormData(prev => {
      const exists = prev.daysOfWeek.includes(day);
      const updated = exists 
        ? prev.daysOfWeek.filter(d => d !== day) 
        : [...prev.daysOfWeek, day];
      return { ...prev, daysOfWeek: updated.length > 0 ? updated : [day] };
    });
  };

  const handleAddPoll = () => {
    if (!newPollQuestion.trim()) {
      toast.error('Please enter a poll question');
      return;
    }
    const filteredOpts = newPollOptions.filter(o => o.trim().length > 0);
    if (filteredOpts.length < 2) {
      toast.error('Please provide at least 2 options');
      return;
    }
    setPolls(prev => [
      ...prev,
      { question: newPollQuestion, options: filteredOpts, allowMultiple: false }
    ]);
    setNewPollQuestion('');
    setNewPollOptions(['', '']);
    setShowPollModal(false);
    toast.success('Poll saved for this meeting!');
  };

  const handleSave = async () => {
    if (!formData.topic.trim()) {
      toast.error('Please enter a meeting topic');
      return;
    }

    setIsSubmitting(true);
    
    // Auto-generate ID or use PMI
    const generatedMeetingId = formData.meetingIdType === 'automatic'
      ? `${Math.floor(100 + Math.random() * 900)} ${Math.floor(100 + Math.random() * 900)} ${Math.floor(1000 + Math.random() * 9000)}`
      : (user?.pmi || '834 521 528');

    const cleanTime = formData.time && !formData.time.includes(':') 
      ? `${formData.time}:00` 
      : (formData.time || '10:00');

    const payload = {
      title: formData.topic,
      description: formData.description,
      date: formData.date,
      time: `${cleanTime} ${formData.ampm}`,
      duration: `${formData.durationHours} hr ${formData.durationMinutes} min`,
      timezone: formData.timezone,
      meetingId: generatedMeetingId,
      status: 'scheduled',
      recurring: formData.recurring,
      recurringDetails: {
        recurrenceType: formData.recurrenceType,
        repeatEvery: formData.repeatEvery,
        daysOfWeek: formData.daysOfWeek,
        endDate: formData.endDate,
        occurrences: formData.occurrences
      },
      passcodeEnabled: formData.passcodeEnabled,
      passcode: formData.passcodeEnabled ? formData.passcode : null,
      waitingRoom: formData.waitingRoom,
      authentication: {
        required: formData.requireAuth,
        type: formData.authType
      },
      registration: {
        required: formData.registrationRequired,
        approvalType: formData.registrationApprovalType,
        allowedDomains: formData.registrationAllowedDomains 
          ? formData.registrationAllowedDomains.split(',').map(d => d.trim()).filter(Boolean)
          : [],
        customQuestions: formData.registrationRequired ? formData.registrationCustomQuestions : []
      },
      hostVideo: formData.hostVideo,
      participantVideo: formData.participantVideo,
      audioOption: formData.audioOption,
      encryption: formData.encryption,
      watermarkSettings: {
        visualEnabled: formData.visualWatermarkEnabled,
        visualMode: formData.watermarkMode,
        visibleOn: formData.watermarkVisibleOn,
        opacity: Number(formData.watermarkOpacity),
        identityType: formData.watermarkIdentityType,
        audioEnabled: formData.audioWatermarkEnabled
      },
      securitySettings: {
        watermark: formData.visualWatermarkEnabled,
        watermarkSettings: {
          visualEnabled: formData.visualWatermarkEnabled,
          visualMode: formData.watermarkMode,
          visibleOn: formData.watermarkVisibleOn,
          opacity: Number(formData.watermarkOpacity),
          identityType: formData.watermarkIdentityType,
          audioEnabled: formData.audioWatermarkEnabled
        }
      },
      liveStreamSettings: {
        enabled: formData.liveStreamEnabled,
        destinations: formData.liveStreamEnabled ? [{
          platform: formData.liveStreamPlatform,
          name: `${formData.liveStreamPlatform} Live`,
          streamUrl: formData.liveStreamUrl,
          streamKey: formData.liveStreamKey,
          streamPageUrl: formData.liveStreamPageUrl,
          resolution: formData.liveStreamResolution
        }] : [],
        branding: {
          watermarkEnabled: formData.liveStreamWatermark,
          brandText: 'Powered by IntelliMeet'
        }
      },
      alternativeHosts: formData.alternativeHosts 
        ? formData.alternativeHosts.split(',').map(s => s.trim()).filter(Boolean)
        : [],
      preCreatedPolls: polls,
      interpretation: {
        enabled: formData.interpretationEnabled,
        languages: formData.interpretationLanguages
      },
      signLanguage: {
        enabled: formData.signLanguageEnabled,
        channels: ['American Sign Language (ASL)']
      },
      options: {
        allowJoinBeforeHost: formData.allowJoinBeforeHost,
        muteUponEntry: formData.muteUponEntry,
        autoRecord: formData.autoRecord,
        geminiAISummary: formData.geminiAISummary,
        requestPermissionToUnmute: formData.requestPermissionToUnmute,
      },
      continuousChatSettings: {
        enabled: formData.continuousChatEnabled,
        beforeMeetingChat: formData.continuousChatEnabled,
        duringMeetingChat: true,
        afterMeetingChat: formData.continuousChatEnabled,
        whoCanChat: 'everyone',
        allowFileSharing: true,
        allowReplies: true,
        allowReactions: true,
        retentionDays: 0,
      },
      attendees: 0
    };

    try {
      const createdMeeting = await addMeeting(payload);

      // Part 36: Save initial agenda topics if configured
      if (enableAgenda && agendaTopics.length > 0) {
        try {
          const token = localStorage.getItem('token');
          const cleanId = generatedMeetingId.replace(/\s/g, '');
          for (const [idx, item] of agendaTopics.entries()) {
            if (item.title && item.title.trim()) {
              await fetch(`${(typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1" ? "https://intellmeet-backend-h3md.onrender.com" : "http://localhost:5000")}/api/meetings/${cleanId}/agenda/items`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                  title: item.title.trim(),
                  durationMinutes: Number(item.durationMinutes) || 15,
                  presenterName: item.presenterName || user?.name || 'Host',
                  order: idx + 1
                })
              });
            }
          }
        } catch (agendaErr) {
          console.warn('Initial agenda setup notice:', agendaErr);
        }
      }

      // Part 39: Auto-sync to connected Google / Microsoft Calendar if requested
      if (syncCalendar) {
        try {
          const token = localStorage.getItem('token');
          await fetch('${(typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1" ? "https://intellmeet-backend-h3md.onrender.com" : "http://localhost:5000")}/api/integrations/calendar/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
            body: JSON.stringify({ provider: 'GOOGLE' })
          });
        } catch (e) {}
      }

      // Part 39: Dispatch to Slack channel if requested
      if (notifySlack) {
        try {
          const token = localStorage.getItem('token');
          await fetch('${(typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1" ? "https://intellmeet-backend-h3md.onrender.com" : "http://localhost:5000")}/api/integrations/dispatch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
            body: JSON.stringify({
              target: 'SLACK',
              meetingId: generatedMeetingId,
              meetingTitle: formData.topic,
              payload: {
                channel: '#general',
                text: `📅 *New IntelliMeet Meeting Scheduled*\n*Topic:* ${formData.topic}\n*Time:* ${formData.startDate} at ${formData.startTime}\n*Join URL:* http://localhost:5173/meetings/${generatedMeetingId.replace(/\s/g, '')}/room`
              }
            })
          });
        } catch (e) {}
      }

      toast.success('Meeting scheduled & synchronized with integrations!');
      const targetMeetingId = (createdMeeting?.meetingId || generatedMeetingId).replace(/\s/g, '');
      navigate(`/meetings/${targetMeetingId}`);
    } catch (error) {
      toast.error('Failed to schedule meeting: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const SectionTitle = ({ icon: Icon, title, subtitle }) => (
    <div className="pt-6 pb-3 border-b border-gray-200 mb-6 flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-base font-bold text-gray-900">{title}</h2>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
      </div>
    </div>
  );

  const FormRow = ({ label, required = false, children, helper = '' }) => (
    <div className="flex flex-col md:flex-row md:items-start gap-2 md:gap-8 mb-5">
      <div className="w-full md:w-56 shrink-0 pt-2">
        <label className="text-xs font-bold uppercase tracking-wider text-gray-700">
          {required && <span className="text-red-500 mr-1">*</span>}
          {label}
        </label>
        {helper && <p className="text-[11px] text-gray-400 mt-0.5">{helper}</p>}
      </div>
      <div className="flex-1 max-w-2xl">
        {children}
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 bg-white min-h-screen">
      
      {/* Top Header */}
      <div className="mb-6 flex items-center justify-between border-b border-gray-200 pb-4">
        <div>
          <Link to="/meetings" className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1 mb-1">
            <ChevronLeft className="w-3.5 h-3.5" /> Back to Upcoming Meetings
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Schedule a Meeting</h1>
        </div>
        <div className="flex gap-3">
          <Button variant="ghost" onClick={() => navigate('/meetings')} className="text-xs font-semibold text-gray-600">
            Cancel
          </Button>
          <Button onClick={handleSave} isLoading={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-6 rounded-xl shadow-md shadow-blue-600/20">
            Save & Schedule
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        
        {/* 1. BASIC INFORMATION */}
        <SectionTitle icon={Calendar} title="1. Basic Information" subtitle="Specify meeting topic, time, and recurrence" />

        <FormRow label="Topic" required={true}>
          <input 
            type="text" 
            name="topic" 
            value={formData.topic} 
            onChange={handleChange}
            placeholder="e.g. IntelliMeet Project Discussion"
            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-900 focus:border-blue-500 outline-none shadow-sm"
          />
        </FormRow>

        <FormRow label="Description">
          <textarea 
            name="description" 
            value={formData.description} 
            onChange={handleChange}
            rows={2}
            placeholder="Enter meeting agenda or brief description (optional)"
            className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm text-gray-700 focus:border-blue-500 outline-none"
          />
        </FormRow>

        <FormRow label="When" required={true}>
          <div className="flex flex-wrap items-center gap-3">
            {/* Date Picker */}
            <div className="relative min-w-[170px]">
              <input 
                type="date" 
                name="date" 
                value={formData.date} 
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm font-medium text-gray-800 focus:border-blue-500 outline-none cursor-pointer bg-white shadow-sm"
              />
            </div>

            {/* Time Selector: Standard Zoom 15-min Dropdown or Custom Input */}
            <div className="flex items-center gap-2">
              {!isCustomTime ? (
                <div className="relative min-w-[130px]">
                  <select 
                    name="time" 
                    value={formData.time} 
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm font-semibold text-gray-800 bg-white focus:border-blue-500 outline-none cursor-pointer shadow-sm"
                  >
                    {(!TIME_OPTIONS.includes(formData.time) && formData.time) && (
                      <option value={formData.time}>
                        {formData.time.includes(':') ? formData.time : `${formData.time}:00`}
                      </option>
                    )}
                    {TIME_OPTIONS.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="relative min-w-[130px]">
                  <input 
                    type="text" 
                    name="time" 
                    value={formData.time} 
                    onChange={handleChange}
                    placeholder="10:00"
                    autoFocus
                    className="w-full border border-blue-500 rounded-xl px-3 py-2 text-sm text-center font-semibold text-gray-800 focus:ring-1 focus:ring-blue-500 outline-none shadow-sm"
                  />
                </div>
              )}

              {/* AM / PM Selector */}
              <select 
                name="ampm" 
                value={formData.ampm} 
                onChange={handleChange}
                className="border border-gray-300 rounded-xl px-3 py-2 text-sm font-bold text-gray-800 bg-white focus:border-blue-500 outline-none cursor-pointer shadow-sm min-w-[70px]"
              >
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </select>

              {/* Switch between Dropdown and Manual Custom Type */}
              <button
                type="button"
                onClick={() => setIsCustomTime(!isCustomTime)}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors whitespace-nowrap"
                title={isCustomTime ? "Switch to standard time dropdown" : "Type a custom time manually"}
              >
                {isCustomTime ? "Select from list" : "Type custom"}
              </button>
            </div>
          </div>
          <p className="text-[11px] text-gray-400 mt-1.5 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-gray-400" />
            Choose a start time from the dropdown list or click &quot;Type custom&quot; to enter manually
          </p>
        </FormRow>

        <FormRow label="Duration">
          <div className="flex items-center gap-3">
            <select 
              name="durationHours" 
              value={formData.durationHours} 
              onChange={handleChange}
              className="border border-gray-300 rounded-xl px-3 py-2 text-sm bg-white focus:border-blue-500 outline-none"
            >
              {[0, 1, 2, 3, 4, 5, 8].map(h => <option key={h} value={h}>{h} hr</option>)}
            </select>
            <select 
              name="durationMinutes" 
              value={formData.durationMinutes} 
              onChange={handleChange}
              className="border border-gray-300 rounded-xl px-3 py-2 text-sm bg-white focus:border-blue-500 outline-none"
            >
              {[0, 15, 30, 45].map(m => <option key={m} value={m}>{m} min</option>)}
            </select>
            <span className="text-xs text-gray-400 italic">Expected meeting length (does not force disconnect)</span>
          </div>
        </FormRow>

        <FormRow label="Time Zone">
          <select 
            name="timezone" 
            value={formData.timezone} 
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-xs font-medium text-gray-800 bg-white focus:border-blue-500 outline-none"
          >
            <option>(UTC+05:30) Chennai, Kolkata, Mumbai, New Delhi</option>
            <option>(UTC-08:00) Pacific Time (US & Canada)</option>
            <option>(UTC-05:00) Eastern Time (US & Canada)</option>
            <option>(UTC+00:00) London, Dublin, Edinburgh</option>
            <option>(UTC+09:00) Tokyo, Osaka, Sapporo</option>
          </select>
        </FormRow>

        {/* Recurring Meeting Checkbox & Flow */}
        <FormRow label="Recurring Meeting">
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input 
                type="checkbox" 
                name="recurring" 
                checked={formData.recurring} 
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 accent-blue-600"
              />
              <span className="text-sm font-semibold text-gray-800">Recurring meeting</span>
            </label>

            {formData.recurring && (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl space-y-4 text-xs">
                <div className="flex items-center gap-4">
                  <span className="font-bold text-gray-700 w-24">Recurrence:</span>
                  <select 
                    name="recurrenceType" 
                    value={formData.recurrenceType} 
                    onChange={handleChange}
                    className="border border-gray-300 rounded-lg px-3 py-1.5 bg-white font-medium outline-none"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="noFixedTime">No Fixed Time</option>
                  </select>
                </div>

                {formData.recurrenceType === 'weekly' && (
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-gray-700 w-24">Occurs on:</span>
                    <div className="flex gap-1.5">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => handleDayToggle(d)}
                          className={`w-9 h-8 rounded-lg font-bold transition-all text-xs ${
                            formData.daysOfWeek.includes(d) 
                              ? 'bg-blue-600 text-white shadow-sm' 
                              : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {formData.recurrenceType !== 'noFixedTime' && (
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-gray-700 w-24">End Date:</span>
                    <input 
                      type="date" 
                      name="endDate" 
                      value={formData.endDate} 
                      onChange={handleChange}
                      className="border border-gray-300 rounded-lg px-3 py-1.5 bg-white font-medium outline-none"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </FormRow>

        {/* 2. MEETING IDENTITY */}
        <SectionTitle icon={Clock} title="2. Meeting Identity" subtitle="Generate a unique ID or use your Personal Meeting ID" />

        <FormRow label="Meeting ID">
          <div className="space-y-2 text-sm">
            <label className="flex items-center gap-3 cursor-pointer">
              <input 
                type="radio" 
                name="meetingIdType" 
                value="automatic" 
                checked={formData.meetingIdType === 'automatic'} 
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 accent-blue-600"
              />
              <span className="font-medium text-gray-800">Generate Automatically</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input 
                type="radio" 
                name="meetingIdType" 
                value="pmi" 
                checked={formData.meetingIdType === 'pmi'} 
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 accent-blue-600"
              />
              <span className="font-medium text-gray-800">Personal Meeting ID: <span className="font-mono font-bold text-blue-600">{user?.pmi || '834 521 528'}</span></span>
            </label>
          </div>
        </FormRow>

        {/* 3. SECURITY */}
        <SectionTitle icon={Shield} title="3. Meeting Security" subtitle="Configure passcode, waiting room, authentication, and registration" />

        <FormRow label="Passcode">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input 
                type="checkbox" 
                name="passcodeEnabled" 
                checked={formData.passcodeEnabled} 
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 accent-blue-600"
              />
              <span className="text-sm font-semibold text-gray-800">Require Passcode</span>
            </label>
            {formData.passcodeEnabled && (
              <input 
                type="text" 
                name="passcode" 
                value={formData.passcode} 
                onChange={handleChange}
                placeholder="ABC123"
                className="w-32 border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-mono font-bold text-center tracking-widest uppercase focus:border-blue-500 outline-none"
              />
            )}
          </div>
        </FormRow>

        <FormRow label="Waiting Room">
          <div className="space-y-1">
            <label className="flex items-center gap-3 cursor-pointer">
              <input 
                type="checkbox" 
                name="waitingRoom" 
                checked={formData.waitingRoom} 
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 accent-blue-600"
              />
              <span className="text-sm font-semibold text-gray-800">Enable Waiting Room</span>
            </label>
            <p className="text-xs text-gray-500 pl-7">Only users admitted by the host can join the meeting.</p>
          </div>
        </FormRow>

        <FormRow label="Authentication">
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input 
                type="checkbox" 
                name="requireAuth" 
                checked={formData.requireAuth} 
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 accent-blue-600"
              />
              <span className="text-sm font-semibold text-gray-800">Require authentication to join</span>
            </label>
            {formData.requireAuth && (
              <div className="pl-7 space-y-2 text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="authType" value="signedIn" checked={formData.authType === 'signedIn'} onChange={handleChange} className="accent-blue-600" />
                  <span>Signed-in IntellMeet users only</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="authType" value="organizationOnly" checked={formData.authType === 'organizationOnly'} onChange={handleChange} className="accent-blue-600" />
                  <span>Internal Organization Domain (@intellmeet.io) only</span>
                </label>
              </div>
            )}
          </div>
        </FormRow>

        <FormRow label="Registration">
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input 
                type="checkbox" 
                name="registrationRequired" 
                checked={formData.registrationRequired} 
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 accent-blue-600"
              />
              <span className="text-sm font-semibold text-gray-800">Required</span>
            </label>
            <p className="text-xs text-gray-500 pl-7">
              Attendees must register with their name, email, and questions before being allowed to join.
            </p>

            {formData.registrationRequired && (
              <div className="ml-7 p-4 bg-gray-50 border border-gray-200 rounded-2xl space-y-4 text-xs">
                <div>
                  <span className="font-bold text-gray-700 block mb-1.5">Approval Type:</span>
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="registrationApprovalType" 
                        value="automatic" 
                        checked={formData.registrationApprovalType === 'automatic'} 
                        onChange={handleChange} 
                        className="accent-blue-600" 
                      />
                      <span>Automatically Approve (Attendees immediately receive meeting access)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="registrationApprovalType" 
                        value="manual" 
                        checked={formData.registrationApprovalType === 'manual'} 
                        onChange={handleChange} 
                        className="accent-blue-600" 
                      />
                      <span>Manually Approve (Host must approve each registrant in Meeting Details)</span>
                    </label>
                  </div>
                </div>

                <div>
                  <span className="font-bold text-gray-700 block mb-1">Email Domain Restrictions (Optional):</span>
                  <input 
                    type="text" 
                    name="registrationAllowedDomains" 
                    value={formData.registrationAllowedDomains} 
                    onChange={handleChange}
                    placeholder="e.g. company.com, university.edu (leave blank for any email)"
                    className="w-full border border-gray-300 rounded-xl px-3 py-1.5 text-xs bg-white focus:border-blue-500 outline-none"
                  />
                  <p className="text-[11px] text-gray-400 mt-0.5">Separate multiple domains with commas.</p>
                </div>
              </div>
            )}
          </div>
        </FormRow>

        {/* 31.1 & 31.4 Meeting Encryption Type */}
        <FormRow label="Encryption">
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="encryption" 
                  value="enhanced" 
                  checked={formData.encryption === 'enhanced'} 
                  onChange={handleChange} 
                  className="accent-blue-600" 
                />
                <span className="text-sm font-semibold text-gray-800">
                  Enhanced Encryption <span className="text-xs text-gray-500 font-normal">(Default & Recommended)</span>
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="encryption" 
                  value="e2ee" 
                  checked={formData.encryption === 'e2ee'} 
                  onChange={() => {
                    setShowE2EEModal(true);
                  }} 
                  className="accent-blue-600" 
                />
                <span className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                  <span>End-to-End Encryption (E2EE)</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full font-bold">
                    Section 31
                  </span>
                </span>
              </label>
            </div>

            <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-600 leading-relaxed">
              {formData.encryption === 'e2ee' ? (
                <div className="text-amber-800 flex items-start gap-2">
                  <span className="font-bold text-amber-600">⚠️ Notice:</span>
                  <span>
                    Under End-to-End Encryption, keys are generated strictly on participant devices. Cloud recording, AI meeting summary, AI questions, live transcription, whiteboard, and polls are automatically disabled (31.8).
                  </span>
                </div>
              ) : (
                <div className="text-gray-600">
                  Meeting traffic is protected in transit using standard 256-bit AES-GCM encryption. All AI summary, transcription, cloud recording, and collaboration tools are fully operational.
                </div>
              )}
            </div>
          </div>
        </FormRow>

        {/* 32.1 & 32.2 Meeting Watermarking */}
        <FormRow label="Watermarking">
          <div className="space-y-4">
            {/* Visual Watermark Toggle */}
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  name="visualWatermarkEnabled"
                  checked={formData.visualWatermarkEnabled}
                  onChange={(e) => setFormData(prev => ({ ...prev, visualWatermarkEnabled: e.target.checked }))}
                  className="mt-1 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-800">Visual Watermark (32.1)</span>
                    <span className="text-[10px] bg-blue-100 text-blue-800 border border-blue-300 px-2 py-0.5 rounded-full font-bold">
                      Anti-Screenshot
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Overlays the viewing participant's identity across video tiles or shared content to discourage and trace unauthorized screenshots or video recordings.
                  </p>
                </div>
              </label>

              {formData.visualWatermarkEnabled && (
                <div className="pl-7 pt-2 border-t border-gray-200 space-y-3">
                  {/* Grid Mode */}
                  <div>
                    <span className="text-xs font-semibold text-gray-700 block mb-1.5">Pattern Layout:</span>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-700">
                        <input
                          type="radio"
                          name="watermarkMode"
                          value="repeated"
                          checked={formData.watermarkMode === 'repeated'}
                          onChange={(e) => setFormData(prev => ({ ...prev, watermarkMode: e.target.value }))}
                          className="text-blue-600"
                        />
                        <span>Multi-Tile Grid (Repeated) <span className="text-gray-400 font-normal">(Crop-proof)</span></span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-700">
                        <input
                          type="radio"
                          name="watermarkMode"
                          value="single"
                          checked={formData.watermarkMode === 'single'}
                          onChange={(e) => setFormData(prev => ({ ...prev, watermarkMode: e.target.value }))}
                          className="text-blue-600"
                        />
                        <span>Center Badge (Single)</span>
                      </label>
                    </div>
                  </div>

                  {/* Visible On */}
                  <div>
                    <span className="text-xs font-semibold text-gray-700 block mb-1.5">Apply Watermark To:</span>
                    <div className="flex flex-wrap gap-4">
                      <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-700">
                        <input
                          type="radio"
                          name="watermarkVisibleOn"
                          value="both"
                          checked={formData.watermarkVisibleOn === 'both'}
                          onChange={(e) => setFormData(prev => ({ ...prev, watermarkVisibleOn: e.target.value }))}
                          className="text-blue-600"
                        />
                        <span>Both Screen Share & Video Feeds</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-700">
                        <input
                          type="radio"
                          name="watermarkVisibleOn"
                          value="sharedContent"
                          checked={formData.watermarkVisibleOn === 'sharedContent'}
                          onChange={(e) => setFormData(prev => ({ ...prev, watermarkVisibleOn: e.target.value }))}
                          className="text-blue-600"
                        />
                        <span>Shared Screen Only</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-700">
                        <input
                          type="radio"
                          name="watermarkVisibleOn"
                          value="video"
                          checked={formData.watermarkVisibleOn === 'video'}
                          onChange={(e) => setFormData(prev => ({ ...prev, watermarkVisibleOn: e.target.value }))}
                          className="text-blue-600"
                        />
                        <span>Video Feeds Only</span>
                      </label>
                    </div>
                  </div>

                  {/* Identity Format & Opacity */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <span className="text-xs font-semibold text-gray-700 block mb-1">Viewer Identifier:</span>
                      <select
                        value={formData.watermarkIdentityType}
                        onChange={(e) => setFormData(prev => ({ ...prev, watermarkIdentityType: e.target.value }))}
                        className="w-full text-xs px-2.5 py-1.5 border border-gray-300 rounded-lg bg-white"
                      >
                        <option value="maskedEmail">Masked Email (e.g. kv***@gmail.com - Privacy Safe)</option>
                        <option value="email">Full Email Address</option>
                        <option value="participantId">Participant ID Only</option>
                      </select>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-semibold text-gray-700">Opacity:</span>
                        <span className="text-xs font-bold text-blue-600">{formData.watermarkOpacity}%</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="80"
                        step="5"
                        value={formData.watermarkOpacity}
                        onChange={(e) => setFormData(prev => ({ ...prev, watermarkOpacity: Number(e.target.value) }))}
                        className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Audio Watermark Toggle */}
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
              <label className="flex items-start gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  name="audioWatermarkEnabled"
                  checked={formData.audioWatermarkEnabled}
                  onChange={(e) => setFormData(prev => ({ ...prev, audioWatermarkEnabled: e.target.checked }))}
                  className="mt-1 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-800">Audio Watermark (32.2)</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full font-bold">
                      Acoustic Forensic Token
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Embeds an inaudible ultrasonic fingerprint (18.5 kHz) into speaker audio streams. Used to trace leak recordings made by external smartphone microphones back to the specific participant.
                  </p>
                </div>
              </label>
            </div>
          </div>
        </FormRow>

        {/* 33.1 & 33.3 Live Streaming Configuration */}
        <FormRow label="Live Streaming">
          <div className="space-y-4">
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  name="liveStreamEnabled"
                  checked={formData.liveStreamEnabled}
                  onChange={(e) => setFormData(prev => ({ ...prev, liveStreamEnabled: e.target.checked }))}
                  className="mt-1 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-800">Allow Live Streaming of Meeting (33.2 & 33.3)</span>
                    <span className="text-[10px] bg-red-100 text-red-800 border border-red-300 px-2 py-0.5 rounded-full font-bold">
                      Broadcast RTMP
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Broadcast meeting media to YouTube, Facebook, Twitch, or Custom RTMP services for external public or enterprise audiences.
                  </p>
                </div>
              </label>

              {formData.liveStreamEnabled && (
                <div className="pl-7 pt-2 border-t border-gray-200 space-y-3">
                  {/* Platform Selection */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <span className="text-xs font-semibold text-gray-700 block mb-1">Target Platform:</span>
                      <select
                        value={formData.liveStreamPlatform}
                        onChange={(e) => {
                          const platform = e.target.value;
                          const urlMap = {
                            YOUTUBE: 'rtmp://a.rtmp.youtube.com/live2',
                            FACEBOOK: 'rtmps://live-api-s.facebook.com:443/rtmp/',
                            TWITCH: 'rtmp://live.twitch.tv/app/',
                            CUSTOM_RTMP: 'rtmp://'
                          };
                          const pageMap = {
                            YOUTUBE: 'https://youtube.com/live',
                            FACEBOOK: 'https://facebook.com/live',
                            TWITCH: 'https://twitch.tv',
                            CUSTOM_RTMP: ''
                          };
                          setFormData(prev => ({
                            ...prev,
                            liveStreamPlatform: platform,
                            liveStreamUrl: urlMap[platform] || 'rtmp://',
                            liveStreamPageUrl: pageMap[platform] || ''
                          }));
                        }}
                        className="w-full text-xs px-2.5 py-1.5 border border-gray-300 rounded-lg bg-white"
                      >
                        <option value="YOUTUBE">YouTube Live (Direct Integration)</option>
                        <option value="FACEBOOK">Facebook Live (Direct Integration)</option>
                        <option value="TWITCH">Twitch (Direct Integration)</option>
                        <option value="CUSTOM_RTMP">Custom Live Streaming (RTMP / RTMPS)</option>
                      </select>
                    </div>

                    <div>
                      <span className="text-xs font-semibold text-gray-700 block mb-1">Stream Resolution:</span>
                      <select
                        value={formData.liveStreamResolution}
                        onChange={(e) => setFormData(prev => ({ ...prev, liveStreamResolution: e.target.value }))}
                        className="w-full text-xs px-2.5 py-1.5 border border-gray-300 rounded-lg bg-white"
                      >
                        <option value="720p">720p HD (Recommended & Standard)</option>
                        <option value="1080p">1080p Full HD</option>
                        <option value="480p">480p SD</option>
                      </select>
                    </div>
                  </div>

                  {/* Stream URL & Key */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <span className="text-xs font-semibold text-gray-700 block mb-1">Stream URL (RTMP/RTMPS):</span>
                      <input
                        type="text"
                        value={formData.liveStreamUrl}
                        onChange={(e) => setFormData(prev => ({ ...prev, liveStreamUrl: e.target.value }))}
                        className="w-full text-xs px-2.5 py-1.5 border border-gray-300 rounded-lg bg-white font-mono"
                        placeholder="rtmp://..."
                      />
                    </div>

                    <div>
                      <span className="text-xs font-semibold text-gray-700 block mb-1">Stream Key (Secured & Masked):</span>
                      <input
                        type="password"
                        value={formData.liveStreamKey}
                        onChange={(e) => setFormData(prev => ({ ...prev, liveStreamKey: e.target.value }))}
                        className="w-full text-xs px-2.5 py-1.5 border border-gray-300 rounded-lg bg-white font-mono"
                        placeholder="Paste Stream Key from platform"
                      />
                    </div>
                  </div>

                  {/* Public Stream Page URL */}
                  <div>
                    <span className="text-xs font-semibold text-gray-700 block mb-1">Public Livestream Watch Page URL:</span>
                    <input
                      type="text"
                      value={formData.liveStreamPageUrl}
                      onChange={(e) => setFormData(prev => ({ ...prev, liveStreamPageUrl: e.target.value }))}
                      className="w-full text-xs px-2.5 py-1.5 border border-gray-300 rounded-lg bg-white"
                      placeholder="https://..."
                    />
                  </div>

                  {/* Branding Watermark */}
                  <div className="pt-2 border-t border-gray-200">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-700">
                      <input
                        type="checkbox"
                        checked={formData.liveStreamWatermark}
                        onChange={(e) => setFormData(prev => ({ ...prev, liveStreamWatermark: e.target.checked }))}
                        className="text-blue-600 rounded"
                      />
                      <span className="font-semibold">Display Organization Livestream Watermark (Section 33.13)</span>
                      <span className="text-gray-500 font-normal">("Powered by IntelliMeet" in bottom-right corner of broadcast)</span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>
        </FormRow>

        {/* 4. VIDEO & AUDIO */}
        <SectionTitle icon={Video} title="4. Video & Audio Options" subtitle="Configure default hardware join states" />

        <FormRow label="Video">
          <div className="space-y-3 text-sm text-gray-800">
            <div className="flex items-center gap-8">
              <span className="w-24 font-bold text-xs uppercase text-gray-600">Host:</span>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="hostVideo" value="on" checked={formData.hostVideo === 'on'} onChange={handleChange} className="accent-blue-600" /> On
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="hostVideo" value="off" checked={formData.hostVideo === 'off'} onChange={handleChange} className="accent-blue-600" /> Off
              </label>
            </div>
            <div className="flex items-center gap-8">
              <span className="w-24 font-bold text-xs uppercase text-gray-600">Participant:</span>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="participantVideo" value="on" checked={formData.participantVideo === 'on'} onChange={handleChange} className="accent-blue-600" /> On
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="participantVideo" value="off" checked={formData.participantVideo === 'off'} onChange={handleChange} className="accent-blue-600" /> Off
              </label>
            </div>
          </div>
        </FormRow>

        <FormRow label="Audio">
          <div className="space-y-2 text-sm text-gray-800">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="radio" name="audioOption" value="both" checked={formData.audioOption === 'both'} onChange={handleChange} className="accent-blue-600" />
              <span className="font-semibold">Telephone and Computer Audio</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="radio" name="audioOption" value="voip" checked={formData.audioOption === 'voip'} onChange={handleChange} className="accent-blue-600" />
              <span>Computer Audio Only</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="radio" name="audioOption" value="telephony" checked={formData.audioOption === 'telephony'} onChange={handleChange} className="accent-blue-600" />
              <span>Telephone Only</span>
            </label>
          </div>
        </FormRow>

        {/* 5. PEOPLE & ROLES */}
        <SectionTitle icon={Users} title="5. People & Roles" subtitle="Configure alternative hosts and view co-host assignments" />

        <FormRow label="Alternative Hosts">
          <div className="space-y-2">
            <input 
              type="text" 
              name="alternativeHosts" 
              value={formData.alternativeHosts} 
              onChange={handleChange}
              placeholder="e.g. colleague1@example.com, colleague2@example.com"
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:border-blue-500 outline-none"
            />
            <p className="text-xs text-gray-500">
              Alternative hosts can start the meeting if you are absent or unavailable. Enter valid user emails separated by commas.
            </p>
          </div>
        </FormRow>

        <FormRow label="Co-host Note">
          <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-gray-700 leading-relaxed">
            <strong>Co-host Assignment:</strong> Unlike Alternative Hosts, Co-hosts are assigned live inside the meeting. To promote a participant, start the meeting, open <strong>Participants → Select attendee → More (...) → Make Co-host</strong>.
          </div>
        </FormRow>

        {/* 6. ENGAGEMENT: POLLS & QUIZZES */}
        <SectionTitle icon={BarChart2} title="6. Pre-Meeting Polls & Quizzes" subtitle="Prepare interactive polls for your attendees ahead of time" />

        <FormRow label="Polls / Quizzes">
          <div className="space-y-3">
            {polls.length === 0 ? (
              <p className="text-xs text-gray-500 italic">No polls created for this meeting yet.</p>
            ) : (
              <div className="space-y-2">
                {polls.map((p, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-gray-900">{idx + 1}. {p.question}</p>
                      <p className="text-[11px] text-gray-500">{p.options.length} answer options</p>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setPolls(polls.filter((_, i) => i !== idx))} 
                      className="text-xs text-red-600 hover:underline font-semibold"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button 
              type="button" 
              onClick={() => setShowPollModal(true)}
              className="px-4 py-2 border border-blue-200 text-blue-600 rounded-xl text-xs font-bold hover:bg-blue-50 transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Create Poll Question
            </button>
          </div>
        </FormRow>

        {/* 7. ACCESSIBILITY & INTERPRETATION */}
        <SectionTitle icon={Languages} title="7. Language & Sign-Language Interpretation" subtitle="Assign multilingual audio channels and sign-language video tiles" />

        <FormRow label="Language Interpretation">
          <div className="space-y-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input 
                type="checkbox" 
                name="interpretationEnabled" 
                checked={formData.interpretationEnabled} 
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 accent-blue-600"
              />
              <span className="text-sm font-semibold text-gray-800">Enable Language Interpretation</span>
            </label>
            {formData.interpretationEnabled && (
              <div className="pl-7 pt-2 flex flex-wrap gap-2 text-xs">
                {['English', 'Tamil', 'Hindi', 'Spanish', 'French', 'German', 'Japanese'].map(lang => (
                  <span key={lang} className="px-3 py-1 bg-gray-100 rounded-full font-medium text-gray-700 border border-gray-200">
                    {lang} Channel
                  </span>
                ))}
              </div>
            )}
          </div>
        </FormRow>

        <FormRow label="Sign Language">
          <div className="space-y-1">
            <label className="flex items-center gap-3 cursor-pointer">
              <input 
                type="checkbox" 
                name="signLanguageEnabled" 
                checked={formData.signLanguageEnabled} 
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 accent-blue-600"
              />
              <span className="text-sm font-semibold text-gray-800">Enable Sign-Language Interpretation</span>
            </label>
            <p className="text-xs text-gray-500 pl-7">Allows designating sign-language interpreters to specific video broadcast tiles.</p>
          </div>
        </FormRow>

        {/* 8. OTHER MEETING OPTIONS */}
        <SectionTitle icon={Settings2} title="8. Other Meeting Options" subtitle="Configure automated recording, AI features, and entry rules" />

        <FormRow label="Join Options">
          <div className="space-y-2 text-sm text-gray-800">
            <label className="flex items-center gap-3 cursor-pointer">
              <input 
                type="checkbox" 
                name="allowJoinBeforeHost" 
                checked={formData.allowJoinBeforeHost} 
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 accent-blue-600"
              />
              <span>Allow participants to join anytime (Join before host)</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input 
                type="checkbox" 
                name="muteUponEntry" 
                checked={formData.muteUponEntry} 
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 accent-blue-600"
              />
              <span>Mute participants upon entry</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input 
                type="checkbox" 
                name="requestPermissionToUnmute" 
                checked={formData.requestPermissionToUnmute} 
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 accent-blue-600"
              />
              <span>Request permission to unmute participants</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input 
                type="checkbox" 
                name="continuousChatEnabled" 
                checked={formData.continuousChatEnabled} 
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 accent-blue-600"
              />
              <span className="font-semibold text-blue-900">
                Continuous Meeting Chat (Allow participants to chat before, during, and after the meeting)
              </span>
            </label>
          </div>
        </FormRow>

        <FormRow label="Automatic Recording">
          <div className="space-y-2 text-sm text-gray-800">
            <label className="flex items-center gap-3 cursor-pointer">
              <input 
                type="radio" 
                name="autoRecord" 
                value="none" 
                checked={formData.autoRecord === 'none'} 
                onChange={handleChange} 
                className="accent-blue-600" 
              />
              <span>Do not record automatically</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input 
                type="radio" 
                name="autoRecord" 
                value="local" 
                checked={formData.autoRecord === 'local'} 
                onChange={handleChange} 
                className="accent-blue-600" 
              />
              <span className="font-medium">Record automatically on local computer</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input 
                type="radio" 
                name="autoRecord" 
                value="cloud" 
                checked={formData.autoRecord === 'cloud'} 
                onChange={handleChange} 
                className="accent-blue-600" 
              />
              <span className="font-medium">Record automatically in the Cloud (with AI Summarization)</span>
            </label>
          </div>
        </FormRow>

        <FormRow label="AI Companion">
          <div className="space-y-1">
            <label className="flex items-center gap-3 cursor-pointer">
              <input 
                type="checkbox" 
                name="geminiAISummary" 
                checked={formData.geminiAISummary} 
                onChange={handleChange}
                className="w-4 h-4 text-purple-600 rounded border-gray-300 accent-purple-600"
              />
              <span className="text-sm font-bold text-purple-900">Enable Google Gemini AI Summary & Auto Tasks</span>
            </label>
            <p className="text-xs text-gray-500 pl-7">
              Automatically summarize transcript and extract action items onto your personal Task Board.
            </p>
          </div>
        </FormRow>

        {/* PART 36: AGENDA & MEETING PREPARATION SECTION (36.1 - 36.15) */}
        <SectionTitle 
          icon={ListChecks} 
          title="Meeting Agenda & Preparation" 
          subtitle="Pre-populate agenda topics with allocated durations and presenters (Section 36.1 - 36.15)" 
        />

        <FormRow label="Agenda Topics" helper="Outline key discussion points before the meeting begins">
          <div className="space-y-3 w-full">
            <label className="flex items-center gap-3 cursor-pointer">
              <input 
                type="checkbox" 
                checked={enableAgenda} 
                onChange={(e) => setEnableAgenda(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded border-gray-300 accent-emerald-600"
              />
              <span className="text-sm font-bold text-gray-900">Include Pre-Meeting Agenda & Topic Outline</span>
            </label>

            {enableAgenda && (
              <div className="space-y-2.5 pt-2">
                {agendaTopics.map((topic, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-gray-50 border border-gray-200 p-2.5 rounded-xl">
                    <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <input 
                      type="text" 
                      value={topic.title} 
                      onChange={(e) => {
                        const copy = [...agendaTopics];
                        copy[idx].title = e.target.value;
                        setAgendaTopics(copy);
                      }}
                      placeholder="Topic Title (e.g. Frontend Architecture)" 
                      className="flex-1 border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs font-medium focus:border-emerald-500 outline-none"
                    />
                    <div className="flex items-center gap-1 shrink-0">
                      <input 
                        type="number" 
                        value={topic.durationMinutes} 
                        onChange={(e) => {
                          const copy = [...agendaTopics];
                          copy[idx].durationMinutes = Number(e.target.value);
                          setAgendaTopics(copy);
                        }}
                        min="1" 
                        max="180" 
                        className="w-14 border border-gray-300 rounded-lg px-2 py-1.5 text-xs text-center font-medium focus:border-emerald-500 outline-none"
                      />
                      <span className="text-[11px] text-gray-500">min</span>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setAgendaTopics(agendaTopics.filter((_, i) => i !== idx))}
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                      title="Remove Topic"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                <button 
                  type="button" 
                  onClick={() => setAgendaTopics([...agendaTopics, { title: '', durationMinutes: 15, presenterName: '' }])}
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1 pt-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Topic
                </button>
              </div>
            )}
          </div>
        </FormRow>

        {/* PART 39: WORKPLACE INTEGRATIONS SECTION */}
        <SectionTitle 
          icon={Globe} 
          title="Workplace & Calendar Integrations (Part 39)" 
          subtitle="Automatically synchronize this meeting with your connected calendar and Slack channels" 
        />

        <FormRow label="Calendar & Chat Sync" helper="Ensure attendees receive invites on their work calendar">
          <div className="space-y-3 w-full">
            <label className="flex items-center gap-3 cursor-pointer">
              <input 
                type="checkbox" 
                checked={syncCalendar} 
                onChange={(e) => setSyncCalendar(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 accent-blue-600"
              />
              <div>
                <span className="text-sm font-bold text-gray-900">Synchronize with Connected Calendar</span>
                <p className="text-xs text-gray-500">Creates event on your connected Google Calendar or Microsoft 365 Outlook with meeting URL and passcode</p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input 
                type="checkbox" 
                checked={notifySlack} 
                onChange={(e) => setNotifySlack(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded border-gray-300 accent-emerald-600"
              />
              <div>
                <span className="text-sm font-bold text-gray-900">Announce in Slack Channel (#general)</span>
                <p className="text-xs text-gray-500">Post meeting time, agenda outline and 1-click join link to your team Slack channel</p>
              </div>
            </label>
          </div>
        </FormRow>

        {/* BOTTOM SAVE ACTIONS */}
        <div className="pt-8 border-t border-gray-200 flex items-center justify-end gap-4">
          <Button variant="ghost" onClick={() => navigate('/meetings')} className="text-xs font-bold text-gray-600 px-6 py-2.5 rounded-xl">
            Cancel
          </Button>
          <Button onClick={handleSave} isLoading={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-8 py-3 rounded-xl shadow-lg shadow-blue-600/30">
            Save Meeting
          </Button>
        </div>

      </div>

      {/* POLL CREATION MODAL */}
      {showPollModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-gray-200 overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-900 text-sm">Add Pre-Meeting Poll Question</h3>
              <button onClick={() => setShowPollModal(false)} className="text-gray-400 hover:text-gray-600 text-lg font-bold">×</button>
            </div>
            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-gray-700 font-bold mb-1">Poll Question</label>
                <input 
                  type="text" 
                  value={newPollQuestion} 
                  onChange={e => setNewPollQuestion(e.target.value)}
                  placeholder="e.g. What technology framework are we prioritizing?"
                  className="w-full border border-gray-300 rounded-xl p-2.5 focus:border-blue-500 outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1.5">Options</label>
                <div className="space-y-2">
                  {newPollOptions.map((opt, i) => (
                    <input 
                      key={i} 
                      type="text" 
                      value={opt} 
                      onChange={e => {
                        const copy = [...newPollOptions];
                        copy[i] = e.target.value;
                        setNewPollOptions(copy);
                      }}
                      placeholder={`Option ${i + 1}`}
                      className="w-full border border-gray-300 rounded-lg p-2 focus:border-blue-500 outline-none"
                    />
                  ))}
                </div>
                {newPollOptions.length < 5 && (
                  <button 
                    type="button" 
                    onClick={() => setNewPollOptions([...newPollOptions, ''])}
                    className="text-xs text-blue-600 font-bold hover:underline mt-2 inline-block"
                  >
                    + Add Another Option
                  </button>
                )}
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowPollModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 font-bold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  onClick={handleAddPoll}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md"
                >
                  Add Question
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Part 31: E2EE Compatibility Warning Modal */}
      <E2EEWarningModal
        isOpen={showE2EEModal}
        onClose={() => setShowE2EEModal(false)}
        onConfirm={() => {
          setFormData(prev => ({ ...prev, encryption: 'e2ee' }));
          setShowE2EEModal(false);
          toast.success('End-to-End Encryption enabled for this meeting');
        }}
      />

    </div>
  );
}
