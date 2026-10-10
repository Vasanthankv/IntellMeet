import React, { useState } from 'react';
import { 
  Sparkles, BrainCircuit, CheckCircle2, ChevronRight, 
  Tag, ListChecks, HelpCircle, ArrowRight, Edit2, Check, X, ShieldCheck
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AISummaryCard({ 
  summary, 
  onSaveOverview = null,
  isApproved = false,
  onApprove = null
}) {
  const [isEditingOverview, setIsEditingOverview] = useState(false);
  const [overviewText, setOverviewText] = useState(summary?.overview || summary?.executiveSummary || '');

  const handleSaveOverview = async () => {
    if (onSaveOverview) {
      await onSaveOverview(overviewText);
    }
    setIsEditingOverview(false);
    toast.success('Executive overview updated');
  };

  const keyPoints = summary?.keyDiscussionPoints || summary?.keyPoints || [];
  const nextSteps = summary?.nextSteps || [];
  const questions = summary?.questions || [];
  const topics = summary?.importantTopics || [];
  const template = summary?.template || 'GENERAL';

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden space-y-6">
      {/* Executive Header Banner */}
      <div className="bg-gradient-to-r from-purple-700 via-indigo-600 to-indigo-800 p-6 text-white relative">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <Sparkles className="w-4 h-4 text-purple-200" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">Executive Meeting Summary</h3>
              <span className="text-xs text-purple-200 font-medium">Template: {template}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isApproved ? (
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-200 border border-emerald-400/40 rounded-full text-xs font-semibold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                Approved by Host
              </span>
            ) : onApprove ? (
              <button
                onClick={onApprove}
                className="px-3 py-1 bg-white text-purple-800 hover:bg-purple-50 rounded-lg text-xs font-bold transition-colors shadow-sm"
              >
                Approve Summary
              </button>
            ) : null}

            {!isEditingOverview && onSaveOverview && (
              <button
                onClick={() => {
                  setOverviewText(summary?.overview || summary?.executiveSummary || '');
                  setIsEditingOverview(true);
                }}
                className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
                title="Edit overview text"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Overview Body / Edit */}
        {isEditingOverview ? (
          <div className="space-y-2 mt-2">
            <textarea
              value={overviewText}
              onChange={(e) => setOverviewText(e.target.value)}
              className="w-full text-sm text-gray-900 bg-white p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300"
              rows={3}
              autoFocus
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setIsEditingOverview(false)}
                className="px-3 py-1 text-xs bg-white/20 hover:bg-white/30 rounded-lg text-white font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveOverview}
                className="px-3 py-1 text-xs bg-white text-purple-800 hover:bg-purple-50 rounded-lg font-bold flex items-center gap-1"
              >
                <Check className="w-3 h-3" /> Save
              </button>
            </div>
          </div>
        ) : (
          <p className="text-purple-100 leading-relaxed text-sm bg-white/10 p-3.5 rounded-xl border border-white/10">
            {summary?.overview || summary?.executiveSummary || 'No summary overview generated yet.'}
          </p>
        )}
      </div>

      {/* Grid of Key Discussion, Next Steps, and Topics */}
      <div className="p-6 pt-0 space-y-6">
        {/* Key Discussion Points (25.7, 25.10) */}
        <div>
          <h4 className="flex items-center gap-2 font-bold text-gray-900 text-sm mb-3">
            <ListChecks className="w-4 h-4 text-purple-600" />
            Key Discussion Points
          </h4>
          {keyPoints.length === 0 ? (
            <p className="text-xs text-gray-400 italic">No key points captured.</p>
          ) : (
            <ul className="space-y-2">
              {keyPoints.map((point, i) => (
                <li key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-gray-700 bg-gray-50 border border-gray-100 p-2.5 rounded-lg">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2 shrink-0" />
                  <span className="leading-relaxed">{point}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Stand-up specific sections if template is STANDUP (25.17) */}
        {template === 'STANDUP' && summary?.standupSpecific && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-purple-50/50 p-4 rounded-xl border border-purple-100">
            <div>
              <h5 className="font-bold text-xs text-purple-900 mb-2">Yesterday</h5>
              <ul className="text-xs text-gray-700 space-y-1 list-disc list-inside">
                {(summary.standupSpecific.yesterday || []).map((y, idx) => (
                  <li key={idx}>{y}</li>
                ))}
              </ul>
            </div>
            <div>
              <h5 className="font-bold text-xs text-indigo-900 mb-2">Today</h5>
              <ul className="text-xs text-gray-700 space-y-1 list-disc list-inside">
                {(summary.standupSpecific.today || []).map((t, idx) => (
                  <li key={idx}>{t}</li>
                ))}
              </ul>
            </div>
            <div>
              <h5 className="font-bold text-xs text-rose-900 mb-2">Blockers</h5>
              <ul className="text-xs text-gray-700 space-y-1 list-disc list-inside">
                {(summary.standupSpecific.blockers || []).map((b, idx) => (
                  <li key={idx}>{b}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Project specific sections if template is PROJECT (25.17) */}
        {template === 'PROJECT' && summary?.projectSpecific && (
          <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-900">Project Status:</span>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-xs">
                {summary.projectSpecific.projectStatus || 'On Track'}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="font-semibold text-gray-800">Completed Deliverables:</span>
                <ul className="mt-1 space-y-1 text-gray-600 list-disc list-inside">
                  {(summary.projectSpecific.completedWork || []).map((w, idx) => (
                    <li key={idx}>{w}</li>
                  ))}
                </ul>
              </div>
              <div>
                <span className="font-semibold text-gray-800">Pending Deliverables:</span>
                <ul className="mt-1 space-y-1 text-gray-600 list-disc list-inside">
                  {(summary.projectSpecific.pendingWork || []).map((p, idx) => (
                    <li key={idx}>{p}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Important Topics & Questions (25.7) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {topics.length > 0 && (
            <div>
              <h4 className="flex items-center gap-1.5 font-bold text-gray-900 text-xs mb-2">
                <Tag className="w-3.5 h-3.5 text-indigo-600" />
                Key Discussion Topics
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {topics.map((topic, i) => (
                  <span key={i} className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium border border-gray-200">
                    #{topic}
                  </span>
                ))}
              </div>
            </div>
          )}

          {nextSteps.length > 0 && (
            <div>
              <h4 className="flex items-center gap-1.5 font-bold text-gray-900 text-xs mb-2">
                <ArrowRight className="w-3.5 h-3.5 text-purple-600" />
                Agreed Next Steps
              </h4>
              <ul className="space-y-1 text-xs text-gray-700">
                {nextSteps.map((step, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                      {i + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
