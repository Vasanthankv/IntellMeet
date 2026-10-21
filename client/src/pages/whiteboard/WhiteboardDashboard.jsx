import React, { useState, useEffect } from 'react';
import { 
  Layout, Plus, Star, Users, Trash2, Copy, Search, 
  MoreVertical, FileText, ArrowRight, Grid, List, 
  ExternalLink, Lock, Shield, Sparkles, CheckCircle2,
  Menu, X
} from 'lucide-react';
import axios from 'axios';
import WhiteboardStudio from '../../components/whiteboard/WhiteboardStudio';
import { useAuthStore } from '../../store/authStore';

export default function WhiteboardDashboard() {
  const { user } = useAuthStore();
  const [whiteboards, setWhiteboards] = useState([]);
  const [activeTab, setActiveTab] = useState('all'); // all, my, shared, starred, trash
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  const [loading, setLoading] = useState(false);

  // Active studio state (if user opens a whiteboard)
  const [openedWhiteboardId, setOpenedWhiteboardId] = useState(null);

  // Authenticated current user
  const currentUser = { 
    id: user?.id || user?._id || 'user_guest', 
    name: user?.name || 'User' 
  };

  useEffect(() => {
    fetchWhiteboards();
  }, [activeTab]);

  const fetchWhiteboards = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${(typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1" ? "https://intellmeet-backend-rc32.onrender.com" : "http://localhost:5000")}/api/whiteboards?userId=${currentUser.id}&tab=${activeTab}`);
      if (res.data.success) {
        setWhiteboards(res.data.whiteboards || []);
      }
    } catch (err) {
      console.error('Error fetching whiteboards:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBoard = async () => {
    try {
      const res = await axios.post(`${(typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1" ? "https://intellmeet-backend-rc32.onrender.com" : "http://localhost:5000")}/api/whiteboards`, {
        title: `Brainstorming ${new Date().toLocaleDateString()}`,
        ownerId: currentUser.id,
        ownerName: currentUser.name,
        accessMode: 'COLLABORATE'
      });
      if (res.data.success) {
        setOpenedWhiteboardId(res.data.whiteboard.whiteboardId);
      }
    } catch (err) {
      console.error('Error creating board:', err);
    }
  };

  const handleDuplicate = async (boardId) => {
    try {
      const res = await axios.post(`${(typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1" ? "https://intellmeet-backend-rc32.onrender.com" : "http://localhost:5000")}/api/whiteboards/${boardId}/duplicate`, {
        userId: currentUser.id,
        userName: currentUser.name
      });
      if (res.data.success) {
        fetchWhiteboards();
      }
    } catch (err) {
      console.error('Error duplicating board:', err);
    }
  };

  const handleToggleStar = async (boardId, currentVal) => {
    try {
      await axios.put(`${(typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1" ? "https://intellmeet-backend-rc32.onrender.com" : "http://localhost:5000")}/api/whiteboards/${boardId}`, {
        isStarred: !currentVal
      });
      setWhiteboards(prev => prev.map(b => b.whiteboardId === boardId ? { ...b, isStarred: !currentVal } : b));
    } catch (err) {
      console.error('Error starring board:', err);
    }
  };

  const handleDelete = async (boardId) => {
    try {
      await axios.delete(`${(typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1" ? "https://intellmeet-backend-rc32.onrender.com" : "http://localhost:5000")}/api/whiteboards/${boardId}`);
      fetchWhiteboards();
    } catch (err) {
      console.error('Error deleting board:', err);
    }
  };

  // If studio is open, render WhiteboardStudio full-screen
  if (openedWhiteboardId) {
    return (
      <div className="w-screen h-screen">
        <WhiteboardStudio
          whiteboardId={openedWhiteboardId}
          currentUser={currentUser}
          onClose={() => {
            setOpenedWhiteboardId(null);
            fetchWhiteboards();
          }}
          isHost={true}
        />
      </div>
    );
  }

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const filtered = whiteboards.filter(b => 
    b.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sidebarContent = (
    <div className="flex flex-col justify-between h-full p-4">
      <div className="space-y-6">
        {/* Logo / Header */}
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/30">
              IM
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-tight text-slate-100">IntellMeet</h1>
              <span className="text-[11px] text-slate-400">Whiteboard Hub</span>
            </div>
          </div>
          <button 
            onClick={() => setMobileSidebarOpen(false)}
            className="md:hidden text-slate-400 hover:text-white p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* New Whiteboard Button */}
        <button
          onClick={() => {
            setMobileSidebarOpen(false);
            handleCreateBoard();
          }}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 px-4 rounded-xl shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center space-x-2 text-xs"
        >
          <Plus className="w-4 h-4" />
          <span>New Whiteboard</span>
        </button>

        {/* Navigation Tabs (17.12) */}
        <nav className="space-y-1">
          {[
            { id: 'all', label: 'All Whiteboards', icon: Layout },
            { id: 'my', label: 'My Whiteboards', icon: FileText },
            { id: 'shared', label: 'Shared with Me', icon: Users },
            { id: 'starred', label: 'Starred', icon: Star },
            { id: 'trash', label: 'Trash', icon: Trash2 }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  isActive 
                    ? 'bg-indigo-600/20 text-indigo-400 font-semibold border border-indigo-500/30' 
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Status */}
      <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1 mt-6">
        <div className="flex items-center space-x-1.5 text-slate-300 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Cloud & Local Sync</span>
        </div>
        <p className="text-[10px] leading-tight text-slate-500">
          Backed by MongoDB persistence. Whiteboards persist after meetings end.
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row font-sans">
      {/* 1. DESKTOP LEFT SIDEBAR */}
      <aside className="hidden md:flex w-64 border-r border-slate-800 bg-slate-900/60 flex-col shrink-0">
        {sidebarContent}
      </aside>

      {/* MOBILE HEADER BAR */}
      <div className="md:hidden flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800">
        <button
          onClick={() => setMobileSidebarOpen(true)}
          className="flex items-center gap-2 text-slate-300 hover:text-white"
        >
          <Menu className="w-5 h-5 text-indigo-400" />
          <span className="font-bold text-sm">Whiteboard Hub</span>
        </button>
        <button
          onClick={handleCreateBoard}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-1.5 px-3 rounded-lg text-xs flex items-center gap-1 shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New</span>
        </button>
      </div>

      {/* MOBILE DRAWER */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileSidebarOpen(false)} />
          <div className="relative w-64 max-w-[80vw] bg-slate-900 h-full z-10 shadow-2xl border-r border-slate-800 overflow-y-auto">
            {sidebarContent}
          </div>
        </div>
      )}

      {/* 2. MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col p-4 sm:p-6 md:p-8 overflow-y-auto">
        {/* Top bar with Search & View Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight capitalize text-slate-100">
              {activeTab === 'all' ? 'All Whiteboards' : `${activeTab} Whiteboards`}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Brainstorm, draw, add sticky notes, and connect diagrams.
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            {/* Search */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search whiteboards..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 outline-none focus:border-indigo-500"
              />
            </div>

            {/* Grid / List View Toggle */}
            <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 shrink-0">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Boards Grid / List */}
        <div className="mt-6 flex-1">
          {loading ? (
            <div className="text-center py-20 text-slate-400 text-sm">Loading whiteboards...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-24 bg-slate-900/30 rounded-2xl border border-dashed border-slate-800 max-w-lg mx-auto">
              <FileText className="w-12 h-12 mx-auto text-slate-600 mb-3" />
              <h3 className="font-semibold text-slate-300 text-sm">No whiteboards found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                Create a digital canvas to brainstorm ideas, draw workflows, and organize sticky notes.
              </p>
              <button
                onClick={handleCreateBoard}
                className="mt-4 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow transition-all inline-flex items-center space-x-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Board</span>
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map(b => (
                <div
                  key={b.whiteboardId}
                  className="bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-4 shadow-lg flex flex-col justify-between group transition-all"
                >
                  <div>
                    {/* Thumbnail placeholder */}
                    <div 
                      onClick={() => setOpenedWhiteboardId(b.whiteboardId)}
                      className="h-32 bg-slate-950 rounded-xl border border-slate-800/80 mb-3 flex items-center justify-center cursor-pointer group-hover:border-indigo-500/30 transition-all relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-radial-gradient opacity-10" />
                      <div className="text-center">
                        <Layout className="w-8 h-8 text-indigo-400 mx-auto mb-1 opacity-70 group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] text-slate-500">Open Studio</span>
                      </div>
                    </div>

                    {/* Title & Star */}
                    <div className="flex items-start justify-between">
                      <h4 
                        onClick={() => setOpenedWhiteboardId(b.whiteboardId)}
                        className="font-semibold text-sm text-slate-200 hover:text-indigo-400 cursor-pointer truncate max-w-[180px]"
                      >
                        {b.title}
                      </h4>
                      <button
                        onClick={() => handleToggleStar(b.whiteboardId, b.isStarred)}
                        className={`p-1 rounded ${b.isStarred ? 'text-amber-400' : 'text-slate-500 hover:text-slate-300'}`}
                      >
                        <Star className={`w-4 h-4 ${b.isStarred ? 'fill-amber-400' : ''}`} />
                      </button>
                    </div>

                    <div className="text-[11px] text-slate-400 mt-1 flex items-center space-x-2">
                      <span>Owner: {b.ownerName || 'Host'}</span>
                      <span>•</span>
                      <span className="capitalize">{b.accessMode?.toLowerCase()}</span>
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="pt-3 border-t border-slate-800/80 mt-4 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500">
                      {new Date(b.updatedAt).toLocaleDateString()}
                    </span>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleDuplicate(b.whiteboardId)}
                        className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                        title="Duplicate Whiteboard (17.13)"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(b.whiteboardId)}
                        className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-500/20 hover:text-rose-400"
                        title="Move to Trash"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-800">
              {filtered.map(b => (
                <div
                  key={b.whiteboardId}
                  className="p-4 flex items-center justify-between hover:bg-slate-850/50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => handleToggleStar(b.whiteboardId, b.isStarred)}
                      className={`p-1 rounded ${b.isStarred ? 'text-amber-400' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      <Star className={`w-4 h-4 ${b.isStarred ? 'fill-amber-400' : ''}`} />
                    </button>
                    <div>
                      <h4
                        onClick={() => setOpenedWhiteboardId(b.whiteboardId)}
                        className="font-semibold text-sm text-slate-200 hover:text-indigo-400 cursor-pointer"
                      >
                        {b.title}
                      </h4>
                      <div className="text-[11px] text-slate-400 flex items-center space-x-2 mt-0.5">
                        <span>Owner: {b.ownerName}</span>
                        <span>•</span>
                        <span>Mode: {b.accessMode}</span>
                        <span>•</span>
                        <span>Pages: {b.pages?.length || 1}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleDuplicate(b.whiteboardId)}
                      className="p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                      title="Duplicate"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(b.whiteboardId)}
                      className="p-2 rounded-lg text-slate-400 hover:bg-rose-500/20 hover:text-rose-400"
                      title="Move to Trash"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setOpenedWhiteboardId(b.whiteboardId)}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-3 py-1.5 rounded-lg font-medium transition-colors"
                    >
                      Open Studio
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
