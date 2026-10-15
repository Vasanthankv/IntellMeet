import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Play, Pause, Download, Lock, Check, Sparkles, 
  FileText, CheckSquare, Calendar, Clock, Video, Volume2, VolumeX 
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function PublicRecordingView() {
  const { shareToken } = useParams();
  const [recording, setRecording] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [requirePasscode, setRequirePasscode] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [activeTab, setActiveTab] = useState('summary');

  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  const fetchRecording = async (code = '') => {
    setIsLoading(true);
    setError(null);
    try {
      const url = `${(typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1" ? "https://intellmeet-backend-h3md.onrender.com" : "http://localhost:5000")}/api/recordings/public/${shareToken}${code ? `?passcode=${encodeURIComponent(code)}` : ''}`;
      const res = await fetch(url);
      const data = await res.json();
      if (res.status === 401 && data.requirePasscode) {
        setRequirePasscode(true);
      } else if (data.success && data.recording) {
        setRecording(data.recording);
        setRequirePasscode(false);
      } else {
        setError(data.message || 'Unable to load recording');
      }
    } catch (e) {
      setError('Network error loading shared recording');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecording();
  }, [shareToken]);

  const handlePasscodeSubmit = (e) => {
    e.preventDefault();
    if (!passcode.trim()) return;
    fetchRecording(passcode.trim());
  };

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

  const formatSecs = (secs) => {
    if (!secs) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#111] flex items-center justify-center text-white">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (requirePasscode) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center p-4 text-white">
        <div className="bg-[#1A1A1A] border border-[#333] rounded-3xl p-8 w-full max-w-md shadow-2xl text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold">Passcode Required</h2>
          <p className="text-xs text-gray-400">
            This IntellMeet recording is protected. Please enter the access passcode provided by the meeting host.
          </p>
          <form onSubmit={handlePasscodeSubmit} className="space-y-3 pt-2">
            <input
              type="password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="Enter passcode"
              className="w-full bg-[#242424] border border-[#444] rounded-xl px-4 py-2.5 text-center text-sm font-mono tracking-widest focus:outline-none focus:border-purple-500"
              autoFocus
            />
            <button
              type="submit"
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs transition-colors shadow-lg shadow-purple-600/30"
            >
              Unlock Recording
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (error || !recording) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center p-4 text-white">
        <div className="bg-[#1A1A1A] border border-[#333] rounded-3xl p-8 w-full max-w-md text-center space-y-3">
          <h2 className="text-lg font-bold text-red-400">Recording Unavailable</h2>
          <p className="text-xs text-gray-400">{error || 'This link may have expired or been removed.'}</p>
          <Link to="/" className="inline-block mt-4 text-xs text-purple-400 hover:underline">
            Back to IntellMeet Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-gray-200">
      {/* Navbar */}
      <header className="border-b border-white/10 bg-[#161616] px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-white font-bold text-lg">
          <div className="w-7 h-7 bg-purple-600 rounded-lg flex items-center justify-center text-white text-xs font-black">
            I
          </div>
          IntellMeet
        </Link>
        {recording.shareSettings?.allowDownload && (
          <button
            onClick={() => {
              toast.success('Downloading recording...');
              const a = document.createElement('a');
              a.href = recording.fileUrl || '#';
              a.download = `${recording.meetingTitle}.mp4`;
              a.click();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-semibold text-white transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Download
          </button>
        )}
      </header>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-black text-white">{recording.meetingTitle}</h1>
          <div className="flex items-center gap-4 text-xs text-gray-400 mt-1 font-medium">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(recording.createdAt).toLocaleDateString()}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {formatSecs(recording.duration || 120)}
            </span>
            <span>Recorded by {recording.recordedBy?.name || 'Host'}</span>
          </div>
        </div>

        {/* Video Player */}
        <div className="relative aspect-video bg-black rounded-3xl overflow-hidden border border-white/10 shadow-2xl flex items-center justify-center">
          <video
            ref={videoRef}
            src={recording.fileUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'}
            onTimeUpdate={() => {
              if (videoRef.current) {
                setCurrentTime(videoRef.current.currentTime);
                setDuration(videoRef.current.duration || 0);
              }
            }}
            onEnded={() => setIsPlaying(false)}
            className="w-full h-full object-contain"
          />
          {!isPlaying && (
            <button
              onClick={togglePlay}
              className="absolute inset-0 m-auto w-20 h-20 rounded-full bg-purple-600/90 text-white flex items-center justify-center backdrop-blur-md shadow-2xl hover:scale-110 transition-transform"
            >
              <Play className="w-10 h-10 fill-current translate-x-1" />
            </button>
          )}
        </div>

        {/* AI Knowledge Tabs */}
        <div className="bg-[#181818] border border-white/10 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex border-b border-white/10 pb-3 gap-4 text-xs font-bold">
            <button
              onClick={() => setActiveTab('summary')}
              className={`pb-1 border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'summary' ? 'border-purple-500 text-purple-400' : 'border-transparent text-gray-400'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" /> AI Summary
            </button>
            <button
              onClick={() => setActiveTab('decisions')}
              className={`pb-1 border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'decisions' ? 'border-purple-500 text-purple-400' : 'border-transparent text-gray-400'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" /> Decisions
            </button>
            <button
              onClick={() => setActiveTab('transcript')}
              className={`pb-1 border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'transcript' ? 'border-purple-500 text-purple-400' : 'border-transparent text-gray-400'
              }`}
            >
              <FileText className="w-3.5 h-3.5" /> Transcript
            </button>
          </div>

          <div className="text-xs text-gray-300">
            {activeTab === 'summary' && (
              recording.aiMetadata?.summary ? (
                <p className="leading-relaxed bg-[#222] p-4 rounded-2xl border border-white/5">
                  {recording.aiMetadata.summary}
                </p>
              ) : (
                <p className="text-gray-400 p-4 bg-[#222] rounded-2xl border border-white/5 italic">
                  No AI summary generated for this recording yet.
                </p>
              )
            )}
            {activeTab === 'decisions' && (
              recording.aiMetadata?.decisions?.length > 0 ? (
                <div className="space-y-2">
                  {recording.aiMetadata.decisions.map((dec, i) => (
                    <div key={i} className="p-3 bg-[#222] border border-white/5 rounded-xl flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{dec}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 p-4 bg-[#222] rounded-2xl border border-white/5 italic">
                  No decisions recorded for this session.
                </p>
              )
            )}
            {activeTab === 'transcript' && (
              <p className="text-gray-400 p-4 bg-[#222] rounded-2xl border border-white/5 italic">
                No transcript is available for this recording yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
