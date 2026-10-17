import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Users,
  Video,
  Play,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Search,
  FileText,
  ListTodo,
  Share2,
  ExternalLink,
  Shield,
  Layers,
  Activity,
  ArrowRight,
  ChevronRight,
  Plus,
  Database,
  BarChart2,
  MessageSquare,
  Bookmark,
  Check,
  Cpu,
  Download,
  Send,
  Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';
import ExportSummaryIntegrationModal from '../integrations/ExportSummaryIntegrationModal';

const API_BASE = import.meta.env.VITE_API_BASE_URL || `${(typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1" ? "https://intellmeet-backend-rc32.onrender.com" : "http://localhost:5000")}/api`;

export default function MeetingLifecycleHub({ meetingId, initialMeeting }) {
  const navigate = useNavigate();

  // State
  const [lifecycle, setLifecycle] = useState(null);
  const [knowledge, setKnowledge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activePhaseIndex, setActivePhaseIndex] = useState(0);
  const [activeKnowledgeTab, setActiveKnowledgeTab] = useState('overview'); // overview, decisions, actions, agenda, chapters, chat
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // New action item state
  const [newActionText, setNewActionText] = useState('');
  const [newActionOwner, setNewActionOwner] = useState('');
  const [isAddingAction, setIsAddingAction] = useState(false);

  // New decision state
  const [newDecisionTitle, setNewDecisionTitle] = useState('');
  const [newDecisionContext, setNewDecisionContext] = useState('');
  const [isAddingDecision, setIsAddingDecision] = useState(false);

  // Socket connection
  useEffect(() => {
    const socket = io(import.meta.env.VITE_SOCKET_URL || `${(typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1" ? "https://intellmeet-backend-rc32.onrender.com" : "http://localhost:5000")}`);
    socket.emit('join-room', meetingId, 'User-' + Math.random().toString(36).substring(7), 'Participant');

    socket.on('meeting-lifecycle-changed', (data) => {
      if (data.meetingId === meetingId) {
        toast.success(`Meeting lifecycle stage updated: ${data.stage}`);
        fetchLifecycle();
        fetchKnowledge();
      }
    });

    socket.on('meeting-lifecycle-pipeline-updated', (data) => {
      if (data.meetingId === meetingId) {
        setLifecycle((prev) => (prev ? { ...prev, pipeline: data.pipeline, pipelineProgress: data.progress } : prev));
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [meetingId]);

  // Fetch Lifecycle Status
  const fetchLifecycle = async () => {
    try {
      const res = await fetch(`${API_BASE}/meetings/${meetingId}/lifecycle`);
      const data = await res.json();
      if (data.success) {
        setLifecycle(data);
        if (data.currentStage === 'PROCESSING') {
          setIsProcessing(true);
        } else {
          setIsProcessing(false);
        }
      }
    } catch (err) {
      console.error('Error fetching lifecycle:', err);
    }
  };

  // Fetch Knowledge Layer
  const fetchKnowledge = async (query = '') => {
    try {
      const url = query
        ? `${API_BASE}/meetings/${meetingId}/knowledge?q=${encodeURIComponent(query)}`
        : `${API_BASE}/meetings/${meetingId}/knowledge`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setKnowledge(data.knowledge);
      }
    } catch (err) {
      console.error('Error fetching knowledge:', err);
    }
  };

  // Initial load
  useEffect(() => {
    setLoading(true);
    Promise.all([fetchLifecycle(), fetchKnowledge()]).finally(() => setLoading(false));
  }, [meetingId]);

  // Handle Search Input
  const handleSearch = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    fetchKnowledge(val);
  };

  // Trigger Post-Meeting Pipeline
  const handleTriggerPipeline = async () => {
    setIsProcessing(true);
    toast.loading('Post-meeting AI pipeline initiated...', { id: 'pipeline-toast' });
    try {
      const res = await fetch(`${API_BASE}/meetings/${meetingId}/lifecycle/trigger-pipeline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Post-meeting AI pipeline completed! Knowledge layer updated.', { id: 'pipeline-toast' });
        await fetchLifecycle();
        await fetchKnowledge();
      } else {
        toast.error(data.message || 'Pipeline execution failed', { id: 'pipeline-toast' });
      }
    } catch (err) {
      toast.error('Network error triggering pipeline', { id: 'pipeline-toast' });
    } finally {
      setIsProcessing(false);
    }
  };

  // Transition Meeting Stage
  const handleStageTransition = async (newStage) => {
    try {
      const res = await fetch(`${API_BASE}/meetings/${meetingId}/lifecycle/stage`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage: newStage,
          triggeredBy: initialMeeting?.hostName || 'Host',
          notes: `Transitioned to ${newStage} from Lifecycle Hub`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Transitioned to ${newStage}`);
        fetchLifecycle();
      } else {
        toast.error(data.message || 'Transition failed');
      }
    } catch (err) {
      toast.error('Failed to transition stage');
    }
  };

  // Toggle Action Item Status
  const handleToggleAction = async (actionId, currentStatus) => {
    const newStatus = currentStatus === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    try {
      const res = await fetch(`${API_BASE}/meetings/${meetingId}/knowledge/action-item/${actionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setKnowledge((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            actionItems: prev.actionItems.map((item) =>
              item.actionId === actionId ? { ...item, status: newStatus } : item
            ),
          };
        });
        toast.success(`Task marked as ${newStatus}`);
      }
    } catch (err) {
      toast.error('Failed to update task');
    }
  };

  // Add New Action Item
  const handleAddAction = async (e) => {
    e.preventDefault();
    if (!newActionText.trim()) return;

    try {
      const res = await fetch(`${API_BASE}/meetings/${meetingId}/knowledge/action-item`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task: newActionText.trim(),
          owner: newActionOwner.trim() || 'Team Member',
          priority: 'MEDIUM',
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Action item recorded');
        setNewActionText('');
        setNewActionOwner('');
        setIsAddingAction(false);
        fetchKnowledge(searchQuery);
      }
    } catch (err) {
      toast.error('Failed to add action item');
    }
  };

  // Add New Decision
  const handleAddDecision = async (e) => {
    e.preventDefault();
    if (!newDecisionTitle.trim()) return;

    try {
      const res = await fetch(`${API_BASE}/meetings/${meetingId}/knowledge/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newDecisionTitle.trim(),
          context: newDecisionContext.trim(),
          decidedBy: initialMeeting?.hostName || 'Meeting Participants',
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Decision recorded');
        setNewDecisionTitle('');
        setNewDecisionContext('');
        setIsAddingDecision(false);
        fetchKnowledge(searchQuery);
      }
    } catch (err) {
      toast.error('Failed to record decision');
    }
  };

  // Status Styling Helpers
  const getStageBadgeColor = (stage) => {
    switch (stage) {
      case 'LIVE':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 animate-pulse';
      case 'PROCESSING':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/40 animate-pulse';
      case 'COMPLETED':
        return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40';
      case 'ENDING':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/40';
      case 'WAITING_TO_START':
        return 'bg-sky-500/20 text-sky-400 border-sky-500/40';
      default:
        return 'bg-slate-700/50 text-slate-300 border-slate-600/50';
    }
  };

  const currentStage = lifecycle?.currentStage || 'SCHEDULED';
  const phases = lifecycle?.phases || [];
  const pipeline = lifecycle?.pipeline || {
    recording: 'IDLE',
    transcript: 'IDLE',
    aiSummary: 'IDLE',
    smartRecording: 'IDLE',
    analytics: 'IDLE',
  };

  if (loading && !lifecycle) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-4 text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
        <p className="text-sm">Synthesizing Complete Meeting Lifecycle...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ─── 1. Header Banner & Quick Actions ───────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-6 border border-slate-700/60 shadow-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <span className="px-2.5 py-1 text-xs font-semibold uppercase tracking-wider rounded-md border bg-indigo-500/20 text-indigo-300 border-indigo-500/40 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Part 40: Lifecycle Hub
              </span>
              <span
                className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full border ${getStageBadgeColor(
                  currentStage
                )} flex items-center gap-1.5`}
              >
                <span className="w-2 h-2 rounded-full bg-current" />
                Stage: {currentStage}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              {lifecycle?.title || initialMeeting?.title || 'IntelliMeet Session'}
            </h1>
            <p className="text-slate-400 text-sm mt-1 flex items-center gap-4 flex-wrap">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-500" />
                {knowledge?.date || initialMeeting?.date || 'Today'}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-500" />
                {knowledge?.duration || initialMeeting?.duration || '45 mins'}
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-slate-500" />
                Host: {knowledge?.hostName || initialMeeting?.hostName || 'Host'}
              </span>
              <span className="text-slate-500">ID: {meetingId}</span>
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {currentStage !== 'LIVE' && currentStage !== 'COMPLETED' && (
              <button
                onClick={() => navigate(`/meetings/${meetingId}/room`)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all"
              >
                <Play className="w-4 h-4 fill-white" />
                Join / Start Live Call
              </button>
            )}

            {currentStage === 'LIVE' && (
              <button
                onClick={() => handleStageTransition('ENDING')}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold rounded-xl flex items-center gap-2 shadow-lg shadow-rose-600/20 transition-all"
              >
                <AlertCircle className="w-4 h-4" />
                End Meeting
              </button>
            )}

            <button
              onClick={handleTriggerPipeline}
              disabled={isProcessing}
              className={`px-4 py-2 ${
                isProcessing
                  ? 'bg-amber-600/40 text-amber-200 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white'
              } text-sm font-semibold rounded-xl flex items-center gap-2 shadow-lg transition-all`}
            >
              <Cpu className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
              {isProcessing ? 'Processing Pipeline...' : 'Run Post-Meeting Pipeline'}
            </button>

            <button
              onClick={() => setIsExportModalOpen(true)}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-xl border border-slate-700 flex items-center gap-2 transition-all"
            >
              <Share2 className="w-4 h-4 text-slate-400" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* ─── 2. 7-Phase Interactive Lifecycle Stepper (Timeline) ─────────── */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-semibold text-white">Continuous Lifecycle Journey (Phases 1 - 7)</h2>
          </div>
          <span className="text-xs text-slate-400">Click any phase to inspect details</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
          {phases.map((phase, idx) => {
            const isSelected = activePhaseIndex === idx;
            const isCompleted = phase.status === 'COMPLETED';
            const isCurrent = phase.status === 'IN_PROGRESS';

            return (
              <button
                key={phase.id}
                onClick={() => setActivePhaseIndex(idx)}
                className={`p-3 rounded-xl border text-left transition-all relative ${
                  isSelected
                    ? 'bg-indigo-600/20 border-indigo-500/60 shadow-md ring-1 ring-indigo-500/30'
                    : isCompleted
                    ? 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/80 text-slate-300'
                    : isCurrent
                    ? 'bg-amber-500/10 border-amber-500/40 text-amber-200'
                    : 'bg-slate-900/40 border-slate-800 hover:bg-slate-800/40 text-slate-500'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Phase {idx + 1}
                  </span>
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : isCurrent ? (
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-slate-700" />
                  )}
                </div>
                <div className="text-xs font-semibold text-white truncate">
                  {phase.name.split('. ')[1] || phase.name}
                </div>
                <div className="text-[11px] text-slate-400 capitalize mt-1">
                  {phase.status.toLowerCase().replace('_', ' ')}
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Phase Detail Drawer */}
        {phases[activePhaseIndex] && (
          <div className="mt-4 p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 flex flex-col md:flex-row md:items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-white">{phases[activePhaseIndex].name}</h4>
                <p className="text-xs text-slate-400">
                  Associated lifecycle stages:{' '}
                  {phases[activePhaseIndex].stages.map((s) => s.name).join(' → ')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Advance Stage:</span>
              <select
                value={currentStage}
                onChange={(e) => handleStageTransition(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-xs rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                {lifecycle?.stages?.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.id})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* ─── 3. Post-Meeting AI Pipeline Monitor ───────────────────────── */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg backdrop-blur-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-semibold text-white">Post-Meeting AI & Capture Pipeline</h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 font-mono">
              Progress: {lifecycle?.pipelineProgress || 0}%
            </span>
            <div className="w-28 bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-amber-500 to-emerald-500 h-2 transition-all duration-500"
                style={{ width: `${lifecycle?.pipelineProgress || 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* 5 Pipeline Worker Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
          {[
            { key: 'recording', label: '1. Cloud Recording', sub: 'Encoding & cloud storage' },
            { key: 'transcript', label: '2. Speech-to-Text', sub: 'Speaker diarization' },
            { key: 'aiSummary', label: '3. AI Overview', sub: 'Executive summaries' },
            { key: 'smartRecording', label: '4. Smart Chapters', sub: 'Timeline indexing' },
            { key: 'analytics', label: '5. Analytics', sub: 'Engagement & quality' },
          ].map((item) => {
            const st = pipeline[item.key] || 'IDLE';
            const isDone = st === 'COMPLETED';
            const isRun = st === 'PROCESSING';

            return (
              <div
                key={item.key}
                className={`p-3.5 rounded-xl border transition-all ${
                  isDone
                    ? 'bg-emerald-950/20 border-emerald-500/30'
                    : isRun
                    ? 'bg-amber-950/20 border-amber-500/30 ring-1 ring-amber-500/30'
                    : 'bg-slate-800/30 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-slate-200">{item.label}</span>
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : isRun ? (
                    <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-slate-600" />
                  )}
                </div>
                <p className="text-[11px] text-slate-400">{item.sub}</p>
                <div className="mt-2.5 flex items-center justify-between text-[10px]">
                  <span
                    className={`font-semibold uppercase tracking-wider ${
                      isDone ? 'text-emerald-400' : isRun ? 'text-amber-400' : 'text-slate-500'
                    }`}
                  >
                    {st}
                  </span>
                  {isDone && <span className="text-slate-500">Ready</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── 4. Meeting Knowledge Layer Explorer ───────────────────────── */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Meeting Knowledge Layer</h2>
              <p className="text-xs text-slate-400">
                Unified post-meeting repository linking decisions, tasks, notes, transcript, and chats
              </p>
            </div>
          </div>

          {/* Universal Full-Text Search Bar */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearch}
              placeholder="Search decisions, tasks, notes, chat..."
              className="w-full pl-9 pr-4 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
          </div>
        </div>

        {/* Knowledge Explorer Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-800/60 pb-3">
          {[
            { id: 'overview', label: 'Executive Summary', icon: Sparkles },
            { id: 'decisions', label: `Decisions (${knowledge?.decisions?.length || 0})`, icon: Bookmark },
            { id: 'actions', label: `Action Items (${knowledge?.actionItems?.length || 0})`, icon: ListTodo },
            { id: 'agenda', label: `Agenda & Pre-reads`, icon: FileText },
            { id: 'chapters', label: `Smart Chapters (${knowledge?.smartChapters?.length || 0})`, icon: Clock },
            { id: 'chat', label: `Continuous Chat (${knowledge?.chatHighlights?.length || 0})`, icon: MessageSquare },
            { id: 'analytics', label: 'Metrics & Quality', icon: BarChart2 },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeKnowledgeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveKnowledgeTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'bg-slate-800/40 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab 1: Executive Overview */}
        {activeKnowledgeTab === 'overview' && (
          <div className="space-y-6">
            <div className="p-5 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  AI Executive Synthesis
                </span>
                <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Sentiment: {knowledge?.aiOverview?.sentiment || 'POSITIVE'}
                </span>
              </div>
              <p className="text-sm text-slate-200 leading-relaxed">
                {knowledge?.aiOverview?.executiveSummary ||
                  'Post-meeting synthesis pending. Run the post-meeting AI pipeline above to generate comprehensive overview.'}
              </p>

              {/* Topics Pills */}
              {knowledge?.aiOverview?.topicsDiscussed?.length > 0 && (
                <div className="pt-2 flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-slate-400">Key Topics:</span>
                  {knowledge.aiOverview.topicsDiscussed.map((topic, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 text-xs font-medium rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-800 text-center">
                <span className="text-2xl font-bold text-white">
                  {knowledge?.metrics?.engagementScore || 92}%
                </span>
                <p className="text-xs text-slate-400 mt-1">Engagement Index</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-800 text-center">
                <span className="text-2xl font-bold text-indigo-400">
                  {knowledge?.decisions?.length || 0}
                </span>
                <p className="text-xs text-slate-400 mt-1">Decisions Logged</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-800 text-center">
                <span className="text-2xl font-bold text-amber-400">
                  {knowledge?.actionItems?.length || 0}
                </span>
                <p className="text-xs text-slate-400 mt-1">Action Items</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-800 text-center">
                <span className="text-2xl font-bold text-emerald-400">
                  {knowledge?.agendaSummary?.filter((a) => a.completed).length || 0}/
                  {knowledge?.agendaSummary?.length || 0}
                </span>
                <p className="text-xs text-slate-400 mt-1">Agenda Items Covered</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Decisions */}
        {activeKnowledgeTab === 'decisions' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-indigo-400" />
                Agreed Decisions ({knowledge?.decisions?.length || 0})
              </h3>
              <button
                onClick={() => setIsAddingDecision(true)}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Record Decision
              </button>
            </div>

            {/* Decision Input Modal/Form */}
            {isAddingDecision && (
              <form
                onSubmit={handleAddDecision}
                className="p-4 rounded-xl bg-slate-800/70 border border-indigo-500/40 space-y-3"
              >
                <h4 className="text-xs font-semibold text-white">Record New Meeting Decision</h4>
                <input
                  type="text"
                  value={newDecisionTitle}
                  onChange={(e) => setNewDecisionTitle(e.target.value)}
                  placeholder="Decision title (e.g., Adopt standardized pipeline)"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                  required
                />
                <textarea
                  value={newDecisionContext}
                  onChange={(e) => setNewDecisionContext(e.target.value)}
                  placeholder="Context and rationale..."
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingDecision(false)}
                    className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg"
                  >
                    Save Decision
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-2.5">
              {knowledge?.decisions?.map((dec, i) => (
                <div
                  key={dec.decisionId || i}
                  className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/60 hover:border-slate-600 transition-all flex items-start gap-3"
                >
                  <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 mt-0.5">
                    <Bookmark className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-white">{dec.title}</h4>
                    {dec.context && <p className="text-xs text-slate-400 mt-1">{dec.context}</p>}
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-500">
                      <span>Decided by: {dec.decidedBy}</span>
                      <span>•</span>
                      <span>{new Date(dec.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Action Items */}
        {activeKnowledgeTab === 'actions' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ListTodo className="w-4 h-4 text-amber-400" />
                Action Items & Next Steps ({knowledge?.actionItems?.length || 0})
              </h3>
              <button
                onClick={() => setIsAddingAction(true)}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Action Item
              </button>
            </div>

            {/* Action Item Input Form */}
            {isAddingAction && (
              <form
                onSubmit={handleAddAction}
                className="p-4 rounded-xl bg-slate-800/70 border border-indigo-500/40 space-y-3"
              >
                <h4 className="text-xs font-semibold text-white">Create New Action Item</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={newActionText}
                    onChange={(e) => setNewActionText(e.target.value)}
                    placeholder="Task description (e.g. Export summary to Jira)"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                    required
                  />
                  <input
                    type="text"
                    value={newActionOwner}
                    onChange={(e) => setNewActionOwner(e.target.value)}
                    placeholder="Assignee / Owner"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingAction(false)}
                    className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg"
                  >
                    Add Task
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-2">
              {knowledge?.actionItems?.map((act, i) => {
                const isCompleted = act.status === 'COMPLETED';
                return (
                  <div
                    key={act.actionId || i}
                    className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                      isCompleted
                        ? 'bg-slate-900/40 border-slate-800 opacity-60'
                        : 'bg-slate-800/40 border-slate-700/60 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <button
                        onClick={() => handleToggleAction(act.actionId, act.status)}
                        className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                          isCompleted
                            ? 'bg-emerald-600 border-emerald-500 text-white'
                            : 'border-slate-600 hover:border-indigo-400'
                        }`}
                      >
                        {isCompleted && <Check className="w-3.5 h-3.5" />}
                      </button>
                      <div>
                        <p
                          className={`text-xs font-medium ${
                            isCompleted ? 'line-through text-slate-500' : 'text-slate-200'
                          }`}
                        >
                          {act.task}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Owner: <span className="text-slate-300">{act.owner}</span>
                        </p>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-md ${
                        act.priority === 'HIGH'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-slate-700/50 text-slate-300'
                      }`}
                    >
                      {act.priority || 'MEDIUM'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 4: Agenda & Pre-reads */}
        {activeKnowledgeTab === 'agenda' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Agenda */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" />
                Meeting Agenda ({knowledge?.agendaSummary?.length || 0})
              </h3>
              <div className="space-y-2">
                {knowledge?.agendaSummary?.map((item, i) => (
                  <div
                    key={item.agendaId || i}
                    className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-medium text-slate-200">{item.title}</span>
                    </div>
                    <span className="text-[11px] text-slate-400">{item.durationMinutes || 10}m</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pre-reads */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-sky-400" />
                Pre-read Materials ({knowledge?.preReadsSummary?.length || 0})
              </h3>
              <div className="space-y-2">
                {knowledge?.preReadsSummary?.map((doc, i) => (
                  <div
                    key={doc.docId || i}
                    className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 flex items-center justify-between"
                  >
                    <div>
                      <h5 className="text-xs font-medium text-slate-200">{doc.title}</h5>
                      <span className="text-[10px] text-emerald-400 font-medium">100% Read Completion</span>
                    </div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 px-2 py-0.5 rounded bg-slate-700">
                      {doc.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Smart Chapters */}
        {activeKnowledgeTab === 'chapters' && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              Indexed Smart Chapters & Segments
            </h3>
            <div className="space-y-2.5">
              {knowledge?.smartChapters?.map((ch, i) => (
                <div
                  key={ch.chapterId || i}
                  className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60 hover:border-indigo-500/40 transition-all flex items-start gap-3"
                >
                  <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20">
                    {ch.timecode}
                  </span>
                  <div className="flex-1">
                    <h5 className="text-xs font-semibold text-white">{ch.title}</h5>
                    <p className="text-xs text-slate-400 mt-1">{ch.summary}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 6: Continuous Chat Highlights */}
        {activeKnowledgeTab === 'chat' && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-indigo-400" />
              Persistent Chat & Key Discussions
            </h3>
            <div className="space-y-2">
              {knowledge?.chatHighlights?.map((c, i) => (
                <div
                  key={c.messageId || i}
                  className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 flex items-start justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-indigo-300">{c.sender}</span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {c.isPinned && (
                        <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30">
                          Pinned
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 mt-1">{c.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 7: Metrics & Quality */}
        {activeKnowledgeTab === 'analytics' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60">
              <span className="text-xs text-slate-400">Total Duration</span>
              <p className="text-xl font-bold text-white mt-1">
                {knowledge?.metrics?.durationMinutes || 45} Minutes
              </p>
              <p className="text-[11px] text-emerald-400 mt-1">100% On-time schedule</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60">
              <span className="text-xs text-slate-400">Participant Count</span>
              <p className="text-xl font-bold text-white mt-1">
                {knowledge?.metrics?.participantCount || 5} Attendees
              </p>
              <p className="text-[11px] text-indigo-400 mt-1">Active engagement</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60">
              <span className="text-xs text-slate-400">Audio/Video Quality Score</span>
              <p className="text-xl font-bold text-emerald-400 mt-1">98.4 / 100</p>
              <p className="text-[11px] text-slate-400 mt-1">Device & Network Adapted</p>
            </div>
          </div>
        )}
      </div>

      {/* Export to Integrations Modal */}
      {isExportModalOpen && (
        <ExportSummaryIntegrationModal
          meetingId={meetingId}
          summaryText={knowledge?.aiOverview?.executiveSummary || 'Meeting Summary'}
          actionItems={knowledge?.actionItems?.map((a) => a.task) || []}
          onClose={() => setIsExportModalOpen(false)}
        />
      )}
    </div>
  );
}
