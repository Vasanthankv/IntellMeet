import React from 'react';
import VideoTile from './VideoTile';

export default function VideoGrid({ participants }) {
  // Determine grid columns based on number of participants
  const getGridClass = (count) => {
    if (count === 1) return 'grid-cols-1';
    if (count === 2) return 'grid-cols-1 md:grid-cols-2';
    if (count <= 4) return 'grid-cols-2';
    if (count <= 6) return 'grid-cols-2 md:grid-cols-3';
    return 'grid-cols-3 lg:grid-cols-4';
  };

  return (
    <div className="flex-1 p-4 flex items-center justify-center bg-black overflow-hidden relative">
      <div className={`w-full h-full max-w-7xl max-h-[800px] grid gap-4 ${getGridClass(participants.length)}`}>
        {participants.map((p, index) => (
          <VideoTile 
            key={p.id} 
            participant={p} 
            isMuted={index === 1 || index === 3} // Mock some muted users
            isSpeaking={index === 0} // Mock active speaker
          />
        ))}
      </div>
    </div>
  );
}
