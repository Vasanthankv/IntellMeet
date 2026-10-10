import React, { useState, useEffect } from 'react';
import { 
  FileText, Sparkles, BrainCircuit, CheckSquare, 
  Calendar, Clock, CheckCircle2, ChevronRight, RefreshCw, AlertCircle
} from 'lucide-react';
import TranscriptViewer from '../../components/ai/TranscriptViewer';
import toast from 'react-hot-toast';

export default function AITranscriptPage() {
  const [transcriptsList, setTranscriptsList] = useState([]);
  const [selectedMeetingId, setSelectedMeetingId] = useState('');
  const [transcriptData, setTranscriptData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzingAI, setIsAnalyzingAI] = useState(false);
  const [activeTab, setActiveTab] = useState('transcript'); // 'transcript' | 'summary' | 'decisions' | 'actions'

  // Load list of available meeting transcripts
  const fetchTranscriptsList = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/transcripts/all/list', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.success && data.transcripts && data.transcripts.length > 0) {
        setTranscriptsList(data.transcripts);
        if (!selectedMeetingId) {
          setSelectedMeetingId(data.transcripts[0].meetingId);
        }
      }
    } catch (e) {
      console.warn('Could not fetch transcripts list:', e);
    }
  };

  useEffect(() => {
    fetchTranscriptsList();
  }, []);

  // Fetch selected meeting transcript
  useEffect(() => {
    if (!selectedMeetingId) {
      setTranscriptData(null);
      return;
    }

    const loadMeetingTranscript = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`http://localhost:5000/api/meetings/${selectedMeetingId}/transcript`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const data = await res.json();
        if (data.success && data.transcript) {
          setTranscriptData(data.transcript);
        } else {
          setTranscriptData(null);
        }
      } catch (e) {
        toast.error('Network error loading transcript');
      } finally {
        setIsLoading(false);
      }
    };

    loadMeetingTranscript();
  }, [selectedMeetingId]);

  // Edit segment handler
  const handleEditSegment = async (segmentId, newText) => {
    if (!selectedMeetingId) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/meetings/${selectedMeetingId}/transcript/segments/${segmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text: newText })
      });
      const data = await res.json();
      if (data.success) {
        setTranscriptData(prev => ({
          ...prev,
          segments: prev.segments.map(s => {
            if (s.segmentId === segmentId || s._id === segmentId) {
              return { ...s, text: newText, isEdited: true, editedBy: 'You' };
            }
            return s;
          })
        }));
        toast.success('Transcript segment updated with audit trail');
      } else {
        toast.error(data.message || 'Failed to edit segment');
      }
    } catch (e) {
      toast.error('Error updating segment');
    }
  };

  // Export handler
  const handleExport = async (format) => {
    if (selectedMeetingId === 'sample') {
      // Local exporter fallback is triggered inside TranscriptViewer
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/meetings/${selectedMeetingId}/transcript/export?format=${format}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `intellmeet_transcript_${selectedMeetingId}.${format}`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success(`Transcript downloaded as .${format.toUpperCase()}`);
    } catch (e) {
      toast.error('Failed to download transcript file');
    }
  };

  // Run AI processing pipeline (24.11)
  const handleTriggerAI = async () => {
    if (!selectedMeetingId) {
      toast.error('Please select a meeting transcript first');
      return;
    }

    setIsAnalyzingAI(true);
    const toastId = toast.loading('Extracting AI summary, key decisions, and action items...');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/meetings/${selectedMeetingId}/transcript/ai-analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.aiSummary) {
        setTranscriptData(prev => ({ ...prev, aiSummary: data.aiSummary }));
        toast.success('AI Meeting Summary & Action Items Generated!', { id: toastId });
      } else {
        toast.error(data.message || 'Failed to generate AI analysis', { id: toastId });
      }
    } catch (e) {
      toast.error('Network error during AI analysis', { id: toastId });
    } finally {
      setIsAnalyzingAI(false);
    }
  };

  const aiSummary = transcriptData?.aiSummary || {};

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <BrainCircuit className="w-7 h-7 text-purple-600" />
            Meeting Transcripts & AI Intelligence
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Searchable speaker-separated transcripts with audit editing, timecode sync, multi-format export, and automated AI summary.
          </p>
        </div>

        {/* Meeting Selector & Refresh */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-3 py-1.5 shadow-sm text-xs">
            <span className="font-semibold text-gray-500">Meeting:</span>
            <select
              value={selectedMeetingId}
              onChange={(e) => setSelectedMeetingId(e.target.value)}
              className="bg-transparent font-medium text-gray-800 focus:outline-none cursor-pointer"
            >
              {transcriptsList.length === 0 ? (
                <option value="">No recorded transcripts</option>
              ) : (
                transcriptsList.map(t => (
                  <option key={t.meetingId} value={t.meetingId}>
                    {t.meetingId} ({t.segmentCount} segments - {t.status})
                  </option>
                ))
              )}
            </select>
          </div>

          <button
            onClick={fetchTranscriptsList}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors shadow-sm"
            title="Refresh transcripts list"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={handleTriggerAI}
            disabled={isAnalyzingAI || !selectedMeetingId}
            className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isAnalyzingAI ? 'Analyzing...' : 'Generate AI Insights'}</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs (24.11) */}
      <div className="flex items-center gap-2 border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('transcript')}
          className={`pb-3 px-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'transcript'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <FileText className="w-4 h-4" />
          Transcript View
          <span className="bg-gray-100 text-gray-600 rounded-full px-2 py-0.5 text-xs font-normal">
            {transcriptData?.segments?.length || 0}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('summary')}
          className={`pb-3 px-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'summary'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <BrainCircuit className="w-4 h-4" />
          Executive Summary
        </button>

        <button
          onClick={() => setActiveTab('decisions')}
          className={`pb-3 px-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'decisions'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          Key Decisions
          <span className="bg-purple-100 text-purple-700 rounded-full px-2 py-0.5 text-xs font-normal">
            {aiSummary?.decisions?.length || 0}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('actions')}
          className={`pb-3 px-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'actions'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          Action Items
          <span className="bg-indigo-100 text-indigo-700 rounded-full px-2 py-0.5 text-xs font-normal">
            {aiSummary?.actionItems?.length || 0}
          </span>
        </button>
      </div>

      {/* Main Tab Content */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center shadow-sm">
          <RefreshCw className="w-8 h-8 text-purple-600 animate-spin mx-auto mb-3" />
          <p className="text-gray-600 text-sm font-medium">Loading meeting transcript...</p>
        </div>
      ) : !transcriptData ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
          <BrainCircuit className="w-12 h-12 text-purple-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-gray-900 mb-1">No Meeting Transcript Selected</h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            Meetings conducted with live transcription will automatically record speaker dialogues and transcripts here.
          </p>
        </div>
      ) : activeTab === 'transcript' ? (
        <TranscriptViewer 
          transcript={transcriptData?.segments || []} 
          meetingTitle={transcriptData?.title || `Meeting: ${selectedMeetingId}`}
          onEditSegment={handleEditSegment}
          onExport={handleExport}
        />
      ) : activeTab === 'summary' ? (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-bold text-gray-900 mb-2 flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-purple-600" />
              Executive AI Summary
            </h3>
            <p className="text-gray-700 leading-relaxed text-sm bg-purple-50/50 border border-purple-100 rounded-lg p-4">
              {aiSummary?.summary || 'No AI summary generated for this meeting yet. Click "Generate AI Insights" above to extract.'}
            </p>
          </div>

          {aiSummary?.keyTopics && aiSummary.keyTopics.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Key Discussion Topics</h4>
              <div className="flex flex-wrap gap-2">
                {aiSummary.keyTopics.map((topic, i) => (
                  <span key={i} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium border border-gray-200">
                    #{topic}
                  </span>
                ))}
              </div>
            </div>
          )}

          {aiSummary?.importantQuestions && aiSummary.importantQuestions.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Key Questions Raised</h4>
              <ul className="space-y-1.5 text-xs text-gray-700 list-disc list-inside">
                {aiSummary.importantQuestions.map((q, i) => (
                  <li key={i}>{q}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : activeTab === 'decisions' ? (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            Agreed Decisions & Outcomes
          </h3>
          {(!aiSummary?.decisions || aiSummary.decisions.length === 0) ? (
            <p className="text-sm text-gray-500 py-8 text-center">No decisions recorded yet. Run AI Insights to extract.</p>
          ) : (
            <div className="space-y-3">
              {aiSummary.decisions.map((dec, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-emerald-50/50 border border-emerald-100 rounded-lg text-sm text-gray-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{dec}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-indigo-600" />
            Assigned Action Items & Tasks
          </h3>
          {(!aiSummary?.actionItems || aiSummary.actionItems.length === 0) ? (
            <p className="text-sm text-gray-500 py-8 text-center">No action items recorded. Run AI Insights to extract.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {aiSummary.actionItems.map((action, i) => (
                <div key={i} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <input 
                      type="checkbox" 
                      defaultChecked={action.completed}
                      className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500 cursor-pointer" 
                    />
                    <span className={`text-sm ${action.completed ? 'line-through text-gray-400' : 'text-gray-800 font-medium'}`}>
                      {action.task}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 shrink-0 text-xs">
                    {action.owner && (
                      <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded font-medium border border-purple-100">
                        {action.owner}
                      </span>
                    )}
                    {action.due && (
                      <span className="text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {action.due}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
