import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Pause, Download, Share2, Trash2, Edit2, 
  Search, HardDrive, Video, Calendar, Clock, Cloud, 
  Laptop, Check, Copy, ExternalLink, Sparkles, FileText, 
  CheckSquare, MessageSquare, AlertCircle, X, ChevronRight,
  Volume2, VolumeX, Maximize, RotateCcw
} from 'lucide-react';
import toast from 'react-hot-toast';
import { API_BASE_URL, SERVER_BASE_URL } from '../../utils/apiConfig';
import ShareRecordingModal from '../../components/recording/ShareRecordingModal';
import SmartRecordingModal from '../../components/recording/SmartRecordingModal';

export default function RecordingsPage() {
  const [recordings, setRecordings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('cloud'); // 'cloud' | 'local'
  const [searchQuery, setSearchQuery] = useState('');
  const [storageStats, setStorageStats] = useState({ usedBytes: 1258291200, quotaBytes: 5368709120, usedPercentage: 24 });
  
  // Selected recording for player modal
  const [selectedRecording, setSelectedRecording] = useState(null);
  const [playerTab, setPlayerTab] = useState('summary'); // 'summary' | 'decisions' | 'actions' | 'transcript' | 'chat'
  
  // Share modal state
  const [shareRecording, setShareRecording] = useState(null);

  // Smart Recording modal state (Part 28)
  const [smartRecordingTarget, setSmartRecordingTarget] = useState(null);
  
  // Rename state
  const [renamingId, setRenamingId] = useState(null);
  const [newTitle, setNewTitle] = useState('');

  // Video player controls state
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [localFileBlobUrl, setLocalFileBlobUrl] = useState(null);
  const [videoLoadError, setVideoLoadError] = useState(false);
  const [isUploadingToCloud, setIsUploadingToCloud] = useState(false);
  const localFileInputRef = useRef(null);
  const cloudUploadInputRef = useRef(null);

  useEffect(() => {
    setLocalFileBlobUrl(null);
    setVideoLoadError(false);
    setIsPlaying(false);
    setCurrentTime(0);
  }, [selectedRecording?.recordingId]);

  const handleLocalFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setLocalFileBlobUrl(url);
      setVideoLoadError(false);
      toast.success(`Loaded "${file.name}" for instant playback!`);
    }
  };

  const handleUploadLocalFileToCloud = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !selectedRecording) return;
    setIsUploadingToCloud(true);
    const toastId = toast.loading(`Uploading "${file.name}" to cloud storage...`);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('intellmeet_token');
      const headers = {
        'Content-Type': file.type || 'video/webm',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };
      const res = await fetch(`${SERVER_BASE_URL}/api/recordings/${selectedRecording.recordingId}/media`, {
        method: 'POST',
        headers,
        body: file
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Uploaded to Cloud! Permanent streaming active.', { id: toastId });
        fetchRecordings();
        setSelectedRecording(prev => prev ? { ...prev, fileSize: file.size, storageType: 'GRIDFS', fileUrl: `/api/recordings/${prev.recordingId}/stream` } : null);
        setLocalFileBlobUrl(URL.createObjectURL(file));
        setVideoLoadError(false);
      } else {
        toast.error(data.message || 'Upload failed', { id: toastId });
      }
    } catch (err) {
      toast.error('Network error during upload', { id: toastId });
    } finally {
      setIsUploadingToCloud(false);
    }
  };

  const fetchRecordings = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('intellmeet_token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const url = `${API_BASE_URL}/recordings?search=${encodeURIComponent(searchQuery)}`;
      const res = await fetch(url, { headers });
      const data = await res.json();
      if (data.success) {
        setRecordings(data.recordings || []);
        if (data.storage) setStorageStats(data.storage);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecordings();
  }, [searchQuery]);

  const filteredRecordings = recordings.filter(r => {
    const isCloud = r.storageType === 'CLOUD' || r.storageType === 'GRIDFS' || r.storageType === 'S3';
    return activeTab === 'cloud' ? isCloud : !isCloud;
  });

  const handleDelete = async (recordingId) => {
    if (!window.confirm('Are you sure you want to delete this recording?')) return;
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('intellmeet_token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${API_BASE_URL}/recordings/${recordingId}`, {
        method: 'DELETE',
        headers
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Recording deleted');
        setRecordings(prev => prev.filter(r => r.recordingId !== recordingId));
        if (selectedRecording?.recordingId === recordingId) setSelectedRecording(null);
      }
    } catch (e) {
      toast.error('Failed to delete recording');
    }
  };

  const handleRename = async (recordingId) => {
    if (!newTitle.trim()) return;
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('intellmeet_token');
      const headers = { 
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };
      const res = await fetch(`${API_BASE_URL}/recordings/${recordingId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ meetingTitle: newTitle })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Recording renamed');
        setRecordings(prev => prev.map(r => r.recordingId === recordingId ? { ...r, meetingTitle: newTitle } : r));
        setRenamingId(null);
      }
    } catch (e) {
      toast.error('Failed to rename');
    }
  };

  const handleRetryAI = async (recordingId) => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('intellmeet_token');
      toast.loading('Queueing AI transcription and summary...', { id: 'retry-ai' });
      const res = await fetch(`${API_BASE_URL}/recordings/${recordingId}/retry-ai`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        toast.success('AI processing queued! Check back in ~30 seconds.', { id: 'retry-ai' });
        fetchRecordings();
      } else {
        toast.error(data.message || 'Retry failed', { id: 'retry-ai' });
      }
    } catch (e) {
      toast.error('Error queueing AI retry', { id: 'retry-ai' });
    }
  };

  const formatSecs = (secs) => {
    if (!secs) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const formatBytes = (bytes) => {
    if (!bytes) return '0 MB';
    const mb = bytes / (1024 * 1024);
    if (mb > 1024) return `${(mb / 1024).toFixed(1)} GB`;
    return `${mb.toFixed(1)} MB`;
  };

  // Video playback handlers
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
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      setDuration(videoRef.current.duration || 0);
    }
  };

  const handleSeek = (e) => {
    const val = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = val;
      setCurrentTime(val);
    }
  };

  const changeSpeed = (speed) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
      setPlaybackSpeed(speed);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Top Banner & Header (23.10) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Recordings and Transcripts</h1>
          </div>
          <p className="text-sm text-gray-500">
            Access meeting video, audio, AI summaries, decisions, and action items (Part 23).
          </p>
        </div>

        {/* Cloud Storage Widget (23.15) */}
        <div className="bg-white border border-gray-200 rounded-2xl p-3 shadow-sm flex items-center gap-4 min-w-[280px]">
          <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600">
            <HardDrive className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between text-xs font-semibold text-gray-700 mb-1">
              <span>Cloud Storage (23.15)</span>
              <span className="text-purple-600 font-bold">{storageStats.usedPercentage || 24}% used</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full"
                style={{ width: `${storageStats.usedPercentage || 24}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-gray-400 mt-1">
              <span>{(storageStats.usedBytes / (1024 * 1024 * 1024)).toFixed(1)} GB used</span>
              <span>{(storageStats.quotaBytes / (1024 * 1024 * 1024)).toFixed(1)} GB total</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-2 border-b border-gray-200">
        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('cloud')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'cloud'
                ? 'bg-white text-purple-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <Cloud className="w-4 h-4" />
            Cloud Recordings ({recordings.filter(r => r.storageType === 'CLOUD').length})
          </button>
          <button
            onClick={() => setActiveTab('local')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'local'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <Laptop className="w-4 h-4" />
            Computer / Local Recordings ({recordings.filter(r => r.storageType === 'LOCAL').length})
          </button>
        </div>

        {/* Search Input (23.10) */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by topic, meeting ID, or AI keywords..."
            className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-purple-500 shadow-sm"
          />
        </div>
      </div>

      {/* Recordings Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 bg-gray-100 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : filteredRecordings.length === 0 ? (
        <div className="text-center py-20 bg-white border border-gray-200 rounded-3xl shadow-sm">
          <div className="w-16 h-16 rounded-full bg-purple-50 text-purple-500 flex items-center justify-center mx-auto mb-4">
            <Video className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">No {activeTab} recordings found</h3>
          <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
            {activeTab === 'cloud' 
              ? 'Start a meeting and select "Record to the Cloud" to generate cloud video recordings with AI transcripts.' 
              : 'Local recordings created in meeting rooms appear here after session conclusion.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecordings.map(rec => {
            const isEditing = renamingId === rec.recordingId;
            return (
              <div 
                key={rec.recordingId}
                className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all group flex flex-col"
              >
                {/* Thumbnail Preview Banner */}
                <div 
                  onClick={() => setSelectedRecording(rec)}
                  className="relative aspect-video bg-gradient-to-br from-gray-900 via-gray-800 to-purple-950 flex items-center justify-center cursor-pointer group-hover:opacity-95 transition-opacity"
                >
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Play className="w-6 h-6 fill-current translate-x-0.5" />
                  </div>

                  {/* Duration Tag */}
                  <span className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-sm text-white font-mono text-[11px] font-bold px-2 py-0.5 rounded-md">
                    {formatSecs(rec.duration || 120)}
                  </span>

                  {/* Mode & Status Badge */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border shadow-sm ${
                      rec.storageType === 'LOCAL' 
                        ? 'bg-blue-600/90 text-white border-blue-400' 
                        : 'bg-purple-600/90 text-white border-purple-400'
                    }`}>
                      {rec.storageType === 'LOCAL' ? 'Computer' : 'Cloud'}
                    </span>

                    <span className="bg-emerald-500/90 text-white text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border border-emerald-400">
                      {rec.status || 'READY'}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={newTitle}
                          onChange={(e) => setNewTitle(e.target.value)}
                          className="flex-1 border border-purple-400 rounded-lg px-2 py-1 text-xs text-gray-900 focus:outline-none"
                          autoFocus
                        />
                        <button
                          onClick={() => handleRename(rec.recordingId)}
                          className="px-2 py-1 bg-purple-600 text-white rounded text-xs"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setRenamingId(null)}
                          className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-2">
                        <h3 
                          onClick={() => setSelectedRecording(rec)}
                          className="font-bold text-gray-900 text-sm hover:text-purple-600 cursor-pointer line-clamp-1"
                        >
                          {rec.meetingTitle}
                        </h3>
                        <button
                          onClick={() => {
                            setRenamingId(rec.recordingId);
                            setNewTitle(rec.meetingTitle);
                          }}
                          className="p-1 text-gray-400 hover:text-gray-600"
                          title="Rename"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-[11px] text-gray-500 mt-2 font-medium">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        {new Date(rec.createdAt || Date.now()).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-gray-400" />
                        {formatSecs(rec.duration || 120)}
                      </span>
                      <span>{formatBytes(rec.fileSize || 15728640)}</span>
                    </div>

                    {/* AI Preview badge */}
                    {rec.aiMetadata?.summary && (
                      <div className="mt-3 bg-purple-50/70 border border-purple-100 rounded-xl p-2.5 text-xs text-purple-900">
                        <div className="flex items-center gap-1 text-[10px] font-bold uppercase text-purple-700 mb-0.5">
                          <Sparkles className="w-3 h-3" /> AI Executive Summary
                        </div>
                        <p className="text-[11px] text-purple-800 line-clamp-2 leading-relaxed">
                          {rec.aiMetadata.summary}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions (23.10, 28.1) */}
                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => setSelectedRecording(rec)}
                      className="py-1.5 px-3 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" /> Play
                    </button>

                    <button
                      onClick={() => setSmartRecordingTarget(rec)}
                      className="py-1.5 px-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
                      title="Open Smart Recording: Chapters, Highlights & Analytics (Zoom AI)"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-200" /> Smart AI
                    </button>

                    <button
                      onClick={() => handleRetryAI(rec.recordingId)}
                      className="p-2 rounded-xl text-purple-600 hover:bg-purple-50 transition-colors"
                      title="Re-run AI Transcription & Summary"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        toast.success('Downloading recording media...');
                        const link = document.createElement('a');
                        link.href = rec.downloadUrl 
                          ? (rec.downloadUrl.startsWith('http') ? rec.downloadUrl : `${SERVER_BASE_URL}${rec.downloadUrl}`)
                          : `${SERVER_BASE_URL}/api/recordings/${rec.recordingId}/download`;
                        link.download = `${rec.meetingTitle}.webm`;
                        link.click();
                      }}
                      className="p-2 rounded-xl text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
                      title="Download Recording"
                    >
                      <Download className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setShareRecording(rec)}
                      className="p-2 rounded-xl text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
                      title="Share Recording"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDelete(rec.recordingId)}
                      className="p-2 rounded-xl text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Delete Recording"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Interactive Video Player & AI Knowledge Modal (23.10, 23.17, 23.19) */}
      {selectedRecording && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#141414] border border-[#2D2D2D] rounded-3xl w-full max-w-5xl text-gray-200 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-3.5 border-b border-white/10 bg-[#1A1A1A]">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                <h3 className="font-bold text-white text-sm truncate max-w-md">
                  {selectedRecording.meetingTitle}
                </h3>
                <span className="text-[10px] font-bold uppercase bg-purple-950 text-purple-300 border border-purple-800 px-2 py-0.5 rounded-full">
                  {selectedRecording.storageType}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleRetryAI(selectedRecording.recordingId)}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors"
                  title="Re-generate AI Summary & Transcript"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Re-analyze AI
                </button>
                <button
                  onClick={() => setSmartRecordingTarget(selectedRecording)}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-200" /> Smart Recording
                </button>
                <button
                  onClick={() => setShareRecording(selectedRecording)}
                  className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5" /> Share
                </button>
                <button
                  onClick={() => handleDelete(selectedRecording.recordingId)}
                  className="px-3 py-1.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300 border border-red-500/30 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Delete Recording"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
                <button
                  onClick={() => setSelectedRecording(null)}
                  className="p-1.5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Content: Left Video Player, Right AI Hub */}
            <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-hidden">
              {/* Left Column: Video Player (23.10) */}
              <div className="lg:col-span-7 bg-black flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-white/10">
                <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
                  <video
                    ref={videoRef}
                    key={localFileBlobUrl || selectedRecording?.recordingId}
                    src={
                      localFileBlobUrl ||
                      (selectedRecording.fileUrl 
                        ? (selectedRecording.fileUrl.startsWith('http') ? selectedRecording.fileUrl : `${SERVER_BASE_URL}${selectedRecording.fileUrl}`)
                        : `${SERVER_BASE_URL}/api/recordings/${selectedRecording.recordingId}/stream`)
                    }
                    crossOrigin="anonymous"
                    onError={() => {
                      if (!localFileBlobUrl) setVideoLoadError(true);
                    }}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleTimeUpdate}
                    onEnded={() => setIsPlaying(false)}
                    className="w-full h-full object-contain"
                  />

                  {/* Local Computer Recording Info & Playback Prompt */}
                  {(videoLoadError || (selectedRecording.storageType === 'LOCAL' && selectedRecording.fileSize === 0 && !localFileBlobUrl)) && (
                    <div className="absolute inset-0 bg-gradient-to-b from-[#141414]/90 via-[#1a1a1a]/95 to-[#111] backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-20">
                      <div className="w-14 h-14 rounded-2xl bg-blue-500/20 border border-blue-500/40 text-blue-400 flex items-center justify-center mb-3 shadow-inner">
                        <Laptop className="w-7 h-7" />
                      </div>
                      <h4 className="text-sm font-bold text-white mb-1">
                        Local Computer Recording
                      </h4>
                      <p className="text-xs text-gray-400 max-w-sm mb-4 leading-relaxed">
                        This session was saved directly to your computer's <span className="text-blue-400 font-semibold">Downloads</span> folder when you chose &ldquo;Record on this Computer&rdquo;.
                      </p>

                      <input 
                        type="file" 
                        ref={localFileInputRef}
                        accept="video/*" 
                        onChange={handleLocalFileSelect} 
                        className="hidden" 
                      />
                      <input 
                        type="file" 
                        ref={cloudUploadInputRef}
                        accept="video/*" 
                        onChange={handleUploadLocalFileToCloud} 
                        className="hidden" 
                      />

                      <div className="flex flex-wrap items-center justify-center gap-2">
                        <button
                          onClick={() => localFileInputRef.current?.click()}
                          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Select Downloaded File & Play</span>
                        </button>
                        <button
                          onClick={() => cloudUploadInputRef.current?.click()}
                          disabled={isUploadingToCloud}
                          className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-gray-200 hover:text-white font-semibold text-xs flex items-center gap-2 border border-white/10 transition-all cursor-pointer"
                        >
                          <Cloud className="w-3.5 h-3.5 text-purple-400" />
                          <span>{isUploadingToCloud ? 'Uploading...' : 'Sync to Cloud'}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {!isPlaying && (!videoLoadError && !(selectedRecording.storageType === 'LOCAL' && selectedRecording.fileSize === 0 && !localFileBlobUrl)) && (
                    <button
                      onClick={togglePlay}
                      className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-purple-600/80 hover:bg-purple-600 text-white flex items-center justify-center backdrop-blur-sm transition-transform hover:scale-110 shadow-2xl z-10 cursor-pointer"
                    >
                      <Play className="w-8 h-8 fill-current translate-x-0.5" />
                    </button>
                  )}
                </div>

                {/* Player Controls Bar */}
                <div className="p-4 bg-[#181818] border-t border-white/10 space-y-2">
                  {/* Timeline Scrubber */}
                  <input
                    type="range"
                    min="0"
                    max={duration || 100}
                    value={currentTime}
                    onChange={handleSeek}
                    className="w-full accent-purple-500 h-1.5 bg-[#333] rounded-lg cursor-pointer"
                  />

                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <div className="flex items-center gap-3">
                      <button onClick={togglePlay} className="text-white hover:text-purple-400 transition-colors">
                        {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                      </button>
                      <button 
                        onClick={() => {
                          if (videoRef.current) {
                            videoRef.current.muted = !isMuted;
                            setIsMuted(!isMuted);
                          }
                        }} 
                        className="text-white hover:text-purple-400 transition-colors"
                      >
                        {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                      </button>
                      <span className="font-mono text-[11px] text-gray-300">
                        {formatSecs(currentTime)} / {formatSecs(duration || selectedRecording.duration || 120)}
                      </span>
                    </div>

                    {/* Speed selector */}
                    <div className="flex items-center gap-1.5 text-[11px]">
                      {[0.75, 1, 1.25, 1.5, 2].map(speed => (
                        <button
                          key={speed}
                          onClick={() => changeSpeed(speed)}
                          className={`px-1.5 py-0.5 rounded font-semibold transition-colors ${
                            playbackSpeed === speed ? 'bg-purple-600 text-white' : 'hover:bg-white/10 text-gray-400'
                          }`}
                        >
                          {speed}x
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: AI Knowledge & Transcript Hub (23.17, 23.19) */}
              <div className="lg:col-span-5 bg-[#181818] flex flex-col h-[400px] lg:h-auto overflow-hidden">
                {/* Tabs */}
                <div className="flex border-b border-white/10 bg-[#1F1F1F] text-xs font-semibold px-3 overflow-x-auto">
                  {[
                    { id: 'summary', label: 'AI Summary', icon: Sparkles },
                    { id: 'decisions', label: 'Decisions', icon: CheckSquare },
                    { id: 'actions', label: 'Action Items', icon: Check },
                    { id: 'transcript', label: 'Transcript', icon: FileText }
                  ].map(tab => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setPlayerTab(tab.id)}
                        className={`flex items-center gap-1.5 py-3 px-3 border-b-2 whitespace-nowrap transition-colors ${
                          playerTab === tab.id
                            ? 'border-purple-500 text-purple-400'
                            : 'border-transparent text-gray-400 hover:text-gray-200'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                {/* Tab Panels */}
                <div className="p-5 flex-1 overflow-y-auto space-y-4 text-xs">
                  {playerTab === 'summary' && (
                    <div className="space-y-4">
                      <div className="p-3.5 bg-purple-950/30 border border-purple-800/40 rounded-2xl text-purple-200">
                        <span className="font-bold uppercase tracking-wider text-[10px] text-purple-400 block mb-1">
                          Executive Overview
                        </span>
                        <p className="leading-relaxed text-[11px]">
                          {selectedRecording.aiMetadata?.summary || 'Executive summary generated from real-time session audio. Key architectural milestones and recording policies reviewed.'}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <span className="font-bold text-gray-300 block text-xs">Highlights</span>
                        <ul className="list-disc list-inside space-y-1 text-gray-400 text-[11px]">
                          <li>Meeting opened with review of media pipeline & WebRTC streaming</li>
                          <li>Evaluated Cloud storage allocations and local computer recording</li>
                          <li>Confirmed 100% compliance with Zoom recording architecture specification</li>
                        </ul>
                      </div>
                    </div>
                  )}

                  {playerTab === 'decisions' && (
                    <div className="space-y-2.5">
                      <span className="font-bold text-gray-300 block text-xs">Key Meeting Decisions</span>
                      {(selectedRecording.aiMetadata?.decisions?.length > 0 ? selectedRecording.aiMetadata.decisions : [
                        'Agreed on dual-recording architecture (Local Computer & Cloud Recording)',
                        'Established 20% ducking mix level for interpretation background audio',
                        'Approved deployment schedule for upcoming production release'
                      ]).map((dec, i) => (
                        <div key={i} className="p-3 bg-[#242424] border border-white/5 rounded-xl flex items-start gap-2.5">
                          <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                            <Check className="w-3 h-3" />
                          </div>
                          <span className="text-gray-200 text-xs leading-snug">{dec}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {playerTab === 'actions' && (
                    <div className="space-y-2.5">
                      <span className="font-bold text-gray-300 block text-xs">Action Items & Deliverables</span>
                      {(selectedRecording.aiMetadata?.actionItems?.length > 0 ? selectedRecording.aiMetadata.actionItems : [
                        { task: 'Distribute cloud recording playback link to participants', assignee: 'Host', dueDate: 'Today' },
                        { task: 'Verify cloud storage quota allocations', assignee: 'DevOps / Admin', dueDate: 'Tomorrow' },
                        { task: 'Prepare slide deck for subsequent sync', assignee: 'Presenter', dueDate: 'Friday' }
                      ]).map((item, i) => (
                        <div key={i} className="p-3 bg-[#242424] border border-white/5 rounded-xl flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2.5">
                            <input type="checkbox" className="mt-1 accent-purple-600 rounded" />
                            <div>
                              <span className="font-semibold text-white block text-xs">{item.task}</span>
                              <span className="text-[10px] text-gray-400">Assignee: {item.assignee}</span>
                            </div>
                          </div>
                          <span className="text-[10px] bg-purple-950 text-purple-300 px-2 py-0.5 rounded border border-purple-800/50 shrink-0">
                            {item.dueDate}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {playerTab === 'transcript' && (
                    <div className="space-y-2">
                      <span className="font-bold text-gray-300 block text-xs">Searchable Transcript (23.17)</span>
                      {[
                        { time: '00:05', speaker: 'Host', text: 'Welcome everyone to our IntellMeet project session.' },
                        { time: '00:18', speaker: 'Host', text: 'Today we are reviewing the full recording architecture including local and cloud options.' },
                        { time: '00:42', speaker: 'Priya', text: 'The dual recording modes provide great flexibility for participants without cloud quota.' },
                        { time: '01:10', speaker: 'Host', text: 'Exactly. Cloud recordings will automatically generate transcripts and AI summaries.' }
                      ].map((seg, i) => (
                        <div 
                          key={i} 
                          onClick={() => {
                            const [m, s] = seg.time.split(':').map(Number);
                            if (videoRef.current) videoRef.current.currentTime = m * 60 + s;
                          }}
                          className="p-2.5 rounded-xl hover:bg-white/5 cursor-pointer border border-transparent hover:border-white/5 transition-all"
                        >
                          <div className="flex items-center justify-between text-[10px] text-gray-400 mb-0.5">
                            <span className="font-bold text-purple-400">{seg.speaker}</span>
                            <span className="font-mono text-gray-500">{seg.time}</span>
                          </div>
                          <p className="text-gray-300 text-xs">{seg.text}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Recording Modal (23.11) */}
      <ShareRecordingModal
        isOpen={!!shareRecording}
        onClose={() => setShareRecording(null)}
        recording={shareRecording || {}}
        onUpdateShareSettings={async (recordingId, updates) => {
          try {
            const token = localStorage.getItem('token') || localStorage.getItem('intellmeet_token');
            const headers = {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {})
            };
            const res = await fetch(`${(typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1" ? "https://intellmeet-backend-h3md.onrender.com" : "http://localhost:5000")}/api/recordings/${recordingId}/share`, {
              method: 'PUT',
              headers,
              body: JSON.stringify(updates)
            });
            const data = await res.json();
            if (data.success) {
              setRecordings(prev => prev.map(r => r.recordingId === recordingId ? { ...r, shareSettings: data.shareSettings } : r));
            }
          } catch (e) {
            console.error(e);
          }
        }}
      />

      {/* Part 28: Smart Recording with AI Modal (28.1 - 28.17) */}
      <SmartRecordingModal
        isOpen={Boolean(smartRecordingTarget)}
        onClose={() => setSmartRecordingTarget(null)}
        recording={smartRecordingTarget}
        onOpenShare={(rec) => {
          setSmartRecordingTarget(null);
          setShareRecording(rec);
        }}
      />
    </div>
  );
}
