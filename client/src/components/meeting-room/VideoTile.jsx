import React from 'react';
import { MicOff, User } from 'lucide-react';

export default function VideoTile({ participant, isMuted, isSpeaking, hideProfilePictures = false }) {
  return (
    <div className={`relative w-full h-full bg-gray-800 rounded-xl overflow-hidden group ${isSpeaking ? 'ring-2 ring-primary-500' : 'ring-1 ring-gray-700'}`}>
      {/* Fallback avatar if video is off (Section 30.6 Hide Profile Pictures) */}
      <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
        <div className={`w-24 h-24 rounded-full overflow-hidden flex items-center justify-center bg-gray-700 text-gray-300 ${isSpeaking ? 'ring-4 ring-primary-500/30' : ''}`}>
          {hideProfilePictures || !participant?.avatar ? (
            <User className="w-12 h-12 text-gray-400" />
          ) : (
            <img src={participant.avatar} alt={participant.name} className="w-full h-full object-cover" />
          )}
        </div>
      </div>
      
      {/* Label and indicators */}
      <div className="absolute bottom-3 left-3 bg-gray-900/70 backdrop-blur-sm px-3 py-1.5 rounded-lg flex items-center gap-2">
        <span className="text-white text-sm font-medium">{participant.name}</span>
        {isMuted && <MicOff className="w-3.5 h-3.5 text-red-500" />}
      </div>
    </div>
  );
}
