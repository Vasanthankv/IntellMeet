import React, { useState } from 'react';
import { 
  X, Share2, Check, ExternalLink, Send, Sparkles, MessageSquare, 
  Layers, CheckCircle2, AlertCircle, RefreshCw, Radio
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ExportSummaryIntegrationModal({ 
  isOpen, 
  onClose, 
  meetingId, 
  meetingTitle, 
  summaryText, 
  actionItems = [] 
}) {
  const [selectedTarget, setSelectedTarget] = useState('SLACK'); // 'SLACK' | 'TEAMS' | 'JIRA' | 'SALESFORCE' | 'DRIVE'
  const [slackChannel, setSlackChannel] = useState('#general');
  const [jiraIssueTitle, setJiraIssueTitle] = useState(
    actionItems[0]?.task || actionItems[0]?.title || `Follow-up tasks from ${meetingTitle || 'Meeting'}`
  );
  const [jiraAssignee, setJiraAssignee] = useState(actionItems[0]?.assignee || 'Engineering Team');
  const [salesforceAccount, setSalesforceAccount] = useState('Acme Global Enterprises');
  const [isDispatching, setIsDispatching] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  if (!isOpen) return null;

  const handleDispatch = async () => {
    setIsDispatching(true);
    setLastResult(null);

    const payload = {};
    if (selectedTarget === 'SLACK') {
      payload.channel = slackChannel;
      payload.text = `*IntelliMeet AI Summary for ${meetingTitle || 'Meeting'}*\n\n${summaryText || 'Meeting completed with full consensus.'}\n\n*Key Action Items:*\n${
        actionItems.map(a => `• ${a.assignee || 'Team'}: ${a.task || a.title || 'Task'}`).join('\n') || '• No pending action items'
      }`;
    } else if (selectedTarget === 'TEAMS') {
      payload.text = summaryText;
      payload.actionItems = actionItems;
    } else if (selectedTarget === 'JIRA') {
      payload.issueTitle = jiraIssueTitle;
      payload.assignee = jiraAssignee;
      payload.summary = summaryText;
    } else if (selectedTarget === 'SALESFORCE') {
      payload.accountName = salesforceAccount;
      payload.summary = summaryText;
    } else if (selectedTarget === 'DRIVE') {
      payload.meetingTitle = meetingTitle;
      payload.summary = summaryText;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${(typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1" ? "https://intellmeet-backend-h3md.onrender.com" : "http://localhost:5000")}/api/integrations/dispatch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          target: selectedTarget,
          meetingId,
          meetingTitle,
          payload
        })
      });
      const data = await res.json();
      if (data.success) {
        setLastResult(data.dispatchResult);
        toast.success(`Successfully dispatched to ${selectedTarget}!`);
      } else {
        toast.error(data.message || 'Failed to dispatch integration data');
      }
    } catch (err) {
      toast.error('Network error during dispatch');
    } finally {
      setIsDispatching(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#1A1A1A] text-white border border-[#333] rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2A2A2A] bg-[#202020]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-100">Export & Integrate (Part 39)</h3>
              <p className="text-[11px] text-gray-400">Share AI summary, notes and action items to workplace tools</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Target Platform Selector Tabs */}
        <div className="p-6 space-y-5">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-2">
              Select Destination Platform
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'SLACK', label: 'Slack', icon: '💬', color: 'border-emerald-500 text-emerald-400' },
                { id: 'JIRA', label: 'Jira Issue', icon: '🎯', color: 'border-blue-500 text-blue-400' },
                { id: 'SALESFORCE', label: 'Salesforce', icon: '☁️', color: 'border-sky-500 text-sky-400' },
                { id: 'DRIVE', label: 'Google Drive', icon: '📁', color: 'border-amber-500 text-amber-400' },
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => { setSelectedTarget(t.id); setLastResult(null); }}
                  className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 text-xs font-bold transition-all ${
                    selectedTarget === t.id 
                      ? `bg-white/10 ${t.color} shadow-sm` 
                      : 'bg-[#222] border-[#333] text-gray-400 hover:bg-[#282828]'
                  }`}
                >
                  <span className="text-base">{t.icon}</span>
                  <span className="truncate">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic Configuration Form */}
          {selectedTarget === 'SLACK' && (
            <div className="space-y-3 bg-[#222] p-4 rounded-2xl border border-[#333] text-xs">
              <div className="font-semibold text-gray-200 flex items-center justify-between">
                <span>Target Slack Channel</span>
                <span className="text-[10px] text-emerald-400 font-normal">● Connected</span>
              </div>
              <select
                value={slackChannel}
                onChange={e => setSlackChannel(e.target.value)}
                className="w-full bg-[#181818] border border-[#333] rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500 text-xs"
              >
                <option value="#general">#general</option>
                <option value="#engineering">#engineering</option>
                <option value="#product-updates">#product-updates</option>
                <option value="#all-hands">#all-hands</option>
              </select>
              <p className="text-[11px] text-gray-400">
                AI meeting summary & key action items will be formatted with rich markdown blocks and posted into this channel.
              </p>
            </div>
          )}

          {selectedTarget === 'JIRA' && (
            <div className="space-y-3 bg-[#222] p-4 rounded-2xl border border-[#333] text-xs">
              <div className="font-semibold text-gray-200 flex items-center justify-between">
                <span>Create Jira Backlog Issue</span>
                <span className="text-[10px] text-blue-400 font-normal">● Connected</span>
              </div>
              <div>
                <label className="text-[10px] text-gray-400 block mb-1">Issue Summary / Title</label>
                <input
                  type="text"
                  value={jiraIssueTitle}
                  onChange={e => setJiraIssueTitle(e.target.value)}
                  className="w-full bg-[#181818] border border-[#333] rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500 text-xs"
                  placeholder="Issue title"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-400 block mb-1">Assignee</label>
                <input
                  type="text"
                  value={jiraAssignee}
                  onChange={e => setJiraAssignee(e.target.value)}
                  className="w-full bg-[#181818] border border-[#333] rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500 text-xs"
                />
              </div>
            </div>
          )}

          {selectedTarget === 'SALESFORCE' && (
            <div className="space-y-3 bg-[#222] p-4 rounded-2xl border border-[#333] text-xs">
              <div className="font-semibold text-gray-200 flex items-center justify-between">
                <span>Attach Meeting to Salesforce CRM</span>
                <span className="text-[10px] text-sky-400 font-normal">● Connected</span>
              </div>
              <div>
                <label className="text-[10px] text-gray-400 block mb-1">Account / Opportunity Name</label>
                <input
                  type="text"
                  value={salesforceAccount}
                  onChange={e => setSalesforceAccount(e.target.value)}
                  className="w-full bg-[#181818] border border-[#333] rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500 text-xs"
                />
              </div>
              <p className="text-[11px] text-gray-400">
                Customer objections, discussed next steps, and buyer sentiment will be automatically recorded on the Opportunity timeline.
              </p>
            </div>
          )}

          {selectedTarget === 'DRIVE' && (
            <div className="space-y-3 bg-[#222] p-4 rounded-2xl border border-[#333] text-xs">
              <div className="font-semibold text-gray-200 flex items-center justify-between">
                <span>Save to Google Drive Folder</span>
                <span className="text-[10px] text-amber-400 font-normal">● Connected</span>
              </div>
              <div className="p-3 bg-[#181818] rounded-xl border border-[#333] space-y-1">
                <div className="text-gray-300 font-medium">Target Folder:</div>
                <div className="font-mono text-amber-400 text-[11px]">📁 IntelliMeet Recordings & Notes</div>
              </div>
              <p className="text-[11px] text-gray-400">
                Exports AI meeting summary and transcript PDF with shareable team link.
              </p>
            </div>
          )}

          {/* Success Output Display */}
          {lastResult && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-3.5 space-y-1 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                <CheckCircle2 className="w-4 h-4" /> Dispatched Successfully
              </div>
              <p className="text-gray-300 text-[11px]">
                {lastResult.issueKey 
                  ? `Created Jira ticket [${lastResult.issueKey}] with high priority.` 
                  : lastResult.messageId 
                    ? `Posted recap to Slack ${lastResult.channel}.` 
                    : lastResult.recordId 
                      ? `Updated Salesforce Opportunity (${lastResult.accountName}).`
                      : 'Saved document to connected cloud drive.'}
              </p>
            </div>
          )}

          {/* Action Button */}
          <button
            onClick={handleDispatch}
            disabled={isDispatching}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {isDispatching ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Dispatching...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send to {selectedTarget}
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
