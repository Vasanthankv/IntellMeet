import React from 'react';
import { X, Palette } from 'lucide-react';
import PersonalizationWorkspace from './PersonalizationWorkspace';

export default function PersonalizationModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#1C1C1C] border border-[#333] rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#2C2C2C] flex items-center justify-between bg-[#161616]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-500/20 text-blue-400 rounded-xl">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Meeting Personalization</h3>
              <p className="text-xs text-gray-400">Themes, custom wallpaper, toolbar organization & views</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Workspace Body */}
        <div className="flex-1 overflow-y-auto p-6">
          <PersonalizationWorkspace isModal={true} onClose={onClose} />
        </div>

      </div>
    </div>
  );
}
