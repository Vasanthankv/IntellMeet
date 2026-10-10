import React, { useState } from 'react';
import { CheckCircle2, Plus, Trash2, Users, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DecisionsList({
  decisions = [],
  onAddDecision = null,
  onDeleteDecision = null
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [description, setDescription] = useState('');
  const [participants, setParticipants] = useState('');

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      toast.error('Decision statement is required');
      return;
    }
    if (onAddDecision) {
      const parts = participants.split(',').map(p => p.trim()).filter(Boolean);
      await onAddDecision({
        description: description.trim(),
        decidedBy: parts.length > 0 ? parts : ['Team']
      });
      setDescription('');
      setParticipants('');
      setShowAddForm(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-sm">Key Decisions (25.9)</h3>
            <p className="text-xs text-gray-500">{decisions.length} decisions logged & confirmed</p>
          </div>
        </div>

        {onAddDecision && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Decision</span>
          </button>
        )}
      </div>

      {/* Add Decision Form */}
      {showAddForm && (
        <form onSubmit={handleCreate} className="p-4 bg-emerald-50/50 border-b border-emerald-100 space-y-3">
          <textarea
            placeholder="State the decision made by the meeting..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full text-xs sm:text-sm p-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            rows={2}
            autoFocus
          />
          <input
            type="text"
            placeholder="Decided by participants (comma separated, e.g. Vasanthan, Arun)"
            value={participants}
            onChange={(e) => setParticipants(e.target.value)}
            className="w-full text-xs p-2 bg-white border border-gray-300 rounded-lg focus:outline-none"
          />
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1 text-xs text-gray-600 hover:bg-gray-200 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold"
            >
              Save Decision
            </button>
          </div>
        </form>
      )}

      {/* Decisions List */}
      <div className="p-0">
        {decisions.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-xs italic">
            No decisions recorded for this meeting.
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {decisions.map((dec, idx) => {
              const text = typeof dec === 'string' ? dec : dec.description;
              const decId = dec.decisionId || `dec-${idx}`;
              const decidedByList = Array.isArray(dec.decidedBy) ? dec.decidedBy : (dec.decidedBy ? [dec.decidedBy] : []);

              return (
                <li key={decId} className="p-4 hover:bg-gray-50 transition-colors flex items-start justify-between gap-4 group">
                  <div className="flex items-start gap-3 flex-1">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 leading-relaxed">
                        {text}
                      </p>
                      {decidedByList.length > 0 && (
                        <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-500">
                          <Users className="w-3 h-3 text-gray-400" />
                          <span>Decided by: <strong className="text-gray-700">{decidedByList.join(', ')}</strong></span>
                        </div>
                      )}
                    </div>
                  </div>

                  {onDeleteDecision && (
                    <button
                      onClick={() => onDeleteDecision(decId)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-all"
                      title="Delete decision"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
