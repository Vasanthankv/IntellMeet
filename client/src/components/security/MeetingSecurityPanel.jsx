import React, { useState } from 'react';
import { 
  Shield, Lock, Unlock, Users, Eye, EyeOff, UserX, AlertTriangle, 
  Check, X, RefreshCw, MessageSquare, Mic, Video, MonitorUp, 
  Edit3, PenTool, Disc, ChevronRight, PlayCircle
} from 'lucide-react';

export default function MeetingSecurityPanel({
  isOpen,
  onClose,
  securitySettings = {},
  isMeetingLocked = false,
  isHostOrCoHost = false,
  waitingQueueCount = 0,
  watermarkSettings = {},
  onToggleVisualWatermark,
  onOpenWatermarkSettings,
  onToggleLock,
  onToggleWaitingRoom,
  onToggleHideProfilePictures,
  onUpdatePermissions,
  onUpdateScreenSharePolicy,
  onOpenSuspendModal,
  onResumeActivities,
  onOpenRemoveModal,
  onOpenParticipantsDrawer
}) {
  if (!isOpen) return null;

  const perms = securitySettings?.participantPermissions || {};
  const isSuspended = !!securitySettings?.participantActivitiesSuspended;
  const whoCanShare = securitySettings?.whoCanShareScreen || 'all';

  return (
    <div className="absolute bottom-full left-0 mb-3 w-88 sm:w-96 bg-[#1A1A1A] border border-[#383838] rounded-2xl shadow-2xl z-50 text-xs text-gray-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 divide-y divide-[#2A2A2A]">
      
      {/* ── Top Header Bar ── */}
      <div className="p-4 bg-[#212121] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary-600/20 border border-primary-500/30 flex items-center justify-center text-primary-400">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white tracking-wide flex items-center gap-1.5">
              <span>Security</span>
              {isSuspended && (
                <span className="text-[10px] bg-red-600 text-white font-bold px-1.5 py-0.5 rounded uppercase">
                  Suspended
                </span>
              )}
            </h3>
            <p className="text-[10px] text-gray-400">In-Meeting Control Center (Part 30)</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
            isMeetingLocked 
              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' 
              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
          }`}>
            {isMeetingLocked ? '🔒 Locked' : '🔓 Unlocked'}
          </span>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-md hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Suspended Alert Banner ── */}
      {isSuspended && (
        <div className="p-3 bg-red-950/60 border-b border-red-800/50 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-red-200 text-[11px]">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>Emergency Lockdown Active. Activities halted.</span>
          </div>
          <button
            onClick={onResumeActivities}
            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-sm shrink-0"
          >
            <PlayCircle className="w-3.5 h-3.5" />
            Resume
          </button>
        </div>
      )}

      <div className="max-h-[70vh] overflow-y-auto p-4 space-y-4 custom-scrollbar">

        {/* ── Section 1: Meeting Access (30.3, 30.4) ── */}
        <div className="space-y-2">
          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center justify-between">
            <span>Meeting Access</span>
            <span className="text-[10px] text-gray-500 lowercase">admission control</span>
          </div>

          <label className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 cursor-pointer transition-colors">
            <div className="flex items-center gap-2.5">
              <Users className="w-4 h-4 text-blue-400" />
              <div>
                <span className="font-semibold text-gray-200">Enable Waiting Room</span>
                <p className="text-[10px] text-gray-400">Place incoming participants in waiting lounge</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={!!securitySettings?.waitingRoomEnabled}
              onChange={(e) => onToggleWaitingRoom(e.target.checked)}
              className="w-4 h-4 accent-primary-600 rounded cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 cursor-pointer transition-colors">
            <div className="flex items-center gap-2.5">
              {isMeetingLocked ? <Lock className="w-4 h-4 text-amber-400" /> : <Unlock className="w-4 h-4 text-gray-400" />}
              <div>
                <span className="font-semibold text-gray-200">Lock Meeting</span>
                <p className="text-[10px] text-gray-400">Prevent new participants from joining</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={!!isMeetingLocked}
              onChange={(e) => onToggleLock(e.target.checked)}
              className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
            />
          </label>
        </div>

        {/* ── Section 2: Participant Privacy (30.6) ── */}
        <div className="pt-2 border-t border-[#2A2A2A] space-y-2">
          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
            Participant Privacy
          </div>

          <label className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 cursor-pointer transition-colors">
            <div className="flex items-center gap-2.5">
              <EyeOff className="w-4 h-4 text-indigo-400" />
              <div>
                <span className="font-semibold text-gray-200">Hide Profile Pictures</span>
                <p className="text-[10px] text-gray-400">Display generic initials/silhouettes instead of photos</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={!!securitySettings?.hideProfilePictures}
              onChange={(e) => onToggleHideProfilePictures(e.target.checked)}
              className="w-4 h-4 accent-indigo-500 rounded cursor-pointer"
            />
          </label>
        </div>

        {/* ── Section 3: Participant Permissions (30.5) ── */}
        <div className="pt-2 border-t border-[#2A2A2A] space-y-2">
          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
            Allow Participants To
          </div>

          <div className="space-y-1 bg-black/20 p-1.5 rounded-xl border border-white/5">
            {/* Screen Sharing Toggle */}
            <label className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 cursor-pointer">
              <div className="flex items-center gap-2">
                <MonitorUp className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-gray-200">Share Screen</span>
              </div>
              <input
                type="checkbox"
                checked={perms.canShareScreen !== false}
                onChange={(e) => onUpdatePermissions({ canShareScreen: e.target.checked })}
                className="w-4 h-4 accent-primary-600 rounded cursor-pointer"
              />
            </label>

            {/* Chat Control */}
            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-gray-200">Chat</span>
              </div>
              <select
                value={perms.canChat || 'everyone'}
                onChange={(e) => onUpdatePermissions({ canChat: e.target.value })}
                className="bg-[#2B2B2B] text-white border border-[#444] rounded px-2 py-0.5 text-[11px] outline-none cursor-pointer"
              >
                <option value="everyone">Everyone</option>
                <option value="hostOnly">Host Only</option>
                <option value="none">No One</option>
              </select>
            </div>

            {/* Self Unmute */}
            <label className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 cursor-pointer">
              <div className="flex items-center gap-2">
                <Mic className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-gray-200">Unmute Themselves</span>
              </div>
              <input
                type="checkbox"
                checked={perms.canUnmute !== false}
                onChange={(e) => onUpdatePermissions({ canUnmute: e.target.checked })}
                className="w-4 h-4 accent-primary-600 rounded cursor-pointer"
              />
            </label>

            {/* Start Video */}
            <label className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 cursor-pointer">
              <div className="flex items-center gap-2">
                <Video className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-gray-200">Start Video</span>
              </div>
              <input
                type="checkbox"
                checked={perms.canStartVideo !== false}
                onChange={(e) => onUpdatePermissions({ canStartVideo: e.target.checked })}
                className="w-4 h-4 accent-primary-600 rounded cursor-pointer"
              />
            </label>

            {/* Rename Themselves */}
            <label className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 cursor-pointer">
              <div className="flex items-center gap-2">
                <Edit3 className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-gray-200">Rename Themselves</span>
              </div>
              <input
                type="checkbox"
                checked={perms.canRename !== false}
                onChange={(e) => onUpdatePermissions({ canRename: e.target.checked })}
                className="w-4 h-4 accent-primary-600 rounded cursor-pointer"
              />
            </label>

            {/* Share Whiteboard */}
            <label className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 cursor-pointer">
              <div className="flex items-center gap-2">
                <PenTool className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-gray-200">Share Whiteboards</span>
              </div>
              <input
                type="checkbox"
                checked={perms.canShareWhiteboard !== false}
                onChange={(e) => onUpdatePermissions({ canShareWhiteboard: e.target.checked })}
                className="w-4 h-4 accent-primary-600 rounded cursor-pointer"
              />
            </label>

            {/* Request Recording */}
            <label className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 cursor-pointer">
              <div className="flex items-center gap-2">
                <Disc className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-gray-200">Request Cloud Recording</span>
              </div>
              <input
                type="checkbox"
                checked={perms.canRequestRecording !== false}
                onChange={(e) => onUpdatePermissions({ canRequestRecording: e.target.checked })}
                className="w-4 h-4 accent-primary-600 rounded cursor-pointer"
              />
            </label>
          </div>
        </div>

        {/* ── Section 4: Screen Sharing Control (30.8) ── */}
        <div className="pt-2 border-t border-[#2A2A2A] space-y-2">
          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
            Who Can Share Screen? (30.8)
          </div>
          <div className="grid grid-cols-3 gap-1.5 bg-black/30 p-1.5 rounded-xl border border-white/5 text-[11px]">
            <button
              type="button"
              onClick={() => onUpdateScreenSharePolicy('hostOnly')}
              className={`py-1.5 px-2 rounded-lg font-medium transition-colors text-center ${
                whoCanShare === 'hostOnly' 
                  ? 'bg-primary-600 text-white shadow-sm' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Host Only
            </button>
            <button
              type="button"
              onClick={() => onUpdateScreenSharePolicy('hostCoHost')}
              className={`py-1.5 px-2 rounded-lg font-medium transition-colors text-center ${
                whoCanShare === 'hostCoHost' 
                  ? 'bg-primary-600 text-white shadow-sm' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Host + Co-Host
            </button>
            <button
              type="button"
              onClick={() => onUpdateScreenSharePolicy('all')}
              className={`py-1.5 px-2 rounded-lg font-medium transition-colors text-center ${
                whoCanShare === 'all' 
                  ? 'bg-primary-600 text-white shadow-sm' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              All Participants
            </button>
          </div>
        </div>

        {/* ── Section 4.5: Watermarking Controls (Part 32) ── */}
        <div className="pt-2 border-t border-[#2A2A2A] space-y-2">
          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center justify-between">
            <span>Watermarking (Anti-Leak)</span>
            <span className="text-[10px] text-indigo-400 font-semibold lowercase">Section 32</span>
          </div>

          <label className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 cursor-pointer transition-colors">
            <div className="flex items-center gap-2.5">
              <Eye className="w-4 h-4 text-indigo-400" />
              <div>
                <span className="font-semibold text-gray-200">Visual Watermark</span>
                <p className="text-[10px] text-gray-400">Overlays viewer identity on shared content & video</p>
              </div>
            </div>
            <input 
              type="checkbox" 
              checked={!!watermarkSettings?.visualEnabled} 
              onChange={(e) => onToggleVisualWatermark && onToggleVisualWatermark(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 border-gray-600 bg-gray-700 accent-indigo-600 cursor-pointer" 
            />
          </label>

          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenWatermarkSettings && onOpenWatermarkSettings();
            }}
            className="w-full flex items-center justify-between p-2 rounded-xl bg-indigo-950/40 hover:bg-indigo-900/40 text-indigo-200 border border-indigo-500/20 transition-colors text-left"
          >
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-400" />
              <span className="font-semibold">Watermark Settings & Forensic Leak Tracer...</span>
            </div>
            <ChevronRight className="w-4 h-4 text-indigo-400" />
          </button>
        </div>

        {/* ── Section 5: Participant Management (30.9, 30.10) ── */}
        <div className="pt-2 border-t border-[#2A2A2A] space-y-2">
          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
            Participant Management
          </div>

          <div className="space-y-1.5">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenParticipantsDrawer();
              }}
              className="w-full flex items-center justify-between p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-200 transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                <span>Manage Participants Panel</span>
              </div>
              {waitingQueueCount > 0 ? (
                <span className="bg-amber-500 text-black font-bold text-[10px] px-2 py-0.5 rounded-full animate-pulse">
                  {waitingQueueCount} Waiting
                </span>
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-500" />
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenRemoveModal();
              }}
              className="w-full flex items-center justify-between p-2 rounded-xl bg-white/5 hover:bg-white/10 text-red-300 transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <UserX className="w-4 h-4 text-red-400" />
                <span>Remove Participant...</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>

        {/* ── Section 6: Emergency Suspend Activities (30.7) ── */}
        <div className="pt-2 border-t border-[#2A2A2A]">
          {isSuspended ? (
            <button
              type="button"
              onClick={onResumeActivities}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2"
            >
              <PlayCircle className="w-4 h-4" />
              Resume Participant Activities
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenSuspendModal();
              }}
              className="w-full py-2.5 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 group"
            >
              <AlertTriangle className="w-4 h-4 text-red-400 group-hover:text-white transition-colors" />
              <span>Suspend Participant Activities</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
