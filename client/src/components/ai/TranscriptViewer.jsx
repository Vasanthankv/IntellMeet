import React, { useState, useMemo } from 'react';
import { 
  Search, User, PlayCircle, Edit2, Check, X, 
  Download, Filter, Clock, AlertCircle, FileText, ChevronDown
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function TranscriptViewer({ 
  transcript = [], 
  onEditSegment = null,
  onDeleteSegment = null,
  onSeek = null,
  onExport = null,
  meetingTitle = 'Meeting Transcript'
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpeaker, setSelectedSpeaker] = useState('ALL');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Normalize transcript list
  const normalizedSegments = useMemo(() => {
    return (transcript || []).map((entry, idx) => {
      const id = entry.segmentId || entry._id || entry.id || `seg-${idx}`;
      const speaker = entry.speakerName || entry.speaker || 'Unknown Speaker';
      const time = entry.time || (entry.startTime !== undefined 
        ? `${Math.floor(entry.startTime / 60)}:${String(Math.floor(entry.startTime % 60)).padStart(2, '0')}`
        : (entry.timestamp ? new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '00:00'));
      const text = entry.text || '';
      return {
        ...entry,
        id,
        speaker,
        time,
        text,
        isEdited: Boolean(entry.isEdited),
        originalText: entry.originalText,
        editedBy: entry.editedBy
      };
    });
  }, [transcript]);

  // Extract unique speakers list
  const uniqueSpeakers = useMemo(() => {
    const set = new Set();
    normalizedSegments.forEach(s => {
      if (s.speaker) set.add(s.speaker);
    });
    return Array.from(set);
  }, [normalizedSegments]);

  // Filter segments
  const filteredTranscript = useMemo(() => {
    return normalizedSegments.filter(entry => {
      const matchesSearch = !searchTerm.trim() || 
        entry.text.toLowerCase().includes(searchTerm.toLowerCase()) || 
        entry.speaker.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesSpeaker = selectedSpeaker === 'ALL' || entry.speaker === selectedSpeaker;
      return matchesSearch && matchesSpeaker;
    });
  }, [normalizedSegments, searchTerm, selectedSpeaker]);

  const highlightText = (text, highlight) => {
    if (!highlight.trim()) {
      return <span>{text}</span>;
    }
    const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return (
      <span>
        {parts.map((part, i) => 
          regex.test(part) ? (
            <span key={i} className="bg-yellow-200 text-yellow-900 rounded px-1 font-medium">{part}</span>
          ) : part
        )}
      </span>
    );
  };

  const handleStartEdit = (entry) => {
    setEditingId(entry.id);
    setEditText(entry.text);
  };

  const handleSaveEdit = async (id) => {
    if (!editText.trim()) {
      toast.error('Segment text cannot be empty');
      return;
    }
    if (onEditSegment) {
      await onEditSegment(id, editText.trim());
    } else {
      toast.success('Segment updated');
    }
    setEditingId(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  const triggerExport = (format) => {
    setShowExportMenu(false);
    if (onExport) {
      onExport(format);
    } else {
      // Local client fallback exporter
      let content = '';
      let mimeType = 'text/plain';
      const filename = `transcript_${Date.now()}.${format}`;

      if (format === 'json') {
        content = JSON.stringify(normalizedSegments, null, 2);
        mimeType = 'application/json';
      } else if (format === 'vtt') {
        content = 'WEBVTT\n\n' + normalizedSegments.map((s, idx) => {
          const t = s.time || '00:00';
          return `${idx + 1}\n00:${t}.000 --> 00:${t}.999\n<v ${s.speaker}>${s.text}\n`;
        }).join('\n');
      } else if (format === 'srt') {
        content = normalizedSegments.map((s, idx) => {
          const t = s.time || '00:00';
          return `${idx + 1}\n00:${t},000 --> 00:${t},999\n${s.speaker}: ${s.text}\n`;
        }).join('\n');
      } else {
        content = normalizedSegments.map(s => `[${s.time}] ${s.speaker}: ${s.text}`).join('\n');
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported as .${format.toUpperCase()}`);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col h-[650px] overflow-hidden">
      {/* Header & Controls (24.5, 24.8) */}
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-wrap items-center justify-between gap-3 rounded-t-xl shrink-0">
        <div>
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-purple-600" />
            {meetingTitle}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {normalizedSegments.length} total segments recorded • Search, review, edit & export
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Speaker Filter */}
          {uniqueSpeakers.length > 0 && (
            <div className="flex items-center gap-1.5 bg-white border border-gray-300 rounded-lg px-2.5 py-1 text-xs">
              <Filter className="w-3.5 h-3.5 text-gray-400" />
              <select
                value={selectedSpeaker}
                onChange={(e) => setSelectedSpeaker(e.target.value)}
                className="bg-transparent text-gray-700 font-medium focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Speakers ({uniqueSpeakers.length})</option>
                {uniqueSpeakers.map((spk, idx) => (
                  <option key={idx} value={spk}>{spk}</option>
                ))}
              </select>
            </div>
          )}

          {/* Search Box */}
          <div className="relative w-48 sm:w-60">
            <Search className="absolute left-2.5 top-2 h-4 w-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search transcript..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg pl-8 pr-3 py-1.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Export Dropdown (24.8, 24.10) */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-medium transition-colors shadow-sm"
              title="Download meeting transcript"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
              <ChevronDown className="w-3 h-3 ml-0.5" />
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-20 text-xs">
                <button
                  onClick={() => triggerExport('txt')}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center justify-between text-gray-700"
                >
                  <span>Text File (.txt)</span>
                  <span className="text-[10px] text-gray-400">Plain</span>
                </button>
                <button
                  onClick={() => triggerExport('json')}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center justify-between text-gray-700"
                >
                  <span>JSON File (.json)</span>
                  <span className="text-[10px] text-gray-400">Structured</span>
                </button>
                <button
                  onClick={() => triggerExport('vtt')}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center justify-between text-gray-700"
                >
                  <span>WebVTT (.vtt)</span>
                  <span className="text-[10px] text-gray-400">Subtitles</span>
                </button>
                <button
                  onClick={() => triggerExport('srt')}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center justify-between text-gray-700"
                >
                  <span>SubRip (.srt)</span>
                  <span className="text-[10px] text-gray-400">Subtitles</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Transcript Segments List (24.6, 24.7) */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {filteredTranscript.length === 0 ? (
          <div className="text-center text-gray-500 py-16 flex flex-col items-center">
            <AlertCircle className="w-8 h-8 text-gray-400 mb-2" />
            <p className="text-sm font-medium">No matching transcript segments found</p>
            {searchTerm && <p className="text-xs text-gray-400 mt-1">Try searching for a different keyword or clearing filters</p>}
          </div>
        ) : (
          filteredTranscript.map((entry) => {
            const isEditing = editingId === entry.id;

            return (
              <div 
                key={entry.id} 
                className="flex gap-3 sm:gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200 group"
              >
                {/* Speaker Avatar (24.7) */}
                <div className="w-9 h-9 rounded-full bg-purple-100 border border-purple-200 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-4 h-4 text-purple-700" />
                </div>

                <div className="flex-1 min-w-0">
                  {/* Speaker Name & Timecode Header */}
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900 text-sm">{entry.speaker}</span>
                      <button 
                        onClick={() => onSeek && onSeek(entry.startTime || 0)}
                        className="text-xs text-gray-400 font-medium flex items-center gap-1 hover:text-purple-600 transition-colors bg-gray-100 hover:bg-purple-50 px-1.5 py-0.5 rounded"
                        title="Click to jump playback to this timestamp"
                      >
                        <Clock className="w-3 h-3" />
                        {entry.time}
                      </button>

                      {/* Edited Badge with Audit Info (24.9) */}
                      {entry.isEdited && (
                        <span 
                          className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 rounded px-1.5 py-0.2"
                          title={entry.editedBy ? `Edited by ${entry.editedBy}` : 'Edited'}
                        >
                          Edited
                        </span>
                      )}
                    </div>

                    {/* Action buttons (Seek, Edit) */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {onSeek && (
                        <button 
                          onClick={() => onSeek(entry.startTime || 0)}
                          className="text-gray-400 hover:text-purple-600 p-1 rounded hover:bg-gray-200" 
                          title="Play from here"
                        >
                          <PlayCircle className="w-4 h-4" />
                        </button>
                      )}
                      {!isEditing && (
                        <button
                          onClick={() => handleStartEdit(entry)}
                          className="text-gray-400 hover:text-blue-600 p-1 rounded hover:bg-gray-200"
                          title="Edit transcript text"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Body Text / Edit Input (24.9) */}
                  {isEditing ? (
                    <div className="mt-1 space-y-2">
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="w-full text-sm p-2 border border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        rows={2}
                        autoFocus
                      />
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={handleCancelEdit}
                          className="px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-200 rounded flex items-center gap-1"
                        >
                          <X className="w-3 h-3" />
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveEdit(entry.id)}
                          className="px-2.5 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded flex items-center gap-1 font-medium"
                        >
                          <Check className="w-3 h-3" />
                          Save Edit
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-800 leading-relaxed text-sm">
                      {highlightText(entry.text, searchTerm)}
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
