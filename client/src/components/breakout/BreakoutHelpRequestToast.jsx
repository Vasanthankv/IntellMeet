import React from 'react';
import { AlertTriangle, X, ArrowRight, HelpCircle } from 'lucide-react';

export default function BreakoutHelpRequestToast({
  request = null,
  onJoinRoom = () => {},
  onDismiss = () => {}
}) {
  if (!request) return null;

  return (
    <div className="fixed top-5 right-5 z-50 w-full max-w-sm font-sans select-none animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="bg-[#1f2430] border-2 border-amber-500/80 text-slate-100 rounded-2xl shadow-2xl p-4 flex flex-col space-y-3 backdrop-blur-md">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shrink-0">
              <HelpCircle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h4 className="font-bold text-xs text-amber-300 uppercase tracking-wider">
                Help Requested (18.15)
              </h4>
              <p className="font-semibold text-sm text-slate-100 mt-0.5">
                {request.userName} in <span className="text-amber-400">{request.roomName}</span>
              </p>
            </div>
          </div>

          <button onClick={onDismiss} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
          "{request.helpRequest?.message || `${request.userName} is asking for host assistance in ${request.roomName}`}"
        </p>

        <div className="flex items-center justify-end space-x-2 pt-1">
          <button
            onClick={onDismiss}
            className="text-xs text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            Later
          </button>
          <button
            onClick={() => {
              onJoinRoom(request.roomId);
              onDismiss();
            }}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-1.5 rounded-xl text-xs flex items-center space-x-1.5 shadow-lg shadow-amber-500/20 transition-all"
          >
            <span>Join {request.roomName}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
