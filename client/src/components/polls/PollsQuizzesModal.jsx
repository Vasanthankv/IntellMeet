import React, { useState, useEffect, useCallback } from 'react';
import {
  X, Plus, Trash2, ChevronDown, ChevronUp, BarChart2, ClipboardList,
  Play, Square, Share2, Download, RotateCcw, Check, Loader, BookOpen,
  Users, AlertCircle, Eye, EyeOff, GripVertical, ChevronRight
} from 'lucide-react';

const API = '${(typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1" ? "https://intellmeet-backend-h3md.onrender.com" : "http://localhost:5000")}/api';

const QUESTION_TYPES = [
  { value: 'SINGLE_CHOICE',   label: 'Single Choice',   desc: 'One answer only' },
  { value: 'MULTIPLE_CHOICE', label: 'Multiple Choice', desc: 'Select all that apply' },
  { value: 'MATCHING',        label: 'Matching',        desc: 'Match pairs together' },
  { value: 'RANK_ORDER',      label: 'Rank Order',      desc: 'Drag to rank options' },
  { value: 'SHORT_ANSWER',    label: 'Short Answer',    desc: 'Brief text response' },
  { value: 'LONG_ANSWER',     label: 'Long Answer',     desc: 'Extended text response' },
];

function genId() { return Math.random().toString(36).slice(2, 10); }

function emptyQuestion(order = 1) {
  return {
    questionId: genId(), order,
    questionText: '',
    questionType: 'SINGLE_CHOICE',
    options: [
      { optionId: genId(), text: '' },
      { optionId: genId(), text: '' },
    ],
    matchPairs: [{ pairId: genId(), left: '', right: '' }],
    correctAnswers: [],
    points: 1,
    isRequired: true,
  };
}

