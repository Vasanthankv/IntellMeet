import React, { useState } from 'react';
import { 
  X, Mail, MessageSquare, Copy, Check, Lock, 
  Clock, Shield, Download, FileText, Send
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ShareSummaryModal({
  isOpen,
  onClose,
  meetingId,
  summary,
  onShareEmail,
  onShareChat
}) {
  const [copied, setCopied] = useState(false);
  const [emailRecipients, setEmailRecipients] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isPostingChat, setIsPostingChat] = useState(false);

  if (!isOpen || !summary) return null;

  const shareToken = summary?.sharingSettings?.shareToken || 'demo_token';
  const shareableUrl = `${window.location.origin}/summary/public/${meetingId}/${shareToken}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareableUrl);
    setCopied(true);
    toast.success('Public summary link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendEmail = async () => {
    const list = emailRecipients.split(',').map(e => e.trim()).filter(Boolean);
    if (list.length === 0) {
      toast.error('Please enter at least one email address');
      return;
    }
    setIsSendingEmail(true);
    try {
      if (onShareEmail) {
        await onShareEmail(list);
      }
      setEmailRecipients('');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handlePostChat = async () => {
    setIsPostingChat(true);
    try {
      if (onShareChat) {
        await onShareChat();
      }
    } finally {
      setIsPostingChat(false);
    }
  };

  const exportAsFormat = (format) => {
    let content = '';
    let mime = 'text/plain';
    const filename = `meeting_summary_${meetingId}.${format}`;

    if (format === 'json') {
      content = JSON.stringify(summary, null, 2);
      mime = 'application/json';
    } else if (format === 'md') {
      content = `# ${summary.meetingTitle || 'Meeting Summary'}\n\n` +
        `**Meeting ID:** ${meetingId}\n` +
        `**Date:** ${new Date().toLocaleDateString()}\n\n` +
        `## Overview\n${summary.overview}\n\n` +
        `## Key Decisions\n` +
        (summary.decisions || []).map(d => `- **${typeof d === 'string' ? d : d.description}**`).join('\n') + '\n\n' +
        `## Action Items\n` +
        (summary.actionItems || []).map(a => `- [ ] **${a.task}** (Assigned to: ${a.assignedTo}, Due: ${a.dueDate})`).join('\n') + '\n\n' +
        `## Next Steps\n` +
        (summary.nextSteps || []).map(s => `1. ${s}`).join('\n');
      mime = 'text/markdown';
    } else {
      content = `MEETING SUMMARY: ${summary.meetingTitle || meetingId}\n` +
        `===================================================\n` +
        `OVERVIEW:\n${summary.overview}\n\n` +
        `KEY DECISIONS:\n` +
        (summary.decisions || []).map(d => `• ${typeof d === 'string' ? d : d.description}`).join('\n') + '\n\n' +
        `ACTION ITEMS:\n` +
        (summary.actionItems || []).map(a => `• ${a.task} -> ${a.assignedTo} (${a.dueDate})`).join('\n');
    }

    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported as .${format.toUpperCase()}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white text-gray-900 w-full max-w-lg rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in duration-200">
        
        {/* Header */}
        <div className="p-5 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-purple-50 to-indigo-50">
          <div>
            <h3 className="font-bold text-base text-gray-900">Share Meeting Summary</h3>
            <p className="text-xs text-gray-500">Distribute intelligence via email, chat, or secure link</p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 text-xs sm:text-sm">
          {/* Share via Link (25.15) */}
          <div className="space-y-2">
            <label className="font-semibold text-gray-800 flex items-center gap-1.5">
              <Copy className="w-4 h-4 text-purple-600" />
              Copy Shareable Link
            </label>
            <div className="flex items-center gap-2">
              <input 
                type="text" 
                readOnly 
                value={shareableUrl} 
                className="flex-1 bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-600 select-all focus:outline-none"
              />
              <button
                onClick={handleCopyLink}
                className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            {summary.sharingSettings?.isPasscodeProtected && (
              <p className="text-[11px] text-amber-600 flex items-center gap-1">
                <Lock className="w-3 h-3" />
                This link requires a confidential passcode to open.
              </p>
            )}
          </div>

          {/* Email Sharing (25.12) */}
          <div className="space-y-2 pt-2 border-t border-gray-100">
            <label className="font-semibold text-gray-800 flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-indigo-600" />
              Email Participants or Stakeholders
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Enter emails (e.g. dev@company.com, team@company.com)"
                value={emailRecipients}
                onChange={(e) => setEmailRecipients(e.target.value)}
                className="flex-1 bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={handleSendEmail}
                disabled={isSendingEmail}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1 disabled:opacity-50 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSendingEmail ? 'Sending...' : 'Send'}</span>
              </button>
            </div>
          </div>

          {/* Post to Chat (25.13) */}
          <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-200">
            <div>
              <div className="font-semibold text-gray-800 text-xs flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                Post Summary to Meeting Chat
              </div>
              <p className="text-[11px] text-gray-500 mt-0.5">Sends formatted executive card to active chat room</p>
            </div>
            <button
              onClick={handlePostChat}
              disabled={isPostingChat}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
            >
              {isPostingChat ? 'Posting...' : 'Post to Chat'}
            </button>
          </div>

          {/* Multi-Format File Download */}
          <div className="pt-2 border-t border-gray-100">
            <label className="font-semibold text-gray-800 text-xs block mb-2">
              Download Summary Document
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => exportAsFormat('txt')}
                className="p-2 border border-gray-300 rounded-xl text-xs hover:bg-gray-50 text-gray-700 font-medium flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 text-gray-400" />
                Text (.txt)
              </button>
              <button
                onClick={() => exportAsFormat('md')}
                className="p-2 border border-purple-200 bg-purple-50/50 rounded-xl text-xs hover:bg-purple-50 text-purple-700 font-semibold flex items-center justify-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5 text-purple-600" />
                Markdown (.md)
              </button>
              <button
                onClick={() => exportAsFormat('json')}
                className="p-2 border border-gray-300 rounded-xl text-xs hover:bg-gray-50 text-gray-700 font-medium flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 text-gray-400" />
                JSON (.json)
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
