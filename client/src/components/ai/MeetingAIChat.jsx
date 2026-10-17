import React, { useState } from 'react';
import { Bot, Send, User, Sparkles } from 'lucide-react';
import { API_BASE_URL } from '../../utils/apiConfig';

export default function MeetingAIChat({ summary, meetingId: propMeetingId }) {
  const mId = propMeetingId || summary?.meetingId;
  const meetingName = summary?.title || summary?.meetingTitle || 'the selected';
  const [messages, setMessages] = useState([
    { role: 'assistant', text: `Hi! I'm your AI Meeting Assistant. I've analyzed "${meetingName}". What would you like to know about this session?` }
  ]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isThinking) return;

    const query = input.trim();
    const newMessages = [...messages, { role: 'user', text: query }];
    setMessages(newMessages);
    setInput('');
    setIsThinking(true);

    try {
      if (mId) {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/meetings/${mId}/questions/ask`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ question: query, presetType: 'CUSTOM' })
        });
        const data = await res.json();
        if (data.success && data.questionItem?.answer) {
          const ansText = typeof data.questionItem.answer === 'string'
            ? data.questionItem.answer
            : (data.questionItem.answer.text || 'Answer generated.');
          setMessages(prev => [...prev, { 
            role: 'assistant', 
            text: ansText,
            citations: data.questionItem.answer.sources || data.questionItem.citations || []
          }]);
          setIsThinking(false);
          return;
        } else {
          setMessages(prev => [...prev, {
            role: 'assistant',
            text: data.message || 'The AI assistant was unable to process your question. Please ensure Gemini is configured and retry.'
          }]);
          setIsThinking(false);
          return;
        }
      }
    } catch (e) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: `Error connecting to AI service: ${e.message}. Please check your network connection and try again.`
      }]);
      setIsThinking(false);
      return;
    }

    setMessages(prev => [...prev, {
      role: 'assistant',
      text: 'Please select an active meeting to query the AI assistant.'
    }]);
    setIsThinking(false);
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
        {isThinking && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-primary-100 text-primary-600 animate-pulse">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-3 rounded-lg text-sm bg-gray-100 text-gray-500 rounded-tl-none italic flex items-center gap-1.5">
              <span>Thinking and searching transcript</span>
              <span className="inline-flex gap-0.5">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
              </span>
            </div>
          </div>
        )}
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
