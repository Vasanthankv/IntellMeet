import React, { useEffect, useRef } from 'react';
import { 
  Shield, Lock, Unlock, Users, EyeOff, UserX, AlertTriangle, 
  X, MessageSquare, Mic, Video, MonitorUp, 
  Edit3, PenTool, Disc, ChevronRight, PlayCircle, Smile,
  Check, Info
} from 'lucide-react';

function ZoomToggle({ checked, onChange, disabled = false }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled) onChange(!checked);
      }}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
        checked ? 'bg-blue-600' : 'bg-[#404040]'
      } ${disabled ? 'opacity-40 cursor-not-allowed' : 'hover:opacity-90'}`}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          checked ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

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
  const panelRef = useRef(null);

  // Outside click & Escape key detection
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e) => {
      // Ignore clicks inside panel
      if (panelRef.current && panelRef.current.contains(e.target)) {
        return;
      }
      // Ignore clicks on security toolbar button (button's own click handler toggles it)
      const securityToolbarBtn = document.getElementById('security-toolbar-button');
      if (securityToolbarBtn && securityToolbarBtn.contains(e.target)) {
        return;
      }
      onClose();
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    // 60ms delay ensures the opening click event doesn't trigger instant closing
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('touchstart', handleOutsideClick);
    }, 60);

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const perms = securitySettings?.participantPermissions || {};
  const isSuspended = !!(securitySettings?.participantActivitiesSuspended || securitySettings?.suspendActivities);
  const whoCanShare = securitySettings?.whoCanShareScreen || 'all';

  const canReact = perms.canReact !== undefined 
    ? perms.canReact 
    : (securitySettings?.allowReactions !== undefined ? securitySettings.allowReactions : true);

  return (
    <>
      {/* Light backdrop overlay (dismiss on outside tap) */}
      <div 
        className="fixed inset-0 z-[990] bg-black/40 backdrop-blur-[1px] animate-in fade-in duration-150" 
        onClick={onClose} 
      />

      {/* Security Popover / Modal: Positioned floating directly above toolbar */}
      <div 
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Meeting Security Settings"
        onClick={(e) => e.stopPropagation()}
        className="fixed bottom-[74px] left-2 sm:left-12 md:left-24 z-[999] w-[calc(100vw-16px)] sm:w-[390px] bg-[#1A1A1A] border border-[#383838] rounded-2xl shadow-2xl text-xs text-gray-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[calc(100vh-90px)]"
      >
        
        {/* ── Top Header Bar ── */}
        <div className="p-3.5 bg-[#222222] border-b border-[#303030] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
              <Shield className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white tracking-wide truncate">
                  Security
                </h3>
                {isHostOrCoHost ? (
                  <span className="text-[10px] bg-blue-900/60 text-blue-300 font-semibold px-1.5 py-0.5 rounded border border-blue-700/50">
                    Host Control
                  </span>
                ) : (
                  <span className="text-[10px] bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded border border-gray-700">
                    View Only
                  </span>
                )}
              </div>
              <p className="text-[10px] text-gray-400 truncate">Manage access, permissions, and session protection</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
              isMeetingLocked 
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' 
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
            }`}>
              {isMeetingLocked ? '🔒 Locked' : '🔓 Unlocked'}
            </span>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              title="Close Security"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Suspended Alert Banner ── */}
        {isSuspended && (
          <div className="p-2.5 bg-red-950/70 border-b border-red-800/60 flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2 text-red-200 text-[11px] min-w-0">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 animate-pulse" />
              <span className="font-semibold truncate">Emergency Lockdown Active</span>
            </div>
            {isHostOrCoHost && (
              <button
                onClick={onResumeActivities}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-sm shrink-0 transition-colors"
              >
                <PlayCircle className="w-3.5 h-3.5" />
                Resume
              </button>
            )}
          </div>
        )}

        {/* ── View-Only Participant Notice ── */}
        {!isHostOrCoHost && (
          <div className="px-3 py-2 bg-blue-950/40 border-b border-blue-900/40 flex items-center gap-2 text-[10px] text-blue-200 shrink-0">
            <Info className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span>Only meeting hosts and co-hosts can change security settings.</span>
          </div>
        )}

        {/* ── Scrollable Body ── */}
        <div className="overflow-y-auto p-3.5 space-y-3.5 custom-scrollbar divide-y divide-[#2B2B2B]">

          {/* ── Section 1: Meeting Access ── */}
          <div className="space-y-1.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center justify-between px-1">
              <span>Meeting Access</span>
              <span className="text-[10px] text-gray-500 lowercase">Admission Control</span>
            </div>

            {/* Lock Meeting */}
            <div className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-2.5 pr-2">
                {isMeetingLocked ? <Lock className="w-4 h-4 text-amber-400 shrink-0" /> : <Unlock className="w-4 h-4 text-gray-400 shrink-0" />}
                <div>
                  <span className="font-semibold text-gray-200 block">Lock Meeting</span>
                  <p className="text-[10px] text-gray-400">Prevent new participants from joining</p>
                </div>
              </div>
              <ZoomToggle
                checked={!!isMeetingLocked}
                onChange={(val) => onToggleLock(val)}
                disabled={!isHostOrCoHost}
              />
            </div>

            {/* Enable Waiting Room */}
            <div className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-2.5 pr-2">
                <Users className="w-4 h-4 text-blue-400 shrink-0" />
                <div>
                  <span className="font-semibold text-gray-200 block">Enable Waiting Room</span>
                  <p className="text-[10px] text-gray-400">Place incoming participants in waiting lounge</p>
                </div>
              </div>
              <ZoomToggle
                checked={!!(securitySettings?.waitingRoomEnabled ?? securitySettings?.enableWaitingRoom)}
                onChange={(val) => onToggleWaitingRoom(val)}
                disabled={!isHostOrCoHost}
              />
            </div>

            {/* Hide Profile Pictures */}
            <div className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-2.5 pr-2">
                <EyeOff className="w-4 h-4 text-indigo-400 shrink-0" />
                <div>
                  <span className="font-semibold text-gray-200 block">Hide Profile Pictures</span>
                  <p className="text-[10px] text-gray-400">Display initials or silhouettes instead of photos</p>
                </div>
              </div>
              <ZoomToggle
                checked={!!securitySettings?.hideProfilePictures}
                onChange={(val) => onToggleHideProfilePictures(val)}
                disabled={!isHostOrCoHost}
              />
            </div>
          </div>

          {/* ── Section 2: Allow Participants To: (Zoom-Style Permissions) ── */}
          <div className="pt-3 space-y-1.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-1">
              Allow Participants To:
            </div>

            <div className="space-y-1 bg-black/25 p-1 rounded-xl border border-white/5">
              {/* Share Screen */}
              <div className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-2">
                  <MonitorUp className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-gray-200">Share Screen</span>
                </div>
                <ZoomToggle
                  checked={perms.canShareScreen !== false && securitySettings?.allowShareScreen !== false}
                  onChange={(val) => onUpdatePermissions({ canShareScreen: val })}
                  disabled={!isHostOrCoHost}
                />
              </div>

              {/* Chat Access */}
              <div className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-gray-200">Chat</span>
                </div>
                {isHostOrCoHost ? (
                  <select
                    value={perms.canChat || securitySettings?.allowChat || 'everyone'}
                    onChange={(e) => onUpdatePermissions({ canChat: e.target.value })}
                    className="bg-[#2B2B2B] text-white border border-[#444] rounded px-2 py-0.5 text-[11px] outline-none cursor-pointer focus:border-blue-500"
                  >
                    <option value="everyone">Everyone</option>
                    <option value="hostOnly">Host Only</option>
                    <option value="none">No One</option>
                  </select>
                ) : (
                  <span className="text-[11px] text-gray-400 font-medium capitalize">
                    {perms.canChat || securitySettings?.allowChat || 'Everyone'}
                  </span>
                )}
              </div>

              {/* Rename Themselves */}
              <div className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-2">
                  <Edit3 className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-gray-200">Rename Themselves</span>
                </div>
                <ZoomToggle
                  checked={perms.canRename !== false && securitySettings?.allowRename !== false}
                  onChange={(val) => onUpdatePermissions({ canRename: val })}
                  disabled={!isHostOrCoHost}
                />
              </div>

              {/* Unmute Themselves */}
              <div className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-2">
                  <Mic className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-gray-200">Unmute Themselves</span>
                </div>
                <ZoomToggle
                  checked={perms.canUnmute !== false && securitySettings?.allowUnmute !== false}
                  onChange={(val) => onUpdatePermissions({ canUnmute: val })}
                  disabled={!isHostOrCoHost}
                />
              </div>

              {/* Start Video */}
              <div className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-2">
                  <Video className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-gray-200">Start Video</span>
                </div>
                <ZoomToggle
                  checked={perms.canStartVideo !== false && securitySettings?.allowStartVideo !== false}
                  onChange={(val) => onUpdatePermissions({ canStartVideo: val })}
                  disabled={!isHostOrCoHost}
                />
              </div>

              {/* Meeting Reactions */}
              <div className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-2">
                  <Smile className="w-3.5 h-3.5 text-yellow-400" />
                  <span className="text-gray-200">Meeting Reactions (Emojis)</span>
                </div>
                <ZoomToggle
                  checked={canReact}
                  onChange={(val) => onUpdatePermissions({ canReact: val })}
                  disabled={!isHostOrCoHost}
                />
              </div>

              {/* Share Whiteboard */}
              <div className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-2">
                  <PenTool className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-gray-200">Share Whiteboards</span>
                </div>
                <ZoomToggle
                  checked={perms.canShareWhiteboard !== false && securitySettings?.allowWhiteboard !== false}
                  onChange={(val) => onUpdatePermissions({ canShareWhiteboard: val })}
                  disabled={!isHostOrCoHost}
                />
              </div>

              {/* Request Cloud Recording */}
              <div className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-2">
                  <Disc className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-gray-200">Request Cloud Recording</span>
                </div>
                <ZoomToggle
                  checked={perms.canRequestRecording !== false}
                  onChange={(val) => onUpdatePermissions({ canRequestRecording: val })}
                  disabled={!isHostOrCoHost}
                />
              </div>
            </div>
          </div>

          {/* ── Section 3: Screen Sharing Policy ── */}
          <div className="pt-3 space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-1">
              Who Can Share Screen?
            </div>
            <div className="grid grid-cols-3 gap-1 bg-black/35 p-1 rounded-xl border border-white/5 text-[11px]">
              <button
                type="button"
                disabled={!isHostOrCoHost}
                onClick={() => onUpdateScreenSharePolicy('hostOnly')}
                className={`py-1.5 px-2 rounded-lg font-medium transition-colors text-center ${
                  whoCanShare === 'hostOnly' 
                    ? 'bg-blue-600 text-white font-semibold shadow-sm' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                } ${!isHostOrCoHost ? 'cursor-not-allowed opacity-60' : ''}`}
              >
                Host Only
              </button>
              <button
                type="button"
                disabled={!isHostOrCoHost}
                onClick={() => onUpdateScreenSharePolicy('hostCoHost')}
                className={`py-1.5 px-2 rounded-lg font-medium transition-colors text-center ${
                  whoCanShare === 'hostCoHost' 
                    ? 'bg-blue-600 text-white font-semibold shadow-sm' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                } ${!isHostOrCoHost ? 'cursor-not-allowed opacity-60' : ''}`}
              >
                Host + Co-Host
              </button>
              <button
                type="button"
                disabled={!isHostOrCoHost}
                onClick={() => onUpdateScreenSharePolicy('all')}
                className={`py-1.5 px-2 rounded-lg font-medium transition-colors text-center ${
                  whoCanShare === 'all' 
                    ? 'bg-blue-600 text-white font-semibold shadow-sm' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                } ${!isHostOrCoHost ? 'cursor-not-allowed opacity-60' : ''}`}
              >
                Everyone
              </button>
            </div>
          </div>

          {/* ── Section 4: Watermarking Controls ── */}
          <div className="pt-3 space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center justify-between px-1">
              <span>Watermarking Protection</span>
              <span className="text-[10px] text-blue-400 font-semibold lowercase">Anti-Leak</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-2.5 pr-2">
                <Shield className="w-4 h-4 text-blue-400 shrink-0" />
                <div>
                  <span className="font-semibold text-gray-200 block">Visual Watermark</span>
                  <p className="text-[10px] text-gray-400">Overlays viewer identity on shared screen & video</p>
                </div>
              </div>
              <ZoomToggle
                checked={!!watermarkSettings?.visualEnabled}
                onChange={(val) => onToggleVisualWatermark && onToggleVisualWatermark(val)}
                disabled={!isHostOrCoHost}
              />
            </div>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenWatermarkSettings && onOpenWatermarkSettings();
              }}
              className="w-full flex items-center justify-between p-2 rounded-xl bg-blue-950/30 hover:bg-blue-900/40 text-blue-200 border border-blue-500/20 transition-colors text-left"
            >
              <div className="flex items-center gap-2 truncate">
                <Shield className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span className="font-medium truncate">Watermark Settings & Leak Tracer...</span>
              </div>
              <ChevronRight className="w-4 h-4 text-blue-400 shrink-0 ml-1" />
            </button>
          </div>

          {/* ── Section 5: Participant Management ── */}
          <div className="pt-3 space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-1">
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
                  <Users className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="font-medium">Manage Participants Panel</span>
                </div>
                {waitingQueueCount > 0 ? (
                  <span className="bg-amber-500 text-black font-bold text-[10px] px-2 py-0.5 rounded-full animate-pulse">
                    {waitingQueueCount} Waiting
                  </span>
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-500 shrink-0" />
                )}
              </button>

              {isHostOrCoHost && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenRemoveModal();
                  }}
                  className="w-full flex items-center justify-between p-2 rounded-xl bg-white/5 hover:bg-white/10 text-red-300 transition-colors text-left"
                >
                  <div className="flex items-center gap-2">
                    <UserX className="w-4 h-4 text-red-400 shrink-0" />
                    <span className="font-medium">Remove Participant...</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-500 shrink-0" />
                </button>
              )}
            </div>
          </div>

          {/* ── Section 6: Emergency Suspend Activities ── */}
          {isHostOrCoHost && (
            <div className="pt-3">
              {isSuspended ? (
                <button
                  type="button"
                  onClick={() => {
                    onResumeActivities();
                    onClose();
                  }}
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
          )}

        </div>
      </div>
    </>
  );
}
