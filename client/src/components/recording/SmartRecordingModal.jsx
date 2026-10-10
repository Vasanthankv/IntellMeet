import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Pause, Clock, Sparkles, Scissors, ListTodo, BarChart2, Tag, 
  Settings, Share2, Download, Check, Copy, Plus, Trash2, Edit2, 
  RefreshCw, X, ChevronRight, Volume2, VolumeX, Maximize, Bookmark, 
  FileText, CheckSquare, Square, User, ExternalLink, FolderPlus, Layers
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function SmartRecordingModal({
  isOpen,
  onClose,
  recording,
  onOpenShare
}) {
  const [activeTab, setActiveTab] = useState('chapters'); // 'chapters' | 'highlights' | 'next-steps' | 'analytics' | 'topics' | 'settings' | 'playlists'
  const [smartRec, setSmartRec] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isProcessingAI, setIsProcessingAI] = useState(false);

  // Video playback
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(1);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  // Editing state
  const [editingChapterId, setEditingChapterId] = useState(null);
  const [chapterTitle, setChapterTitle] = useState('');
  const [chapterSummary, setChapterSummary] = useState('');

  // Split chapter modal
  const [splitChapterModal, setSplitChapterModal] = useState(null);
  const [splitTimestamp, setSplitTimestamp] = useState(0);
  const [splitNewTitle, setSplitNewTitle] = useState('');

  // Add highlight modal
  const [showAddHighlight, setShowAddHighlight] = useState(false);
  const [hlTitle, setHlTitle] = useState('');
  const [hlDesc, setHlDesc] = useState('');
  const [hlStart, setHlStart] = useState(0);
  const [hlEnd, setHlEnd] = useState(30);

  // Add next step modal
  const [showAddNextStep, setShowAddNextStep] = useState(false);
  const [nsTask, setNsTask] = useState('');
  const [nsAssignee, setNsAssignee] = useState('');
  const [nsDue, setNsDue] = useState('Friday');

  // Playlists
  const [userPlaylists, setUserPlaylists] = useState([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState('');
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isSmartPlaylist, setIsSmartPlaylist] = useState(false);
  const [smartTopicFilter, setSmartTopicFilter] = useState('');

  const formatSecs = (s) => {
    const mins = Math.floor((s || 0) / 60);
    const secs = Math.floor((s || 0) % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const fetchSmartRecording = async () => {
    if (!recording?.recordingId) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/recordings/${recording.recordingId}/smart`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.success && data.smartRecording) {
        setSmartRec(data.smartRecording);
      }
    } catch (e) {
      console.error('Error fetching smart recording:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlaylists = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/recordings/playlists/all', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.success && data.playlists) {
        setUserPlaylists(data.playlists);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (isOpen && recording?.recordingId) {
      fetchSmartRecording();
      fetchPlaylists();
    }
  }, [isOpen, recording]);

  // Video player controls
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
    setDuration(videoRef.current.duration || recording?.duration || 360);
  };

  const seekTo = (seconds) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(0, Math.min(seconds, duration));
    setCurrentTime(videoRef.current.currentTime);
    if (!isPlaying) {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const changeSpeed = (speed) => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = speed;
    setPlaybackSpeed(speed);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  // 1. Generate Smart Recording with AI (28.15)
  const handleGenerateAI = async () => {
    if (!recording?.recordingId) return;
    setIsProcessingAI(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/recordings/${recording.recordingId}/smart/generate`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.success && data.smartRecording) {
        setSmartRec(data.smartRecording);
        toast.success('Smart Recording processed with AI highlights & chapters!');
      } else {
        toast.error(data.message || 'AI Processing failed');
      }
    } catch (e) {
      toast.error('Failed to run Smart Recording AI analysis');
    } finally {
      setIsProcessingAI(false);
    }
  };

  // 2. Highlights Actions (28.4)
  const handleSaveClip = async (hl) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/recordings/${recording.recordingId}/smart/highlights/clip`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          highlightId: hl.highlightId,
          title: hl.title,
          startTime: hl.startTime,
          endTime: hl.endTime
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Highlight "${hl.title}" saved as clip!`);
        fetchSmartRecording();
      }
    } catch (e) {
      toast.error('Could not save clip');
    }
  };

  const handleAddHighlight = async (e) => {
    e.preventDefault();
    if (!hlTitle.trim()) return;
    const newHL = {
      title: hlTitle.trim(),
      description: hlDesc.trim(),
      startTime: Number(hlStart),
      endTime: Number(hlEnd),
      source: 'MANUAL'
    };
    const updated = [...(smartRec.highlights || []), newHL];
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:5000/api/recordings/${recording.recordingId}/smart/highlights`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ highlights: updated })
      });
      setSmartRec(prev => ({ ...prev, highlights: updated }));
      setShowAddHighlight(false);
      setHlTitle('');
      setHlDesc('');
      toast.success('Highlight added');
    } catch (e) {
      toast.error('Failed to add highlight');
    }
  };

  const handleDeleteHighlight = async (id) => {
    const updated = smartRec.highlights.filter(h => h.highlightId !== id);
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:5000/api/recordings/${recording.recordingId}/smart/highlights`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ highlights: updated })
      });
      setSmartRec(prev => ({ ...prev, highlights: updated }));
      toast.success('Highlight removed');
    } catch (e) {
      toast.error('Failed to delete highlight');
    }
  };

  // 3. Chapters Actions (28.5, 28.6)
  const handleSaveChapterEdit = async (chId) => {
    const updated = smartRec.chapters.map(c => 
      c.chapterId === chId ? { ...c, title: chapterTitle, summary: chapterSummary } : c
    );
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:5000/api/recordings/${recording.recordingId}/smart/chapters`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ chapters: updated })
      });
      setSmartRec(prev => ({ ...prev, chapters: updated }));
      setEditingChapterId(null);
      toast.success('Chapter updated');
    } catch (e) {
      toast.error('Failed to update chapter');
    }
  };

  const handleSplitChapter = async (e) => {
    e.preventDefault();
    if (!splitChapterModal) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/recordings/${recording.recordingId}/smart/chapters/split`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          chapterId: splitChapterModal.chapterId,
          splitTime: Number(splitTimestamp),
          newTitle2: splitNewTitle || `${splitChapterModal.title} (Part 2)`
        })
      });
      const data = await res.json();
      if (data.success) {
        setSmartRec(prev => ({ ...prev, chapters: data.chapters }));
        setSplitChapterModal(null);
        toast.success('Chapter split into two sections');
      }
    } catch (e) {
      toast.error('Failed to split chapter');
    }
  };

  const handleDeleteChapter = async (chId) => {
    const updated = smartRec.chapters.filter(c => c.chapterId !== chId);
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:5000/api/recordings/${recording.recordingId}/smart/chapters`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ chapters: updated })
      });
      setSmartRec(prev => ({ ...prev, chapters: updated }));
      toast.success('Chapter deleted');
    } catch (e) {
      toast.error('Failed to delete chapter');
    }
  };

  // 4. Next Steps Actions (28.7)
  const handleToggleNextStep = async (stepId) => {
    const updated = smartRec.nextSteps.map(s => 
      s.nextStepId === stepId ? { ...s, status: s.status === 'COMPLETED' ? 'OPEN' : 'COMPLETED' } : s
    );
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:5000/api/recordings/${recording.recordingId}/smart/next-steps`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ nextSteps: updated })
      });
      setSmartRec(prev => ({ ...prev, nextSteps: updated }));
    } catch (e) {
      toast.error('Failed to update next step');
    }
  };

  const handleAddNextStep = async (e) => {
    e.preventDefault();
    if (!nsTask.trim()) return;
    const newStep = {
      task: nsTask.trim(),
      assignedTo: nsAssignee.trim() || 'Team Member',
      dueDate: nsDue.trim() || 'Next Sprint',
      status: 'OPEN'
    };
    const updated = [...(smartRec.nextSteps || []), newStep];
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:5000/api/recordings/${recording.recordingId}/smart/next-steps`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ nextSteps: updated })
      });
      setSmartRec(prev => ({ ...prev, nextSteps: updated }));
      setShowAddNextStep(false);
      setNsTask('');
      setNsAssignee('');
      toast.success('Next step added');
    } catch (e) {
      toast.error('Failed to add next step');
    }
  };

  const copyNextSteps = () => {
    if (!smartRec?.nextSteps?.length) return;
    const text = smartRec.nextSteps.map((s, i) => `${i + 1}. [${s.status}] ${s.task} (Owner: ${s.assignedTo}, Due: ${s.dueDate})`).join('\n');
    navigator.clipboard.writeText(text);
    toast.success('Next steps copied to clipboard!');
  };

  // 5. Playlists (28.10)
  const handleAddToPlaylist = async (playlistId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/recordings/playlists/${playlistId}/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ recordingId: recording.recordingId })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Added to playlist!');
        fetchPlaylists();
      }
    } catch (e) {
      toast.error('Failed to add to playlist');
    }
  };

  const handleCreatePlaylist = async (e) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/recordings/playlists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          name: newPlaylistName.trim(),
          isSmart: isSmartPlaylist,
          smartFilter: isSmartPlaylist ? { topic: smartTopicFilter.trim() } : {},
          recordingIds: [recording.recordingId]
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Playlist "${newPlaylistName}" created!`);
        setNewPlaylistName('');
        setSmartTopicFilter('');
        fetchPlaylists();
      }
    } catch (e) {
      toast.error('Could not create playlist');
    }
  };

  if (!isOpen || !recording) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#141414] border border-[#2D2D2D] rounded-3xl w-full max-w-6xl text-gray-200 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#1A1A1A]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-sm truncate max-w-md">
                  {recording.meetingTitle}
                </h3>
                <span className="text-[10px] font-bold uppercase bg-purple-950/80 text-purple-300 border border-purple-800 px-2 py-0.5 rounded-full">
                  Smart Recording with AI
                </span>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                  smartRec?.status === 'READY' ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800' : 'bg-amber-950/80 text-amber-400 border-amber-800'
                }`}>
                  {smartRec?.status || 'IDLE'}
                </span>
              </div>
              <p className="text-[11px] text-gray-400">
                Highlights, smart chapters, next steps, and conversation analytics (Zoom AI)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleGenerateAI}
              disabled={isProcessingAI}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all disabled:opacity-40"
            >
              {isProcessingAI ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              {smartRec?.status === 'READY' ? 'Re-analyze' : 'Generate with AI'}
            </button>

            {onOpenShare && (
              <button
                onClick={() => onOpenShare(recording)}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors"
              >
                <Share2 className="w-3.5 h-3.5" /> Share
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Left Video Player, Right Smart Tabs */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-hidden">
          
          {/* Left Column: Smart Video Player (28.1, 28.4, 28.5) */}
          <div className="lg:col-span-7 bg-black flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-white/10">
            {/* Video Element */}
            <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
              <video
                ref={videoRef}
                src={recording.fileUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleTimeUpdate}
                className="w-full h-full object-contain cursor-pointer"
                onClick={togglePlay}
              />

              {/* Big Center Play Overlay */}
              {!isPlaying && (
                <div 
                  onClick={togglePlay}
                  className="absolute inset-0 flex items-center justify-center bg-black/40 cursor-pointer"
                >
                  <div className="w-16 h-16 rounded-full bg-purple-600/90 text-white flex items-center justify-center shadow-2xl hover:scale-105 transition-transform">
                    <Play className="w-7 h-7 fill-current translate-x-0.5" />
                  </div>
                </div>
              )}
            </div>

            {/* Smart Timeline Bar with Chapter & Highlight Markers (28.4, 28.5) */}
            <div className="p-4 bg-[#181818] space-y-3">
              <div className="relative group">
                {/* Timeline Track */}
                <input
                  type="range"
                  min="0"
                  max={duration || 360}
                  value={currentTime}
                  onChange={(e) => seekTo(Number(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />

                {/* Chapter & Highlight Markers on timeline */}
                <div className="absolute top-0 left-0 right-0 h-2 pointer-events-none flex items-center">
                  {smartRec?.chapters?.map((ch, idx) => {
                    const pct = Math.min(100, Math.max(0, (ch.startTime / (duration || 360)) * 100));
                    return (
                      <div 
                        key={idx}
                        style={{ left: `${pct}%` }}
                        className="absolute w-1 h-3 bg-indigo-400 rounded-sm -translate-y-0.5 shadow-sm"
                        title={`Chapter: ${ch.title} (${formatSecs(ch.startTime)})`}
                      />
                    );
                  })}
                  {smartRec?.highlights?.map((hl, idx) => {
                    const pct = Math.min(100, Math.max(0, (hl.startTime / (duration || 360)) * 100));
                    return (
                      <div 
                        key={idx}
                        style={{ left: `${pct}%` }}
                        className="absolute w-1.5 h-3.5 bg-amber-400 rounded-sm -translate-y-1 shadow-sm"
                        title={`Highlight: ${hl.title} (${formatSecs(hl.startTime)})`}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Player Controls Bar */}
              <div className="flex items-center justify-between text-xs text-gray-300">
                <div className="flex items-center gap-3">
                  <button onClick={togglePlay} className="p-1 hover:text-white transition-colors">
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                  </button>
                  <button onClick={toggleMute} className="p-1 hover:text-white transition-colors">
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                  <span className="font-mono text-[11px] text-gray-400">
                    {formatSecs(currentTime)} / {formatSecs(duration)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-[#222] px-2 py-0.5 rounded-lg border border-white/5">
                    {[1, 1.25, 1.5, 2].map(speed => (
                      <button
                        key={speed}
                        onClick={() => changeSpeed(speed)}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          playbackSpeed === speed ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        {speed}x
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => {
                      if (videoRef.current?.requestFullscreen) videoRef.current.requestFullscreen();
                    }}
                    className="p-1 hover:text-white"
                  >
                    <Maximize className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Smart Recording AI Hub (28.4 - 28.12) */}
          <div className="lg:col-span-5 bg-[#171717] flex flex-col h-full overflow-hidden">
            
            {/* Sub-Tab Navigation Bar */}
            <div className="flex items-center border-b border-white/10 px-3 bg-[#1C1C1C] overflow-x-auto scrollbar-none">
              {[
                { id: 'chapters', label: 'Smart Chapters', icon: Clock, count: smartRec?.chapters?.length },
                { id: 'highlights', label: 'Highlights', icon: Bookmark, count: smartRec?.highlights?.length },
                { id: 'next-steps', label: 'Next Steps', icon: ListTodo, count: smartRec?.nextSteps?.length },
                { id: 'analytics', label: 'Analytics', icon: BarChart2 },
                { id: 'topics', label: 'Topics', icon: Tag, count: smartRec?.topics?.length },
                { id: 'playlists', label: 'Playlists', icon: Layers },
                { id: 'settings', label: 'Settings', icon: Settings }
              ].map(t => {
                const Icon = t.icon;
                const isAct = activeTab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id)}
                    className={`py-3 px-2.5 text-xs font-semibold border-b-2 flex items-center gap-1.5 shrink-0 transition-colors ${
                      isAct 
                        ? 'border-purple-500 text-purple-400' 
                        : 'border-transparent text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{t.label}</span>
                    {t.count !== undefined && (
                      <span className="text-[10px] px-1 rounded-full bg-white/10 text-gray-300">
                        {t.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Sub-Tab Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              
              {/* ── 1. SMART CHAPTERS (28.5, 28.6) ── */}
              {activeTab === 'chapters' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>Divided into {smartRec?.chapters?.length || 0} chapters</span>
                    <span className="text-[11px] text-purple-400">Click chapter to jump to timestamp</span>
                  </div>

                  {smartRec?.chapters?.map((ch, idx) => (
                    <div 
                      key={ch.chapterId || idx}
                      className="p-3.5 rounded-2xl bg-[#222] border border-white/5 hover:border-purple-500/40 transition-colors group space-y-2"
                    >
                      {editingChapterId === ch.chapterId ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={chapterTitle}
                            onChange={(e) => setChapterTitle(e.target.value)}
                            className="w-full bg-[#181818] border border-purple-500 rounded-lg p-2 text-xs text-white"
                          />
                          <textarea
                            value={chapterSummary}
                            onChange={(e) => setChapterSummary(e.target.value)}
                            rows={2}
                            className="w-full bg-[#181818] border border-gray-700 rounded-lg p-2 text-xs text-gray-200"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setEditingChapterId(null)}
                              className="px-2.5 py-1 text-xs text-gray-400 hover:text-white"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleSaveChapterEdit(ch.chapterId)}
                              className="px-3 py-1 bg-purple-600 text-white rounded-lg text-xs font-bold"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start justify-between gap-2">
                            <div 
                              onClick={() => seekTo(ch.startTime)}
                              className="cursor-pointer flex-1"
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-mono text-[10px] font-bold text-indigo-400 bg-indigo-950/80 px-2 py-0.5 rounded-md border border-indigo-800">
                                  {formatSecs(ch.startTime)} — {formatSecs(ch.endTime)}
                                </span>
                                <h4 className="font-bold text-xs text-white group-hover:text-purple-300 transition-colors">
                                  {ch.title}
                                </h4>
                              </div>
                              <p className="text-[11px] text-gray-400 leading-relaxed">
                                {ch.summary}
                              </p>
                            </div>

                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => {
                                  setEditingChapterId(ch.chapterId);
                                  setChapterTitle(ch.title);
                                  setChapterSummary(ch.summary);
                                }}
                                className="p-1 text-gray-400 hover:text-white"
                                title="Edit Chapter"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  setSplitChapterModal(ch);
                                  setSplitTimestamp(Math.floor((ch.startTime + ch.endTime) / 2));
                                  setSplitNewTitle(`${ch.title} (Part 2)`);
                                }}
                                className="p-1 text-gray-400 hover:text-purple-400"
                                title="Split Chapter"
                              >
                                <Scissors className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteChapter(ch.chapterId)}
                                className="p-1 text-gray-400 hover:text-red-400"
                                title="Delete Chapter"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* ── 2. RECORDING HIGHLIGHTS (28.4) ── */}
              {activeTab === 'highlights' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>Key moments identified by AI</span>
                    <button
                      onClick={() => setShowAddHighlight(true)}
                      className="text-purple-400 hover:text-purple-300 font-bold text-xs flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Moment
                    </button>
                  </div>

                  {smartRec?.highlights?.map((hl, idx) => (
                    <div 
                      key={hl.highlightId || idx}
                      className="p-3.5 rounded-2xl bg-[#222] border border-white/5 hover:border-amber-500/40 transition-colors group space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div 
                          onClick={() => seekTo(hl.startTime)}
                          className="cursor-pointer flex-1"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-[10px] font-bold text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded-md border border-amber-800">
                              {formatSecs(hl.startTime)}
                            </span>
                            <h4 className="font-bold text-xs text-white group-hover:text-amber-300 transition-colors">
                              {hl.title}
                            </h4>
                          </div>
                          {hl.description && (
                            <p className="text-[11px] text-gray-400 leading-relaxed">
                              {hl.description}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleSaveClip(hl)}
                            className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors"
                            title="Save as separate video clip"
                          >
                            <Scissors className="w-3 h-3" /> Save Clip
                          </button>
                          <button
                            onClick={() => handleDeleteHighlight(hl.highlightId)}
                            className="p-1 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── 3. NEXT STEPS (28.7) ── */}
              {activeTab === 'next-steps' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>Actions to complete after meeting</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={copyNextSteps}
                        className="text-gray-400 hover:text-white flex items-center gap-1 text-[11px]"
                      >
                        <Copy className="w-3 h-3" /> Copy
                      </button>
                      <button
                        onClick={() => setShowAddNextStep(true)}
                        className="text-purple-400 hover:text-purple-300 font-bold text-xs flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Task
                      </button>
                    </div>
                  </div>

                  {smartRec?.nextSteps?.map((step, idx) => (
                    <div 
                      key={step.nextStepId || idx}
                      className="p-3 rounded-2xl bg-[#222] border border-white/5 flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="flex items-start gap-2.5">
                        <button
                          onClick={() => handleToggleNextStep(step.nextStepId)}
                          className="mt-0.5 text-purple-400 hover:text-purple-300"
                        >
                          {step.status === 'COMPLETED' ? (
                            <CheckSquare className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Square className="w-4 h-4 text-gray-500" />
                          )}
                        </button>
                        <div>
                          <p className={`font-medium ${step.status === 'COMPLETED' ? 'line-through text-gray-500' : 'text-gray-200'}`}>
                            {step.task}
                          </p>
                          <div className="flex items-center gap-3 text-[10px] text-gray-400 mt-1">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" /> {step.assignedTo}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" /> Due: {step.dueDate}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── 4. CONVERSATION ANALYTICS (28.8) ── */}
              {activeTab === 'analytics' && smartRec?.analytics && (
                <div className="space-y-4">
                  {/* Talk Speed & Talk/Listen */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 bg-[#222] rounded-2xl border border-white/5 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Avg Talk Speed</span>
                      <div className="text-xl font-bold text-white font-mono">
                        {smartRec.analytics.talkSpeed?.wpmAverage || 135} <span className="text-xs font-normal text-gray-400">WPM</span>
                      </div>
                      <span className="text-[10px] text-emerald-400">Optimal engagement cadence</span>
                    </div>

                    <div className="p-3.5 bg-[#222] rounded-2xl border border-white/5 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Patience Score</span>
                      <div className="text-xl font-bold text-purple-400 font-mono">
                        {smartRec.analytics.patience?.score || 91}/100
                      </div>
                      <span className="text-[10px] text-gray-400">{smartRec.analytics.patience?.interruptionCount || 1} interruption detected</span>
                    </div>
                  </div>

                  {/* Talk / Listen Ratio Per Speaker */}
                  <div className="p-4 bg-[#222] rounded-2xl border border-white/5 space-y-3">
                    <span className="text-xs font-bold text-white block">Talk-Listen Ratio</span>
                    {smartRec.analytics.talkListenRatio?.map((spk, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="font-semibold text-gray-300">{spk.speakerName}</span>
                          <span className="text-purple-400 font-mono">{spk.talkPercentage}% talk ({formatSecs(spk.talkTimeSeconds)})</span>
                        </div>
                        <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden flex">
                          <div style={{ width: `${spk.talkPercentage}%` }} className="bg-purple-600 h-full" />
                          <div style={{ width: `${spk.listenPercentage}%` }} className="bg-gray-700 h-full" />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Longest Monologue */}
                  {smartRec.analytics.longestMonologue && (
                    <div className="p-4 bg-[#222] rounded-2xl border border-white/5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">Longest Monologue</span>
                        <span className="font-mono text-amber-400 text-xs font-bold">
                          {smartRec.analytics.longestMonologue.durationSeconds}s
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400 italic">
                        "{smartRec.analytics.longestMonologue.textSnippet}"
                      </p>
                      <span className="text-[10px] text-gray-500 block">
                        Speaker: {smartRec.analytics.longestMonologue.speakerName}
                      </span>
                    </div>
                  )}

                  {/* Filler Words */}
                  {smartRec.analytics.fillerWords && (
                    <div className="p-4 bg-[#222] rounded-2xl border border-white/5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">Filler-Word Usage</span>
                        <span className="font-mono text-purple-400 text-xs font-bold">
                          {smartRec.analytics.fillerWords.totalCount} detected
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        {smartRec.analytics.fillerWords.perSpeaker?.map((ps, i) => (
                          <div key={i} className="p-2 bg-[#181818] rounded-xl">
                            <span className="font-bold text-gray-300 block">{ps.speakerName}</span>
                            <span className="text-gray-400">{ps.count} words (um, uh, like)</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── 5. TOPIC TRACKING (28.9) ── */}
              {activeTab === 'topics' && (
                <div className="space-y-3">
                  <span className="text-xs text-gray-400 block">Identified discussion topics & keywords</span>
                  {smartRec?.topics?.map((top, idx) => (
                    <div 
                      key={top.topicId || idx}
                      onClick={() => seekTo(top.startTime)}
                      className="p-3.5 rounded-2xl bg-[#222] border border-white/5 hover:border-purple-500/40 cursor-pointer transition-colors space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-xs text-white">{top.topicName}</h4>
                        <span className="font-mono text-[10px] text-purple-400 bg-purple-950/80 px-2 py-0.5 rounded-md border border-purple-800">
                          {formatSecs(top.startTime)}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {top.keywords?.map((k, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-md bg-[#181818] text-[10px] text-gray-300 border border-white/5">
                            #{k}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── 6. PLAYLISTS (28.10) ── */}
              {activeTab === 'playlists' && (
                <div className="space-y-4">
                  <div className="p-3.5 bg-[#222] rounded-2xl border border-white/5 space-y-3">
                    <span className="text-xs font-bold text-white block">Add to Existing Playlist</span>
                    <div className="space-y-2">
                      {userPlaylists.map(pl => (
                        <div key={pl.playlistId} className="flex items-center justify-between p-2 rounded-xl bg-[#181818] text-xs">
                          <div>
                            <span className="font-bold text-gray-200 block">{pl.name}</span>
                            <span className="text-[10px] text-gray-400">
                              {pl.isSmart ? `⚡ Smart Playlist (Topic: ${pl.smartFilter?.topic})` : `${pl.recordingIds?.length || 0} recordings`}
                            </span>
                          </div>
                          <button
                            onClick={() => handleAddToPlaylist(pl.playlistId)}
                            className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-[10px] font-bold"
                          >
                            Add
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Create New Playlist Form */}
                  <form onSubmit={handleCreatePlaylist} className="p-3.5 bg-[#222] rounded-2xl border border-white/5 space-y-3">
                    <span className="text-xs font-bold text-white block">Create New Playlist</span>
                    <input
                      type="text"
                      value={newPlaylistName}
                      onChange={(e) => setNewPlaylistName(e.target.value)}
                      placeholder="Playlist Name (e.g. Sprint Demos)"
                      className="w-full bg-[#181818] border border-gray-700 rounded-xl px-3 py-2 text-xs text-white"
                    />

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="isSmart"
                        checked={isSmartPlaylist}
                        onChange={(e) => setIsSmartPlaylist(e.target.checked)}
                        className="accent-purple-600"
                      />
                      <label htmlFor="isSmart" className="text-xs text-gray-300">
                        Enable AI Smart Playlist (Auto-collect by Topic)
                      </label>
                    </div>

                    {isSmartPlaylist && (
                      <input
                        type="text"
                        value={smartTopicFilter}
                        onChange={(e) => setSmartTopicFilter(e.target.value)}
                        placeholder="Topic filter (e.g. Deployment, Testing)"
                        className="w-full bg-[#181818] border border-gray-700 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    )}

                    <button
                      type="submit"
                      disabled={!newPlaylistName.trim()}
                      className="w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-xl text-xs disabled:opacity-40"
                    >
                      Create & Add Recording
                    </button>
                  </form>
                </div>
              )}

              {/* ── 7. SETTINGS (28.3) ── */}
              {activeTab === 'settings' && smartRec?.settings && (
                <div className="space-y-3 p-2">
                  <span className="text-xs font-bold text-white block mb-2">Smart Recording with AI Settings</span>
                  
                  {[
                    { key: 'enabled', label: 'Smart Recording with AI', desc: 'Enable AI synthesis for cloud recordings' },
                    { key: 'createHighlights', label: 'Recording Highlights', desc: 'Automatically extract key moments and clip markers' },
                    { key: 'createChapters', label: 'Summary and Smart Chapters', desc: 'Divide recording into chapters with concise summaries' },
                    { key: 'createNextSteps', label: 'Next Steps', desc: 'Identify follow-up deliverables and action items' },
                    { key: 'createAnalytics', label: 'Conversation Analytics', desc: 'Compute talk speed, monologue length, and patience' }
                  ].map(s => (
                    <div key={s.key} className="flex items-center justify-between p-3 bg-[#222] rounded-xl border border-white/5">
                      <div>
                        <span className="font-bold text-xs text-white block">{s.label}</span>
                        <span className="text-[10px] text-gray-400">{s.desc}</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={smartRec.settings[s.key]}
                        onChange={async (e) => {
                          const newSettings = { ...smartRec.settings, [s.key]: e.target.checked };
                          setSmartRec(prev => ({ ...prev, settings: newSettings }));
                          const token = localStorage.getItem('token');
                          await fetch(`http://localhost:5000/api/recordings/${recording.recordingId}/smart/settings`, {
                            method: 'PUT',
                            headers: {
                              'Content-Type': 'application/json',
                              ...(token ? { Authorization: `Bearer ${token}` } : {})
                            },
                            body: JSON.stringify({ settings: newSettings })
                          });
                          toast.success('Settings updated');
                        }}
                        className="accent-purple-600 w-4 h-4 cursor-pointer"
                      />
                    </div>
                  ))}
                </div>
              )}

            </div>
          </div>
        </div>

        {/* ── Split Chapter Modal ── */}
        {splitChapterModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#242424] border border-[#444] rounded-2xl p-5 max-w-sm w-full space-y-4 text-xs">
              <h4 className="font-bold text-sm text-white">Split Chapter: {splitChapterModal.title}</h4>
              <form onSubmit={handleSplitChapter} className="space-y-3">
                <div>
                  <label className="text-gray-400 block mb-1">Split Timestamp (Seconds)</label>
                  <input
                    type="number"
                    value={splitTimestamp}
                    onChange={(e) => setSplitTimestamp(e.target.value)}
                    className="w-full bg-[#181818] border border-gray-700 rounded-xl p-2 text-white"
                  />
                  <span className="text-[10px] text-gray-500">Time: {formatSecs(splitTimestamp)}</span>
                </div>
                <div>
                  <label className="text-gray-400 block mb-1">Title for Second Chapter</label>
                  <input
                    type="text"
                    value={splitNewTitle}
                    onChange={(e) => setSplitNewTitle(e.target.value)}
                    className="w-full bg-[#181818] border border-gray-700 rounded-xl p-2 text-white"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSplitChapterModal(null)}
                    className="px-3 py-1.5 border border-gray-700 rounded-xl text-gray-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl"
                  >
                    Split
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── Add Highlight Modal ── */}
        {showAddHighlight && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#242424] border border-[#444] rounded-2xl p-5 max-w-sm w-full space-y-4 text-xs">
              <h4 className="font-bold text-sm text-white">Add Important Moment</h4>
              <form onSubmit={handleAddHighlight} className="space-y-3">
                <div>
                  <label className="text-gray-400 block mb-1">Highlight Title</label>
                  <input
                    type="text"
                    required
                    value={hlTitle}
                    onChange={(e) => setHlTitle(e.target.value)}
                    placeholder="e.g. Deployment Agreement"
                    className="w-full bg-[#181818] border border-gray-700 rounded-xl p-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-gray-400 block mb-1">Description</label>
                  <input
                    type="text"
                    value={hlDesc}
                    onChange={(e) => setHlDesc(e.target.value)}
                    placeholder="Context..."
                    className="w-full bg-[#181818] border border-gray-700 rounded-xl p-2 text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-gray-400 block mb-1">Start (Seconds)</label>
                    <input
                      type="number"
                      value={hlStart}
                      onChange={(e) => setHlStart(e.target.value)}
                      className="w-full bg-[#181818] border border-gray-700 rounded-xl p-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-gray-400 block mb-1">End (Seconds)</label>
                    <input
                      type="number"
                      value={hlEnd}
                      onChange={(e) => setHlEnd(e.target.value)}
                      className="w-full bg-[#181818] border border-gray-700 rounded-xl p-2 text-white"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddHighlight(false)}
                    className="px-3 py-1.5 border border-gray-700 rounded-xl text-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl"
                  >
                    Save Highlight
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── Add Next Step Modal ── */}
        {showAddNextStep && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#242424] border border-[#444] rounded-2xl p-5 max-w-sm w-full space-y-4 text-xs">
              <h4 className="font-bold text-sm text-white">Add Next Step Deliverable</h4>
              <form onSubmit={handleAddNextStep} className="space-y-3">
                <div>
                  <label className="text-gray-400 block mb-1">Task</label>
                  <input
                    type="text"
                    required
                    value={nsTask}
                    onChange={(e) => setNsTask(e.target.value)}
                    placeholder="Action item..."
                    className="w-full bg-[#181818] border border-gray-700 rounded-xl p-2 text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-gray-400 block mb-1">Assignee</label>
                    <input
                      type="text"
                      value={nsAssignee}
                      onChange={(e) => setNsAssignee(e.target.value)}
                      placeholder="e.g. Arun"
                      className="w-full bg-[#181818] border border-gray-700 rounded-xl p-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-gray-400 block mb-1">Due Date</label>
                    <input
                      type="text"
                      value={nsDue}
                      onChange={(e) => setNsDue(e.target.value)}
                      placeholder="e.g. Friday"
                      className="w-full bg-[#181818] border border-gray-700 rounded-xl p-2 text-white"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddNextStep(false)}
                    className="px-3 py-1.5 border border-gray-700 rounded-xl text-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl"
                  >
                    Add Next Step
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
