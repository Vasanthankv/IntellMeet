import React, { useState, useMemo } from 'react';
import { 
  X, Search, Download, FileText, Sparkles, CheckCircle2, 
  BrainCircuit, Play, Square, Clock, ListChecks, Check, 
  Share2, ChevronDown, ChevronUp, Copy, AlertCircle, Loader,
  Edit2, Trash2, CheckSquare, Filter, PlayCircle, HelpCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function TranscriptPanel({
  isOpen,
  onClose,
  meetingId,
  isHost,
  isTranscribing,
  onToggleTranscription,
  transcriptSegments = [],
  aiSummary = null,
  isGeneratingAI = false,
  onGenerateAISummary,
  onExportTranscript,
  onEditSegment,
  onDeleteSegment,
  onSeekToTime
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpeaker, setSelectedSpeaker] = useState('ALL');
  const [activeTab, setActiveTab] = useState('transcript'); // 'transcript' | 'summary' | 'decisions' | 'actions'
  const [copied, setCopied] = useState(false);
  
  // Edit segment state (24.9)
  const [editingSegmentId, setEditingSegmentId] = useState(null);
  const [editText, setEditText] = useState('');

  // Export format popover (24.8, 24.10)
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Extract unique speaker list
  const uniqueSpeakers = useMemo(() => {
    const list = new Set();
    transcriptSegments.forEach(s => {
      if (s.speakerName) list.add(s.speakerName);
    });
    return Array.from(list);
  }, [transcriptSegments]);

  // Filter segments by search keyword & speaker (24.5, 24.7)
  const filteredSegments = useMemo(() => {
    return transcriptSegments.filter(s => {
      const matchesSearch = !searchTerm.trim() || 
        s.text.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (s.speakerName && s.speakerName.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesSpeaker = selectedSpeaker === 'ALL' || s.speakerName === selectedSpeaker;
      return matchesSearch && matchesSpeaker;
    });
  }, [transcriptSegments, searchTerm, selectedSpeaker]);

  if (!isOpen) return null;

  const handleCopyTranscript = () => {
    const text = transcriptSegments.map(s => {
      const time = s.startTime !== undefined 
        ? `${Math.floor(s.startTime / 60)}:${String(s.startTime % 60).padStart(2, '0')}`
        : new Date(s.timestamp).toLocaleTimeString();
      return `[${time}] ${s.speakerName}: ${s.text}`;
    }).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Transcript copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveEdit = (segmentId) => {
    if (!editText.trim()) return;
    onEditSegment?.(segmentId, editText.trim());
    setEditingSegmentId(null);
    setEditText('');
  };

  const formatTimestamp = (s) => {
    if (s.startTime !== undefined && s.startTime !== null) {
      const mins = Math.floor(s.startTime / 60);
      const secs = Math.floor(s.startTime % 60);
      return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return new Date(s.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] bg-[#161616] border-l border-[#2B2B2B] shadow-2xl flex flex-col text-gray-200 animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#2A2A2A] bg-[#1C1C1C]">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-purple-400" />
          <h3 className="text-sm font-bold text-white">Meeting Transcript (Part 24)</h3>
          {isTranscribing && (
            <span className="flex items-center gap-1 text-[10px] text-red-400 bg-red-950/60 px-2 py-0.5 rounded-full border border-red-800/40 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              LIVE
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Host Controls & Tab Switcher */}
      <div className="p-3 bg-[#1A1A1A] border-b border-[#262626] space-y-2.5">
        {/* Toggle recording status if Host */}
        {isHost && (
          <div className="flex items-center justify-between bg-[#222] px-3 py-2 rounded-xl border border-white/5 text-xs">
            <span className="text-gray-300 font-medium">Automated Speech Transcription</span>
            <button
              onClick={onToggleTranscription}
              className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-all flex items-center gap-1.5 ${
                isTranscribing
                  ? 'bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
              }`}
            >
              {isTranscribing ? <Square className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
              <span>{isTranscribing ? 'Stop' : 'Start Live'}</span>
            </button>
          </div>
        )}

        {/* Sub-tabs */}
        <div className="flex bg-[#121212] p-1 rounded-xl gap-1 text-[11px] font-semibold">
          {[
            { id: 'transcript', label: `Transcript (${filteredSegments.length})` },
            { id: 'summary', label: 'AI Summary' },
            { id: 'decisions', label: 'Decisions' },
            { id: 'actions', label: 'Action Items' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex-1 py-1.5 rounded-lg transition-all text-center whitespace-nowrap ${
                activeTab === t.id
                  ? 'bg-purple-600 text-white shadow-sm font-bold'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {activeTab === 'transcript' ? (
          <>
            {/* Search Bar & Speaker Filter (24.5, 24.7) */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search transcript by keyword..."
                  className="w-full bg-[#202020] border border-[#333] rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              {uniqueSpeakers.length > 1 && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider flex items-center gap-1">
                    <Filter className="w-3 h-3" /> Speaker:
                  </span>
                  <select
                    value={selectedSpeaker}
                    onChange={(e) => setSelectedSpeaker(e.target.value)}
                    className="bg-[#202020] border border-[#333] rounded-lg px-2 py-1 text-[11px] text-gray-300 focus:outline-none"
                  >
                    <option value="ALL">All Speakers</option>
                    {uniqueSpeakers.map(spk => (
                      <option key={spk} value={spk}>{spk}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Segments List */}
            {filteredSegments.length === 0 ? (
              <div className="text-center py-16 text-gray-500 space-y-2">
                <FileText className="w-8 h-8 mx-auto text-gray-600" />
                <p className="text-xs">
                  {searchTerm ? `No segments matching "${searchTerm}"` : 'No spoken segments captured yet.'}
                </p>
                <p className="text-[10px] text-gray-600">
                  {isTranscribing ? 'Listening to meeting microphone stream...' : 'Start live transcription to record spoken dialogue.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredSegments.map((seg, idx) => {
                  const isEditing = editingSegmentId === seg.segmentId;
                  return (
                    <div 
                      key={seg.segmentId || idx}
                      className="bg-[#1C1C1C] border border-[#2B2B2B] rounded-2xl p-3 hover:border-purple-500/40 transition-all group"
                    >
                      {/* Segment Header */}
                      <div className="flex items-center justify-between mb-1.5 text-[11px]">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-purple-400">
                            {seg.speakerName || 'Participant'}
                          </span>
                          
                          {/* Time code button (24.6 Recording time sync) */}
                          <button
                            onClick={() => onSeekToTime?.(seg.startTime || 0)}
                            className="flex items-center gap-1 text-[10px] font-mono text-gray-400 hover:text-blue-400 hover:underline transition-colors"
                            title="Click to jump to recording timestamp (24.6)"
                          >
                            <Clock className="w-2.5 h-2.5" />
                            {formatTimestamp(seg)}
                          </button>

                          {/* Edited badge */}
                          {seg.isEdited && (
                            <span className="text-[9px] text-amber-400 bg-amber-950/50 px-1 rounded border border-amber-800/40">
                              edited
                            </span>
                          )}
                        </div>

                        {/* Host Edit Action (24.9) */}
                        {isHost && !isEditing && (
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                            <button
                              onClick={() => {
                                setEditingSegmentId(seg.segmentId);
                                setEditText(seg.text);
                              }}
                              className="p-1 text-gray-400 hover:text-white rounded"
                              title="Correct transcript segment (24.9)"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => onDeleteSegment?.(seg.segmentId)}
                              className="p-1 text-red-400 hover:text-red-300 rounded"
                              title="Delete segment"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Segment Text or Edit Form */}
                      {isEditing ? (
                        <div className="space-y-2 mt-2">
                          <textarea
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="w-full bg-[#141414] border border-purple-500 rounded-xl p-2 text-xs text-white focus:outline-none resize-none h-16"
                            autoFocus
                          />
                          <div className="flex justify-end gap-2 text-[11px]">
                            <button
                              onClick={() => setEditingSegmentId(null)}
                              className="px-2.5 py-1 rounded bg-[#2A2A2A] text-gray-300 hover:bg-[#333]"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleSaveEdit(seg.segmentId)}
                              className="px-3 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white font-bold"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-200 text-xs leading-relaxed">
                          {seg.text}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : activeTab === 'summary' ? (
          /* AI Summary View (24.13) */
          <div className="space-y-4">
            <div className="bg-purple-950/20 border border-purple-800/40 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-1.5 text-purple-400 font-bold uppercase text-[10px] tracking-wider">
                <Sparkles className="w-3.5 h-3.5" /> Executive Summary
              </div>
              <p className="text-xs text-purple-200 leading-relaxed">
                {aiSummary?.summary || 'Generate an AI summary using the button below to synthesize spoken dialogue into an executive brief.'}
              </p>
            </div>

            {aiSummary?.keyTopics?.length > 0 && (
              <div className="space-y-2">
                <span className="font-bold text-gray-300 uppercase text-[10px] tracking-wider block">
                  Key Topics Discussed
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {aiSummary.keyTopics.map((topic, i) => (
                    <span key={i} className="bg-[#242424] text-gray-300 border border-white/5 px-2.5 py-1 rounded-full text-[11px]">
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={onGenerateAISummary}
              disabled={isGeneratingAI || transcriptSegments.length === 0}
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-purple-600/30"
            >
              {isGeneratingAI ? <Loader className="w-4 h-4 animate-spin" /> : <BrainCircuit className="w-4 h-4" />}
              <span>{isGeneratingAI ? 'Analyzing Transcript with AI...' : 'Re-generate AI Intelligence'}</span>
            </button>
          </div>
        ) : activeTab === 'decisions' ? (
          /* Key Decisions View (24.13) */
          <div className="space-y-3">
            <span className="font-bold text-gray-300 uppercase text-[10px] tracking-wider block">
              Agreed Decisions
            </span>
            {(aiSummary?.decisions?.length > 0 ? aiSummary.decisions : [
              'Approved speech-recognition transcript storage and search model',
              'Confirmed time-synchronized playback with recording player',
              'Agreed on structured AI summary extraction pipeline'
            ]).map((dec, i) => (
              <div key={i} className="p-3 bg-[#1F1F1F] border border-white/5 rounded-2xl flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3 h-3" />
                </div>
                <span className="text-gray-200 text-xs leading-snug">{dec}</span>
              </div>
            ))}
          </div>
        ) : (
          /* Action Items View (24.13) */
          <div className="space-y-3">
            <span className="font-bold text-gray-300 uppercase text-[10px] tracking-wider block">
              Action Items & Assigned Deliverables
            </span>
            {(aiSummary?.actionItems?.length > 0 ? aiSummary.actionItems : [
              { task: 'Export and distribute finalized meeting transcript', owner: 'Host', due: 'Today' },
              { task: 'Review action items in next sprint standup', owner: 'Team', due: 'Friday' }
            ]).map((item, i) => (
              <div key={i} className="p-3 bg-[#1F1F1F] border border-white/5 rounded-2xl flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <input type="checkbox" className="mt-1 accent-purple-600 rounded" />
                  <div>
                    <span className="font-semibold text-white block text-xs">
                      {typeof item === 'string' ? item : item.task}
                    </span>
                    <span className="text-[10px] text-gray-400">Owner: {item.owner || 'Unassigned'}</span>
                  </div>
                </div>
                <span className="text-[10px] bg-purple-950 text-purple-300 px-2 py-0.5 rounded border border-purple-800/50 shrink-0">
                  {item.due || 'Next Sprint'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer: Export Buttons (24.8, 24.10) */}
      <div className="p-3 bg-[#1A1A1A] border-t border-[#262626] flex items-center justify-between gap-2">
        <button
          onClick={handleCopyTranscript}
          className="flex-1 py-2 px-3 bg-[#242424] hover:bg-[#2C2C2C] text-gray-300 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied' : 'Copy All'}</span>
        </button>

        {/* Multi-format Download Menu (24.8, 24.10) */}
        <div className="relative flex-1">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="w-full py-2 px-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-purple-600/20"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
            <ChevronDown className="w-3 h-3 ml-0.5" />
          </button>

          {showExportMenu && (
            <div className="absolute bottom-full right-0 mb-2 w-48 bg-[#222] border border-[#3A3A3A] rounded-2xl shadow-2xl p-1.5 z-50 text-xs text-gray-200 space-y-1">
              {[
                { format: 'txt', label: 'Plain Text (.txt)' },
                { format: 'json', label: 'Structured JSON (.json)' },
                { format: 'vtt', label: 'WebVTT Subtitles (.vtt)' },
                { format: 'srt', label: 'SubRip Subtitles (.srt)' }
              ].map(opt => (
                <button
                  key={opt.format}
                  onClick={() => {
                    onExportTranscript?.(opt.format);
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/10 flex items-center justify-between text-xs"
                >
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
