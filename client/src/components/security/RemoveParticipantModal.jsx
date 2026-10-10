import React, { useState } from 'react';
import { UserX, AlertTriangle, X, CheckSquare, Square } from 'lucide-react';

export default function RemoveParticipantModal({ 
  isOpen, 
  onClose, 
  participants = [], 
  currentUserId,
  onConfirmRemove,
  isSubmitting = false 
}) {
  const [selectedParticipantId, setSelectedParticipantId] = useState('');
  const [preventRejoin, setPreventRejoin] = useState(true);

  if (!isOpen) return null;

  // Filter out the local user/host
  const removableParticipants = participants.filter(
    p => p.id !== 'local' && p.id !== currentUserId && !p.isLocal
  );

  const selectedParticipant = removableParticipants.find(p => p.id === selectedParticipantId);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedParticipantId) return;
    onConfirmRemove(selectedParticipantId, selectedParticipant?.name || 'Participant', preventRejoin);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#1F1F1F] border border-[#3A3A3A] rounded-3xl w-full max-w-md shadow-2xl p-6 text-white space-y-5 animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#333]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <UserX className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-gray-100">Remove Participant</h3>
              <p className="text-[11px] text-gray-400">Meeting Security & Access Control (Section 30.9)</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {removableParticipants.length === 0 ? (
          <div className="py-6 text-center text-gray-400 text-xs">
            No other removable participants currently in this session.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-2">
                Select Participant to Remove:
              </label>
              <select
                value={selectedParticipantId}
                onChange={(e) => setSelectedParticipantId(e.target.value)}
                required
                className="w-full bg-[#2B2B2B] text-white border border-[#444] rounded-xl px-3 py-2.5 text-xs outline-none focus:border-primary-500 transition-colors"
              >
                <option value="">-- Choose a participant --</option>
                {removableParticipants.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.isCoHost ? '(Co-host)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Prevent Rejoin Checkbox */}
            <div 
              onClick={() => setPreventRejoin(!preventRejoin)}
              className="flex items-start gap-2.5 p-3 bg-black/30 border border-white/5 rounded-xl cursor-pointer hover:bg-black/50 transition-colors"
            >
              <div className="pt-0.5 text-primary-400">
                {preventRejoin ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-gray-500" />}
              </div>
              <div className="text-xs">
                <span className="font-medium text-gray-200">Do not allow removed participant to rejoin</span>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  The participant's ID will be blocked from reconnecting for the duration of this meeting.
                </p>
              </div>
            </div>

            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-2 text-[11px] text-amber-300">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
              <span>The user will be immediately disconnected from audio, video, and chat.</span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!selectedParticipantId || isSubmitting}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-red-600/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Removing...' : 'Remove Participant'}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
