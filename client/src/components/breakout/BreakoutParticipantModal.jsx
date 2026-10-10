import React from 'react';
import { X, Users, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function BreakoutParticipantModal({
  isOpen,
  onClose,
  rooms = [],
  currentRoomId = null,
  onSelectRoom = () => {}
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans select-none">
      <div className="bg-[#1e232d] text-slate-100 border border-slate-700/80 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-slate-100 text-sm">Choose a Breakout Room (18.5)</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Room List (18.26) */}
        <div className="p-4 flex-1 overflow-y-auto space-y-2">
          {rooms.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              No breakout rooms are currently available.
            </div>
          ) : (
            rooms.map(room => {
              const isCurrent = room.roomId === currentRoomId;
              const participantCount = room.participants?.length || 0;

              return (
                <div
                  key={room.roomId}
                  className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                    isCurrent 
                      ? 'bg-indigo-600/15 border-indigo-500/50 text-indigo-200' 
                      : 'bg-slate-850/60 border-slate-850 hover:border-slate-700 text-slate-200'
                  }`}
                >
                  <div>
                    <div className="font-semibold text-xs text-slate-100 flex items-center space-x-2">
                      <span>{room.name}</span>
                      {isCurrent && (
                        <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded font-medium">
                          Current Room
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 flex items-center space-x-1">
                      <Users className="w-3 h-3 text-slate-500" />
                      <span>{participantCount} participant{participantCount === 1 ? '' : 's'}</span>
                    </div>
                  </div>

                  {!isCurrent ? (
                    <button
                      onClick={() => {
                        onSelectRoom(room);
                        onClose();
                      }}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-3.5 py-1.5 rounded-lg font-semibold transition-colors flex items-center space-x-1 shadow"
                    >
                      <span>Join</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  ) : (
                    <span className="text-xs text-indigo-400 font-semibold px-2 py-1">In Room</span>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60 flex justify-end">
          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-4 py-1.5 rounded-xl font-semibold transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
