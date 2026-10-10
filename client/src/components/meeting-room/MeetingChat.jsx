import React, { useState } from 'react';
import { X, Send, Smile } from 'lucide-react';
import { useSocket } from '../../hooks/useSocket';

export default function MeetingChat({ meetingId, onClose }) {
  const { chatMessages, sendMessage } = useSocket(meetingId);
  const [input, setInput] = useState('');

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage(input, "Admin User"); // Hardcoded user for mock
    setInput('');
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full shrink-0">
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 shrink-0">
        <h2 className="font-semibold text-gray-900">Meeting Chat</h2>
        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-md text-gray-500">
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {chatMessages.length === 0 ? (
          <div className="text-center text-gray-400 text-sm mt-10">
            No messages yet. Start the conversation!
          </div>
        ) : (
          chatMessages.map((msg, i) => {
            const isMe = msg.user === "Admin User";
            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-xs font-semibold text-gray-700">{isMe ? 'You' : msg.user}</span>
                  <span className="text-[10px] text-gray-400">{msg.timestamp}</span>
                </div>
                <div className={`px-3 py-2 rounded-lg max-w-[90%] text-sm ${isMe ? 'bg-primary-600 text-white rounded-tr-none' : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none'}`}>
                  {msg.text}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="p-3 bg-white border-t border-gray-200 shrink-0">
        <form onSubmit={handleSend} className="relative flex items-center">
          <button type="button" className="absolute left-2 text-gray-400 hover:text-gray-600">
            <Smile className="w-5 h-5" />
          </button>
          <input 
            type="text" 
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type a message..." 
            className="w-full bg-gray-100 border-transparent rounded-full pl-9 pr-10 py-2 text-sm focus:bg-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
          />
          <button 
            type="submit" 
            disabled={!input.trim()}
            className="absolute right-1.5 p-1.5 bg-primary-600 text-white rounded-full hover:bg-primary-700 disabled:opacity-50 disabled:hover:bg-primary-600"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
