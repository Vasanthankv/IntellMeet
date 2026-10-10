import React, { useState, useEffect } from 'react';
import { 
  X, Plus, FileText, Star, Users, Lock, Unlock, 
  ArrowRight, Search, Layout, Sparkles, Shield, Clock
} from 'lucide-react';
import axios from 'axios';

const TEMPLATES = [
  { id: 'BLANK', label: 'Blank Canvas', desc: 'Start with an empty infinite workspace' },
  { id: 'BRAINSTORMING', label: 'Brainstorming & Ideas', desc: 'Pre-populated with idea sticky notes & voting clusters' },
  { id: 'FLOWCHART', label: 'Architecture & Flowchart', desc: 'Pre-connected components with smart connectors' },
  { id: 'KANBAN', label: 'Kanban & Action Items', desc: 'To-Do, In Progress, and Completed columns' }
];

export default function WhiteboardPickerModal({
  isOpen,
  onClose,
  onOpenWhiteboard,
  currentUser = { id: 'user_host_1', name: 'Host' },
  meetingId = 'meet_101',
  isHost = true
}) {
  const [activeTab, setActiveTab] = useState('NEW'); // 'NEW' or 'EXISTING'
  const [title, setTitle] = useState(`Brainstorming - ${new Date().toLocaleDateString()}`);
  const [accessMode, setAccessMode] = useState('COLLABORATE'); // 'COLLABORATE' or 'PRESENT'
  const [selectedTemplate, setSelectedTemplate] = useState('BRAINSTORMING');

  // Existing boards
  const [existingBoards, setExistingBoards] = useState([]);
  const [boardFilter, setBoardFilter] = useState('all'); // all, my, shared, starred
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [allowParticipantCreate, setAllowParticipantCreate] = useState(true);

  useEffect(() => {
    if (isOpen && activeTab === 'EXISTING') {
      fetchBoards();
    }
  }, [isOpen, activeTab, boardFilter]);

  const fetchBoards = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/whiteboards?userId=${currentUser.id}&tab=${boardFilter}`);
      if (res.data.success) {
        setExistingBoards(res.data.whiteboards || []);
      }
    } catch (err) {
      console.error('Error fetching whiteboards:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = async () => {
    try {
      const res = await axios.post('http://localhost:5000/api/whiteboards', {
        title: title.trim() || 'Untitled Whiteboard',
        ownerId: currentUser.id,
        ownerName: currentUser.name,
        meetingId,
        accessMode
      });
      if (res.data.success) {
        onOpenWhiteboard(res.data.whiteboard);
        onClose();
      }
    } catch (err) {
      console.error('Error creating whiteboard:', err);
    }
  };

  const handleSelectExisting = (board) => {
    onOpenWhiteboard(board);
    onClose();
  };

  if (!isOpen) return null;

  const filteredBoards = existingBoards.filter(b => 
    b.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Top Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-2">
            <Layout className="w-5 h-5 text-indigo-400" />
            <h2 className="font-bold text-slate-100 text-base">Whiteboards in IntellMeet</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection (17.2, 17.3) */}
        <div className="flex border-b border-slate-800 bg-slate-950/30">
          <button
            onClick={() => setActiveTab('NEW')}
            className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center space-x-2 border-b-2 transition-all ${
              activeTab === 'NEW' 
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10' 
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>New Whiteboard</span>
          </button>
          <button
            onClick={() => setActiveTab('EXISTING')}
            className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center space-x-2 border-b-2 transition-all ${
              activeTab === 'EXISTING' 
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10' 
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Existing Whiteboards</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-5">
          {activeTab === 'NEW' ? (
            <div className="space-y-4">
              {/* Whiteboard Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Whiteboard Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Q4 Sprint Planning"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 outline-none focus:border-indigo-500"
                />
              </div>

              {/* In-Meeting Access Mode (17.3) */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Access Mode</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setAccessMode('COLLABORATE')}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      accessMode === 'COLLABORATE'
                        ? 'border-indigo-500 bg-indigo-500/10 text-slate-100 shadow-md ring-1 ring-indigo-500'
                        : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center space-x-2 font-semibold text-sm mb-1 text-indigo-400">
                      <Users className="w-4 h-4" />
                      <span>Collaborating</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Participants can edit, add sticky notes, shapes, and collaborate simultaneously.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAccessMode('PRESENT')}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      accessMode === 'PRESENT'
                        ? 'border-indigo-500 bg-indigo-500/10 text-slate-100 shadow-md ring-1 ring-indigo-500'
                        : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center space-x-2 font-semibold text-sm mb-1 text-amber-400">
                      <Lock className="w-4 h-4" />
                      <span>Presenting</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Presenter can edit; participants view only. Ideal for lectures and architecture walkthroughs.
                    </p>
                  </button>
                </div>
              </div>

              {/* Templates */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Starting Template</label>
                <div className="grid grid-cols-2 gap-2.5">
                  {TEMPLATES.map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedTemplate(t.id)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        selectedTemplate === t.id
                          ? 'border-indigo-500 bg-indigo-500/10 text-slate-100'
                          : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="font-semibold text-xs text-slate-200">{t.label}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{t.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Filter tabs & search */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs">
                  {['all', 'my', 'starred', 'shared'].map(f => (
                    <button
                      key={f}
                      onClick={() => setBoardFilter(f)}
                      className={`px-3 py-1 rounded-lg font-medium capitalize transition-colors ${
                        boardFilter === f ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
                <div className="relative flex-1 max-w-[200px]">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search boards..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-2.5 py-1 text-xs text-slate-200 outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Boards list */}
              {loading ? (
                <div className="text-center py-8 text-xs text-slate-400">Loading whiteboards...</div>
              ) : filteredBoards.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-xs">No whiteboards found in this category.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {filteredBoards.map(b => (
                    <div
                      key={b.whiteboardId}
                      className="p-3 bg-slate-800/60 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl flex items-center justify-between transition-colors cursor-pointer"
                      onClick={() => handleSelectExisting(b)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-sm">
                          WB
                        </div>
                        <div>
                          <div className="font-semibold text-xs text-slate-200 flex items-center space-x-1.5">
                            <span>{b.title}</span>
                            {b.isStarred && <Star className="w-3 h-3 text-amber-400 fill-amber-400" />}
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center space-x-2 mt-0.5">
                            <span>Created by {b.ownerName}</span>
                            <span>•</span>
                            <span className="capitalize">{b.accessMode?.toLowerCase()}</span>
                          </div>
                        </div>
                      </div>
                      <button className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-3 py-1.5 rounded-lg font-medium transition-colors">
                        Open in Meeting
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer controls */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          {/* Host setting (17.22) */}
          {isHost ? (
            <label className="flex items-center space-x-2 text-xs text-slate-400 cursor-pointer">
              <input
                type="checkbox"
                checked={allowParticipantCreate}
                onChange={(e) => setAllowParticipantCreate(e.target.checked)}
                className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Allow participants to open new whiteboards</span>
            </label>
          ) : (
            <div />
          )}

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-4 py-2 rounded-xl font-semibold transition-colors"
            >
              Cancel
            </button>
            {activeTab === 'NEW' && (
              <button
                onClick={handleCreateNew}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-5 py-2 rounded-xl font-semibold shadow-lg shadow-indigo-500/20 transition-all flex items-center space-x-1.5"
              >
                <span>Open Whiteboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
