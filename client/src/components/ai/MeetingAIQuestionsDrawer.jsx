import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Sparkles, Send, Clock, 
  User, CheckCircle2, ChevronRight, Play, Square, 
  Settings, AlertCircle, HelpCircle, ArrowRight, CornerDownLeft,
  Volume2, Shield, Lock, FileText, Check, ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function MeetingAIQuestionsDrawer({
  isOpen,
  onClose,
  meetingId,
  isHost,
  user,
  socketRef,
  isInBreakoutRoom = false,
  onSeekToTimestamp = null,
  onOpenTranscript = null
}) {
  const [session, setSession] = useState(null);
  const [questionsList, setQuestionsList] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [hasRequested, setHasRequested] = useState(false);
  const feedEndRef = useRef(null);

  // Settings states
  const [whoCanAsk, setWhoCanAsk] = useState('ALL_PARTICIPANTS');
  const [contextScope, setContextScope] = useState('ENTIRE_MEETING');
  const [includeChat, setIncludeChat] = useState(true);
  const [includeOcr, setIncludeOcr] = useState(true);

  // Load session & history
  const fetchSessionAndHistory = async () => {
    if (!meetingId) return;
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const [sessRes, histRes] = await Promise.all([
        fetch(`${(typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1" ? "https://intellmeet-backend-h3md.onrender.com" : "http://localhost:5000")}/api/meetings/${meetingId}/questions/session`, { headers }),
        fetch(`${(typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1" ? "https://intellmeet-backend-h3md.onrender.com" : "http://localhost:5000")}/api/meetings/${meetingId}/questions/history`, { headers })
      ]);

      const sessData = await sessRes.json();
      if (sessData.success && sessData.session) {
        setSession(sessData.session);
        if (sessData.session.permissions?.whoCanAsk) setWhoCanAsk(sessData.session.permissions.whoCanAsk);
        if (sessData.session.permissions?.contextScope) setContextScope(sessData.session.permissions.contextScope);
      }

      const histData = await histRes.json();
      if (histData.success && histData.questions) {
        setQuestionsList(histData.questions);
      }
    } catch (e) {
      console.warn('Could not load AI Questions data:', e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchSessionAndHistory();
    }
  }, [isOpen, meetingId]);

  // Scroll to bottom on new questions
  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [questionsList, isAsking]);

  // Socket event listener
  useEffect(() => {
    const socket = socketRef?.current;
    if (!socket) return;

    const handleStarted = () => {
      setSession(prev => ({ ...prev, status: 'ACTIVE' }));
      toast.success('AI Meeting Questions is now active', { icon: '🤖' });
    };

    const handleStopped = () => {
      setSession(prev => ({ ...prev, status: 'DISABLED' }));
      toast('AI Meeting Questions paused/stopped', { icon: '⏹️' });
    };

    const handleNewQuestion = (qItem) => {
      setQuestionsList(prev => {
        if (prev.some(q => q.questionId === qItem.questionId)) return prev;
        return [...prev, qItem];
      });
    };

    const handleRequested = (reqData) => {
      if (isHost) {
        toast(`Participant ${reqData.userName || 'Someone'} requested to enable AI Meeting Questions`, { icon: '❓' });
      }
    };

    socket.on('ai-questions-started', handleStarted);
    socket.on('ai-questions-stopped', handleStopped);
    socket.on('ai-question-new', handleNewQuestion);
    socket.on('ai-question-requested', handleRequested);

    return () => {
      socket.off('ai-questions-started', handleStarted);
      socket.off('ai-questions-stopped', handleStopped);
      socket.off('ai-question-new', handleNewQuestion);
      socket.off('ai-question-requested', handleRequested);
    };
  }, [socketRef, isHost]);

  // Host Start / Stop Session (26.4, 26.18)
  const handleToggleSession = async () => {
    if (!isHost) return;
    const token = localStorage.getItem('token');
    const isCurrentlyActive = session?.status === 'ACTIVE';
    const endpoint = isCurrentlyActive ? 'stop' : 'start';

    try {
      const res = await fetch(`${(typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1" ? "https://intellmeet-backend-h3md.onrender.com" : "http://localhost:5000")}/api/meetings/${meetingId}/questions/${endpoint}`, {
        method: isCurrentlyActive ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setSession(prev => ({ ...prev, status: isCurrentlyActive ? 'DISABLED' : 'ACTIVE' }));
        socketRef?.current?.emit(isCurrentlyActive ? 'ai-questions-stop' : 'ai-questions-start', meetingId);
        toast.success(isCurrentlyActive ? 'AI Meeting Questions stopped' : 'AI Meeting Questions started');
      }
    } catch (e) {
      toast.error('Failed to toggle AI Questions');
    }
  };

  // Participant Request to Enable (26.4)
  const handleRequestEnable = () => {
    socketRef?.current?.emit('ai-question-request', meetingId, {
      userId: user?.id || user?._id || 'participant',
      userName: user?.name || 'Participant'
    });
    setHasRequested(true);
    toast.success('Requested host to enable AI Meeting Questions');
  };

  // Ask Question (Preset or Custom) (26.5 - 26.11)
  const handleAsk = async (questionText, presetType = 'CUSTOM') => {
    const q = (questionText || inputText).trim();
    if (!q) return;

    if (session?.status !== 'ACTIVE' && !isHost) {
      toast.error('AI Meeting Questions is not active');
      return;
    }

    setIsAsking(true);
    setInputText('');

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${(typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1" ? "https://intellmeet-backend-h3md.onrender.com" : "http://localhost:5000")}/api/meetings/${meetingId}/questions/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          question: q,
          presetType
        })
      });
      const data = await res.json();
      if (data.success && data.questionItem) {
        setQuestionsList(prev => [...prev, data.questionItem]);
        socketRef?.current?.emit('ai-question-submit', meetingId, data.questionItem);
      } else {
        toast.error(data.message || 'Failed to get answer');
      }
    } catch (e) {
      toast.error('Network error asking AI question');
    } finally {
      setIsAsking(false);
    }
  };

  // Save Settings (26.12, 26.13)
  const handleSaveSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${(typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1" ? "https://intellmeet-backend-h3md.onrender.com" : "http://localhost:5000")}/api/meetings/${meetingId}/questions/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          whoCanAsk,
          contextScope,
          allowedSources: {
            transcript: true,
            chat: includeChat,
            screenOcr: includeOcr
          }
        })
      });
      const data = await res.json();
      if (data.success) {
        setSession(data.session);
        setShowSettings(false);
        toast.success('Question permissions saved');
      }
    } catch (e) {
      toast.error('Could not save settings');
    }
  };

  if (!isOpen) return null;

  const isActive = session?.status === 'ACTIVE';

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[450px] bg-[#1E1E1E] text-white shadow-2xl border-l border-[#333] flex flex-col animate-in slide-in-from-right duration-200">
      
      {/* Header */}
      <div className="px-5 py-4 border-b border-[#333] flex items-center justify-between bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-[#1E1E1E]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center">
            <HelpCircle className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-white">Meeting Questions</h3>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                isActive ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
              }`}>
                {isActive ? 'Active' : 'Paused'}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">Ask about current meeting without interrupting (Zoom AI)</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {isHost && (
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
              title="Question settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Breakout Room Limitation Notice (26.19) */}
      {isInBreakoutRoom && (
        <div className="px-4 py-2.5 bg-amber-950/40 border-b border-amber-800/40 flex items-center gap-2.5 text-xs text-amber-200">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Zoom AI limitation: Meeting Questions are available in the Main Meeting only.</span>
        </div>
      )}

      {/* Host Control Bar or Participant Request Notice (26.4, 26.5) */}
      {!isInBreakoutRoom && (
        <div className="px-4 py-2 bg-[#252525] border-b border-[#333] flex items-center justify-between text-xs">
          {isHost ? (
            <>
              <span className="text-zinc-400">Host Control:</span>
              <button
                onClick={handleToggleSession}
                className={`px-3 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition-colors ${
                  isActive 
                    ? 'bg-rose-900/60 hover:bg-rose-900 text-rose-200' 
                    : 'bg-purple-600 hover:bg-purple-500 text-white'
                }`}
              >
                {isActive ? <Square className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                <span>{isActive ? 'Stop AI Questions' : 'Start AI Questions'}</span>
              </button>
            </>
          ) : !isActive ? (
            <div className="w-full flex items-center justify-between">
              <span className="text-zinc-400">Questions are inactive</span>
              <button
                onClick={handleRequestEnable}
                disabled={hasRequested}
                className="px-3 py-1 bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-700 text-white rounded-lg font-semibold"
              >
                {hasRequested ? 'Requested' : 'Request to Enable'}
              </button>
            </div>
          ) : (
            <span className="text-emerald-400 flex items-center gap-1.5 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live context grounded in speech & chat
            </span>
          )}
        </div>
      )}

      {/* Host Settings Popover (26.12, 26.13) */}
      {showSettings && isHost && (
        <div className="p-4 bg-[#2A2A2A] border-b border-[#3A3A3A] space-y-3 text-xs">
          <div className="font-bold text-white flex items-center justify-between">
            <span>Question Settings (26.12)</span>
            <button onClick={() => setShowSettings(false)} className="text-zinc-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div>
            <label className="text-zinc-400 block mb-1">Who can ask questions?</label>
            <select
              value={whoCanAsk}
              onChange={(e) => setWhoCanAsk(e.target.value)}
              className="w-full bg-[#1E1E1E] border border-zinc-700 rounded-lg p-1.5 text-zinc-200 focus:outline-none"
            >
              <option value="ALL_PARTICIPANTS">All participants and invitees</option>
              <option value="HOST_AND_COHOST">Host and co-hosts only</option>
              <option value="ORGANIZATION_ONLY">Organization users only</option>
            </select>
          </div>

          <div>
            <label className="text-zinc-400 block mb-1">Context Query Window (26.13)</label>
            <select
              value={contextScope}
              onChange={(e) => setContextScope(e.target.value)}
              className="w-full bg-[#1E1E1E] border border-zinc-700 rounded-lg p-1.5 text-zinc-200 focus:outline-none"
            >
              <option value="ENTIRE_MEETING">Entire meeting since AI started</option>
              <option value="SINCE_JOINED">Only since participant joined</option>
            </select>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={handleSaveSettings}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-semibold"
            >
              Save Settings
            </button>
          </div>
        </div>
      )}

      {/* Preset Question Chips (26.6, 26.8) */}
      {!isInBreakoutRoom && (
        <div className="p-3 border-b border-[#333] bg-[#222] space-y-2">
          <div className="text-[11px] text-zinc-400 font-semibold uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-purple-400" />
            Suggested Questions (26.6)
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[
              { label: 'Catch me up', type: 'CATCH_ME_UP' },
              { label: 'What are the action items?', type: 'ACTION_ITEMS' },
              { label: 'What decisions were made?', type: 'DECISIONS' },
              { label: 'Was a deadline agreed on?', type: 'DEADLINES' },
              { label: 'Was my name mentioned?', type: 'MY_NAME' }
            ].map((chip) => (
              <button
                key={chip.type}
                onClick={() => handleAsk(chip.label, chip.type)}
                disabled={isAsking || (!isActive && !isHost)}
                className="px-2.5 py-1 bg-[#2D2D2D] hover:bg-purple-900/40 hover:border-purple-600 text-zinc-300 hover:text-white rounded-full text-[11px] border border-[#3D3D3D] transition-all disabled:opacity-50"
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Questions & Answers Chat Feed (26.21, 26.22) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {questionsList.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-500">
            <HelpCircle className="w-10 h-10 text-zinc-600 mb-3" />
            <p className="text-sm font-semibold text-zinc-300">Ask about this meeting</p>
            <p className="text-xs text-zinc-500 mt-1 max-w-xs">
              AI answers directly from the meeting transcript and chat without interrupting the conversation.
            </p>
          </div>
        ) : (
          questionsList.map((item) => {
            const isMe = item.userId === (user?.id || user?._id);

            return (
              <div key={item.questionId || item.id} className="space-y-2">
                {/* User's Question */}
                <div className="flex items-start gap-2.5 justify-end">
                  <div className="bg-purple-600 text-white rounded-2xl rounded-tr-none px-3.5 py-2 max-w-[85%] text-xs shadow-sm">
                    <p className="font-medium">{item.question}</p>
                    <span className="text-[10px] text-purple-200 mt-1 block text-right">
                      {item.userName || 'You'} • {new Date(item.askedAt || item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                {/* AI Answer Card with Sources (26.9, 26.11, 26.24) */}
                {item.answer ? (
                  <div className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-purple-600/30 border border-purple-500/40 flex items-center justify-center shrink-0 mt-0.5">
                      <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    </div>

                    <div className="bg-[#2A2A2A] border border-[#3A3A3A] rounded-2xl rounded-tl-none p-3.5 max-w-[90%] text-xs space-y-2.5 text-zinc-200 shadow-md">
                      <div className="whitespace-pre-line leading-relaxed text-zinc-100">
                        {item.answer.text}
                      </div>

                      {/* Cited Sources (26.9, 26.11) */}
                      {item.answer.sources && item.answer.sources.length > 0 && (
                        <div className="pt-2 border-t border-[#3A3A3A] space-y-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 block">
                            Ground Truth Sources:
                          </span>
                          {item.answer.sources.map((src, sIdx) => (
                            <div key={sIdx} className="bg-[#222] p-2 rounded-lg border border-[#333] flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 mb-0.5">
                                  <Clock className="w-3 h-3 text-purple-400" />
                                  <strong className="text-zinc-200">{src.timecode}</strong>
                                  <span>— {src.speakerName}</span>
                                </div>
                                <p className="text-[11px] text-zinc-300 italic truncate">
                                  "{src.textSnippet}"
                                </p>
                              </div>

                              {onSeekToTimestamp && src.startTime !== undefined && (
                                <button
                                  onClick={() => onSeekToTimestamp(src.startTime)}
                                  className="text-[10px] text-purple-400 hover:text-purple-300 font-semibold px-2 py-1 bg-purple-900/30 hover:bg-purple-900/50 rounded flex items-center gap-1 shrink-0"
                                  title="Jump playback to this timestamp"
                                >
                                  <span>Jump</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-zinc-400 pl-9">
                    <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
                    <span>AI is searching meeting context...</span>
                  </div>
                )}
              </div>
            );
          })
        )}

        {isAsking && (
          <div className="flex items-center gap-2 text-xs text-zinc-400 pl-9">
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
            <span>AI is searching meeting context...</span>
          </div>
        )}
        <div ref={feedEndRef} />
      </div>

      {/* Input Box (26.5, 26.7) */}
      <div className="p-3 border-t border-[#333] bg-[#222]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAsk();
          }}
          className="flex items-center gap-2 bg-[#1E1E1E] border border-zinc-700 rounded-xl px-3 py-1.5 focus-within:border-purple-500 transition-colors"
        >
          <input
            type="text"
            placeholder={isInBreakoutRoom ? 'Unavailable in breakout rooms' : 'Ask about this meeting...'}
            disabled={isInBreakoutRoom || isAsking}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 bg-transparent text-xs text-white placeholder-zinc-500 focus:outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isInBreakoutRoom || isAsking}
            className="p-1.5 bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-800 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
