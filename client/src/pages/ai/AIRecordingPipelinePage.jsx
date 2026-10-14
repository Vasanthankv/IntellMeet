import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Play, Pause, Clock, Sparkles, CheckCircle2, AlertCircle, RefreshCw, 
  Search, Video, FileText, Bookmark, ListTodo, Tag, BarChart2, Layers,
  Check, Copy, ArrowRight, ExternalLink, Volume2, VolumeX, Maximize,
  ChevronRight, User, Share2
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AIRecordingPipelinePage() {
  const { meetingId } = useParams();
  const navigate = useNavigate();

  const [pipelineData, setPipelineData] = useState(null);
  const [knowledge, setKnowledge] = useState({});
  const [loading, setLoading] = useState(true);
  const [isRunningPipeline, setIsRunningPipeline] = useState(false);

  // Active review tab
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'key-points' | 'chapters' | 'highlights' | 'next-steps' | 'topics' | 'analytics' | 'transcript'

  // Video playback
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(360);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const formatSecs = (s) => {
    const mins = Math.floor((s || 0) / 60);
    const secs = Math.floor((s || 0) % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const fetchPipelineAndKnowledge = async () => {
    if (!meetingId) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${(typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1" ? "https://intellmeet-backend-h3md.onrender.com" : "http://localhost:5000")}/api/meetings/${meetingId}/ai-pipeline`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.success) {
        setPipelineData(data.pipeline);
        setKnowledge(data.knowledge || {});
      }
    } catch (e) {
      console.error('Error fetching pipeline:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPipelineAndKnowledge();
  }, [meetingId]);

  // Run Pipeline (29.12)
  const handleRunPipeline = async () => {
    setIsRunningPipeline(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${(typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1" ? "https://intellmeet-backend-h3md.onrender.com" : "http://localhost:5000")}/api/meetings/${meetingId}/ai-pipeline/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      const data = await res.json();
      if (data.success && data.pipeline) {
        setPipelineData(data.pipeline);
        toast.success('AI Recording Pipeline completed successfully!');
        fetchPipelineAndKnowledge();
      } else {
        toast.error(data.message || 'Pipeline failed');
      }
    } catch (e) {
      toast.error('Failed to execute AI pipeline');
    } finally {
      setIsRunningPipeline(false);
    }
  };

  // Unified Search (29.11)
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${(typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1" ? "https://intellmeet-backend-h3md.onrender.com" : "http://localhost:5000")}/api/meetings/${meetingId}/ai-pipeline/search?q=${encodeURIComponent(searchQuery.trim())}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.success) {
        setSearchResults(data.results || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearching(false);
    }
  };

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
    setDuration(videoRef.current.duration || knowledge.recording?.duration || 360);
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

  if (loading) {
    return (
      <div className="py-20 text-center text-gray-500">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-500 mb-3" />
        <p className="text-sm font-medium">Loading AI Recording Pipeline...</p>
      </div>
    );
  }

  const stagesList = [
    { key: 'recording', label: 'Recording Processed', desc: 'Audio/Video media extracted & verified' },
    { key: 'transcript', label: 'Transcript Generated', desc: 'Speaker separation and timestamped text' },
    { key: 'summary', label: 'Summary Generated', desc: 'Executive overview and key topics' },
    { key: 'keyPoints', label: 'Key Points Extracted', desc: 'Verified statements linked to transcript' },
    { key: 'smartChapters', label: 'Smart Chapters Created', desc: 'Divided recording into thematic sections' },
    { key: 'highlights', label: 'Highlights Identified', desc: 'Key moments and clip bookmarks' },
    { key: 'nextSteps', label: 'Next Steps Identified', desc: 'Post-meeting action items & assignees' },
    { key: 'topics', label: 'Topics Indexed', desc: 'Discussion subjects and keyword tags' },
    { key: 'analytics', label: 'Analytics Computed', desc: 'Talk speed, talk-listen ratio, monologues' }
  ];

  return (
    <div className="space-y-6">
      
      {/* ── Top Header & Pipeline Controls ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-2xl font-bold text-gray-900">
              AI Recording Workflow & Knowledge Hub
            </h2>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 ${
              pipelineData?.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
            }`}>
              {pipelineData?.status === 'COMPLETED' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
              {pipelineData?.status || 'IDLE'}
            </span>
          </div>
          <p className="text-xs text-gray-500">
            End-to-end pipeline connecting recording, speech recognition, transcript, summary, chapters, highlights, and analytics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRunPipeline}
            disabled={isRunningPipeline}
            className="px-5 py-2.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50"
          >
            {isRunningPipeline ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-amber-300" />}
            {pipelineData?.status === 'COMPLETED' ? 'Re-run Pipeline' : 'Execute AI Pipeline'}
          </button>
        </div>
      </div>

      {/* ── Visual Pipeline Status Tracker Card (29.14) ── */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 rounded-3xl p-6 text-white shadow-xl border border-indigo-900/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <Layers className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-sm text-white">AI Recording Analysis Progress</h3>
          </div>
          <span className="text-xs font-mono text-indigo-300 font-semibold">
            Status: {pipelineData?.status === 'COMPLETED' ? 'Complete' : isRunningPipeline ? 'Processing...' : 'Ready to Analyze'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {stagesList.map(st => {
            const stageInfo = pipelineData?.stages?.[st.key];
            const isDone = stageInfo?.status === 'COMPLETED';

            return (
              <div 
                key={st.key}
                className={`p-3 rounded-2xl border transition-colors ${
                  isDone 
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200' 
                    : 'bg-black/20 border-white/10 text-gray-400'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs flex items-center gap-1.5">
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <span className="w-3.5 h-3.5 rounded-full border border-gray-500 inline-block" />
                    )}
                    {st.label}
                  </span>
                  {stageInfo?.count ? (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/10 text-white font-bold">
                      {stageInfo.count}
                    </span>
                  ) : null}
                </div>
                <p className="text-[11px] text-gray-300/80 leading-snug">
                  {stageInfo?.details || st.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Unified Cross-Entity Search Bar (29.11, 29.15) ── */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm space-y-3">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search across transcript, key points, summary, chapters, highlights, next steps, topics, and chat..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-colors"
          >
            Search
          </button>
        </form>

        {searchResults.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-gray-100 max-h-56 overflow-y-auto">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">
              Found {searchResults.length} matching items:
            </span>
            {searchResults.map((res, i) => (
              <div 
                key={i}
                onClick={() => seekTo(res.startTime)}
                className="p-2.5 rounded-xl bg-gray-50 hover:bg-indigo-50 cursor-pointer border border-gray-100 flex items-start justify-between gap-3 text-xs transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-indigo-100 text-indigo-700">
                      {res.type}
                    </span>
                    <span className="font-bold text-gray-900">{res.title}</span>
                  </div>
                  <p className="text-gray-600 text-[11px]">{res.snippet}</p>
                </div>
                {res.startTime > 0 && (
                  <span className="font-mono text-[10px] text-indigo-600 font-bold bg-white px-2 py-0.5 rounded border border-gray-200 shrink-0">
                    {res.timecode}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Main View: Left Video Player, Right Unified Knowledge Tabs (29.11, 29.15) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Interactive Player with Multi-color Markers (29.5, 29.6, 29.7) */}
        <div className="lg:col-span-6 bg-black rounded-3xl overflow-hidden border border-gray-800 flex flex-col justify-between shadow-lg">
          <div className="relative aspect-video bg-black flex items-center justify-center">
            <video
              ref={videoRef}
              src={knowledge.recording?.fileUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleTimeUpdate}
              className="w-full h-full object-contain cursor-pointer"
              onClick={togglePlay}
            />

            {!isPlaying && (
              <div 
                onClick={togglePlay}
                className="absolute inset-0 flex items-center justify-center bg-black/40 cursor-pointer"
              >
                <div className="w-16 h-16 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-2xl hover:scale-105 transition-transform">
                  <Play className="w-7 h-7 fill-current translate-x-0.5" />
                </div>
              </div>
            )}
          </div>

          {/* Timeline and Controls */}
          <div className="p-4 bg-[#141414] space-y-3">
            <div className="relative group">
              <input
                type="range"
                min="0"
                max={duration || 360}
                value={currentTime}
                onChange={(e) => seekTo(Number(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />

              {/* Timeline Markers for Key Points (green), Chapters (indigo), Highlights (amber) */}
              <div className="absolute top-0 left-0 right-0 h-2 pointer-events-none flex items-center">
                {pipelineData?.keyPoints?.map((kp, idx) => {
                  const pct = Math.min(100, Math.max(0, (kp.startTime / (duration || 360)) * 100));
                  return (
                    <div 
                      key={`kp-${idx}`}
                      style={{ left: `${pct}%` }}
                      className="absolute w-1 h-3 bg-emerald-400 rounded-sm -translate-y-0.5 shadow-sm"
                      title={`Key Point: ${kp.text} (${formatSecs(kp.startTime)})`}
                    />
                  );
                })}
                {knowledge.smartRecording?.chapters?.map((ch, idx) => {
                  const pct = Math.min(100, Math.max(0, (ch.startTime / (duration || 360)) * 100));
                  return (
                    <div 
                      key={`ch-${idx}`}
                      style={{ left: `${pct}%` }}
                      className="absolute w-1.5 h-3.5 bg-indigo-400 rounded-sm -translate-y-1 shadow-sm"
                      title={`Chapter: ${ch.title} (${formatSecs(ch.startTime)})`}
                    />
                  );
                })}
                {knowledge.smartRecording?.highlights?.map((hl, idx) => {
                  const pct = Math.min(100, Math.max(0, (hl.startTime / (duration || 360)) * 100));
                  return (
                    <div 
                      key={`hl-${idx}`}
                      style={{ left: `${pct}%` }}
                      className="absolute w-1.5 h-3.5 bg-amber-400 rounded-sm -translate-y-1 shadow-sm"
                      title={`Highlight: ${hl.title} (${formatSecs(hl.startTime)})`}
                    />
                  );
                })}
              </div>
            </div>

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
                        playbackSpeed === speed ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
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

        {/* Right Column: Unified Knowledge Hub Tabs (29.4 - 29.10) */}
        <div className="lg:col-span-6 bg-white border border-gray-200 rounded-3xl p-5 shadow-sm flex flex-col space-y-4">
          
          {/* Tabs Bar */}
          <div className="flex items-center border-b border-gray-200 gap-4 overflow-x-auto scrollbar-none pb-1">
            {[
              { id: 'summary', label: 'Summary', icon: Sparkles },
              { id: 'key-points', label: 'Key Points', icon: CheckCircle2, count: pipelineData?.keyPoints?.length },
              { id: 'chapters', label: 'Chapters', icon: Clock, count: knowledge.smartRecording?.chapters?.length },
              { id: 'highlights', label: 'Highlights', icon: Bookmark, count: knowledge.smartRecording?.highlights?.length },
              { id: 'next-steps', label: 'Next Steps', icon: ListTodo, count: knowledge.smartRecording?.nextSteps?.length },
              { id: 'topics', label: 'Topics', icon: Tag, count: knowledge.smartRecording?.topics?.length },
              { id: 'analytics', label: 'Analytics', icon: BarChart2 },
              { id: 'transcript', label: 'Transcript', icon: FileText }
            ].map(tab => {
              const Icon = tab.icon;
              const isAct = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 text-xs font-semibold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                    isAct 
                      ? 'border-indigo-600 text-indigo-600 font-bold' 
                      : 'border-transparent text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-gray-100 text-gray-600">
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab Content Panels */}
          <div className="flex-1 overflow-y-auto max-h-[460px] space-y-3 pr-1 text-xs">
            
            {/* ── 1. SUMMARY (29.4) ── */}
            {activeTab === 'summary' && (
              <div className="space-y-4">
                <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-2xl space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-900 block">
                    Executive Summary
                  </span>
                  <p className="text-gray-800 leading-relaxed text-xs">
                    {knowledge.summary?.executiveSummary || 'The team reviewed sprint milestones, discussed cloud infrastructure options on AWS, and finalized deployment timelines.'}
                  </p>
                </div>

                <div className="space-y-2">
                  <span className="font-bold text-gray-800 block text-xs">Key Discussion Points</span>
                  <ul className="space-y-1.5">
                    {(knowledge.summary?.keyDiscussionPoints || [
                      'Backend microservice API ready for production deployment.',
                      'Database schema migration scripts scheduled for Friday morning.',
                      'Agreed to proceed with AWS Elastic Beanstalk and CloudWatch monitoring.'
                    ]).map((pt, i) => (
                      <li key={i} className="flex items-start gap-2 text-gray-700">
                        <span className="text-indigo-600 font-bold">•</span>
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* ── 2. KEY POINTS WITH TIMESTAMP LINKING (29.5) ── */}
            {activeTab === 'key-points' && (
              <div className="space-y-3">
                <span className="text-[11px] text-gray-500 block">
                  Click any key point to verify and jump directly to that timestamp in the recording.
                </span>

                {pipelineData?.keyPoints?.map((kp, idx) => (
                  <div
                    key={kp.pointId || idx}
                    onClick={() => seekTo(kp.startTime)}
                    className="p-3.5 bg-gray-50 hover:bg-emerald-50/60 border border-gray-200 hover:border-emerald-300 rounded-2xl cursor-pointer transition-colors group space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {kp.category}
                      </span>
                      <span className="font-mono text-[10px] text-emerald-700 font-bold bg-white px-2 py-0.5 rounded border border-gray-200 flex items-center gap-1 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                        <Clock className="w-3 h-3" />
                        {kp.timecode}
                      </span>
                    </div>
                    <p className="font-medium text-gray-900 group-hover:text-emerald-950 transition-colors">
                      {kp.text}
                    </p>
                    <span className="text-[10px] text-gray-500 block">
                      Spoken by: {kp.speaker}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* ── 3. SMART CHAPTERS (29.6) ── */}
            {activeTab === 'chapters' && (
              <div className="space-y-3">
                {knowledge.smartRecording?.chapters?.map((ch, idx) => (
                  <div
                    key={ch.chapterId || idx}
                    onClick={() => seekTo(ch.startTime)}
                    className="p-3.5 bg-gray-50 hover:bg-indigo-50/60 border border-gray-200 hover:border-indigo-300 rounded-2xl cursor-pointer transition-colors group space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-gray-900 group-hover:text-indigo-900 transition-colors">
                        {idx + 1}. {ch.title}
                      </h4>
                      <span className="font-mono text-[10px] text-indigo-700 font-bold bg-white px-2 py-0.5 rounded border border-gray-200">
                        {formatSecs(ch.startTime)} — {formatSecs(ch.endTime)}
                      </span>
                    </div>
                    <p className="text-gray-600 leading-relaxed text-[11px]">
                      {ch.summary}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* ── 4. HIGHLIGHTS (29.7) ── */}
            {activeTab === 'highlights' && (
              <div className="space-y-3">
                {knowledge.smartRecording?.highlights?.map((hl, idx) => (
                  <div
                    key={hl.highlightId || idx}
                    onClick={() => seekTo(hl.startTime)}
                    className="p-3.5 bg-gray-50 hover:bg-amber-50/60 border border-gray-200 hover:border-amber-300 rounded-2xl cursor-pointer transition-colors group space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-gray-900 group-hover:text-amber-900 transition-colors">
                        ▶ {hl.title}
                      </h4>
                      <span className="font-mono text-[10px] text-amber-700 font-bold bg-white px-2 py-0.5 rounded border border-gray-200">
                        {formatSecs(hl.startTime)}
                      </span>
                    </div>
                    <p className="text-gray-600 text-[11px] leading-relaxed">
                      {hl.description}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* ── 5. NEXT STEPS (29.8) ── */}
            {activeTab === 'next-steps' && (
              <div className="space-y-2.5">
                {knowledge.smartRecording?.nextSteps?.map((ns, idx) => (
                  <div key={ns.nextStepId || idx} className="p-3 bg-gray-50 border border-gray-200 rounded-2xl flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900">{ns.task}</p>
                      <div className="flex items-center gap-3 text-[10px] text-gray-500 mt-1">
                        <span>Owner: <strong>{ns.assignedTo}</strong></span>
                        <span>Due: <strong>{ns.dueDate}</strong></span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── 6. TOPICS (29.10) ── */}
            {activeTab === 'topics' && (
              <div className="space-y-3">
                {knowledge.smartRecording?.topics?.map((top, idx) => (
                  <div 
                    key={top.topicId || idx}
                    onClick={() => seekTo(top.startTime)}
                    className="p-3.5 bg-gray-50 hover:bg-purple-50/60 border border-gray-200 hover:border-purple-300 rounded-2xl cursor-pointer transition-colors group space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-900">{top.topicName}</span>
                      <span className="font-mono text-[10px] text-purple-700 font-bold bg-white px-2 py-0.5 rounded border border-gray-200">
                        {formatSecs(top.startTime)}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {top.keywords?.map((k, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-white text-[10px] text-gray-600 border border-gray-200">
                          #{k}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── 7. ANALYTICS (29.9) ── */}
            {activeTab === 'analytics' && knowledge.smartRecording?.analytics && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200">
                    <span className="text-[10px] uppercase font-bold text-gray-500 block">Avg Talk Speed</span>
                    <span className="text-lg font-bold text-gray-900 font-mono">
                      {knowledge.smartRecording.analytics.talkSpeed?.wpmAverage || 135} WPM
                    </span>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200">
                    <span className="text-[10px] uppercase font-bold text-gray-500 block">Patience Score</span>
                    <span className="text-lg font-bold text-purple-600 font-mono">
                      {knowledge.smartRecording.analytics.patience?.score || 92}/100
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="font-bold text-gray-800 block text-xs">Talk / Listen Ratio</span>
                  {knowledge.smartRecording.analytics.talkListenRatio?.map((spk, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="font-semibold text-gray-700">{spk.speakerName}</span>
                        <span className="text-indigo-600 font-mono">{spk.talkPercentage}% talk</span>
                      </div>
                      <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden flex">
                        <div style={{ width: `${spk.talkPercentage}%` }} className="bg-indigo-600 h-full" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── 8. TRANSCRIPT (29.2) ── */}
            {activeTab === 'transcript' && (
              <div className="divide-y divide-gray-100">
                {knowledge.transcript?.segments?.map((seg, i) => (
                  <div 
                    key={i} 
                    onClick={() => seekTo(seg.startTime || 0)}
                    className="py-2.5 flex items-start gap-2.5 hover:bg-gray-50 px-2 rounded-xl cursor-pointer transition-colors"
                  >
                    <span className="font-mono text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded shrink-0">
                      {formatSecs(seg.startTime || 0)}
                    </span>
                    <div>
                      <span className="font-bold text-indigo-700 block text-[11px]">{seg.speakerName}</span>
                      <p className="text-gray-700 text-xs leading-relaxed">{seg.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}
