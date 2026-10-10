import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Circle, Send, BarChart2, Trophy, AlertCircle, Loader } from 'lucide-react';

const API = 'http://localhost:5000/api';

// ─── Progress bar for shared results ─────────────────────────────────────────
function ResultBar({ label, count, pct, isCorrect, myAnswer }) {
  return (
    <div className="mb-2.5">
      <div className="flex items-center justify-between text-xs text-gray-300 mb-1">
        <div className="flex items-center gap-1.5">
          {myAnswer && <CheckCircle className="w-3 h-3 text-indigo-400 shrink-0" />}
          <span className="truncate max-w-[200px]">{label}</span>
        </div>
        <span className="tabular-nums ml-2 shrink-0">{pct}%</span>
      </div>
      <div className="h-4 bg-[#2A2A2A] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${
            isCorrect === true ? 'bg-emerald-500' :
            isCorrect === false ? 'bg-gray-600' :
            myAnswer ? 'bg-indigo-500' : 'bg-indigo-700/60'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Participant view ─────────────────────────────────────────────────────────
export default function PollParticipantView({
  isOpen, onClose, activePoll, sharedResults, socketRef, meetingId, userId, userName
}) {
  const [answers, setAnswers] = useState({});      // questionId → answer state
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [quizResult, setQuizResult] = useState(null);  // { totalScore, maxScore, answers }
  const [error, setError] = useState('');
  const [view, setView] = useState('answer'); // 'answer' | 'results'

  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  // Reset on new poll
  useEffect(() => {
    if (activePoll) {
      setAnswers({});
      setSubmitted(false);
      setQuizResult(null);
      setError('');
      setView('answer');
    }
  }, [activePoll?._id]);

  // Switch to results view when host shares
  useEffect(() => {
    if (sharedResults && submitted) setView('results');
  }, [sharedResults]);

  const updateAnswer = (questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async () => {
    if (!activePoll) return;
    setSubmitting(true); setError('');
    try {
      // Build answer payload
      const payload = activePoll.questions.map(q => {
        const ans = answers[q.questionId];
        const base = { questionId: q.questionId };
        if (['SINGLE_CHOICE'].includes(q.questionType)) {
          return { ...base, selectedOptions: ans ? [ans] : [] };
        } else if (['MULTIPLE_CHOICE', 'RANK_ORDER'].includes(q.questionType)) {
          return { ...base, selectedOptions: Array.isArray(ans) ? ans : [] };
        } else if (q.questionType === 'MATCHING') {
          return { ...base, matchedPairs: Array.isArray(ans) ? ans : [] };
        } else {
          return { ...base, textAnswer: ans || '' };
        }
      });

      const r = await fetch(`${API}/polls/${activePoll._id}/respond`, {
        method: 'POST', headers,
        body: JSON.stringify({ answers: payload, participantName: userName || 'Participant' }),
      });
      const d = await r.json();
      if (!r.ok) { setError(d.message || 'Submission failed'); setSubmitting(false); return; }

      setSubmitted(true);
      if (d.score !== undefined) setQuizResult({ totalScore: d.score, maxScore: d.maxScore, answers: d.answers });

      // Notify host via socket
      socketRef?.current?.emit('poll-response-submit', meetingId, {
        pollId: activePoll._id, participantId: userId, participantName: userName
      });
      socketRef?.current?.emit('poll-results-update', meetingId, { pollId: activePoll._id });
    } catch { setError('Network error. Please try again.'); }
    setSubmitting(false);
  };

  if (!isOpen || !activePoll) return null;

  const isQuiz = activePoll.pollType === 'QUIZ';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-[#161616] border border-[#2D2D2D] rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2D2D2D] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isQuiz ? 'bg-amber-600/20' : 'bg-indigo-600/20'}`}>
              {isQuiz ? <Trophy className={`w-4 h-4 text-amber-400`} /> : <BarChart2 className="w-4 h-4 text-indigo-400" />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">{activePoll.title}</h3>
              <p className="text-[11px] text-gray-400">{isQuiz ? 'Quiz' : 'Poll'} · {activePoll.questions.length} question{activePoll.questions.length !== 1 ? 's' : ''}</p>
            </div>
            {/* Live indicator */}
            {!submitted && (
              <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-900/30 px-2 py-0.5 rounded-full ml-2">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                Live
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-[#2A2A2A] text-gray-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* Anonymous notice */}
          {activePoll.isAnonymous && (
            <div className="flex items-center gap-2 bg-indigo-900/20 border border-indigo-500/30 rounded-lg px-3 py-2 mb-4 text-xs text-indigo-300">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              Your response is anonymous
            </div>
          )}

          {/* Description */}
          {activePoll.description && (
            <p className="text-sm text-gray-400 mb-4">{activePoll.description}</p>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 bg-red-900/30 border border-red-500/40 rounded-lg px-3 py-2 mb-4 text-xs text-red-300">
              <AlertCircle className="w-3.5 h-3.5" /> {error}
            </div>
          )}

          {/* ── Quiz score result ── */}
          {submitted && quizResult && (
            <div className={`rounded-xl p-4 mb-4 text-center border ${quizResult.totalScore === quizResult.maxScore ? 'bg-emerald-900/20 border-emerald-500/30' : 'bg-indigo-900/20 border-indigo-500/30'}`}>
              <Trophy className={`w-8 h-8 mx-auto mb-2 ${quizResult.totalScore === quizResult.maxScore ? 'text-amber-400' : 'text-indigo-400'}`} />
              <p className="text-xl font-bold text-white">{quizResult.totalScore} / {quizResult.maxScore}</p>
              <p className="text-sm text-gray-300">
                {quizResult.maxScore > 0
                  ? `${Math.round((quizResult.totalScore / quizResult.maxScore) * 100)}% correct`
                  : 'Submitted'}
              </p>
            </div>
          )}

          {/* ── Submitted waiting state ── */}
          {submitted && !sharedResults && !quizResult && (
            <div className="text-center py-6 text-gray-400">
              <CheckCircle className="w-10 h-10 mx-auto mb-3 text-emerald-500" />
              <p className="text-sm font-medium text-white">Response submitted!</p>
              <p className="text-xs mt-1">Waiting for the host to share results...</p>
            </div>
          )}

          {/* ── Shared results view ── */}
          {view === 'results' && sharedResults && (
            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-4">Results</p>
              {activePoll.questions.map((q, qi) => {
                const qs = sharedResults[q.questionId];
                if (!qs) return null;
                const isTextQ = ['SHORT_ANSWER', 'LONG_ANSWER'].includes(q.questionType);
                const myAns = answers[q.questionId];
                return (
                  <div key={q.questionId} className="mb-5">
                    <p className="text-sm font-medium text-white mb-2">Q{qi+1}: {q.questionText}</p>
                    {isTextQ ? (
                      <p className="text-xs text-gray-400 italic">Text responses are private</p>
                    ) : (
                      (q.options || []).map(opt => {
                        const pct = qs.percentages?.[opt.optionId] || 0;
                        const cnt = qs.optionCounts?.[opt.optionId] || 0;
                        const isCorrect = isQuiz && q.correctAnswers?.length ? q.correctAnswers.includes(opt.optionId) ? true : null : null;
                        const isMyAnswer = Array.isArray(myAns) ? myAns.includes(opt.optionId) : myAns === opt.optionId;
                        return (
                          <ResultBar key={opt.optionId} label={opt.text} count={cnt} pct={pct} isCorrect={isCorrect} myAnswer={isMyAnswer} />
                        );
                      })
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Answer questions ── */}
          {!submitted && (
            <div className="space-y-5">
              {activePoll.questions.map((q, qi) => {
                const ans = answers[q.questionId];

                return (
                  <div key={q.questionId} className="bg-[#1E1E1E] border border-[#2D2D2D] rounded-xl p-4">
                    <div className="flex items-start gap-2 mb-3">
                      <span className="text-xs font-bold text-gray-500 mt-0.5 w-5 shrink-0">Q{qi+1}</span>
                      <p className="text-sm font-medium text-white leading-snug">{q.questionText}</p>
                      {q.isRequired && <span className="text-red-400 text-xs shrink-0">*</span>}
                    </div>

                    {/* Single choice */}
                    {q.questionType === 'SINGLE_CHOICE' && (
                      <div className="space-y-2">
                        {(q.options || []).map(opt => (
                          <button
                            key={opt.optionId}
                            onClick={() => updateAnswer(q.questionId, opt.optionId)}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border text-sm text-left transition-colors ${
                              ans === opt.optionId
                                ? 'border-indigo-500 bg-indigo-900/30 text-indigo-300'
                                : 'border-[#333] hover:border-indigo-500/50 text-gray-300 hover:bg-[#2A2A2A]'
                            }`}
                          >
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${ans === opt.optionId ? 'border-indigo-500' : 'border-gray-500'}`}>
                              {ans === opt.optionId && <div className="w-2 h-2 rounded-full bg-indigo-500" />}
                            </div>
                            {opt.text}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Multiple choice */}
                    {q.questionType === 'MULTIPLE_CHOICE' && (
                      <div className="space-y-2">
                        {(q.options || []).map(opt => {
                          const selected = Array.isArray(ans) && ans.includes(opt.optionId);
                          return (
                            <button
                              key={opt.optionId}
                              onClick={() => {
                                const curr = Array.isArray(ans) ? ans : [];
                                updateAnswer(q.questionId, selected ? curr.filter(id => id !== opt.optionId) : [...curr, opt.optionId]);
                              }}
                              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border text-sm text-left transition-colors ${
                                selected ? 'border-indigo-500 bg-indigo-900/30 text-indigo-300' : 'border-[#333] hover:border-indigo-500/50 text-gray-300 hover:bg-[#2A2A2A]'
                              }`}
                            >
                              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${selected ? 'border-indigo-500 bg-indigo-500' : 'border-gray-500'}`}>
                                {selected && <X className="w-2.5 h-2.5 text-white font-bold" />}
                              </div>
                              {opt.text}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Rank order */}
                    {q.questionType === 'RANK_ORDER' && (
                      <div>
                        <p className="text-xs text-gray-500 mb-2">Click options in order of preference (1st = top rank)</p>
                        {(q.options || []).map(opt => {
                          const ranked = Array.isArray(ans) ? ans : [];
                          const rank = ranked.indexOf(opt.optionId);
                          return (
                            <button
                              key={opt.optionId}
                              onClick={() => {
                                if (rank === -1) {
                                  updateAnswer(q.questionId, [...ranked, opt.optionId]);
                                } else {
                                  updateAnswer(q.questionId, ranked.filter(id => id !== opt.optionId));
                                }
                              }}
                              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border text-sm text-left transition-colors mb-2 ${
                                rank !== -1 ? 'border-indigo-500 bg-indigo-900/30 text-indigo-300' : 'border-[#333] hover:border-indigo-500/50 text-gray-300 hover:bg-[#2A2A2A]'
                              }`}
                            >
                              <span className={`w-6 h-6 rounded-full text-[11px] font-bold flex items-center justify-center shrink-0 ${rank !== -1 ? 'bg-indigo-600 text-white' : 'bg-[#333] text-gray-400'}`}>
                                {rank !== -1 ? rank + 1 : '—'}
                              </span>
                              {opt.text}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Matching */}
                    {q.questionType === 'MATCHING' && (
                      <div className="space-y-3">
                        <p className="text-xs text-gray-500">Match each item on the left with its corresponding item on the right.</p>
                        {(q.matchPairs || []).map((pair, pi) => {
                          const currPairs = Array.isArray(ans) ? ans : [];
                          const existing = currPairs.find(p => p.left === pair.left);
                          return (
                            <div key={pair.pairId} className="flex items-center gap-2">
                              <span className="text-sm text-gray-300 flex-1 px-3 py-2 bg-[#2A2A2A] rounded-lg">{pair.left}</span>
                              <span className="text-gray-500">→</span>
                              <select
                                value={existing?.right || ''}
                                onChange={e => {
                                  const updated = currPairs.filter(p => p.left !== pair.left);
                                  if (e.target.value) updated.push({ left: pair.left, right: e.target.value });
                                  updateAnswer(q.questionId, updated);
                                }}
                                className="flex-1 bg-[#2A2A2A] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                              >
                                <option value="">Select...</option>
                                {(q.matchPairs || []).map(mp => (
                                  <option key={mp.pairId} value={mp.right}>{mp.right}</option>
                                ))}
                              </select>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Short Answer */}
                    {q.questionType === 'SHORT_ANSWER' && (
                      <input
                        value={ans || ''}
                        onChange={e => updateAnswer(q.questionId, e.target.value)}
                        placeholder="Your answer..."
                        maxLength={200}
                        className="w-full bg-[#2A2A2A] border border-[#333] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                      />
                    )}

                    {/* Long Answer */}
                    {q.questionType === 'LONG_ANSWER' && (
                      <textarea
                        value={ans || ''}
                        onChange={e => updateAnswer(q.questionId, e.target.value)}
                        placeholder="Your detailed answer..."
                        rows={3}
                        maxLength={2000}
                        className="w-full bg-[#2A2A2A] border border-[#333] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 resize-none"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {!submitted && (
          <div className="px-5 py-4 border-t border-[#2D2D2D] shrink-0">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className={`w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors ${
                isQuiz
                  ? 'bg-amber-600 hover:bg-amber-700 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              } disabled:opacity-50`}
            >
              {submitting
                ? <><Loader className="w-4 h-4 animate-spin" /> Submitting...</>
                : <><Send className="w-4 h-4" /> Submit {isQuiz ? 'Quiz' : 'Poll'}</>
              }
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