// ─── Animated results bar ─────────────────────────────────────────────────────
function ResultBar({ label, count, pct, isCorrect }) {
  return (
    <div className="mb-2">
      <div className="flex items-center justify-between text-xs text-gray-300 mb-1">
        <span className="truncate max-w-[180px]">{label}</span>
        <span className="ml-2 tabular-nums">{count} ({pct}%)</span>
      </div>
      <div className="h-5 bg-[#333] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${isCorrect === true ? 'bg-emerald-500' : isCorrect === false ? 'bg-red-500/60' : 'bg-indigo-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Question editor ──────────────────────────────────────────────────────────
function QuestionEditor({ q, onChange, onRemove, isQuiz, idx }) {
  const [collapsed, setCollapsed] = useState(false);

  const updateField = (field, val) => onChange({ ...q, [field]: val });

  const addOption = () => updateField('options', [...(q.options || []), { optionId: genId(), text: '' }]);
  const removeOption = (oid) => updateField('options', q.options.filter(o => o.optionId !== oid));
  const updateOption = (oid, text) => updateField('options', q.options.map(o => o.optionId === oid ? { ...o, text } : o));

  const addMatchPair = () => updateField('matchPairs', [...(q.matchPairs || []), { pairId: genId(), left: '', right: '' }]);
  const removeMatchPair = (pid) => updateField('matchPairs', q.matchPairs.filter(p => p.pairId !== pid));
  const updateMatchPair = (pid, side, val) => updateField('matchPairs', q.matchPairs.map(p => p.pairId === pid ? { ...p, [side]: val } : p));

  const toggleCorrect = (oid) => {
    if (q.questionType === 'SINGLE_CHOICE') {
      updateField('correctAnswers', [oid]);
    } else {
      const curr = q.correctAnswers || [];
      updateField('correctAnswers', curr.includes(oid) ? curr.filter(c => c !== oid) : [...curr, oid]);
    }
  };

  const showOptions = ['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'RANK_ORDER'].includes(q.questionType);
  const showMatching = q.questionType === 'MATCHING';
  const showText = ['SHORT_ANSWER', 'LONG_ANSWER'].includes(q.questionType);

  return (
    <div className="bg-[#1E1E1E] border border-[#2D2D2D] rounded-xl mb-3 overflow-hidden">
      <div className="flex items-center px-4 py-3 cursor-pointer gap-2" onClick={() => setCollapsed(!collapsed)}>
        <GripVertical className="w-4 h-4 text-gray-500 shrink-0" />
        <span className="text-xs font-semibold text-gray-400 w-5 shrink-0">Q{idx + 1}</span>
        <span className="text-sm text-gray-200 truncate flex-1">{q.questionText || 'Untitled question'}</span>
        <span className="text-[10px] text-gray-500 bg-[#2A2A2A] px-2 py-0.5 rounded shrink-0">
          {QUESTION_TYPES.find(t => t.value === q.questionType)?.label}
        </span>
        {collapsed ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronUp className="w-4 h-4 text-gray-500" />}
        <button onClick={(e) => { e.stopPropagation(); onRemove(); }} className="p-1 rounded hover:bg-red-500/20 text-red-400 shrink-0">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {!collapsed && (
        <div className="px-4 pb-4 space-y-3">
          {/* Question text */}
          <input
            value={q.questionText}
            onChange={e => updateField('questionText', e.target.value)}
            placeholder="Enter your question..."
            className="w-full bg-[#2A2A2A] border border-[#333] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
          />

          {/* Question type */}
          <select
            value={q.questionType}
            onChange={e => updateField('questionType', e.target.value)}
            className="bg-[#2A2A2A] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
          >
            {QUESTION_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label} — {t.desc}</option>
            ))}
          </select>

          {/* Options */}
          {showOptions && (
            <div>
              <p className="text-xs text-gray-400 mb-2">{isQuiz ? 'Options (check correct answer)' : 'Options'}</p>
              {(q.options || []).map((opt, oi) => (
                <div key={opt.optionId} className="flex items-center gap-2 mb-2">
                  {isQuiz && (
                    <button
                      onClick={() => toggleCorrect(opt.optionId)}
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                        (q.correctAnswers || []).includes(opt.optionId) ? 'border-emerald-500 bg-emerald-500' : 'border-gray-500'
                      }`}
                    >
                      {(q.correctAnswers || []).includes(opt.optionId) && <Check className="w-3 h-3 text-white" />}
                    </button>
                  )}
                  <input
                    value={opt.text}
                    onChange={e => updateOption(opt.optionId, e.target.value)}
                    placeholder={`Option ${oi + 1}`}
                    className="flex-1 bg-[#2A2A2A] border border-[#333] rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                  />
                  {(q.options || []).length > 2 && (
                    <button onClick={() => removeOption(opt.optionId)} className="text-red-400 hover:text-red-300">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button onClick={addOption} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 mt-1">
                <Plus className="w-3.5 h-3.5" /> Add option
              </button>
            </div>
          )}

          {/* Matching pairs */}
          {showMatching && (
            <div>
              <p className="text-xs text-gray-400 mb-2">Matching pairs</p>
              {(q.matchPairs || []).map((pair, pi) => (
                <div key={pair.pairId} className="flex items-center gap-2 mb-2">
                  <input
                    value={pair.left}
                    onChange={e => updateMatchPair(pair.pairId, 'left', e.target.value)}
                    placeholder={`Left ${pi + 1}`}
                    className="flex-1 bg-[#2A2A2A] border border-[#333] rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                  />
                  <ChevronRight className="w-4 h-4 text-gray-500 shrink-0" />
                  <input
                    value={pair.right}
                    onChange={e => updateMatchPair(pair.pairId, 'right', e.target.value)}
                    placeholder={`Right ${pi + 1}`}
                    className="flex-1 bg-[#2A2A2A] border border-[#333] rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                  />
                  {(q.matchPairs || []).length > 1 && (
                    <button onClick={() => removeMatchPair(pair.pairId)} className="text-red-400 hover:text-red-300">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button onClick={addMatchPair} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" /> Add pair
              </button>
            </div>
          )}

          {/* Text answer hint */}
          {showText && (
            <div className="text-xs text-gray-500 italic">Participants will type their answer in a text field.</div>
          )}

          {/* Quiz points */}
          {isQuiz && (
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-400">Points:</label>
              <input
                type="number" min="1" max="100"
                value={q.points || 1}
                onChange={e => updateField('points', parseInt(e.target.value) || 1)}
                className="w-20 bg-[#2A2A2A] border border-[#333] rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Live Results Panel ───────────────────────────────────────────────────────
function LiveResultsPanel({ poll, results, totalResponses }) {
  if (!results || !poll) return null;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-sm text-gray-300">
        <Users className="w-4 h-4 text-indigo-400" />
        <span><span className="font-bold text-white">{totalResponses}</span> response{totalResponses !== 1 ? 's' : ''}</span>
      </div>
      {poll.questions.map((q, qi) => {
        const qs = results[q.questionId];
        if (!qs) return null;
        const isTextQ = ['SHORT_ANSWER', 'LONG_ANSWER'].includes(q.questionType);
        return (
          <div key={q.questionId} className="bg-[#1E1E1E] border border-[#2D2D2D] rounded-xl p-4">
            <p className="text-sm font-semibold text-white mb-3">Q{qi + 1}: {q.questionText}</p>
            {isTextQ ? (
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {(qs.textAnswers || []).map((t, i) => (
                  <p key={i} className="text-xs text-gray-300 bg-[#2A2A2A] rounded px-3 py-1.5">{t}</p>
                ))}
                {!qs.textAnswers?.length && <p className="text-xs text-gray-500 italic">No text answers yet</p>}
              </div>
            ) : (
              <div>
                {(q.options || q.matchPairs || []).map((opt) => {
                  const optId = opt.optionId || opt.pairId;
                  const cnt = qs.optionCounts?.[optId] || 0;
                  const pct = qs.percentages?.[optId] || 0;
                  const isCorrect = poll.pollType === 'QUIZ' && q.correctAnswers?.length
                    ? q.correctAnswers.includes(optId) ? true : null
                    : null;
                  return (
                    <ResultBar
                      key={optId}
                      label={opt.text || `${opt.left} → ${opt.right}`}
                      count={cnt}
                      pct={pct}
                      isCorrect={isCorrect}
                    />
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────
export default function PollsQuizzesModal({
  isOpen, onClose, meetingId, socketRef, isHost = false, userId, activePoll, onActivePollChange
}) {
  const [tab, setTab] = useState('manage');  // 'manage' | 'create' | 'results' | 'library'
  const [pollType, setPollType] = useState('POLL');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [showResultsToParticipants, setShowResultsToParticipants] = useState(false);
  const [questions, setQuestions] = useState([emptyQuestion(1)]);
  const [polls, setPolls] = useState([]);
  const [libraryPolls, setLibraryPolls] = useState([]);
  const [selectedPoll, setSelectedPoll] = useState(null);
  const [results, setResults] = useState(null);
  const [totalResponses, setTotalResponses] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [listTab, setListTab] = useState('all');  // 'all' | 'active' | 'upcoming' | 'completed'

  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const fetchPolls = useCallback(async () => {
    if (!meetingId) return;
    try {
      const queryTab = listTab === 'all' ? '' : `&tab=${listTab}`;
      const r = await fetch(`${API}/polls?meetingId=${meetingId}${queryTab}`, { headers });
      const d = await r.json();
      if (d.success) setPolls(d.polls);
    } catch {}
  }, [meetingId, listTab]);

  const fetchLibrary = useCallback(async () => {
    try {
      const r = await fetch(`${API}/polls/library/list`, { headers });
      const d = await r.json();
      if (d.success) setLibraryPolls(d.polls);
    } catch {}
  }, []);

  const fetchResults = useCallback(async (pollId) => {
    if (!pollId) return;
    try {
      const r = await fetch(`${API}/polls/${pollId}/results`, { headers });
      const d = await r.json();
      if (d.success) { setResults(d.summary); setTotalResponses(d.totalResponses); }
    } catch {}
  }, []);

  useEffect(() => { if (isOpen) { fetchPolls(); fetchLibrary(); } }, [isOpen, listTab]);

  // Socket: live results update
  useEffect(() => {
    const sock = socketRef?.current;
    if (!sock) return;
    const onResultsUpdated = (data) => {
      if (selectedPoll && data.pollId === selectedPoll._id) {
        fetchResults(selectedPoll._id);
      }
    };
    const onPollEnded = (data) => { fetchPolls(); };
    sock.on('poll-results-updated', onResultsUpdated);
    sock.on('poll-ended', onPollEnded);
    return () => { sock.off('poll-results-updated', onResultsUpdated); sock.off('poll-ended', onPollEnded); };
  }, [socketRef, selectedPoll]);

  // When activePoll changes (from socket), refresh
  useEffect(() => {
    if (activePoll && tab === 'results') fetchResults(activePoll._id);
  }, [activePoll]);

  const resetCreate = () => {
    setTitle(''); setDescription(''); setIsAnonymous(false); setShowResultsToParticipants(false);
    setPollType('POLL'); setQuestions([emptyQuestion(1)]); setError('');
  };

  const addQuestion = () => {
    setQuestions(prev => [...prev, emptyQuestion(prev.length + 1)]);
  };

  const handleCreate = async () => {
    if (!title.trim()) { setError('Poll title is required'); return; }
    if (questions.some(q => !q.questionText.trim())) { setError('All questions must have text'); return; }
    setLoading(true); setError('');
    try {
      const r = await fetch(`${API}/polls`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ meetingId, title, pollType, description, isAnonymous, showResultsToParticipants, questions }),
      });
      const d = await r.json();
      if (!r.ok) { setError(d.message || 'Failed to create'); setLoading(false); return; }
      resetCreate();
      await fetchPolls();
      setTab('manage');
    } catch (e) { setError('Network error'); }
    setLoading(false);
  };

  const handleLaunch = async (poll) => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/polls/${poll._id}/launch`, { method: 'PUT', headers });
      const d = await r.json();
      if (d.success) {
        onActivePollChange?.(d.poll);
        socketRef?.current?.emit('poll-launch', meetingId, { poll: d.poll });
        if (d.poll.pollType === 'QUIZ') socketRef?.current?.emit('quiz-launch', meetingId, { poll: d.poll });
        await fetchPolls();
        setSelectedPoll(d.poll);
        fetchResults(d.poll._id);
        setTab('results');
      }
    } catch {}
    setLoading(false);
  };

  const handleEnd = async (poll) => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/polls/${poll._id}/end`, { method: 'PUT', headers });
      const d = await r.json();
      if (d.success) {
        onActivePollChange?.(null);
        socketRef?.current?.emit('poll-end', meetingId, { poll: d.poll });
        await fetchPolls();
        setSelectedPoll(d.poll);
        fetchResults(d.poll._id);
      }
    } catch {}
    setLoading(false);
  };

  const handleShare = async (poll) => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/polls/${poll._id}/share-results`, { method: 'PUT', headers });
      const d = await r.json();
      if (d.success) {
        socketRef?.current?.emit('poll-share-results', meetingId, { pollId: poll._id, summary: results, totalResponses });
        await fetchPolls(); setSelectedPoll(d.poll);
      }
    } catch {}
    setLoading(false);
  };

  const handleRelaunch = async (poll) => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/polls/${poll._id}/relaunch`, { method: 'POST', headers });
      const d = await r.json();
      if (d.success) {
        onActivePollChange?.(d.poll);
        socketRef?.current?.emit('poll-launch', meetingId, { poll: d.poll });
        await fetchPolls();
        setSelectedPoll(d.poll);
        fetchResults(d.poll._id);
        setTab('results');
      }
    } catch {}
    setLoading(false);
  };

  const handleDownloadReport = async (poll) => {
    try {
      const r = await fetch(`${API}/polls/${poll._id}/report`, { headers });
      const d = await r.json();
      if (d.success) {
        const blob = new Blob([JSON.stringify(d, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${poll.title.replace(/\s+/g, '_')}_report.json`;
        a.click();
      }
    } catch {}
  };

  const handleSaveToLibrary = async (poll) => {
    try {
      await fetch(`${API}/polls/${poll._id}/save-to-library`, { method: 'POST', headers });
      await fetchLibrary();
    } catch {}
  };

  const handleImportFromLibrary = async (libPoll) => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/polls/library/${libPoll._id}/import`, {
        method: 'POST', headers, body: JSON.stringify({ meetingId }),
      });
      const d = await r.json();
      if (d.success) { await fetchPolls(); setTab('manage'); }
    } catch {}
    setLoading(false);
  };

  const handleDeletePoll = async (poll) => {
    if (!window.confirm(`Delete "${poll.title}"?`)) return;
    try {
      await fetch(`${API}/polls/${poll._id}`, { method: 'DELETE', headers });
      await fetchPolls();
      if (selectedPoll?._id === poll._id) { setSelectedPoll(null); setResults(null); }
    } catch {}
  };

  const handleCreateBreakoutRooms = async (poll) => {
    if (!poll.questions?.[0]) return;
    try {
      const r = await fetch(`${API}/polls/${poll._id}/create-breakout-rooms`, {
        method: 'POST', headers,
        body: JSON.stringify({ questionId: poll.questions[0].questionId }),
      });
      const d = await r.json();
      if (d.success) {
        alert(`Ready to create ${d.rooms.length} breakout rooms!\n\nGroups:\n${d.rooms.map(r => `• ${r.name} (${r.participants.length} participants)`).join('\n')}`);
      }
    } catch {}
  };

  if (!isOpen) return null;

  const STATUS_COLORS = {
    DRAFT: 'text-gray-400 bg-gray-800',
    ACTIVE: 'text-emerald-400 bg-emerald-900/40',
    ENDED: 'text-orange-400 bg-orange-900/40',
    SHARED: 'text-indigo-400 bg-indigo-900/40',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#161616] border border-[#2D2D2D] rounded-2xl shadow-2xl w-full max-w-2xl mx-4 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2D2D2D] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-600/20 rounded-xl flex items-center justify-center">
              <BarChart2 className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Polls & Quizzes</h2>
              <p className="text-xs text-gray-400">Create, launch, and analyze</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-[#2A2A2A] text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#2D2D2D] px-4 shrink-0">
          {[
            { id: 'manage', label: 'Polls', icon: ClipboardList },
            { id: 'create', label: isHost ? 'Create' : null, icon: Plus },
            { id: 'results', label: selectedPoll ? 'Live Results' : null, icon: BarChart2 },
            { id: 'library', label: 'Library', icon: BookOpen },
          ].filter(t => t.label).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => {
                setTab(id);
                if (id === 'results' && selectedPoll) fetchResults(selectedPoll._id);
              }}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === id ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">

          {/* ── Manage tab ── */}
          {tab === 'manage' && (
            <div>
              {/* List tabs */}
              <div className="flex gap-1 mb-4">
                {['all','upcoming','active','completed'].map(lt => (
                  <button
                    key={lt}
                    onClick={() => setListTab(lt)}
                    className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors ${
                      listTab === lt ? 'bg-indigo-600 text-white' : 'bg-[#2A2A2A] text-gray-400 hover:text-white'
                    }`}
                  >
                    {lt}
                  </button>
                ))}
              </div>

              {polls.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <BarChart2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No polls yet. Create one to get started!</p>
                  {isHost && (
                    <button onClick={() => setTab('create')} className="mt-3 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm text-white">
                      Create Poll
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {polls.map(poll => (
                    <div key={poll._id} className="bg-[#1E1E1E] border border-[#2D2D2D] rounded-xl p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${poll.pollType === 'QUIZ' ? 'bg-amber-900/40 text-amber-400' : 'bg-indigo-900/40 text-indigo-400'}`}>
                              {poll.pollType}
                            </span>
                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[poll.status]}`}>
                              {poll.status}
                            </span>
                            {poll.isAnonymous && <EyeOff className="w-3 h-3 text-gray-500" title="Anonymous" />}
                          </div>
                          <p className="text-sm font-semibold text-white truncate">{poll.title}</p>
                          <p className="text-xs text-gray-500">{poll.questions?.length || 0} question{poll.questions?.length !== 1 ? 's' : ''} · {poll.totalResponses || 0} responses</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {isHost && poll.status === 'DRAFT' && (
                            <button onClick={() => handleLaunch(poll)} disabled={loading}
                              className="p-1.5 rounded-lg bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/40 transition-colors" title="Launch">
                              <Play className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {isHost && poll.status === 'ACTIVE' && (
                            <>
                              <button onClick={() => { setSelectedPoll(poll); fetchResults(poll._id); setTab('results'); }}
                                className="p-1.5 rounded-lg bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/40 transition-colors" title="Live Results">
                                <BarChart2 className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => handleEnd(poll)} disabled={loading}
                                className="p-1.5 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/40 transition-colors" title="End Poll">
                                <Square className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                          {isHost && poll.status === 'ENDED' && (
                            <>
                              <button onClick={() => { setSelectedPoll(poll); fetchResults(poll._id); setTab('results'); }}
                                className="p-1.5 rounded-lg bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/40" title="Results">
                                <BarChart2 className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => handleShare(poll)} disabled={loading}
                                className="p-1.5 rounded-lg bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/40" title="Share Results">
                                <Share2 className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => handleRelaunch(poll)} disabled={loading}
                                className="p-1.5 rounded-lg bg-amber-600/20 text-amber-400 hover:bg-amber-600/40" title="Relaunch">
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => handleCreateBreakoutRooms(poll)}
                                className="p-1.5 rounded-lg bg-purple-600/20 text-purple-400 hover:bg-purple-600/40" title="Create Breakout Rooms from results">
                                <Users className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                          <button onClick={() => handleDownloadReport(poll)}
                            className="p-1.5 rounded-lg hover:bg-[#2A2A2A] text-gray-400 hover:text-white" title="Download Report">
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          {isHost && (
                            <>
                              <button onClick={() => handleSaveToLibrary(poll)}
                                className="p-1.5 rounded-lg hover:bg-[#2A2A2A] text-gray-400 hover:text-white" title="Save to Library">
                                <BookOpen className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => handleDeletePoll(poll)}
                                className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400" title="Delete">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Create tab ── */}
          {tab === 'create' && isHost && (
            <div>
              {error && (
                <div className="flex items-center gap-2 bg-red-900/30 border border-red-500/40 rounded-lg px-4 py-3 mb-4 text-sm text-red-300">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              {/* Type selector */}
              <div className="flex gap-3 mb-4">
                {['POLL', 'QUIZ'].map(pt => (
                  <button
                    key={pt}
                    onClick={() => setPollType(pt)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-colors ${
                      pollType === pt
                        ? pt === 'QUIZ' ? 'border-amber-500 bg-amber-900/20 text-amber-400' : 'border-indigo-500 bg-indigo-900/20 text-indigo-400'
                        : 'border-[#2D2D2D] text-gray-400 hover:border-[#444]'
                    }`}
                  >
                    {pt === 'POLL' ? '📊 Poll' : '🧠 Quiz'}
                  </button>
                ))}
              </div>

              {/* Title */}
              <div className="mb-3">
                <label className="text-xs text-gray-400 mb-1.5 block">Title *</label>
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder={pollType === 'QUIZ' ? 'e.g. React Knowledge Quiz' : 'e.g. Meeting Feedback'}
                  className="w-full bg-[#2A2A2A] border border-[#333] rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Description */}
              <div className="mb-4">
                <label className="text-xs text-gray-400 mb-1.5 block">Description (optional)</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Add context for participants..."
                  className="w-full bg-[#2A2A2A] border border-[#333] rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              {/* Settings row */}
              <div className="flex items-center gap-5 mb-5 flex-wrap">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={isAnonymous} onChange={e => setIsAnonymous(e.target.checked)} className="rounded" />
                  <span className="text-xs text-gray-300">Anonymous responses</span>
                </label>
                {pollType === 'QUIZ' && (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={showResultsToParticipants} onChange={e => setShowResultsToParticipants(e.target.checked)} className="rounded" />
                    <span className="text-xs text-gray-300">Show score after submission</span>
                  </label>
                )}
              </div>

              {/* Questions */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Questions</label>
                  <span className="text-xs text-gray-500">{questions.length}/{pollType === 'QUIZ' ? 50 : 100}</span>
                </div>
                {questions.map((q, i) => (
                  <QuestionEditor
                    key={q.questionId}
                    q={q}
                    idx={i}
                    isQuiz={pollType === 'QUIZ'}
                    onChange={(updated) => setQuestions(prev => prev.map((pq, pi) => pi === i ? updated : pq))}
                    onRemove={() => setQuestions(prev => prev.filter((_, pi) => pi !== i))}
                  />
                ))}
                <button
                  onClick={addQuestion}
                  disabled={questions.length >= (pollType === 'QUIZ' ? 50 : 100)}
                  className="w-full py-2.5 border border-dashed border-[#2D2D2D] rounded-xl text-sm text-indigo-400 hover:border-indigo-500/50 hover:bg-indigo-600/5 transition-colors flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  <Plus className="w-4 h-4" /> Add Question
                </button>
              </div>

              {/* Action */}
              <div className="flex gap-3 mt-5">
                <button
                  onClick={() => { resetCreate(); setTab('manage'); }}
                  className="flex-1 py-2.5 rounded-xl border border-[#2D2D2D] text-sm text-gray-400 hover:text-white hover:border-[#444] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-sm font-semibold text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Save {pollType === 'QUIZ' ? 'Quiz' : 'Poll'}
                </button>
              </div>
            </div>
          )}

          {/* ── Results tab ── */}
          {tab === 'results' && (
            <div>
              {!selectedPoll ? (
                <div className="text-center py-12 text-gray-500">
                  <BarChart2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Launch a poll to see live results here</p>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm font-bold text-white">{selectedPoll.title}</p>
                      <p className="text-xs text-gray-500">{selectedPoll.pollType} · {selectedPoll.status}</p>
                    </div>
                    <div className="flex gap-2">
                      {selectedPoll.status === 'ACTIVE' && isHost && (
                        <button onClick={() => handleEnd(selectedPoll)}
                          className="px-3 py-1.5 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/40 text-xs font-medium flex items-center gap-1.5">
                          <Square className="w-3 h-3" /> End
                        </button>
                      )}
                      {selectedPoll.status === 'ENDED' && isHost && (
                        <button onClick={() => handleShare(selectedPoll)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/40 text-xs font-medium flex items-center gap-1.5">
                          <Share2 className="w-3 h-3" /> Share to All
                        </button>
                      )}
                      <button onClick={() => fetchResults(selectedPoll._id)}
                        className="px-3 py-1.5 rounded-lg bg-[#2A2A2A] text-gray-400 hover:text-white text-xs font-medium">
                        Refresh
                      </button>
                    </div>
                  </div>
                  <LiveResultsPanel poll={selectedPoll} results={results} totalResponses={totalResponses} />
                </div>
              )}
            </div>
          )}

          {/* ── Library tab ── */}
          {tab === 'library' && (
            <div>
              <p className="text-xs text-gray-400 mb-4">Save polls as reusable templates to import into any meeting.</p>
              {libraryPolls.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  <BookOpen className="w-8 h-8 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Your poll library is empty.</p>
                  <p className="text-xs mt-1">Save any poll to the library using the 📚 button in the Polls tab.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {libraryPolls.map(lp => (
                    <div key={lp._id} className="bg-[#1E1E1E] border border-[#2D2D2D] rounded-xl p-4 flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${lp.pollType === 'QUIZ' ? 'bg-amber-900/40 text-amber-400' : 'bg-indigo-900/40 text-indigo-400'}`}>
                            {lp.pollType}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-white truncate">{lp.libraryName || lp.title}</p>
                        <p className="text-xs text-gray-500">{lp.questions?.length || 0} questions</p>
                      </div>
                      <button
                        onClick={() => handleImportFromLibrary(lp)}
                        disabled={loading}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/40 text-xs font-medium transition-colors"
                      >
                        Import
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
