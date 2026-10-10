import React, { useState, useEffect } from 'react';
import { 
  Sparkles, BrainCircuit, RefreshCw, Share2, 
  ShieldCheck, Download, Plus, LayoutTemplate, AlertCircle
} from 'lucide-react';
import AISummaryCard from '../../components/ai/AISummaryCard';
import ActionItemList from '../../components/ai/ActionItemList';
import DecisionsList from '../../components/ai/DecisionsList';
import MeetingAIChat from '../../components/ai/MeetingAIChat';
import ShareSummaryModal from '../../components/ai/ShareSummaryModal';
import toast from 'react-hot-toast';

export default function AISummaryPage() {
  const [summariesList, setSummariesList] = useState([]);
  const [selectedMeetingId, setSelectedMeetingId] = useState('');
  const [currentSummary, setCurrentSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('GENERAL');

  // Load list of past meeting summaries
  const fetchSummariesList = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/summaries/all/list', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.success && data.summaries) {
        setSummariesList(data.summaries);
        if (data.summaries.length > 0 && !selectedMeetingId) {
          setSelectedMeetingId(data.summaries[0].meetingId);
        }
      }
    } catch (e) {
      console.warn('Could not fetch summaries list:', e);
    }
  };

  useEffect(() => {
    fetchSummariesList();
  }, []);

  // Fetch selected meeting summary
  useEffect(() => {
    if (!selectedMeetingId) {
      setCurrentSummary(null);
      return;
    }

    const loadSummary = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`http://localhost:5000/api/meetings/${selectedMeetingId}/summary`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const data = await res.json();
        if (data.success && data.summary) {
          setCurrentSummary(data.summary);
          if (data.summary.template) setSelectedTemplate(data.summary.template);
        } else {
          setCurrentSummary(null);
        }
      } catch (e) {
        toast.error('Network error loading summary');
      } finally {
        setIsLoading(false);
      }
    };

    loadSummary();
  }, [selectedMeetingId]);

  // Generate / Regenerate AI Summary (25.6, 25.17)
  const handleGenerateSummary = async (chosenTemplate = selectedTemplate) => {
    if (!selectedMeetingId) {
      toast.error('Please select a meeting first');
      return;
    }

    setIsGenerating(true);
    const toastId = toast.loading('AI is processing transcript to generate meeting summary...');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/meetings/${selectedMeetingId}/summary/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ template: chosenTemplate })
      });
      const data = await res.json();
      if (data.success && data.summary) {
        setCurrentSummary(data.summary);
        toast.success('AI Meeting Summary generated successfully!', { id: toastId });
      } else {
        toast.error(data.message || 'Failed to generate summary', { id: toastId });
      }
    } catch (e) {
      toast.error('Network error during AI summary generation', { id: toastId });
    } finally {
      setIsGenerating(false);
    }
  };

  // Host Approve Summary (25.23)
  const handleApprove = async () => {
    if (!selectedMeetingId) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/meetings/${selectedMeetingId}/summary/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setCurrentSummary(prev => ({ ...prev, isApproved: true }));
        toast.success('Meeting summary officially approved by host');
      }
    } catch (e) {
      toast.error('Failed to approve summary');
    }
  };

  // Save edited Overview (25.23)
  const handleSaveOverview = async (newText) => {
    if (!selectedMeetingId) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/meetings/${selectedMeetingId}/summary`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ overview: newText })
      });
      const data = await res.json();
      if (data.success) {
        setCurrentSummary(prev => ({ ...prev, overview: newText }));
      }
    } catch (e) {
      toast.error('Could not save overview');
    }
  };

  // Action item status toggle (25.8)
  const handleToggleActionStatus = async (actionItemId, nextStatus) => {
    if (!selectedMeetingId) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/meetings/${selectedMeetingId}/summary/action-items/${actionItemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: nextStatus })
      });
      const data = await res.json();
      if (data.success) {
        setCurrentSummary(prev => ({
          ...prev,
          actionItems: prev.actionItems.map(a => 
            a.actionItemId === actionItemId ? { ...a, status: nextStatus } : a
          )
        }));
      }
    } catch (e) {
      toast.error('Failed to update task status');
    }
  };

  // Add Action Item (25.8)
  const handleAddActionItem = async (newAction) => {
    if (!selectedMeetingId) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/meetings/${selectedMeetingId}/summary/action-items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(newAction)
      });
      const data = await res.json();
      if (data.success && data.actionItem) {
        setCurrentSummary(prev => ({ ...prev, actionItems: [...prev.actionItems, data.actionItem] }));
        toast.success('Action item created and synced to tasks');
      }
    } catch (e) {
      toast.error('Failed to create action item');
    }
  };

  // Delete Action Item (25.8)
  const handleDeleteActionItem = async (actionItemId) => {
    if (!selectedMeetingId) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/meetings/${selectedMeetingId}/summary/action-items/${actionItemId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setCurrentSummary(prev => ({
          ...prev,
          actionItems: prev.actionItems.filter(a => a.actionItemId !== actionItemId)
        }));
        toast.success('Action item removed');
      }
    } catch (e) {
      toast.error('Failed to delete action item');
    }
  };

  // Add Decision (25.9)
  const handleAddDecision = async (newDec) => {
    if (!selectedMeetingId) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/meetings/${selectedMeetingId}/summary/decisions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(newDec)
      });
      const data = await res.json();
      if (data.success && data.decision) {
        setCurrentSummary(prev => ({ ...prev, decisions: [...prev.decisions, data.decision] }));
        toast.success('Decision logged');
      }
    } catch (e) {
      toast.error('Failed to log decision');
    }
  };

  // Delete Decision (25.9)
  const handleDeleteDecision = async (decisionId) => {
    if (!selectedMeetingId) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/meetings/${selectedMeetingId}/summary/decisions/${decisionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setCurrentSummary(prev => ({
          ...prev,
          decisions: prev.decisions.filter(d => d.decisionId !== decisionId)
        }));
        toast.success('Decision removed');
      }
    } catch (e) {
      toast.error('Failed to delete decision');
    }
  };

  // Share handlers (25.12, 25.13)
  const handleShareEmail = async (recipients) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`http://localhost:5000/api/meetings/${selectedMeetingId}/summary/share/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ recipients })
    });
    const data = await res.json();
    if (data.success) {
      toast.success(`Summary emailed to ${recipients.length} address(es)`);
    } else {
      toast.error(data.message || 'Failed to email summary');
    }
  };

  const handleShareChat = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`http://localhost:5000/api/meetings/${selectedMeetingId}/summary/share/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.success) {
      toast.success('Summary card posted to meeting chat!');
    } else {
      toast.error(data.message || 'Failed to post to chat');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Top Header Controls (25.3, 25.17) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <BrainCircuit className="w-7 h-7 text-purple-600" />
            AI Meeting Summary
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Enterprise-grade meeting intelligence: key discussion, decisions, structured action items, and next steps.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Meeting Selector */}
          <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-3 py-1.5 shadow-sm text-xs">
            <span className="font-semibold text-gray-500">Meeting:</span>
            <select
              value={selectedMeetingId}
              onChange={(e) => setSelectedMeetingId(e.target.value)}
              className="bg-transparent font-medium text-gray-800 focus:outline-none cursor-pointer"
            >
              {summariesList.length === 0 ? (
                <option value="">No meetings with AI summaries</option>
              ) : (
                summariesList.map(s => (
                  <option key={s.meetingId} value={s.meetingId}>
                    {s.meetingTitle || s.meetingId} ({s.actionItemCount || 0} actions)
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Template Selector (25.17) */}
          <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-3 py-1.5 shadow-sm text-xs">
            <LayoutTemplate className="w-3.5 h-3.5 text-purple-600" />
            <select
              value={selectedTemplate}
              onChange={(e) => {
                setSelectedTemplate(e.target.value);
                handleGenerateSummary(e.target.value);
              }}
              className="bg-transparent font-semibold text-purple-900 focus:outline-none cursor-pointer"
            >
              <option value="GENERAL">General Meeting</option>
              <option value="PROJECT">Project Review</option>
              <option value="STANDUP">Daily Stand-up</option>
              <option value="CLIENT">Client Meeting</option>
              <option value="INTERVIEW">Interview</option>
              <option value="TEAM_REVIEW">Team Review</option>
            </select>
          </div>

          <button
            onClick={fetchSummariesList}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors shadow-sm"
            title="Refresh summaries"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Share Button (25.11) */}
          <button
            onClick={() => setShowShareModal(true)}
            disabled={!currentSummary}
            className="flex items-center gap-1.5 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all disabled:opacity-40"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share</span>
          </button>

          {/* Regenerate AI Summary Button */}
          <button
            onClick={() => handleGenerateSummary(selectedTemplate)}
            disabled={isGenerating || !selectedMeetingId}
            className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all disabled:opacity-40"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isGenerating ? 'Synthesizing...' : 'Regenerate AI'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: 2 columns for summary content + 1 column for AI Chat (25.18, 25.19) */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center shadow-sm">
          <RefreshCw className="w-8 h-8 text-purple-600 animate-spin mx-auto mb-3" />
          <p className="text-gray-600 text-sm font-medium">Loading AI meeting summary...</p>
        </div>
      ) : !currentSummary ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
          <BrainCircuit className="w-12 h-12 text-purple-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-gray-900 mb-1">No AI Summary Selected</h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            Meetings conducted with transcription will automatically generate structured summaries, action items, and key decisions.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left/Center Columns: Executive Summary Card, Decisions, and Action Items */}
          <div className="xl:col-span-2 space-y-6">
            <AISummaryCard 
              summary={currentSummary}
              onSaveOverview={handleSaveOverview}
              isApproved={currentSummary?.isApproved}
              onApprove={handleApprove}
            />

            <DecisionsList 
              decisions={currentSummary?.decisions || []}
              onAddDecision={handleAddDecision}
              onDeleteDecision={handleDeleteDecision}
            />

            <ActionItemList 
              actionItems={currentSummary?.actionItems || []}
              onToggleStatus={handleToggleActionStatus}
              onAddActionItem={handleAddActionItem}
              onDeleteActionItem={handleDeleteActionItem}
            />
          </div>

          {/* Right Column: AI Interactive Assistant + Meeting Context */}
          <div className="xl:col-span-1 space-y-6">
            <MeetingAIChat summary={currentSummary} />
          </div>
        </div>
      )}

      {/* Share Summary Modal (25.11 - 25.15) */}
      <ShareSummaryModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        meetingId={selectedMeetingId}
        summary={currentSummary}
        onShareEmail={handleShareEmail}
        onShareChat={handleShareChat}
      />
    </div>
  );
}
