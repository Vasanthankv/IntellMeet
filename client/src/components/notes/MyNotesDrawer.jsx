import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Sparkles, Send, Clock, User, CheckCircle2, ChevronRight, Play, Pause,
  Settings, AlertCircle, HelpCircle, ArrowRight, Lock, Unlock, FileText, Check, 
  Copy, Share2, Trash2, Plus, RefreshCw, Tag, Globe, MessageSquare, ExternalLink,
  ListTodo, CheckSquare, Bookmark, HelpCircle as QuestionIcon
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function MyNotesDrawer({
  isOpen,
  onClose,
  meetingId,
  meetingTitle = 'Meeting',
  isHost,
  user,
  socketRef,
  onSeekToTimestamp = null
}) {
  const [activeTab, setActiveTab] = useState('notes'); // 'notes' | 'transcript' | 'ai-enhance'
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  // Note fields
  const [title, setTitle] = useState('My Notes');
  const [content, setContent] = useState('');
  const [sections, setSections] = useState({
    important: [],
    questions: [],
    decisions: [],
    tasks: [],
    personal: []
  });

  // Adding quick section item
  const [showAddSectionModal, setShowAddSectionModal] = useState(false);
  const [sectionCategory, setSectionCategory] = useState('important');
  const [sectionInputText, setSectionInputText] = useState('');
  const [sectionInputDue, setSectionInputDue] = useState('');

  // Transcript state
  const [transcriptSegments, setTranscriptSegments] = useState([]);
  const [isTranscriptPaused, setIsTranscriptPaused] = useState(false);
  const [transcriptLanguage, setTranscriptLanguage] = useState('en-US');
  const [transcriptLoading, setTranscriptLoading] = useState(false);

  // AI Enhancement state
  const [aiTemplate, setAiTemplate] = useState('STANDARD');
  const [aiLength, setAiLength] = useState('MEDIUM');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [refinementInput, setRefinementInput] = useState('');
  const [isRefining, setIsRefining] = useState(false);

  // Sharing modal
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [shareRole, setShareRole] = useState('viewer');
  const [copiedLink, setCopiedLink] = useState(false);

  const saveTimeoutRef = useRef(null);

  // 1. Fetch or initialize personal note
  const fetchNote = async () => {
    if (!meetingId) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${(typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1" ? "https://intellmeet-backend-h3md.onrender.com" : "http://localhost:5000")}/api/meetings/${meetingId}/notes/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.note) {
        setNote(data.note);
        setTitle(data.note.title || `${meetingTitle} - My Notes`);
        setContent(data.note.content || '');
        setSections(data.note.sections || {
          important: [],
          questions: [],
          decisions: [],
          tasks: [],
          personal: []
        });
        setIsTranscriptPaused(data.note.transcriptSettings?.isPaused || false);
        setTranscriptLanguage(data.note.transcriptSettings?.language || 'en-US');
        if (data.note.lastSavedAt) {
          setLastSaved(new Date(data.note.lastSavedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        }
      }
    } catch (e) {
      console.error('Error fetching personal note:', e);
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch transcript segments for this meeting
  const fetchTranscript = async () => {
    if (!meetingId) return;
    setTranscriptLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${(typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1" ? "https://intellmeet-backend-h3md.onrender.com" : "http://localhost:5000")}/api/meetings/${meetingId}/transcript/export?format=json`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.transcript?.segments) {
        setTranscriptSegments(data.transcript.segments);
      }
    } catch (e) {
      console.error('Error fetching transcript for notes:', e);
    } finally {
      setTranscriptLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNote();
      fetchTranscript();
    }
  }, [isOpen, meetingId]);

  // 3. Auto-save Debounce (27.2, 27.7)
  const triggerAutoSave = (newContent, newTitle, newSections) => {
    if (!note) return;
    setSaving(true);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${(typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1" ? "https://intellmeet-backend-h3md.onrender.com" : "http://localhost:5000")}/api/notes/${note.noteId || note._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            title: newTitle !== undefined ? newTitle : title,
            content: newContent !== undefined ? newContent : content,
            sections: newSections !== undefined ? newSections : sections
          })
        });
        const data = await res.json();
        if (data.success) {
          setNote(data.note);
          setLastSaved(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
          if (socketRef?.current) {
            socketRef.current.emit('note-update', meetingId, { noteId: note.noteId, title: data.note.title });
          }
        }
      } catch (e) {
        console.error('Auto-save note error:', e);
      } finally {
        setSaving(false);
      }
    }, 1000);
  };

  const handleContentChange = (e) => {
    const val = e.target.value;
    setContent(val);
    triggerAutoSave(val, title, sections);
  };

  const handleTitleChange = (e) => {
    const val = e.target.value;
    setTitle(val);
    triggerAutoSave(content, val, sections);
  };

  // Add section item (Important, Question, Decision, Task, Personal)
  const handleAddSectionItem = (e) => {
    e.preventDefault();
    if (!sectionInputText.trim()) return;

    const newItem = {
      text: sectionInputText.trim(),
      due: sectionCategory === 'tasks' ? sectionInputDue : '',
      completed: false,
      timestamp: new Date()
    };

    const updatedSections = {
      ...sections,
      [sectionCategory]: [...(sections[sectionCategory] || []), newItem]
    };

    setSections(updatedSections);
    triggerAutoSave(content, title, updatedSections);

    setSectionInputText('');
    setSectionInputDue('');
    setShowAddSectionModal(false);
    toast.success(`Added to ${sectionCategory}`);
  };

  const handleDeleteSectionItem = (category, index) => {
    const updatedCategory = [...sections[category]];
    updatedCategory.splice(index, 1);
    const updatedSections = {
      ...sections,
      [category]: updatedCategory
    };
    setSections(updatedSections);
    triggerAutoSave(content, title, updatedSections);
  };

  const handleToggleTask = (index) => {
    const updatedTasks = [...sections.tasks];
    updatedTasks[index].completed = !updatedTasks[index].completed;
    const updatedSections = { ...sections, tasks: updatedTasks };
    setSections(updatedSections);
    triggerAutoSave(content, title, updatedSections);
  };

  // 4. Transcript Controls (27.5)
  const handleToggleTranscript = async () => {
    if (!note) return;
    const newPaused = !isTranscriptPaused;
    setIsTranscriptPaused(newPaused);
    try {
      const token = localStorage.getItem('token');
      await fetch(`${(typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1" ? "https://intellmeet-backend-h3md.onrender.com" : "http://localhost:5000")}/api/notes/${note.noteId || note._id}/transcript-control`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isPaused: newPaused, language: transcriptLanguage })
      });
      toast.success(newPaused ? 'Transcript paused for My Notes' : 'Transcript resumed');
      if (socketRef?.current) {
        socketRef.current.emit('note-transcription-toggle', meetingId, { isPaused: newPaused });
      }
    } catch (e) {
      toast.error('Failed to update transcript control');
    }
  };

  const handleInsertTranscriptSegment = (seg) => {
    const quote = `\n\n> [${formatSecs(seg.startTime || 0)}] **${seg.speakerName}**: "${seg.text}"\n\n`;
    const updatedContent = content + quote;
    setContent(updatedContent);
    triggerAutoSave(updatedContent, title, sections);
    toast.success('Segment inserted into your notes');
    setActiveTab('notes');
  };

  // 5. AI Note Enhancement (27.4)
  const handleGenerateAI = async () => {
    if (!note) return;
    setIsGeneratingAI(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${(typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1" ? "https://intellmeet-backend-h3md.onrender.com" : "http://localhost:5000")}/api/notes/${note.noteId || note._id}/ai-enhance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ template: aiTemplate, length: aiLength })
      });
      const data = await res.json();
      if (data.success && data.aiEnhancement) {
        setNote(data.note);
        toast.success('Notes enhanced with AI!');
        setActiveTab('ai-enhance');
        if (socketRef?.current) {
          socketRef.current.emit('ai-note-generate', meetingId, { noteId: note.noteId });
        }
      } else {
        toast.error(data.message || 'AI Enhancement failed');
      }
    } catch (e) {
      toast.error('Failed to enhance notes with AI');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // 6. Conversational AI Note Refinement (27.4, 27.7)
  const handleRefineAI = async (e) => {
    e.preventDefault();
    if (!refinementInput.trim() || !note) return;
    setIsRefining(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${(typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1" ? "https://intellmeet-backend-h3md.onrender.com" : "http://localhost:5000")}/api/notes/${note.noteId || note._id}/ai-refine`, {
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
        if (socketRef?.current) {
          socketRef.current.emit('ai-note-refine', meetingId, { noteId: note.noteId });
        }
      } else {
        toast.error(data.message || 'Refinement failed');
      }
    } catch (e) {
      toast.error('Refinement request failed');
    } finally {
      setIsRefining(false);
    }
  };

  // 7. Sharing Management (27.6)
  const handleShareNote = async (e) => {
    e.preventDefault();
    if (!shareEmail.trim() || !note) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${(typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1" ? "https://intellmeet-backend-h3md.onrender.com" : "http://localhost:5000")}/api/notes/${note.noteId || note._id}/share`, {
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
        toast.success(`Shared with ${shareEmail}`);
        if (socketRef?.current) {
          socketRef.current.emit('note-share', meetingId, { email: shareEmail, role: shareRole });
        }
      } else {
        toast.error(data.message || 'Share failed');
      }
    } catch (e) {
      toast.error('Failed to share note');
    }
  };

  const handleRevokeShare = async (targetIdOrEmail) => {
    if (!note) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${(typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1" ? "https://intellmeet-backend-h3md.onrender.com" : "http://localhost:5000")}/api/notes/${note.noteId || note._id}/share/${targetIdOrEmail}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setNote(prev => ({ ...prev, shares: data.shares }));
        toast.success('Share access revoked');
      }
    } catch (e) {
      toast.error('Failed to revoke share');
    }
  };

  const copyNoteLink = () => {
    const url = `${window.location.origin}/meetings/${meetingId}/notes`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
    toast.success('Personal Note link copied to clipboard!');
  };

  const applyAIToNotes = () => {
    if (!note?.aiEnhancement?.enhancedContent) return;
    const combined = content + '\n\n---\n### AI Enhanced Summary\n\n' + note.aiEnhancement.enhancedContent;
    setContent(combined);
    triggerAutoSave(combined, title, sections);
    setActiveTab('notes');
    toast.success('AI Enhanced content applied to your notes');
  };

  const formatSecs = (s) => {
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[500px] bg-[#1E1E1E] text-white shadow-2xl border-l border-[#333] flex flex-col animate-in slide-in-from-right duration-200">
      
      {/* ── Header (27.1, 27.6) ── */}
      <div className="px-5 py-3.5 border-b border-[#333] bg-gradient-to-r from-amber-950/30 via-zinc-900 to-[#1E1E1E] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
            <FileText className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-white">My Notes</h3>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                note?.visibility === 'SHARED' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}>
                {note?.visibility === 'SHARED' ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                {note?.visibility === 'SHARED' ? 'Shared' : 'Private to you'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-zinc-400">
              <span>{saving ? 'Saving...' : lastSaved ? `Saved at ${lastSaved}` : 'Auto-save active'}</span>
              <span>•</span>
              <span className="text-zinc-500">Zoom AI Notes</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={copyNoteLink}
            className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
            title="Copy Note Link"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setShowShareModal(true)}
            className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
            title="Share Note Permissions"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
            title="Close My Notes"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ── Navigation Tabs (27.8) ── */}
      <div className="px-5 border-b border-[#333] bg-[#181818] flex items-center gap-6">
        <button
          onClick={() => setActiveTab('notes')}
          className={`py-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
            activeTab === 'notes' ? 'border-amber-400 text-amber-400' : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Notes
        </button>

        <button
          onClick={() => setActiveTab('transcript')}
          className={`py-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
            activeTab === 'transcript' ? 'border-amber-400 text-amber-400' : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          Transcript
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-zinc-800 text-zinc-400">
            {transcriptSegments.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('ai-enhance')}
          className={`py-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
            activeTab === 'ai-enhance' ? 'border-amber-400 text-amber-400' : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          AI Enhance
          {note?.aiEnhancement?.status === 'COMPLETED' && (
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
          )}
        </button>
      </div>

      {/* ── TAB 1: MANUAL NOTES (27.2) ── */}
      {activeTab === 'notes' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Note Title */}
          <div>
            <input
              type="text"
              value={title}
              onChange={handleTitleChange}
              placeholder="Note Title..."
              className="w-full bg-transparent text-base font-bold text-white border-b border-transparent focus:border-amber-500 focus:outline-none px-1 py-1"
            />
          </div>

          {/* Quick Action Chips (27.2) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-[11px] text-zinc-400 font-medium shrink-0">Add:</span>
            <button
              onClick={() => { setSectionCategory('important'); setShowAddSectionModal(true); }}
              className="px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-medium flex items-center gap-1 shrink-0"
            >
              <Bookmark className="w-3 h-3" /> Important
            </button>
            <button
              onClick={() => { setSectionCategory('decisions'); setShowAddSectionModal(true); }}
              className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-medium flex items-center gap-1 shrink-0"
            >
              <CheckCircle2 className="w-3 h-3" /> Decision
            </button>
            <button
              onClick={() => { setSectionCategory('tasks'); setShowAddSectionModal(true); }}
              className="px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 text-xs font-medium flex items-center gap-1 shrink-0"
            >
              <ListTodo className="w-3 h-3" /> Task
            </button>
            <button
              onClick={() => { setSectionCategory('questions'); setShowAddSectionModal(true); }}
              className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 text-xs font-medium flex items-center gap-1 shrink-0"
            >
              <QuestionIcon className="w-3 h-3" /> Question
            </button>
          </div>

          {/* Structured Note Tags / Cards */}
          {(sections.important?.length > 0 || sections.decisions?.length > 0 || sections.tasks?.length > 0 || sections.questions?.length > 0) && (
            <div className="space-y-2 bg-[#252525] p-3 rounded-xl border border-[#333]">
              <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Structured Items</div>
              
              {/* Important */}
              {sections.important?.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs bg-red-950/30 border border-red-800/40 p-2 rounded-lg text-red-200">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-red-400 uppercase text-[9px] px-1.5 py-0.5 rounded bg-red-900/60">Important</span>
                    <span>{item.text}</span>
                  </div>
                  <button onClick={() => handleDeleteSectionItem('important', idx)} className="text-zinc-500 hover:text-red-400">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              {/* Decisions */}
              {sections.decisions?.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs bg-emerald-950/30 border border-emerald-800/40 p-2 rounded-lg text-emerald-200">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-emerald-400 uppercase text-[9px] px-1.5 py-0.5 rounded bg-emerald-900/60">Decision</span>
                    <span>{item.text}</span>
                  </div>
                  <button onClick={() => handleDeleteSectionItem('decisions', idx)} className="text-zinc-500 hover:text-emerald-400">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              {/* Tasks */}
              {sections.tasks?.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs bg-blue-950/30 border border-blue-800/40 p-2 rounded-lg text-blue-200">
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleToggleTask(idx)} className="text-blue-400">
                      {item.completed ? <CheckSquare className="w-4 h-4 text-emerald-400" /> : <Square className="w-4 h-4 text-zinc-400" />}
                    </button>
                    <span className={item.completed ? 'line-through text-zinc-500' : ''}>{item.text}</span>
                    {item.due && <span className="text-[10px] text-blue-400 bg-blue-900/50 px-1.5 py-0.5 rounded">Due: {item.due}</span>}
                  </div>
                  <button onClick={() => handleDeleteSectionItem('tasks', idx)} className="text-zinc-500 hover:text-blue-400">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              {/* Questions */}
              {sections.questions?.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs bg-amber-950/30 border border-amber-800/40 p-2 rounded-lg text-amber-200">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-amber-400 uppercase text-[9px] px-1.5 py-0.5 rounded bg-amber-900/60">Question</span>
                    <span>{item.text}</span>
                  </div>
                  <button onClick={() => handleDeleteSectionItem('questions', idx)} className="text-zinc-500 hover:text-amber-400">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Personal Free-form Notes Textarea (27.2) */}
          <div className="flex-1 flex flex-col min-h-[220px]">
            <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
              Personal Notes
            </label>
            <textarea
              value={content}
              onChange={handleContentChange}
              placeholder="Type your personal meeting notes here... (e.g., project details, reminders, draft thoughts). Notes are private to you and auto-saved."
              className="flex-1 w-full bg-[#181818] border border-[#333] rounded-xl p-3.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500 leading-relaxed resize-none min-h-[200px]"
            />
          </div>
        </div>
      )}

      {/* ── TAB 2: TRANSCRIPT INTEGRATION (27.3, 27.5) ── */}
      {activeTab === 'transcript' && (
        <div className="flex-1 overflow-y-auto p-4 flex flex-col space-y-4">
          {/* Transcript Control Header */}
          <div className="p-3 bg-[#252525] rounded-xl border border-[#333] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isTranscriptPaused ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'}`} />
              <span className="text-xs font-semibold text-white">
                {isTranscriptPaused ? 'Transcription Paused' : 'Live Transcription Active'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={transcriptLanguage}
                onChange={(e) => setTranscriptLanguage(e.target.value)}
                className="bg-[#181818] text-[11px] text-zinc-300 border border-[#444] rounded-lg px-2 py-1 focus:outline-none"
              >
                <option value="en-US">English (US)</option>
                <option value="es-ES">Spanish</option>
                <option value="fr-FR">French</option>
                <option value="de-DE">German</option>
                <option value="hi-IN">Hindi</option>
                <option value="ta-IN">Tamil</option>
                <option value="zh-CN">Chinese</option>
              </select>

              <button
                onClick={handleToggleTranscript}
                className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors ${
                  isTranscriptPaused 
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white' 
                    : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                }`}
              >
                {isTranscriptPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                {isTranscriptPaused ? 'Resume' : 'Pause'}
              </button>
            </div>
          </div>

          {/* Transcript Feed */}
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
            {transcriptLoading ? (
              <div className="p-8 text-center text-xs text-zinc-500">Loading transcript...</div>
            ) : transcriptSegments.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-500 border border-dashed border-[#333] rounded-xl">
                No speech detected yet. Spoken speech will appear here and can be referenced or added to your notes.
              </div>
            ) : (
              transcriptSegments.map((seg, i) => (
                <div key={i} className="group p-2.5 rounded-xl bg-[#222] border border-[#333] hover:border-zinc-500 transition-colors">
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="font-bold text-amber-400">{seg.speakerName}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onSeekToTimestamp && onSeekToTimestamp(seg.startTime || 0)}
                        className="text-zinc-500 hover:text-white flex items-center gap-1"
                        title="Seek to time in recording"
                      >
                        <Clock className="w-3 h-3" />
                        {formatSecs(seg.startTime || 0)}
                      </button>
                      <button
                        onClick={() => handleInsertTranscriptSegment(seg)}
                        className="opacity-0 group-hover:opacity-100 text-amber-400 hover:text-amber-300 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 flex items-center gap-1 transition-opacity"
                        title="Add quote to my notes"
                      >
                        <Plus className="w-2.5 h-2.5" /> Note
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed">{seg.text}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── TAB 3: AI ENHANCE & REFINE (27.4, 27.9) ── */}
      {activeTab === 'ai-enhance' && (
        <div className="flex-1 overflow-y-auto p-4 flex flex-col space-y-4">
          
          {/* Controls: Template & Length */}
          <div className="p-3.5 bg-[#252525] rounded-2xl border border-[#333] space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">Template Style</label>
                <select
                  value={aiTemplate}
                  onChange={(e) => setAiTemplate(e.target.value)}
                  className="w-full bg-[#181818] border border-[#444] rounded-xl px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-purple-500"
                >
                  <option value="STANDARD">Standard (Balanced)</option>
                  <option value="EXECUTIVE">Executive (High-Level)</option>
                  <option value="TECHNICAL">Technical (Specs & Code)</option>
                  <option value="ACTION_ORIENTED">Action-Oriented (Tasks)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">Note Length</label>
                <select
                  value={aiLength}
                  onChange={(e) => setAiLength(e.target.value)}
                  className="w-full bg-[#181818] border border-[#444] rounded-xl px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-purple-500"
                >
                  <option value="SHORT">Short (Highlights)</option>
                  <option value="MEDIUM">Medium (Standard)</option>
                  <option value="LONG">Long (Detailed)</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleGenerateAI}
              disabled={isGeneratingAI}
              className="w-full py-2 bg-gradient-to-r from-purple-600 via-indigo-600 to-amber-600 hover:from-purple-500 hover:to-amber-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 transition-all"
            >
              {isGeneratingAI ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 text-amber-200" />
              )}
              {note?.aiEnhancement?.status === 'COMPLETED' ? 'Regenerate Enhanced Note' : 'Generate with AI'}
            </button>
          </div>

          {/* AI Enhanced Results View */}
          {note?.aiEnhancement?.status === 'COMPLETED' ? (
            <div className="flex-1 space-y-4">
              
              {/* Action Toolbar for AI Note */}
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-zinc-400 font-semibold">
                  Generated {note.aiEnhancement.generatedAt ? new Date(note.aiEnhancement.generatedAt).toLocaleTimeString() : ''}
                </span>
                <button
                  onClick={applyAIToNotes}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Apply to Notes
                </button>
              </div>

              {/* Citations from Transcript (27.3) */}
              {note.aiEnhancement.citations?.length > 0 && (
                <div className="p-3 bg-purple-950/20 border border-purple-800/40 rounded-xl space-y-2">
                  <div className="text-[11px] font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Bookmark className="w-3.5 h-3.5" />
                    Transcript Citations
                  </div>
                  <div className="space-y-1.5">
                    {note.aiEnhancement.citations.map((c, i) => (
                      <div key={i} className="text-xs text-purple-200 bg-purple-900/30 p-2 rounded-lg flex items-start justify-between gap-2">
                        <div>
                          <span className="font-bold text-amber-400">[{c.timecode}] {c.speaker}:</span>
                          <span className="ml-1 text-zinc-300">"{c.text}"</span>
                        </div>
                        {onSeekToTimestamp && (
                          <button
                            onClick={() => onSeekToTimestamp(c.startTime || 0)}
                            className="text-purple-300 hover:text-white shrink-0 p-1"
                            title="Jump to speech in meeting"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Enhanced Note Markdown View */}
              <div className="p-4 bg-[#222] border border-[#333] rounded-2xl text-xs text-zinc-200 leading-relaxed whitespace-pre-wrap font-sans">
                {note.aiEnhancement.enhancedContent}
              </div>

              {/* Conversational AI Chat Refinement (27.4, 27.7) */}
              <div className="p-3.5 bg-[#252525] rounded-2xl border border-[#333] space-y-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
                  Refine with AI Chat
                </div>

                {note.aiEnhancement.chatRefinements?.length > 0 && (
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {note.aiEnhancement.chatRefinements.map((chat, idx) => (
                      <div
                        key={idx}
                        className={`p-2 rounded-xl text-xs ${
                          chat.role === 'user' 
                            ? 'bg-purple-900/30 text-purple-200 border border-purple-800/40 ml-4' 
                            : 'bg-zinc-800 text-zinc-200 border border-zinc-700 mr-4'
                        }`}
                      >
                        <span className="font-bold block text-[10px] text-zinc-400 mb-0.5">
                          {chat.role === 'user' ? 'You' : 'AI Assistant'}
                        </span>
                        {chat.message}
                      </div>
                    ))}
                  </div>
                )}

                <form onSubmit={handleRefineAI} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={refinementInput}
                    onChange={(e) => setRefinementInput(e.target.value)}
                    placeholder="e.g. 'Make action items bulleted with assignees'..."
                    className="flex-1 bg-[#181818] border border-[#444] rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                  />
                  <button
                    type="submit"
                    disabled={isRefining || !refinementInput.trim()}
                    className="p-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl disabled:opacity-40 transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border border-dashed border-[#333] rounded-2xl text-zinc-500">
              <Sparkles className="w-10 h-10 text-purple-400/50 mb-3" />
              <p className="text-sm font-bold text-zinc-300">Enrich Your Notes with AI</p>
              <p className="text-xs text-zinc-500 mt-1 max-w-xs">
                Zoom AI combines your manual notes with the spoken meeting transcript to create structured takeaways, decisions, and action items.
              </p>
            </div>
          )}

        </div>
      )}

      {/* ── Footer / Status Bar (27.8) ── */}
      <div className="px-5 py-3 border-t border-[#333] bg-[#181818] flex items-center justify-between text-xs text-zinc-400">
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleTranscript}
            className="hover:text-white transition-colors text-[11px] flex items-center gap-1"
          >
            {isTranscriptPaused ? <Play className="w-3 h-3 text-emerald-400" /> : <Pause className="w-3 h-3 text-amber-400" />}
            {isTranscriptPaused ? 'Resume Transcript' : 'Pause Transcript'}
          </button>
        </div>

        <button
          onClick={handleGenerateAI}
          disabled={isGeneratingAI}
          className="text-amber-400 hover:text-amber-300 font-bold text-[11px] flex items-center gap-1.5 transition-colors disabled:opacity-40"
        >
          <Sparkles className="w-3 h-3 text-purple-400" />
          Generate AI
        </button>
      </div>

      {/* ── Quick Add Section Modal ── */}
      {showAddSectionModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#242424] border border-[#444] rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-white capitalize">Add {sectionCategory} Item</h4>
              <button onClick={() => setShowAddSectionModal(false)} className="text-zinc-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSectionItem} className="space-y-3">
              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">Item Description</label>
                <input
                  type="text"
                  autoFocus
                  value={sectionInputText}
                  onChange={(e) => setSectionInputText(e.target.value)}
                  placeholder={`Describe this ${sectionCategory}...`}
                  className="w-full bg-[#181818] border border-[#444] rounded-xl p-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              {sectionCategory === 'tasks' && (
                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">Due Date / Timeframe</label>
                  <input
                    type="text"
                    value={sectionInputDue}
                    onChange={(e) => setSectionInputDue(e.target.value)}
                    placeholder="e.g. Friday, Tomorrow, Next Sprint"
                    className="w-full bg-[#181818] border border-[#444] rounded-xl p-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddSectionModal(false)}
                  className="px-3 py-1.5 rounded-xl border border-zinc-700 text-xs font-semibold text-zinc-300 hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!sectionInputText.trim()}
                  className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold disabled:opacity-40"
                >
                  Add Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Share Note Modal (27.6) ── */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#242424] border border-[#444] rounded-2xl p-5 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-white flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-blue-400" />
                  Share Personal Note
                </h4>
                <p className="text-[11px] text-zinc-400">Share with colleagues with customizable permissions</p>
              </div>
              <button onClick={() => setShowShareModal(false)} className="text-zinc-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Share Form */}
            <form onSubmit={handleShareNote} className="space-y-3">
              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">Colleague Email</label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    required
                    value={shareEmail}
                    onChange={(e) => setShareEmail(e.target.value)}
                    placeholder="colleague@company.com"
                    className="flex-1 bg-[#181818] border border-[#444] rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                  />
                  <select
                    value={shareRole}
                    onChange={(e) => setShareRole(e.target.value)}
                    className="bg-[#181818] border border-[#444] rounded-xl px-2 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="viewer">Viewer (Read-only)</option>
                    <option value="editor">Editor (Can edit)</option>
                    <option value="co-owner">Co-owner (Full control)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={!shareEmail.trim()}
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40"
              >
                <Share2 className="w-3.5 h-3.5" /> Share Note
              </button>
            </form>

            {/* Existing Shares List */}
            {note?.shares?.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-[#333]">
                <span className="text-[10px] uppercase font-bold text-zinc-400 block">People with access</span>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {note.shares.map((share, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-[#181818] text-xs">
                      <div>
                        <span className="font-semibold text-white block">{share.userName || share.userEmail}</span>
                        <span className="text-[10px] text-zinc-400">{share.userEmail} • <strong className="text-blue-400 capitalize">{share.role}</strong></span>
                      </div>
                      <button
                        onClick={() => handleRevokeShare(share.userEmail)}
                        className="text-zinc-500 hover:text-red-400 p-1"
                        title="Revoke access"
                      >
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
