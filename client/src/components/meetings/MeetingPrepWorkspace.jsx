import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import io from 'socket.io-client';
import {
  ListOrdered, CheckCircle2, PlayCircle, FastForward, Plus, Trash2,
  Edit3, FileText, File, Download, ExternalLink, Share2, BookOpen,
  Users, Check, Sparkles, ChevronDown, ChevronUp, AlertCircle,
  ArrowRight, Tag, Send, Eye, Clock, RefreshCw, X
} from 'lucide-react';

export default function MeetingPrepWorkspace({ meeting, meetingId, user, isLiveMeeting = false }) {
  const currentMeetingId = meetingId || meeting?.meetingId || meeting?._id;
  const isHost = user?.email && (user.email === meeting?.hostEmail || user?.name === meeting?.hostName || user?.role === 'Administrator');

  const [activeTab, setActiveTab] = useState('AGENDA'); // 'AGENDA' | 'PREREADS' | 'NOTES'
  const [agenda, setAgenda] = useState(null);
  const [preReads, setPreReads] = useState([]);
  const [meetingNotes, setMeetingNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Expanded Agenda Items
  const [expandedItems, setExpandedItems] = useState({});

  // Modals state
  const [showAddAgendaModal, setShowAddAgendaModal] = useState(false);
  const [newAgendaItem, setNewAgendaItem] = useState({
    title: '',
    description: '',
    presenterName: user?.name || '',
    presenterEmail: user?.email || '',
    durationMinutes: 15,
    notes: '',
  });

  const [showAddPreReadModal, setShowAddPreReadModal] = useState(false);
  const [newPreRead, setNewPreRead] = useState({
    title: '',
    description: '',
    type: 'PDF',
    fileUrl: '',
    externalUrl: '',
    fileSize: '',
  });

  // Note composer state
  const [noteContent, setNoteContent] = useState('');
  const [noteCategory, setNoteCategory] = useState('GENERAL'); // 'GENERAL' | 'DECISION' | 'ACTION_ITEM' | 'KEY_TAKEAWAY'
  const [selectedAgendaIdForNote, setSelectedAgendaIdForNote] = useState('');
  const [noteFilterCategory, setNoteFilterCategory] = useState('ALL');

  const socketRef = useRef(null);
  const preReadFileRef = useRef(null);

  // Setup Socket.io for real-time collaboration
  useEffect(() => {
    if (!currentMeetingId) return;

    const socketUrl =
      import.meta.env.VITE_API_URL ||
      (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
        ? (typeof localStorage !== 'undefined' && localStorage.getItem('intellmeet_api_url')) || 'https://intellmeet-backend-h3md.onrender.com'
        : 'http://localhost:5000');
    socketRef.current = io(socketUrl);
    socketRef.current.emit('join-room', currentMeetingId, user?.id || 'guest', user?.name || 'User');

    socketRef.current.on('agenda-updated', (updatedAgenda) => {
      setAgenda(updatedAgenda);
    });

    socketRef.current.on('meeting-note-created', (newNote) => {
      setMeetingNotes(prev => {
        if (prev.some(n => n._id === newNote._id)) return prev;
        return [...prev, newNote];
      });
    });

    socketRef.current.on('meeting-note-changed', (editedNote) => {
      setMeetingNotes(prev => prev.map(n => n._id === editedNote._id ? editedNote : n));
    });

    socketRef.current.on('preread-changed', (updatedPreRead) => {
      setPreReads(prev => prev.map(p => p._id === updatedPreRead._id ? updatedPreRead : p));
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [currentMeetingId]);

  // Fetch Agenda
  const fetchAgenda = async () => {
    if (!currentMeetingId) return;
    try {
      const res = await fetch(`${(typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1" ? "https://intellmeet-backend-h3md.onrender.com" : "http://localhost:5000")}/api/meetings/${currentMeetingId}/agenda`);
      const data = await res.json();
      if (data.success && data.agenda) {
        setAgenda(data.agenda);
      }
    } catch (err) {
      console.error('Failed to load meeting agenda:', err);
    }
  };

  // Fetch Pre-reads
  const fetchPreReads = async () => {
    if (!currentMeetingId) return;
    try {
      const res = await fetch(`${(typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1" ? "https://intellmeet-backend-h3md.onrender.com" : "http://localhost:5000")}/api/meetings/${currentMeetingId}/prereads`);
      const data = await res.json();
      if (data.success) {
        setPreReads(data.preReads || []);
      }
    } catch (err) {
      console.error('Failed to load pre-reads:', err);
    }
  };

  // Fetch Notes
  const fetchMeetingNotes = async () => {
    if (!currentMeetingId) return;
    try {
      const query = noteFilterCategory !== 'ALL' ? `?category=${noteFilterCategory}` : '';
      const res = await fetch(`${(typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1" ? "https://intellmeet-backend-h3md.onrender.com" : "http://localhost:5000")}/api/meetings/${currentMeetingId}/meeting-notes${query}`);
      const data = await res.json();
      if (data.success) {
        setMeetingNotes(data.notes || []);
      }
    } catch (err) {
      console.error('Failed to load meeting notes:', err);
    }
  };

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([fetchAgenda(), fetchPreReads(), fetchMeetingNotes()]);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, [currentMeetingId, noteFilterCategory]);

  // Toggle Agenda Item Expand
  const toggleExpand = (itemId) => {
    setExpandedItems(prev => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  // Add Agenda Item
  const handleAddAgendaItem = async (e) => {
    e.preventDefault();
    if (!newAgendaItem.title.trim()) {
      toast.error('Topic title is required');
      return;
    }

    try {
      const res = await fetch(`${(typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1" ? "https://intellmeet-backend-h3md.onrender.com" : "http://localhost:5000")}/api/meetings/${currentMeetingId}/agenda/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAgendaItem)
      });
      const data = await res.json();
      if (data.success) {
        setAgenda(data.agenda);
        setShowAddAgendaModal(false);
        setNewAgendaItem({
          title: '',
          description: '',
          presenterName: user?.name || '',
          presenterEmail: user?.email || '',
          durationMinutes: 15,
          notes: '',
        });
        toast.success('Agenda item added');
        if (socketRef.current) socketRef.current.emit('agenda-item-updated', currentMeetingId, data.agenda);
      }
    } catch (err) {
      toast.error('Failed to add agenda item');
    }
  };

  // Update Status of Agenda Item (Section 36.5)
  const handleUpdateItemStatus = async (itemId, newStatus) => {
    try {
      const res = await fetch(`${(typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1" ? "https://intellmeet-backend-h3md.onrender.com" : "http://localhost:5000")}/api/meetings/${currentMeetingId}/agenda/items/${itemId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        setAgenda(data.agenda);
        toast.success(`Topic updated to ${newStatus}`);
        if (socketRef.current) socketRef.current.emit('agenda-item-updated', currentMeetingId, data.agenda);
      }
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  // Delete Agenda Item
  const handleDeleteAgendaItem = async (itemId) => {
    if (!window.confirm('Remove this agenda item from the meeting plan?')) return;
    try {
      const res = await fetch(`${(typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1" ? "https://intellmeet-backend-h3md.onrender.com" : "http://localhost:5000")}/api/meetings/${currentMeetingId}/agenda/items/${itemId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setAgenda(data.agenda);
        toast.success('Agenda item removed');
        if (socketRef.current) socketRef.current.emit('agenda-item-updated', currentMeetingId, data.agenda);
      }
    } catch (err) {
      toast.error('Failed to delete agenda item');
    }
  };

  // Add Pre-Read File or Link (Section 36.2)
  const handleUploadPreReadFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      let docType = 'DOCUMENT';
      if (file.type.includes('pdf')) docType = 'PDF';
      else if (file.type.includes('presentation') || file.name.endsWith('.pptx')) docType = 'PRESENTATION';
      else if (file.type.includes('spreadsheet') || file.name.endsWith('.xlsx')) docType = 'SPREADSHEET';
      else if (file.type.startsWith('image/')) docType = 'IMAGE';

      const sizeStr = file.size > 1024 * 1024 
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
        : `${Math.round(file.size / 1024)} KB`;

      setNewPreRead(prev => ({
        ...prev,
        title: prev.title || file.name,
        type: docType,
        fileSize: sizeStr,
        fileUrl: reader.result,
      }));
      toast.success(`Attached "${file.name}"`);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSavePreRead = async (e) => {
    e.preventDefault();
    if (!newPreRead.title.trim()) {
      toast.error('Pre-read document title is required');
      return;
    }

    try {
      const res = await fetch(`${(typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1" ? "https://intellmeet-backend-h3md.onrender.com" : "http://localhost:5000")}/api/meetings/${currentMeetingId}/prereads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newPreRead,
          uploadedBy: user?.id || user?._id || '',
          uploadedByName: user?.name || 'Participant'
        })
      });
      const data = await res.json();
      if (data.success) {
        setPreReads(prev => [data.preRead, ...prev]);
        setShowAddPreReadModal(false);
        setNewPreRead({
          title: '',
          description: '',
          type: 'PDF',
          fileUrl: '',
          externalUrl: '',
          fileSize: '',
        });
        toast.success('Pre-read material added');
      }
    } catch (err) {
      toast.error('Failed to add pre-read');
    }
  };

  // Toggle Pre-Read Reviewed Status
  const handleToggleReviewed = async (preReadId, currentStatus) => {
    try {
      const res = await fetch(`${(typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1" ? "https://intellmeet-backend-h3md.onrender.com" : "http://localhost:5000")}/api/meetings/${currentMeetingId}/prereads/${preReadId}/view`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id || user?._id || '',
          userName: user?.name || 'Participant',
          reviewed: !currentStatus
        })
      });
      const data = await res.json();
      if (data.success) {
        setPreReads(prev => prev.map(p => p._id === preReadId ? data.preRead : p));
        toast.success(!currentStatus ? 'Marked as reviewed!' : 'Marked as unreviewed');
        if (socketRef.current) socketRef.current.emit('preread-updated', currentMeetingId, data.preRead);
      }
    } catch (err) {
      toast.error('Error updating review status');
    }
  };

  // Add Shared Meeting Note (Section 36.3 & 36.6)
  const handleAddMeetingNote = async (e) => {
    e.preventDefault();
    if (!noteContent.trim()) return;

    try {
      const res = await fetch(`${(typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1" ? "https://intellmeet-backend-h3md.onrender.com" : "http://localhost:5000")}/api/meetings/${currentMeetingId}/meeting-notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agendaItemId: selectedAgendaIdForNote,
          authorId: user?.id || user?._id || '',
          authorName: user?.name || 'Participant',
          authorEmail: user?.email || '',
          content: noteContent.trim(),
          category: noteCategory,
          visibility: 'ALL_PARTICIPANTS'
        })
      });
      const data = await res.json();
      if (data.success) {
        setMeetingNotes(prev => [...prev, data.note]);
        setNoteContent('');
        toast.success(`Shared ${noteCategory.toLowerCase().replace('_', ' ')} recorded!`);
        if (socketRef.current) socketRef.current.emit('meeting-note-added', currentMeetingId, data.note);
      }
    } catch (err) {
      toast.error('Failed to save shared note');
    }
  };

  // Calculations
  const totalAgendaMinutes = agenda?.items?.reduce((acc, i) => acc + (i.durationMinutes || 0), 0) || 0;
  const completedCount = agenda?.items?.filter(i => i.status === 'COMPLETED').length || 0;
  const totalItemsCount = agenda?.items?.length || 0;
  const progressPct = totalItemsCount > 0 ? Math.round((completedCount / totalItemsCount) * 100) : 0;

  return (
    <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
      
      {/* Top Banner Header */}
      <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-blue-50/50 via-indigo-50/20 to-purple-50/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-indigo-600 text-white rounded-xl shadow-sm">
              <BookOpen className="w-4 h-4" />
            </span>
            <h3 className="font-bold text-base text-gray-900 flex items-center gap-2">
              Meeting Preparation & Workspace
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                Agenda • Pre-reads • Shared Notes
              </span>
            </h3>
          </div>
          <p className="text-xs text-gray-500">
            Connect agenda timing, required pre-reads, live topic advancement, and shared decisions across the meeting lifecycle.
          </p>
        </div>

        {/* Progress & Stats Cards */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 bg-white border border-gray-200 rounded-2xl shadow-xs text-center">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Total Agenda</span>
            <span className="font-extrabold text-sm text-gray-900">{totalAgendaMinutes} mins</span>
          </div>

          <div className="px-3.5 py-2 bg-white border border-gray-200 rounded-2xl shadow-xs text-center">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Progress</span>
            <span className="font-extrabold text-sm text-emerald-600">{completedCount}/{totalItemsCount} ({progressPct}%)</span>
          </div>

          <button
            onClick={loadAll}
            className="p-2 border border-gray-200 hover:bg-white text-gray-600 rounded-xl transition-colors shadow-xs"
            title="Refresh agenda and notes"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Workspace Tabs Navigation */}
      <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between gap-2 bg-white">
        <div className="flex items-center gap-1.5 text-xs font-bold">
          <button
            onClick={() => setActiveTab('AGENDA')}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 ${
              activeTab === 'AGENDA'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <ListOrdered className="w-4 h-4" />
            Agenda Topics
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              activeTab === 'AGENDA' ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
            }`}>
              {totalItemsCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('PREREADS')}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 ${
              activeTab === 'PREREADS'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <FileText className="w-4 h-4" />
            Pre-read Materials
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              activeTab === 'PREREADS' ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
            }`}>
              {preReads.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('NOTES')}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 ${
              activeTab === 'NOTES'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Share2 className="w-4 h-4" />
            Shared Notes & Decisions
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              activeTab === 'NOTES' ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
            }`}>
              {meetingNotes.length}
            </span>
          </button>
        </div>

        {/* Action Button depending on tab */}
        {activeTab === 'AGENDA' && (
          <button
            onClick={() => setShowAddAgendaModal(true)}
            className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add Topic
          </button>
        )}

        {activeTab === 'PREREADS' && (
          <button
            onClick={() => setShowAddPreReadModal(true)}
            className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add Pre-read
          </button>
        )}
      </div>

      {/* TAB 1: AGENDA TOPICS (Section 36.1, 36.5, 36.6) */}
      {activeTab === 'AGENDA' && (
        <div className="p-5 space-y-4">
          {/* Progress Bar */}
          <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
            <div
              style={{ width: `${progressPct}%` }}
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
            />
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-gray-400">Loading meeting agenda items...</div>
          ) : totalItemsCount === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <ListOrdered className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="font-bold text-xs text-gray-600">No agenda topics defined yet</p>
              <p className="text-[11px] text-gray-400 mt-1">Add items to align discussion topics and allocate session time.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {agenda.items.map((item, idx) => {
                const isExpanded = expandedItems[item.itemId || item._id];
                const isCurrent = item.status === 'IN_PROGRESS';
                const isDone = item.status === 'COMPLETED';
                const isSkipped = item.status === 'SKIPPED';

                return (
                  <div
                    key={item.itemId || item._id || idx}
                    className={`rounded-2xl border transition-all ${
                      isCurrent
                        ? 'bg-blue-50/50 border-blue-300 shadow-sm ring-1 ring-blue-400/40'
                        : isDone
                        ? 'bg-emerald-50/20 border-emerald-200'
                        : isSkipped
                        ? 'bg-gray-50 border-gray-200 opacity-60'
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {/* Item Row Header */}
                    <div className="p-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {/* Order & Status Icon */}
                        <div className="flex items-center gap-2 shrink-0">
                          {isDone ? (
                            <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                              <CheckCircle2 className="w-4 h-4" />
                            </span>
                          ) : isCurrent ? (
                            <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center animate-pulse">
                              <PlayCircle className="w-4 h-4" />
                            </span>
                          ) : isSkipped ? (
                            <span className="w-6 h-6 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-xs font-bold">
                              —
                            </span>
                          ) : (
                            <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs font-bold">
                              {idx + 1}
                            </span>
                          )}
                        </div>

                        {/* Title and Presenter */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className={`font-bold text-xs ${isDone ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                              {item.title}
                            </h4>
                            {isCurrent && (
                              <span className="px-2 py-0.2 rounded-full bg-blue-600 text-white font-bold text-[9px] uppercase tracking-wider animate-pulse">
                                Live Now
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-gray-500 mt-0.5">
                            {item.presenterName && <span>Lead: <strong>{item.presenterName}</strong></span>}
                            <span>•</span>
                            <span className="flex items-center gap-1 font-medium">
                              <Clock className="w-3 h-3 text-gray-400" /> {item.durationMinutes} mins
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Status Selector & Expand Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        {/* Status Dropdown */}
                        <select
                          value={item.status}
                          onChange={(e) => handleUpdateItemStatus(item.itemId || item._id, e.target.value)}
                          className={`text-xs font-bold px-2.5 py-1 rounded-xl border outline-none cursor-pointer ${
                            isCurrent
                              ? 'bg-blue-100 text-blue-800 border-blue-300'
                              : isDone
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : isSkipped
                              ? 'bg-gray-200 text-gray-700 border-gray-300'
                              : 'bg-gray-100 text-gray-700 border-gray-200'
                          }`}
                        >
                          <option value="PENDING">Pending</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="COMPLETED">Completed</option>
                          <option value="SKIPPED">Skipped</option>
                        </select>

                        <button
                          onClick={() => toggleExpand(item.itemId || item._id)}
                          className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
                          title="View topic notes and decisions"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>

                        {isHost && (
                          <button
                            onClick={() => handleDeleteAgendaItem(item.itemId || item._id)}
                            className="p-1 hover:bg-rose-50 rounded-lg text-gray-400 hover:text-rose-600 transition-colors"
                            title="Delete agenda item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Expandable Details: Description, Decision, Notes */}
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-1 border-t border-gray-100 text-xs text-gray-700 space-y-2.5 bg-white/60 rounded-b-2xl">
                        {item.description && (
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-0.5">Description & Scope</span>
                            <p className="text-gray-600 leading-relaxed">{item.description}</p>
                          </div>
                        )}

                        {item.decision && (
                          <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block mb-0.5 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Agreed Decision
                            </span>
                            <p className="text-emerald-950 font-semibold">{item.decision}</p>
                          </div>
                        )}

                        {item.notes && (
                          <div className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-0.5">Preparation Notes</span>
                            <p className="text-gray-700">{item.notes}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PRE-READ MATERIALS (Section 36.2, 36.7) */}
      {activeTab === 'PREREADS' && (
        <div className="p-5 space-y-4">
          {loading ? (
            <div className="py-12 text-center text-xs text-gray-400">Loading pre-read materials...</div>
          ) : preReads.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <FileText className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="font-bold text-xs text-gray-600">No pre-read materials uploaded</p>
              <p className="text-[11px] text-gray-400 mt-1 max-w-sm mx-auto">
                Attach project specifications, slide decks, or spreadsheets for attendees to review before meeting.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {preReads.map(doc => {
                const isReviewedByMe = doc.viewedBy?.some(v => (v.userId === user?.id || v.userName === user?.name) && v.reviewed);
                const reviewedCount = doc.viewedBy?.filter(v => v.reviewed).length || 0;

                return (
                  <div key={doc._id} className="p-4 bg-white rounded-2xl border border-gray-200 shadow-xs flex flex-col justify-between space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 overflow-hidden">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                          {doc.type === 'PDF' ? <FileText className="w-5 h-5 text-red-500" /> :
                           doc.type === 'LINK' ? <ExternalLink className="w-5 h-5 text-blue-500" /> :
                           <File className="w-5 h-5 text-indigo-500" />}
                        </div>
                        <div className="overflow-hidden">
                          <h4 className="font-bold text-xs text-gray-900 truncate">{doc.title}</h4>
                          <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">{doc.description || 'Pre-read document'}</p>
                          <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-1.5">
                            <span>Uploaded by <strong>{doc.uploadedByName}</strong></span>
                            {doc.fileSize && <span>• {doc.fileSize}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {doc.fileUrl && (
                          <a
                            href={doc.fileUrl}
                            download={doc.title}
                            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-blue-600 transition-colors"
                            title="Download document"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        )}
                        {doc.externalUrl && (
                          <a
                            href={doc.externalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-blue-600 transition-colors"
                            title="Open external link"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Review Status Footer */}
                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-gray-500 flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5 text-gray-400" /> {reviewedCount} reviewed
                      </span>

                      <button
                        onClick={() => handleToggleReviewed(doc._id, isReviewedByMe)}
                        className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                          isReviewedByMe
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        {isReviewedByMe ? 'Reviewed by You' : 'Mark as Reviewed'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SHARED MEETING NOTES & DECISIONS (Section 36.3, 36.6) */}
      {activeTab === 'NOTES' && (
        <div className="p-5 space-y-5">
          {/* Note Filters */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1 overflow-x-auto text-xs font-bold">
              {['ALL', 'DECISION', 'ACTION_ITEM', 'KEY_TAKEAWAY', 'GENERAL'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setNoteFilterCategory(cat)}
                  className={`px-3 py-1 rounded-xl transition-all ${
                    noteFilterCategory === cat
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat === 'ALL' ? 'All Notes' : cat.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Notes List */}
          <div className="space-y-3">
            {meetingNotes.length === 0 ? (
              <div className="py-10 text-center text-gray-400">
                <Share2 className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="font-bold text-xs text-gray-600">No shared notes or decisions yet</p>
                <p className="text-[11px] text-gray-400 mt-1">
                  Collaborative notes are visible to all meeting participants (distinct from private My Notes).
                </p>
              </div>
            ) : (
              meetingNotes.map(n => (
                <div key={n._id} className="p-4 bg-gray-50/70 border border-gray-200 rounded-2xl space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900">{n.authorName}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full uppercase ${
                        n.category === 'DECISION'
                          ? 'bg-emerald-100 text-emerald-800'
                          : n.category === 'ACTION_ITEM'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {n.category.replace('_', ' ')}
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-400">
                      {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-gray-800 leading-relaxed whitespace-pre-wrap">{n.content}</p>
                </div>
              ))
            )}
          </div>

          {/* Note Input Composer */}
          <form onSubmit={handleAddMeetingNote} className="p-3 bg-white border border-gray-200 rounded-2xl shadow-xs space-y-3">
            <textarea
              rows={2}
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Record a shared meeting note, agreed decision, or key takeaway..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs outline-none focus:border-blue-500 focus:bg-white transition-all resize-none"
            />

            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-gray-500">Category:</span>
                <select
                  value={noteCategory}
                  onChange={(e) => setNoteCategory(e.target.value)}
                  className="bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1 text-xs font-bold text-gray-700 outline-none"
                >
                  <option value="GENERAL">General Note</option>
                  <option value="DECISION">Agreed Decision</option>
                  <option value="ACTION_ITEM">Action Item</option>
                  <option value="KEY_TAKEAWAY">Key Takeaway</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={!noteContent.trim()}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Send className="w-3.5 h-3.5" /> Post Note
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: ADD AGENDA ITEM */}
      {showAddAgendaModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-gray-200 overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <ListOrdered className="w-4 h-4 text-blue-600" />
                Add Agenda Topic Item
              </h3>
              <button onClick={() => setShowAddAgendaModal(false)} className="text-gray-400 hover:text-gray-600 font-bold text-lg">×</button>
            </div>

            <form onSubmit={handleAddAgendaItem} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-gray-700 font-bold mb-1">Topic Title *</label>
                <input
                  type="text"
                  required
                  value={newAgendaItem.title}
                  onChange={(e) => setNewAgendaItem({ ...newAgendaItem, title: e.target.value })}
                  placeholder="e.g. Q4 Cloud Architecture Alignment"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">Topic Description</label>
                <textarea
                  rows={2}
                  value={newAgendaItem.description}
                  onChange={(e) => setNewAgendaItem({ ...newAgendaItem, description: e.target.value })}
                  placeholder="Summary of what will be discussed and expected outcomes..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Presenter / Lead</label>
                  <input
                    type="text"
                    value={newAgendaItem.presenterName}
                    onChange={(e) => setNewAgendaItem({ ...newAgendaItem, presenterName: e.target.value })}
                    placeholder="e.g. Presenter Name"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Allocated Minutes</label>
                  <input
                    type="number"
                    min="1"
                    max="180"
                    value={newAgendaItem.durationMinutes}
                    onChange={(e) => setNewAgendaItem({ ...newAgendaItem, durationMinutes: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddAgendaModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl font-bold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-sm"
                >
                  Add Topic
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD PRE-READ MATERIAL */}
      {showAddPreReadModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-gray-200 overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                Add Pre-read Material
              </h3>
              <button onClick={() => setShowAddPreReadModal(false)} className="text-gray-400 hover:text-gray-600 font-bold text-lg">×</button>
            </div>

            <form onSubmit={handleSavePreRead} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-gray-700 font-bold mb-1">Material Title *</label>
                <input
                  type="text"
                  required
                  value={newPreRead.title}
                  onChange={(e) => setNewPreRead({ ...newPreRead, title: e.target.value })}
                  placeholder="e.g. Project Architecture Spec v2.pdf"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">Format / Type</label>
                <select
                  value={newPreRead.type}
                  onChange={(e) => setNewPreRead({ ...newPreRead, type: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-semibold outline-none focus:border-indigo-500"
                >
                  <option value="PDF">PDF Document</option>
                  <option value="DOCUMENT">Word / Doc</option>
                  <option value="PRESENTATION">Slide Deck (PPT)</option>
                  <option value="SPREADSHEET">Spreadsheet (Excel)</option>
                  <option value="LINK">External Web Link</option>
                  <option value="IMAGE">Diagram / Image</option>
                </select>
              </div>

              {newPreRead.type === 'LINK' ? (
                <div>
                  <label className="block text-gray-700 font-bold mb-1">External URL</label>
                  <input
                    type="url"
                    value={newPreRead.externalUrl}
                    onChange={(e) => setNewPreRead({ ...newPreRead, externalUrl: e.target.value })}
                    placeholder="https://docs.google.com/..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs outline-none focus:border-indigo-500"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Upload File Attachment</label>
                  <input
                    type="file"
                    ref={preReadFileRef}
                    onChange={handleUploadPreReadFile}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => preReadFileRef.current?.click()}
                    className="w-full py-2.5 border-2 border-dashed border-gray-300 hover:border-indigo-400 rounded-xl text-center text-gray-600 font-medium transition-colors"
                  >
                    {newPreRead.fileUrl ? '✓ File Attached (Click to change)' : 'Select file from computer'}
                  </button>
                </div>
              )}

              <div>
                <label className="block text-gray-700 font-bold mb-1">Reading Guidelines / Instructions</label>
                <textarea
                  rows={2}
                  value={newPreRead.description}
                  onChange={(e) => setNewPreRead({ ...newPreRead, description: e.target.value })}
                  placeholder="e.g. Please review sections 2 and 4 before the sync."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddPreReadModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl font-bold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-sm"
                >
                  Save Material
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
