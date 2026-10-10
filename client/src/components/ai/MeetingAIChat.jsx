import React, { useState } from 'react';
import { Bot, Send, User } from 'lucide-react';

export default function MeetingAIChat({ summary }) {
  const meetingName = summary?.title || summary?.meetingTitle || 'the selected';
  const [messages, setMessages] = useState([
    { role: 'assistant', text: `Hi! I'm your AI Meeting Assistant. I've analyzed "${meetingName}". What would you like to know about this session?` }
  ]);
  const [input, setInput] = useState('');

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message
    const newMessages = [...messages, { role: 'user', text: input }];
    setMessages(newMessages);
    setInput('');

    // AI response based on real summary context
    setTimeout(() => {
      let aiResponse = "I'm your meeting assistant. You can ask me about decisions, action items, or the summary of this session.";
      const lowerInput = input.toLowerCase();
      
      if (lowerInput.includes('action') || lowerInput.includes('task')) {
        const items = summary?.actionItems || [];
        aiResponse = items.length > 0 
          ? `There are ${items.length} action items recorded: ${items.map(a => a.task || a.description || 'Task').slice(0, 3).join('; ')}.`
          : 'No specific action items have been recorded for this meeting yet.';
      } else if (lowerInput.includes('decision') || lowerInput.includes('decide') || lowerInput.includes('outcome')) {
        const decs = summary?.decisions || [];
        aiResponse = decs.length > 0
          ? `Agreed decisions include: ${decs.map(d => d.description || d).slice(0, 3).join('; ')}.`
          : 'No formal decisions have been logged for this meeting yet.';
      } else if (lowerInput.includes('summary') || lowerInput.includes('overview') || lowerInput.includes('about')) {
        aiResponse = summary?.overview 
          ? `Here is the executive overview: ${summary.overview}`
          : `This session is titled "${meetingName}". No detailed overview notes have been submitted yet.`;
      }

      setMessages(prev => [...prev, { role: 'assistant', text: aiResponse }]);
    }, 700);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col h-[600px]">
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-indigo-50 flex items-center gap-3 shrink-0 rounded-t-xl">
        <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center shadow-sm">
          <Bot className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 text-sm">AI Meeting Assistant</h3>
          <p className="text-xs text-gray-500">Ask questions about this meeting</p>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'assistant' ? 'bg-primary-100 text-primary-600' : 'bg-gray-200 text-gray-600'}`}>
              {msg.role === 'assistant' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
            </div>
            <div className={`p-3 rounded-lg max-w-[85%] text-sm ${msg.role === 'user' ? 'bg-primary-600 text-white rounded-tr-none' : 'bg-gray-100 text-gray-800 rounded-tl-none'}`}>
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-gray-200 shrink-0">
        <form onSubmit={handleSend} className="relative flex items-center">
          <input 
            type="text" 
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask about decisions, topics, etc..." 
            className="w-full bg-gray-50 border border-gray-300 rounded-lg pl-4 pr-10 py-2.5 text-sm focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
          <button 
            type="submit" 
            disabled={!input.trim()}
            className="absolute right-2 p-1.5 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
