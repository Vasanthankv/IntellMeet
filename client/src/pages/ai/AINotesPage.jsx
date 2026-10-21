import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  FileText, Sparkles, RefreshCw, Share2, Lock, Unlock, Copy, Check, 
  Trash2, Plus, Clock, Bookmark, ListTodo, HelpCircle, CheckCircle2,
  Send, ExternalLink, Globe, AlignLeft, Calendar
} from 'lucide-react';
import { API_BASE_URL } from '../../utils/apiConfig';
import toast from 'react-hot-toast';

export default function AINotesPage() {
  const { meetingId } = useParams();
  const [notesList, setNotesList] = useState([]);
  const [activeMeetingId, setActiveMeetingId] = useState(meetingId || '');
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  const [activeSubTab, setActiveSubTab] = useState('notes'); // 'notes' | 'ai-enhanced' | 'transcript'
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [sections, setSections] = useState({
    important: [],
    questions: [],
    decisions: [],
    tasks: [],
    personal: []
  });

  // AI settings
  const [aiTemplate, setAiTemplate] = useState('STANDARD');
  const [aiLength, setAiLength] = useState('MEDIUM');
  const [isGenerating, setIsGenerating] = useState(false);
  const [refinementInput, setRefinementInput] = useState('');
  const [isRefining, setIsRefining] = useState(false);

  // Transcript
  const [transcriptSegments, setTranscriptSegments] = useState([]);
  const [transcriptSearch, setTranscriptSearch] = useState('');

  // Sharing
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [shareRole, setShareRole] = useState('viewer');
  const [copiedLink, setCopiedLink] = useState(false);

  // Quick item addition
  const [newItemText, setNewItemText] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('important');
  const [newItemDue, setNewItemDue] = useState('');

  // Load user's notes list if no direct meetingId or to support switching
  useEffect(() => {
    const fetchUserNotes = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/notes/user/all`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const data = await res.json();
        if (data.success && data.notes) {
          setNotesList(data.notes);
          if (!activeMeetingId && data.notes.length > 0) {
            setActiveMeetingId(data.notes[0].meetingId);
          }
        }
      } catch (e) {
        console.warn('Could not fetch user notes list:', e);
      }
    };
    fetchUserNotes();
  }, []);

  useEffect(() => {
    if (meetingId) {
      setActiveMeetingId(meetingId);
    }
  }, [meetingId]);

  const fetchNoteAndTranscript = async () => {
    if (!activeMeetingId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      // Fetch personal note
      const res = await fetch(`${API_BASE_URL}/meetings/${activeMeetingId}/notes/my`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.success && data.note) {
        setNote(data.note);
        setTitle(data.note.title || 'My Notes');
        setContent(data.note.content || '');
        setSections(data.note.sections || {
          important: [],
          questions: [],
          decisions: [],
          tasks: [],
          personal: []
        });
        if (data.note.lastSavedAt) {
          setLastSaved(new Date(data.note.lastSavedAt).toLocaleTimeString());
        }
      }

      // Fetch transcript segments
      const trRes = await fetch(`${API_BASE_URL}/meetings/${activeMeetingId}/transcript/export?format=json`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const trData = await trRes.json();
      if (trData.success && trData.transcript?.segments) {
        setTranscriptSegments(trData.transcript.segments);
      }
    } catch (e) {
      console.error('Error fetching note details:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNoteAndTranscript();
  }, [activeMeetingId]);

  const saveNoteChanges = async (updatedContent, updatedTitle, updatedSections) => {
    if (!note) return;
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/notes/${note.noteId || note._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: updatedTitle !== undefined ? updatedTitle : title,
          content: updatedContent !== undefined ? updatedContent : content,
          sections: updatedSections !== undefined ? updatedSections : sections
        })
      });
      const data = await res.json();
      if (data.success) {
        setNote(data.note);
        setLastSaved(new Date().toLocaleTimeString());
      }
    } catch (e) {
      toast.error('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!newItemText.trim()) return;

    const item = {
      text: newItemText.trim(),
      due: newItemCategory === 'tasks' ? newItemDue : '',
      completed: false,
      timestamp: new Date()
    };

    const updatedSections = {
      ...sections,
      [newItemCategory]: [...(sections[newItemCategory] || []), item]
    };

    setSections(updatedSections);
    saveNoteChanges(content, title, updatedSections);
    setNewItemText('');
    setNewItemDue('');
    toast.success(`Added to ${newItemCategory}`);
  };

  const handleDeleteItem = (cat, idx) => {
    const arr = [...sections[cat]];
    arr.splice(idx, 1);
    const updated = { ...sections, [cat]: arr };
    setSections(updated);
    saveNoteChanges(content, title, updated);
  };

  const handleGenerateAI = async () => {
    if (!note) return;
    setIsGenerating(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/notes/${note.noteId || note._id}/ai-enhance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ template: aiTemplate, length: aiLength })
      });
      const data = await res.json();
      if (data.success) {
        setNote(data.note);
        setActiveSubTab('ai-enhanced');
        toast.success('Personal notes enhanced with AI!');
      } else {
        toast.error(data.message || 'Generation failed');
      }
    } catch (e) {
      toast.error('AI Note generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRefine = async (e) => {
    e.preventDefault();
    if (!refinementInput.trim() || !note) return;
    setIsRefining(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/notes/${note.noteId || note._id}/ai-refine`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ refinementPrompt: refinementInput.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setNote(prev => ({
          ...prev,
          aiEnhancement: {
            ...prev?.aiEnhancement,
            enhancedContent: data.enhancedContent,
            chatRefinements: data.chatRefinements
          }
        }));
        setRefinementInput('');
        toast.success('Note refined with AI!');
      }
    } catch (e) {
      toast.error('Refinement request failed');
    } finally {
      setIsRefining(false);
    }
  };

  const handleShare = async (e) => {
    e.preventDefault();
    if (!shareEmail.trim() || !note) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/notes/${note.noteId || note._id}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ email: shareEmail.trim(), role: shareRole })
      });
      const data = await res.json();
      if (data.success) {
        setNote(prev => ({ ...prev, shares: data.shares, visibility: 'SHARED' }));
        setShareEmail('');
        toast.success(`Note shared with ${shareEmail}`);
      }
    } catch (e) {
      toast.error('Failed to share note');
    }
  };

  const handleRevokeShare = async (emailOrId) => {
    if (!note) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/notes/${note.noteId || note._id}/share/${emailOrId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setNote(prev => ({ ...prev, shares: data.shares }));
        toast.success('Access revoked');
      }
    } catch (e) {
      toast.error('Failed to revoke access');
    }
  };

  const copyNoteLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
    toast.success('Note link copied to clipboard');
  };

  const formatSecs = (s) => {
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const filteredTranscript = transcriptSegments.filter(s => 
    !transcriptSearch.trim() ||
    s.speakerName.toLowerCase().includes(transcriptSearch.toLowerCase()) ||
    s.text.toLowerCase().includes(transcriptSearch.toLowerCase())
  );

  if (loading) {
    return (
      <div className="py-20 text-center text-gray-500">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-500 mb-3" />
        <p className="text-sm font-medium">Loading My Notes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                saveNoteChanges(content, e.target.value, sections);
              }}
              className="text-2xl font-bold text-gray-900 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-indigo-600 focus:outline-none"
            />
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 ${
              note?.visibility === 'SHARED' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
            }`}>
              {note?.visibility === 'SHARED' ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
              {note?.visibility === 'SHARED' ? 'Shared Note' : 'Private to you'}
            </span>
          </div>
          <p className="text-xs text-gray-500 flex items-center gap-2">
            <span>{saving ? 'Saving changes...' : lastSaved ? `Last saved at ${lastSaved}` : 'Auto-saved'}</span>
            <span>•</span>
            <span>Zoom AI My Notes feature</span>
          </p>
          {notesList.length > 0 && (
            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-xs text-gray-500 font-semibold">Meeting Note:</span>
              <select
                value={activeMeetingId}
                onChange={(e) => setActiveMeetingId(e.target.value)}
                className="text-xs bg-gray-50 border border-gray-300 rounded px-2 py-1 text-gray-700 font-medium focus:outline-none cursor-pointer"
              >
                {notesList.map((n) => (
                  <option key={n.meetingId || n._id} value={n.meetingId}>
                    {n.meetingTitle || n.title || n.meetingId}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={copyNoteLink}
            className="px-3 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            Copy Link
          </button>
          <button
            onClick={() => setShowShareModal(true)}
            className="px-3.5 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Share2 className="w-3.5 h-3.5 text-blue-600" />
            Share ({note?.shares?.length || 0})
          </button>
          <button
            onClick={handleGenerateAI}
            disabled={isGenerating}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50"
          >
            {isGenerating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-amber-200" />}
            {note?.aiEnhancement?.status === 'COMPLETED' ? 'Regenerate AI' : 'Enhance with AI'}
          </button>
        </div>
      </div>

      {/* Sub Tab Navigation (27.8) */}
      <div className="flex border-b border-gray-200 gap-4 sm:gap-6 overflow-x-auto no-scrollbar whitespace-nowrap shrink-0">
        <button
          onClick={() => setActiveSubTab('notes')}
          className={`py-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors shrink-0 ${
            activeSubTab === 'notes' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <FileText className="w-4 h-4" /> Personal Notes
        </button>

        <button
          onClick={() => setActiveSubTab('ai-enhanced')}
          className={`py-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors shrink-0 ${
            activeSubTab === 'ai-enhanced' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Sparkles className="w-4 h-4 text-purple-600" /> AI Enhanced Notes
          {note?.aiEnhancement?.status === 'COMPLETED' && (
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('transcript')}
          className={`py-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors shrink-0 ${
            activeSubTab === 'transcript' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Globe className="w-4 h-4 text-gray-600" /> Associated Transcript
          <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600 font-bold">
            {transcriptSegments.length}
          </span>
        </button>
      </div>

      {/* ── SUB TAB 1: MANUAL NOTES ── */}
      {activeSubTab === 'notes' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Free-form text */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block mb-2">
                Personal Meeting Notes
              </label>
              <textarea
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);
                  saveNoteChanges(e.target.value, title, sections);
                }}
                rows={14}
                placeholder="Type your personal meeting notes here... Write thoughts, details, questions, or ideas during or after the meeting."
                className="w-full text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded-xl p-3 border border-gray-200 leading-relaxed font-sans"
              />
            </div>
          </div>

          {/* Right Column: Structured Items (Important, Decisions, Tasks, Questions) */}
          <div className="space-y-4">
            {/* Quick Add Form */}
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-gray-700">Add Structured Item</h4>
              <form onSubmit={handleAddItem} className="space-y-2.5">
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value)}
                    className="bg-white border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs text-gray-700 font-medium focus:outline-none"
                  >
                    <option value="important">Important Point</option>
                    <option value="decisions">Decision</option>
                    <option value="tasks">Task / Reminder</option>
                    <option value="questions">Question</option>
                  </select>
                  {newItemCategory === 'tasks' && (
                    <input
                      type="text"
                      value={newItemDue}
                      onChange={(e) => setNewItemDue(e.target.value)}
                      placeholder="Due: Friday"
                      className="bg-white border border-gray-200 rounded-xl px-2 py-1.5 text-xs text-gray-700 focus:outline-none"
                    />
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newItemText}
                    onChange={(e) => setNewItemText(e.target.value)}
                    placeholder="Enter item details..."
                    className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs text-gray-800 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!newItemText.trim()}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl disabled:opacity-40"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            </div>

            {/* Structured Items List */}
            <div className="space-y-3">
              {/* Important Points */}
              {sections.important?.length > 0 && (
                <div className="bg-red-50/50 border border-red-200 rounded-2xl p-3.5 space-y-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-red-700 flex items-center gap-1.5">
                    <Bookmark className="w-3.5 h-3.5" /> Important Points
                  </div>
                  {sections.important.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs text-red-950 bg-white p-2 rounded-lg border border-red-100">
                      <span>{item.text}</span>
                      <button onClick={() => handleDeleteItem('important', idx)} className="text-gray-400 hover:text-red-500">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Decisions */}
              {sections.decisions?.length > 0 && (
                <div className="bg-emerald-50/50 border border-emerald-200 rounded-2xl p-3.5 space-y-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Decisions
                  </div>
                  {sections.decisions.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs text-emerald-950 bg-white p-2 rounded-lg border border-emerald-100">
                      <span>{item.text}</span>
                      <button onClick={() => handleDeleteItem('decisions', idx)} className="text-gray-400 hover:text-emerald-500">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Tasks */}
              {sections.tasks?.length > 0 && (
                <div className="bg-blue-50/50 border border-blue-200 rounded-2xl p-3.5 space-y-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
                    <ListTodo className="w-3.5 h-3.5" /> Tasks & Reminders
                  </div>
                  {sections.tasks.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs text-blue-950 bg-white p-2 rounded-lg border border-blue-100">
                      <div>
                        <span className="block font-medium">{item.text}</span>
                        {item.due && <span className="text-[10px] text-blue-600">Due: {item.due}</span>}
                      </div>
                      <button onClick={() => handleDeleteItem('tasks', idx)} className="text-gray-400 hover:text-blue-500">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Questions */}
              {sections.questions?.length > 0 && (
                <div className="bg-amber-50/50 border border-amber-200 rounded-2xl p-3.5 space-y-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5" /> Questions & Open Items
                  </div>
                  {sections.questions.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs text-amber-950 bg-white p-2 rounded-lg border border-amber-100">
                      <span>{item.text}</span>
                      <button onClick={() => handleDeleteItem('questions', idx)} className="text-gray-400 hover:text-amber-500">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── SUB TAB 2: AI ENHANCED NOTES ── */}
      {activeSubTab === 'ai-enhanced' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-500 block mb-0.5">Template</label>
                <select
                  value={aiTemplate}
                  onChange={(e) => setAiTemplate(e.target.value)}
                  className="bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs text-gray-800 font-medium focus:outline-none"
                >
                  <option value="STANDARD">Standard (Balanced)</option>
                  <option value="EXECUTIVE">Executive (High-Level)</option>
                  <option value="TECHNICAL">Technical (Code & Architecture)</option>
                  <option value="ACTION_ORIENTED">Action-Oriented (Tasks & Deadlines)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-gray-500 block mb-0.5">Length</label>
                <select
                  value={aiLength}
                  onChange={(e) => setAiLength(e.target.value)}
                  className="bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs text-gray-800 font-medium focus:outline-none"
                >
                  <option value="SHORT">Short (Highlights)</option>
                  <option value="MEDIUM">Medium (Balanced)</option>
                  <option value="LONG">Long (Detailed)</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleGenerateAI}
              disabled={isGenerating}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all disabled:opacity-50"
            >
              {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-amber-300" />}
              {note?.aiEnhancement?.status === 'COMPLETED' ? 'Regenerate Note' : 'Generate with AI'}
            </button>
          </div>

          {note?.aiEnhancement?.status === 'COMPLETED' ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
                  <div className="prose prose-sm max-w-none text-gray-800 whitespace-pre-wrap font-sans leading-relaxed">
                    {note.aiEnhancement.enhancedContent}
                  </div>
                </div>

                {/* AI Refinement Chat (27.4, 27.7) */}
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-3">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-purple-600" /> Refine Note with AI Chat
                  </h4>

                  {note.aiEnhancement.chatRefinements?.length > 0 && (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {note.aiEnhancement.chatRefinements.map((chat, i) => (
                        <div
                          key={i}
                          className={`p-2.5 rounded-xl text-xs ${
                            chat.role === 'user' ? 'bg-purple-50 text-purple-900 border border-purple-100 ml-4' : 'bg-gray-50 text-gray-800 border border-gray-200 mr-4'
                          }`}
                        >
                          <span className="font-bold block text-[10px] text-gray-500 mb-0.5">
                            {chat.role === 'user' ? 'You' : 'AI Assistant'}
                          </span>
                          {chat.message}
                        </div>
                      ))}
                    </div>
                  )}

                  <form onSubmit={handleRefine} className="flex gap-2">
                    <input
                      type="text"
                      value={refinementInput}
                      onChange={(e) => setRefinementInput(e.target.value)}
                      placeholder="e.g. 'Add more detail to the deployment timeline'..."
                      className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <button
                      type="submit"
                      disabled={isRefining || !refinementInput.trim()}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold disabled:opacity-40 transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>
              </div>

              {/* Citations & Structured Summary Cards */}
              <div className="space-y-4">
                {note.aiEnhancement.citations?.length > 0 && (
                  <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 space-y-2.5">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-purple-900 flex items-center gap-1.5">
                      <Bookmark className="w-4 h-4 text-purple-600" />
                      Transcript Citations
                    </h4>
                    <div className="space-y-2">
                      {note.aiEnhancement.citations.map((c, idx) => (
                        <div key={idx} className="bg-white p-2.5 rounded-xl border border-purple-100 text-xs text-gray-800">
                          <span className="font-bold text-purple-700">[{c.timecode}] {c.speaker}:</span>
                          <p className="text-gray-600 mt-0.5 italic">"{c.text}"</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="py-16 text-center border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
              <Sparkles className="w-10 h-10 text-purple-400 mx-auto mb-2" />
              <h3 className="font-bold text-sm text-gray-800">No AI Enhancement yet</h3>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                Click "Generate with AI" above to synthesize your personal notes with the meeting transcript.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── SUB TAB 3: ASSOCIATED TRANSCRIPT ── */}
      {activeSubTab === 'transcript' && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h4 className="font-bold text-sm text-gray-900">Meeting Spoken Transcript</h4>
            <input
              type="text"
              value={transcriptSearch}
              onChange={(e) => setTranscriptSearch(e.target.value)}
              placeholder="Search transcript speech..."
              className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-64"
            />
          </div>

          <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto pr-1">
            {filteredTranscript.length === 0 ? (
              <p className="py-8 text-center text-xs text-gray-400">No transcript matches found.</p>
            ) : (
              filteredTranscript.map((seg, idx) => (
                <div key={idx} className="py-2.5 flex items-start gap-3">
                  <span className="text-[11px] font-mono text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded shrink-0">
                    {formatSecs(seg.startTime || 0)}
                  </span>
                  <div>
                    <span className="font-bold text-xs text-indigo-700 block mb-0.5">{seg.speakerName}</span>
                    <p className="text-xs text-gray-700 leading-relaxed">{seg.text}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── Share Modal (27.6) ── */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-gray-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-gray-900 flex items-center gap-2">
                <Share2 className="w-5 h-5 text-blue-600" /> Share Personal Note
              </h3>
              <button onClick={() => setShowShareModal(false)} className="text-gray-400 hover:text-gray-600 text-lg font-bold">×</button>
            </div>

            <form onSubmit={handleShare} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Email Address</label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    required
                    value={shareEmail}
                    onChange={(e) => setShareEmail(e.target.value)}
                    placeholder="colleague@company.com"
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none"
                  />
                  <select
                    value={shareRole}
                    onChange={(e) => setShareRole(e.target.value)}
                    className="bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-2 text-xs text-gray-800 font-medium focus:outline-none"
                  >
                    <option value="viewer">Viewer</option>
                    <option value="editor">Editor</option>
                    <option value="co-owner">Co-owner</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={!shareEmail.trim()}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40"
              >
                <Share2 className="w-3.5 h-3.5" /> Share Note
              </button>
            </form>

            {note?.shares?.length > 0 && (
              <div className="pt-3 border-t border-gray-100 space-y-2">
                <span className="text-xs font-bold text-gray-700 block">People with access</span>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {note.shares.map((s, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-gray-50 text-xs">
                      <div>
                        <span className="font-semibold text-gray-900 block">{s.userName || s.userEmail}</span>
                        <span className="text-[11px] text-gray-500">{s.userEmail} • <strong className="text-blue-600 capitalize">{s.role}</strong></span>
                      </div>
                      <button onClick={() => handleRevokeShare(s.userEmail)} className="text-gray-400 hover:text-red-500">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
