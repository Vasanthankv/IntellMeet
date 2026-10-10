import React, { useState } from 'react';
import { 
  Users, Check, X, ShieldAlert, Sliders, ChevronRight, UserCheck, 
  UserMinus, Power, AlertCircle, Sparkles, Presentation
} from 'lucide-react';

export default function SlideControlPopover({
  isOpen,
  onClose,
  session,
  participants = [],
  currentUserId,
  onGrantControl,
  onRevokeControl,
  onStopAllControl,
  onEndPresentation
}) {
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen || !session) return null;

  const activeControllers = session.controllers?.filter(c => c.status === 'ACTIVE') || [];
  const activeControllerIds = new Set(activeControllers.map(c => c.userId));

  // Available participants who are not the presenter and don't currently have active control
  const eligibleParticipants = participants.filter(p => {
    const pId = p.id || p.userId;
    if (pId === session.presenterId || pId === currentUserId) return false;
    return true;
  }).filter(p => {
    const name = p.name || p.userName || 'Participant';
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const toggleSelect = (pId) => {
    setSelectedParticipants(prev => 
      prev.includes(pId) ? prev.filter(id => id !== pId) : [...prev, pId]
    );
  };

  const handleGiveControl = () => {
    if (selectedParticipants.length === 0) return;

    const toGrant = selectedParticipants.map(id => {
      const p = participants.find(part => (part.id || part.userId) === id);
      return {
        userId: id,
        userName: p?.name || p?.userName || 'Participant',
        userRole: p?.role || 'participant'
      };
    });

    onGrantControl(toGrant);
    setSelectedParticipants([]);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-[#1C1D22] border border-[#333] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        {/* Header (Section 16.2 & 16.11) */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2C2D35] bg-[#22242B]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <Presentation className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Slide Control 👥
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30 font-medium">
                  {session.presentationType}
                </span>
              </h3>
              <p className="text-[11px] text-gray-400 truncate max-w-[260px]">
                {session.presentationName} • Slide {session.currentSlide}/{session.totalSlides}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 max-h-[460px] overflow-y-auto">
          {/* Active Controllers List (Section 16.4 & 16.5) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                Active Controllers ({activeControllers.length})
              </span>
              {activeControllers.length > 0 && (
                <button
                  onClick={onStopAllControl}
                  className="text-[10px] text-red-400 hover:text-red-300 font-semibold hover:underline"
                >
                  Stop All Control
                </button>
              )}
            </div>

            {activeControllers.length === 0 ? (
              <div className="p-3 bg-[#16171B] rounded-xl border border-[#2B2C33] text-center text-xs text-gray-400 italic">
                No participants currently have slide control permission.
              </div>
            ) : (
              <div className="space-y-1.5">
                {activeControllers.map(ctrl => (
                  <div
                    key={ctrl.userId}
                    className="flex items-center justify-between p-2.5 bg-[#17181F] border border-blue-500/20 rounded-xl"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-full bg-blue-500/30 text-blue-300 font-bold text-[10px] flex items-center justify-center shrink-0">
                        {ctrl.userName?.charAt(0) || 'P'}
                      </div>
                      <div className="truncate">
                        <span className="text-xs font-semibold text-white block truncate">{ctrl.userName}</span>
                        <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Can navigate slides
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => onRevokeControl(ctrl.userId)}
                      className="px-2.5 py-1 bg-red-600/20 hover:bg-red-600/40 text-red-300 border border-red-500/30 rounded-lg text-[10px] font-semibold transition-colors flex items-center gap-1"
                      title="Revoke slide control"
                    >
                      <UserMinus className="w-3 h-3" />
                      <span>Revoke</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-[#2C2D35]" />

          {/* Select Participants to Give Control (Section 16.2 & 16.11) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                Give Slide Control
              </span>
              <span className="text-[10px] text-gray-400">
                {selectedParticipants.length} selected
              </span>
            </div>

            {/* Filter Search */}
            <input
              type="text"
              placeholder="Search participant by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#16171B] border border-[#2B2C33] rounded-xl px-3 py-1.5 text-xs text-white placeholder-gray-500 outline-none focus:border-blue-500 mb-2.5"
            />

            {/* Participant Checkbox List (Section 16.2 Diagram) */}
            <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
              {eligibleParticipants.length === 0 ? (
                <div className="py-4 text-center text-xs text-gray-500 italic">
                  No other participants available to grant control.
                </div>
              ) : (
                eligibleParticipants.map(p => {
                  const pId = p.id || p.userId;
                  const isSelected = selectedParticipants.includes(pId);
                  const isAlreadyController = activeControllerIds.has(pId);

                  return (
                    <label
                      key={pId}
                      className={`flex items-center justify-between p-2 rounded-xl border cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-blue-600/20 border-blue-500 text-white'
                          : isAlreadyController
                          ? 'bg-[#181920] border-[#2E303A] text-gray-400 opacity-60 cursor-not-allowed'
                          : 'bg-[#181920] border-[#2A2B33] text-gray-300 hover:bg-[#20212A]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <input
                          type="checkbox"
                          checked={isSelected || isAlreadyController}
                          disabled={isAlreadyController}
                          onChange={() => !isAlreadyController && toggleSelect(pId)}
                          className="accent-blue-600 rounded"
                        />
                        <span className="text-xs font-medium truncate">{p.name || p.userName || 'Participant'}</span>
                        {p.role === 'host' && (
                          <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1 rounded font-bold">Host</span>
                        )}
                      </div>
                      {isAlreadyController && (
                        <span className="text-[10px] text-emerald-400 font-semibold">Active</span>
                      )}
                    </label>
                  );
                })
              )}
            </div>

            {/* Give Control Button (Section 16.2 & 16.11) */}
            <button
              onClick={handleGiveControl}
              disabled={selectedParticipants.length === 0}
              className="w-full mt-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-xs transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-1.5"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Give Control ({selectedParticipants.length})</span>
            </button>
          </div>
        </div>

        {/* Footer Actions (Section 16.13) */}
        <div className="px-5 py-3 border-t border-[#2C2D35] bg-[#181920] flex items-center justify-between">
          <button
            onClick={onEndPresentation}
            className="text-xs text-red-400 hover:text-red-300 font-semibold flex items-center gap-1.5 hover:underline"
          >
            <Power className="w-3.5 h-3.5" />
            <span>End Presentation</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#2A2B33] hover:bg-[#353742] text-gray-200 text-xs font-semibold rounded-xl transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
