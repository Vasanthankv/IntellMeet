import React, { useState, useEffect } from 'react';
import { 
  Users, HelpCircle, LogOut, Clock, AlertTriangle, 
  CheckCircle2, Sparkles, MessageSquare 
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function BreakoutRoomBanner({
  room,
  meetingId,
  currentUser = { id: 'local', name: 'Participant' },
  socket = null,
  countdownSeconds = null,
  onReturnToMain = () => {}
}) {
  const [hasRequestedHelp, setHasRequestedHelp] = useState(false);
  const [countdown, setCountdown] = useState(countdownSeconds || null);

  useEffect(() => {
    if (countdownSeconds !== null && countdownSeconds !== undefined) {
      setCountdown(countdownSeconds);
      const interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            onReturnToMain();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [countdownSeconds]);

  // Ask for Help (18.15)
  const handleAskForHelp = async () => {
    try {
      setHasRequestedHelp(true);
      const res = await axios.post(`${(typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1" ? "https://intellmeet-backend-rc32.onrender.com" : "http://localhost:5000")}/api/meetings/${meetingId}/breakout/help`, {
        roomId: room.roomId,
        userId: currentUser.id,
        userName: currentUser.name,
        message: `${currentUser.name} requested help in ${room.name}`
      });

      if (res.data.success) {
        toast.success('Help request sent to the meeting host!', { icon: '🙋‍♂️' });
        if (socket) {
          socket.emit('breakout-help-request', meetingId, {
            helpRequest: res.data.helpRequest,
            roomId: room.roomId,
            roomName: room.name,
            userName: currentUser.name
          });
        }
      }
    } catch (err) {
      console.error('Error asking for help:', err);
      toast.error('Could not send help request');
    }
  };

  // Return to Main Meeting (18.16)
  const handleLeaveRoom = async () => {
    try {
      await axios.post(`${(typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1" ? "https://intellmeet-backend-rc32.onrender.com" : "http://localhost:5000")}/api/meetings/${meetingId}/breakout/leave`, {
        roomId: room.roomId,
        userId: currentUser.id
      });
      if (socket) {
        socket.emit('breakout-leave', meetingId, {
          roomId: room.roomId,
          userId: currentUser.id
        });
      }
      onReturnToMain();
    } catch (err) {
      console.error('Error leaving room:', err);
      onReturnToMain();
    }
  };

  return (
    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-40 flex items-center bg-[#1F2430]/90 backdrop-blur-md border border-indigo-500/40 shadow-2xl rounded-2xl px-4 py-2 text-xs text-slate-100 space-x-3 select-none animate-in fade-in slide-in-from-top-2 duration-200">
      {/* Room Badge */}
      <div className="flex items-center space-x-2">
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
        <span className="font-bold text-slate-100">{room.name}</span>
        <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full font-semibold border border-indigo-500/30">
          Breakout Room
        </span>
      </div>

      <div className="w-px h-4 bg-slate-700" />

      {/* Countdown / Timer (18.17, 18.18) */}
      {countdown !== null && (
        <div className="flex items-center space-x-1 text-amber-300 font-mono font-bold bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/30">
          <Clock className="w-3.5 h-3.5 animate-spin" />
          <span>
            Closing in 00:{countdown < 10 ? `0${countdown}` : countdown}
          </span>
        </div>
      )}

      {/* Ask Host for Help (18.15) */}
      <button
        onClick={handleAskForHelp}
        disabled={hasRequestedHelp}
        className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-semibold transition-all ${
          hasRequestedHelp 
            ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
            : 'bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 hover:text-white shadow'
        }`}
        title="Request the host to join this breakout room"
      >
        <HelpCircle className="w-3.5 h-3.5" />
        <span>{hasRequestedHelp ? 'Host Notified' : 'Ask for Help'}</span>
      </button>

      {/* Return to Main Meeting (18.16) */}
      <button
        onClick={handleLeaveRoom}
        className="flex items-center space-x-1.5 bg-slate-800 hover:bg-rose-600/30 hover:border-rose-500/40 text-slate-300 hover:text-rose-300 px-3 py-1.5 rounded-xl font-semibold border border-slate-700 transition-colors shadow"
        title="Leave breakout room and return to main meeting"
      >
        <LogOut className="w-3.5 h-3.5" />
        <span>Return to Main</span>
      </button>
    </div>
  );
}
