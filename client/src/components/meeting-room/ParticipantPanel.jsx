import React from 'react';
import { X, Mic, MicOff, Search, User } from 'lucide-react';

export default function ParticipantPanel({ participants = [], onClose, hideProfilePictures = false }) {
  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full shrink-0">
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
        <h2 className="font-semibold text-gray-900">Participants ({participants.length})</h2>
        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-md text-gray-500">
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <div className="p-3 border-b border-gray-100">
        <div className="relative">
          <Search className="absolute left-2.5 top-2 h-4 w-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search participants" 
            className="w-full bg-gray-50 border border-gray-200 rounded-md pl-9 pr-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2">
        {participants.map((p, i) => (
          <div key={p.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg group">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                {hideProfilePictures || !p.avatar ? (
                  <User className="w-4 h-4 text-gray-500" />
                ) : (
                  <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" />
                )}
              </div>
              <span className="text-sm font-medium text-gray-700">{p.name} {i === 0 && "(You)"}</span>
            </div>
            <div className="text-gray-400 group-hover:text-gray-600">
              {i === 1 || i === 3 ? <MicOff className="w-4 h-4 text-red-500" /> : <Mic className="w-4 h-4" />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
