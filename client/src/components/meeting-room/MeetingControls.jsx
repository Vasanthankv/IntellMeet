import React from 'react';
import { 
  Mic, MicOff, Video, VideoOff, MonitorUp, MessageSquare, 
  Users, Sparkles, Settings, Shield 
} from 'lucide-react';

export default function MeetingControls({ 
  isAudioMuted, toggleAudio, 
  isVideoMuted, toggleVideo, 
  isScreenSharing, toggleScreenShare,
  activePanel, setActivePanel,
  onToggleSecurity,
  isSecurityActive = false,
  isMeetingLocked = false
}) {
  
  const IconButton = ({ icon: Icon, label, active, onClick, danger, badge }) => (
    <div className="flex flex-col items-center gap-1 relative">
      <button 
        onClick={onClick}
        className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors relative ${
          danger 
            ? 'bg-red-500 hover:bg-red-600 text-white' 
            : active 
              ? 'bg-primary-600 hover:bg-primary-700 text-white' 
              : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
        }`}
      >
        <Icon className="w-5 h-5" />
        {badge && (
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-500 rounded-full border-2 border-gray-900" />
        )}
      </button>
      <span className="text-[10px] font-medium text-gray-400">{label}</span>
    </div>
  );

  return (
    <div className="h-24 bg-gray-900 border-t border-gray-800 flex items-center justify-center gap-3 sm:gap-6 shrink-0 z-10">
      <IconButton 
        icon={isAudioMuted ? MicOff : Mic} 
        label={isAudioMuted ? "Unmute" : "Mute"} 
        danger={isAudioMuted}
        onClick={toggleAudio} 
      />
      <IconButton 
        icon={isVideoMuted ? VideoOff : Video} 
        label={isVideoMuted ? "Start Video" : "Stop Video"} 
        danger={isVideoMuted}
        onClick={toggleVideo} 
      />
      
      <div className="w-px h-10 bg-gray-800 mx-2 hidden sm:block"></div>
      
      {/* 30.2 Security Button */}
      {onToggleSecurity && (
        <IconButton 
          icon={Shield} 
          label="Security" 
          active={isSecurityActive}
          badge={isMeetingLocked}
          onClick={onToggleSecurity} 
        />
      )}

      <IconButton 
        icon={MonitorUp} 
        label="Share" 
        active={isScreenSharing}
        onClick={toggleScreenShare} 
      />
      <IconButton 
        icon={Users} 
        label="People" 
        active={activePanel === 'participants'}
        onClick={() => setActivePanel(activePanel === 'participants' ? null : 'participants')} 
      />
      <IconButton 
        icon={MessageSquare} 
        label="Chat" 
        active={activePanel === 'chat'}
        onClick={() => setActivePanel(activePanel === 'chat' ? null : 'chat')} 
      />
      <IconButton 
        icon={Sparkles} 
        label="AI Assistant" 
        active={activePanel === 'ai'}
        onClick={() => setActivePanel(activePanel === 'ai' ? null : 'ai')} 
      />
      
      <div className="w-px h-10 bg-gray-800 mx-2 hidden sm:block"></div>
      
      <IconButton 
        icon={Settings} 
        label="Settings" 
        onClick={() => {}} 
      />
    </div>
  );
}
