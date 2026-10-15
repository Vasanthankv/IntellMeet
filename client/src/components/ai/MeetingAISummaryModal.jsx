import React, { useState, useEffect } from 'react';
import { 
  X, Sparkles, BrainCircuit, CheckCircle2, CheckSquare, 
  HelpCircle, Settings, Play, Square, RefreshCw, Send, 
  Share2, Shield, Lock, Clock, ListChecks, FileText, ChevronRight, AlertCircle, Copy
} from 'lucide-react';
import { API_BASE_URL } from '../../utils/apiConfig';
import toast from 'react-hot-toast';
import ExportSummaryIntegrationModal from '../integrations/ExportSummaryIntegrationModal';

export default function MeetingAISummaryModal({
  isOpen,
  onClose,
  meetingId,
  isHost,
  user,
  socketRef,
  summaryData,
  onGenerateSummary,
  isGenerating
}) {
  const [activeTab, setActiveTab] = useState('live'); // 'live' | 'settings' | 'share'
  const [template, setTemplate] = useState('GENERAL');
  const [autoStart, setAutoStart] = useState(false);
  const [isSummaryActive, setIsSummaryActive] = useState(false);
  const [liveTopics, setLiveTopics] = useState([]);
  const [liveDecisions, setLiveDecisions] = useState([]);
  const [liveActionItems, setLiveActionItems] = useState([]);
  const [hasRequested, setHasRequested] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);
  
  // Sharing states (25.11 - 25.15 & Part 39)
  const [shareRecipients, setShareRecipients] = useState('');
  const [isSharingEmail, setIsSharingEmail] = useState(false);
  const [retentionPolicy, setRetentionPolicy] = useState('NEVER');
  const [passcode, setPasscode] = useState('');
  const [isPasscodeProtected, setIsPasscodeProtected] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  // Sync state from summaryData
  useEffect(() => {
    if (summaryData) {
      if (summaryData.status === 'ACTIVE') setIsSummaryActive(true);
      if (summaryData.template) setTemplate(summaryData.template);
      if (summaryData.autoStart !== undefined) setAutoStart(summaryData.autoStart);
      if (summaryData.importantTopics) setLiveTopics(summaryData.importantTopics);
      if (summaryData.decisions) setLiveDecisions(summaryData.decisions);
      if (summaryData.actionItems) setLiveActionItems(summaryData.actionItems);
      if (summaryData.retentionPolicy) setRetentionPolicy(summaryData.retentionPolicy);
      if (summaryData.sharingSettings?.passcode) setPasscode(summaryData.sharingSettings.passcode);
      if (summaryData.sharingSettings?.isPasscodeProtected !== undefined) {
        setIsPasscodeProtected(summaryData.sharingSettings.isPasscodeProtected);
      }
    }
  }, [summaryData]);

  // Socket listener for live detections
  useEffect(() => {
    const socket = socketRef?.current;
    if (!socket) return;

    const handleSummaryStarted = (data) => {
      setIsSummaryActive(true);
      if (data?.template) setTemplate(data.template);
      toast.success('AI Meeting Summary started by host', { icon: '✨' });
    };

    const handleSummaryStopped = () => {
      setIsSummaryActive(false);
      toast('AI Meeting Summary paused/stopped', { icon: '⏹️' });
    };

    const handleDecisionDetected = (data) => {
      setLiveDecisions(prev => [...prev, data]);
      toast('AI identified a new decision', { icon: '🎯' });
    };

    const handleActionItemDetected = (data) => {
      setLiveActionItems(prev => [...prev, data]);
      toast('AI identified a new action item', { icon: '📋' });
    };

    const handleTopicsUpdated = (topics) => {
      setLiveTopics(topics);
    };

    const handleSummaryRequested = (reqData) => {
      if (isHost) {
        toast(`Participant ${reqData.userName || 'Someone'} requested to enable AI Meeting Summary`, { icon: '🤖', duration: 5000 });
        setPendingRequests(prev => [...prev, reqData]);
      }
    };

    socket.on('ai-summary-started', handleSummaryStarted);
    socket.on('ai-summary-stopped', handleSummaryStopped);
    socket.on('ai-decision-detected', handleDecisionDetected);
    socket.on('ai-action-item-detected', handleActionItemDetected);
    socket.on('ai-topics-updated', handleTopicsUpdated);
    socket.on('ai-summary-requested', handleSummaryRequested);

    return () => {
      socket.off('ai-summary-started', handleSummaryStarted);
      socket.off('ai-summary-stopped', handleSummaryStopped);
      socket.off('ai-decision-detected', handleDecisionDetected);
      socket.off('ai-action-item-detected', handleActionItemDetected);
      socket.off('ai-topics-updated', handleTopicsUpdated);
      socket.off('ai-summary-requested', handleSummaryRequested);
    };
  }, [socketRef, isHost]);

  // Host starts/stops AI Summary (25.4, 25.5)
  const handleToggleSummarySession = async () => {
    if (!isHost) return;
    const token = localStorage.getItem('token');
    const nextStatus = !isSummaryActive;

    try {
      if (nextStatus) {
        const res = await fetch(`${API_BASE_URL}/meetings/${meetingId}/summary/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ template, meetingTitle: `Meeting ${meetingId}` })
        });
        const data = await res.json();
        if (data.success) {
          setIsSummaryActive(true);
          socketRef?.current?.emit('ai-summary-start', meetingId, { template });
          toast.success('AI Meeting Summary active: tracking decisions & action items');
        }
      } else {
        const res = await fetch(`${API_BASE_URL}/meetings/${meetingId}/summary/settings`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ status: 'IDLE' })
        });
        setIsSummaryActive(false);
        socketRef?.current?.emit('ai-summary-stop', meetingId);
        toast('AI Meeting Summary paused');
      }
    } catch (e) {
      toast.error('Failed to toggle AI Summary');
    }
  };

  // Participant requests host to start AI Summary (25.4)
  const handleRequestAISummary = () => {
    socketRef?.current?.emit('ai-summary-request', meetingId, {
      userId: user?.id || user?._id || 'guest',
      userName: user?.name || 'Participant',
      timestamp: new Date()
    });
    setHasRequested(true);
    toast.success('Requested host to start AI Meeting Summary');
  };

  // Save Settings (25.3, 25.16)
  const handleSaveSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/meetings/${meetingId}/summary/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          template,
          autoStart,
          retentionPolicy,
          sharingSettings: {
            isPasscodeProtected,
            passcode: isPasscodeProtected ? passcode : null
          }
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('AI Summary settings & retention policy saved');
      }
    } catch (e) {
      toast.error('Could not save settings');
    }
  };

  // Share via Email (25.12)
  const handleShareEmail = async () => {
    const emails = shareRecipients.split(',').map(e => e.trim()).filter(Boolean);
    if (emails.length === 0) {
      toast.error('Please enter at least one email address');
      return;
    }
    setIsSharingEmail(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/meetings/${meetingId}/summary/share/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ recipients: emails })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Summary emailed to ${emails.length} recipient(s)`);
        setShareRecipients('');
      } else {
        toast.error(data.message || 'Failed to send emails');
      }
    } catch (e) {
      toast.error('Error sending email');
    } finally {
      setIsSharingEmail(false);
    }
  };

  // Share via Chat (25.13)
  const handleShareChat = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/meetings/${meetingId}/summary/share/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        socketRef?.current?.emit('ai-summary-shared', meetingId, { type: 'chat' });
        toast.success('Summary card posted to meeting chat!');
      }
    } catch (e) {
      toast.error('Could not post to chat');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#1E1E1E] text-white w-full max-w-2xl rounded-2xl shadow-2xl border border-[#333] flex flex-col max-h-[85vh] overflow-hidden animate-in fade-in duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#333] flex items-center justify-between bg-gradient-to-r from-purple-900/40 via-indigo-900/30 to-[#1E1E1E]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center">
              <BrainCircuit className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-white">AI Meeting Summary</h3>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold flex items-center gap-1 ${
                  isSummaryActive 
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                    : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isSummaryActive ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'}`} />
                  {isSummaryActive ? 'Active' : 'Idle'}
                </span>
              </div>
              <p className="text-xs text-zinc-400">Automated key discussion points, decisions & action items</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-6 border-b border-[#333] bg-[#252525] gap-4">
          <button
            onClick={() => setActiveTab('live')}
            className={`py-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'live' 
                ? 'border-purple-500 text-purple-400' 
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <BrainCircuit className="w-4 h-4" />
            Live Insights
          </button>
          {isHost && (
            <button
              onClick={() => setActiveTab('settings')}
              className={`py-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === 'settings' 
                  ? 'border-purple-500 text-purple-400' 
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Settings className="w-4 h-4" />
              Settings & Templates
            </button>
          )}
          <button
            onClick={() => setActiveTab('share')}
            className={`py-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'share' 
                ? 'border-purple-500 text-purple-400' 
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Share2 className="w-4 h-4" />
            Share & Security
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {activeTab === 'live' && (
            <div className="space-y-5">
              {/* Host Start / Stop Bar or Participant Request Button */}
              {isHost ? (
                <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-800/40 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-semibold text-sm text-purple-200">AI Summary Engine</h4>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {isSummaryActive 
                        ? 'Actively extracting topics, decisions, and action items in the background' 
                        : 'Start AI Summary to begin capturing key takeaways'}
                    </p>
                  </div>
                  <button
                    onClick={handleToggleSummarySession}
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md ${
                      isSummaryActive
                        ? 'bg-rose-600/90 hover:bg-rose-600 text-white'
                        : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white'
                    }`}
                  >
                    {isSummaryActive ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    <span>{isSummaryActive ? 'Pause Summary' : 'Start AI Summary'}</span>
                  </button>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700/60 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-semibold text-sm text-zinc-200">AI Summary with Zoom-grade Intelligence</h4>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {isSummaryActive ? 'The host has enabled AI Summary for this meeting.' : 'Host has not activated AI Summary yet.'}
                    </p>
                  </div>
                  {!isSummaryActive && (
                    <button
                      onClick={handleRequestAISummary}
                      disabled={hasRequested}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-zinc-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{hasRequested ? 'Requested' : 'Request AI Summary'}</span>
                    </button>
                  )}
                </div>
              )}

              {/* Real-Time Extraction Status Grid (25.18) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-[#2A2A2A] border border-[#3A3A3A] p-3.5 rounded-xl">
                  <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
                    <span className="flex items-center gap-1.5 font-medium"><BrainCircuit className="w-3.5 h-3.5 text-purple-400" /> Topics</span>
                    <span className="font-bold text-white">{liveTopics.length}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {liveTopics.length === 0 ? (
                      <span className="text-[11px] text-zinc-500 italic">Listening...</span>
                    ) : (
                      liveTopics.slice(0, 3).map((t, idx) => (
                        <span key={idx} className="bg-purple-900/40 text-purple-300 text-[10px] px-1.5 py-0.5 rounded border border-purple-700/40">
                          {t}
                        </span>
                      ))
                    )}
                  </div>
                </div>

                <div className="bg-[#2A2A2A] border border-[#3A3A3A] p-3.5 rounded-xl">
                  <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
                    <span className="flex items-center gap-1.5 font-medium"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Decisions</span>
                    <span className="font-bold text-white">{liveDecisions.length}</span>
                  </div>
                  <div className="mt-2 text-[11px] text-zinc-300 line-clamp-2">
                    {liveDecisions.length === 0 
                      ? <span className="text-zinc-500 italic">No decisions logged yet</span> 
                      : (liveDecisions[liveDecisions.length - 1]?.description || 'Decision recorded')}
                  </div>
                </div>

                <div className="bg-[#2A2A2A] border border-[#3A3A3A] p-3.5 rounded-xl">
                  <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
                    <span className="flex items-center gap-1.5 font-medium"><CheckSquare className="w-3.5 h-3.5 text-indigo-400" /> Action Items</span>
                    <span className="font-bold text-white">{liveActionItems.length}</span>
                  </div>
                  <div className="mt-2 text-[11px] text-zinc-300 line-clamp-2">
                    {liveActionItems.length === 0 
                      ? <span className="text-zinc-500 italic">No action items detected</span> 
                      : (liveActionItems[liveActionItems.length - 1]?.task || 'Action item detected')}
                  </div>
                </div>
              </div>

              {/* Generate Interim or Post-Meeting Summary Button */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#333]">
                <div className="text-xs text-zinc-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-zinc-500" />
                  Template: <span className="text-purple-300 font-semibold">{template}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={onGenerateSummary}
                    disabled={isGenerating}
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg transition-all disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isGenerating ? 'AI Generating...' : 'Generate Full AI Summary'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && isHost && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-2">
                  AI Summary Template (25.17)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'GENERAL', label: 'General Meeting' },
                    { id: 'PROJECT', label: 'Project Review' },
                    { id: 'STANDUP', label: 'Daily Stand-up' },
                    { id: 'CLIENT', label: 'Client Meeting' },
                    { id: 'INTERVIEW', label: 'Interview' },
                    { id: 'TEAM_REVIEW', label: 'Team Review' }
                  ].map(tmpl => (
                    <button
                      key={tmpl.id}
                      onClick={() => setTemplate(tmpl.id)}
                      className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                        template === tmpl.id 
                          ? 'bg-purple-900/40 border-purple-500 text-white font-semibold' 
                          : 'bg-[#2A2A2A] border-[#3A3A3A] text-zinc-400 hover:text-white'
                      }`}
                    >
                      {tmpl.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Auto-start (25.3, 25.5) */}
              <div className="p-3 bg-[#2A2A2A] rounded-xl border border-[#3A3A3A] flex items-center justify-between">
                <div>
                  <div className="font-semibold text-xs text-white">Auto-Start When Meeting Starts</div>
                  <div className="text-[11px] text-zinc-400">Automatically launch AI Meeting Summary upon session launch</div>
                </div>
                <input
                  type="checkbox"
                  checked={autoStart}
                  onChange={(e) => setAutoStart(e.target.checked)}
                  className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 bg-zinc-800 border-zinc-600"
                />
              </div>

              {/* Retention Policy (25.16) */}
              <div className="p-3 bg-[#2A2A2A] rounded-xl border border-[#3A3A3A] space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-xs text-white">Retention & Auto-Deletion</div>
                    <div className="text-[11px] text-zinc-400">Enterprise data governance retention period</div>
                  </div>
                  <select
                    value={retentionPolicy}
                    onChange={(e) => setRetentionPolicy(e.target.value)}
                    className="bg-[#1E1E1E] border border-zinc-700 rounded-lg px-2.5 py-1 text-xs text-zinc-200 focus:outline-none"
                  >
                    <option value="NEVER">Never Delete</option>
                    <option value="30_DAYS">Auto-delete after 30 Days</option>
                    <option value="90_DAYS">Auto-delete after 90 Days</option>
                    <option value="1_YEAR">Auto-delete after 1 Year</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleSaveSettings}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold"
                >
                  Save Settings
                </button>
              </div>
            </div>
          )}

          {activeTab === 'share' && (
            <div className="space-y-4">
              {/* Email Sharing (25.12) */}
              <div className="p-4 bg-[#2A2A2A] rounded-xl border border-[#3A3A3A] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-xs text-white flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5 text-purple-400" />
                    Share via Email (25.12)
                  </div>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter email addresses separated by commas..."
                    value={shareRecipients}
                    onChange={(e) => setShareRecipients(e.target.value)}
                    className="flex-1 bg-[#1E1E1E] border border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                  <button
                    onClick={handleShareEmail}
                    disabled={isSharingEmail}
                    className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold disabled:opacity-50"
                  >
                    {isSharingEmail ? 'Sending...' : 'Send'}
                  </button>
                </div>
              </div>

              {/* Chat Sharing (25.13) */}
              <div className="p-4 bg-[#2A2A2A] rounded-xl border border-[#3A3A3A] flex items-center justify-between">
                <div>
                  <div className="font-semibold text-xs text-white">Post to IntelliMeet Chat (25.13)</div>
                  <div className="text-[11px] text-zinc-400">Instantly share summary card with current meeting chat</div>
                </div>
                <button
                  onClick={handleShareChat}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold"
                >
                  Post to Chat
                </button>
              </div>

              {/* Part 39: Workplace Tools Integration (Slack, Jira, Salesforce, Drive) */}
              <div className="p-4 bg-[#2A2A2A] rounded-xl border border-purple-500/30 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-xs text-purple-300 flex items-center gap-1.5">
                    <Share2 className="w-3.5 h-3.5 text-purple-400" />
                    Workplace Integrations (Part 39)
                  </div>
                  <div className="text-[11px] text-zinc-400">Export recap to Slack channels, Jira issues, Salesforce or Google Drive</div>
                </div>
                <button
                  onClick={() => setShowExportModal(true)}
                  className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold shadow-md"
                >
                  Export to Apps
                </button>
              </div>

              {/* Passcode Security (25.15) */}
              <div className="p-4 bg-[#2A2A2A] rounded-xl border border-[#3A3A3A] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-xs text-white flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                      Confidential Passcode Protection (25.15)
                    </div>
                    <div className="text-[11px] text-zinc-400">Require password to view external summary link</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={isPasscodeProtected}
                    onChange={(e) => setIsPasscodeProtected(e.target.checked)}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 bg-zinc-800 border-zinc-600"
                  />
                </div>

                {isPasscodeProtected && (
                  <input
                    type="password"
                    placeholder="Enter security passcode..."
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    className="w-full bg-[#1E1E1E] border border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#1A1A1A] border-t border-[#333] flex items-center justify-between text-xs text-zinc-400">
          <span>IntellMeet AI Meeting Intelligence</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>

      {/* Part 39: Workplace Tools Export Modal */}
      <ExportSummaryIntegrationModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        meetingId={meetingId}
        meetingTitle="IntelliMeet Session"
        summaryText={
          liveDecisions.length > 0
            ? `Decisions:\n${liveDecisions.map(d => `• ${d.decision || d}`).join('\n')}`
            : 'Meeting completed with action items assigned.'
        }
        actionItems={liveActionItems}
      />
    </div>
  );
}
