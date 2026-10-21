import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Send, User, Bot, HelpCircle } from 'lucide-react';

export default function SupportChatPage() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    { id: 1, type: 'bot', text: 'Hi there! Welcome to IntellMeet Support. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userText = input.trim();
    const userMsg = { id: Date.now(), type: 'user', text: userText };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Simulate bot intelligence
    setTimeout(() => {
      setIsTyping(false);
      
      let botResponse = '';
      const lowerInput = userText.toLowerCase();

      // Greetings
      if (lowerInput.match(/\b(hi|hello|hey|greetings)\b/)) {
        botResponse = 'Hello! How can I assist you with IntellMeet today?';
      } 
      // Login / Authentication
      else if (lowerInput.match(/\b(login|log in|sign in|signin)\b/)) {
        botResponse = 'To log in, click the "Sign In" button in the top right corner of the homepage, or navigate to /login. You will need your email and password.';
      } 
      // Registration / Signup
      else if (lowerInput.match(/\b(register|sign up|signup|create account)\b/)) {
        botResponse = 'You can create a free account by clicking "Sign Up Free" in the user menu. We offer Basic, Pro, and Business tiers!';
      } 
      // Passwords
      else if (lowerInput.match(/\b(password|forgot password|reset)\b/)) {
        botResponse = 'If you forgot your password, go to the login page and click "Forgot Password". We will email you a reset link.';
      } 
      // Scheduling Meetings
      else if (lowerInput.match(/\b(schedule|create meeting|new meeting|host)\b/)) {
        botResponse = 'To schedule a meeting, go to your Dashboard and click the "Schedule Meeting" button. You can set the topic, time, and advanced AI options there.';
      } 
      // Joining Meetings
      else if (lowerInput.match(/\b(join|enter meeting)\b/)) {
        botResponse = 'To join a meeting, you can click the invite link sent to you, or click "Join a Meeting" from the top menu and enter the Meeting ID.';
      } 
      // Audio/Video Issues
      else if (lowerInput.match(/\b(video|camera|cam)\b/)) {
        botResponse = 'If you are having trouble with your video, please ensure your browser has camera permissions enabled (check the lock icon next to the URL).';
      } else if (lowerInput.match(/\b(audio|mic|microphone|sound|hear)\b/)) {
        botResponse = 'For audio issues, please check that your microphone isn\'t muted and that your browser has microphone permissions enabled.';
      } 
      // In-Meeting Features
      else if (lowerInput.match(/\b(screen|share|present)\b/)) {
        botResponse = 'To share your screen, click the "Monitor" icon in the bottom control bar during a meeting. You can share your whole screen or a specific tab.';
      } else if (lowerInput.match(/\b(record|recording)\b/)) {
        botResponse = 'To start recording, click the "Record" button in the bottom control bar. Recordings are automatically saved to your Hub.';
      } else if (lowerInput.match(/\b(summary|ai|transcription|captions|cc)\b/)) {
        botResponse = 'Our AI Summary feature automatically generates transcripts and action items. Click "IntellMeet AI Summary" or "CC" in the meeting room to activate it!';
      } 
      // Billing & Pricing
      else if (lowerInput.match(/\b(pricing|plan|upgrade|billing|pay)\b/)) {
        botResponse = 'You can view our pricing plans and upgrade your account by visiting the "Plans and Billing" page from your profile dropdown.';
      } 
      // Pleasantries
      else if (lowerInput.match(/\b(ok|okay|thanks|thank you|cool)\b/)) {
        botResponse = 'You\'re welcome! Let me know if there\'s anything else you need help with.';
      } 
      // Dynamic Fallback Action
      else {
        botResponse = `I see you are asking about "${userText}". While I am a bot, I have logged this request. You can check our Knowledge Base for quick answers, or type "agent" to be connected with a human specialist.`;
      }

      const botMsg = { 
        id: Date.now(), 
        type: 'bot', 
        text: botResponse
      };
      setMessages(prev => [...prev, botMsg]);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans h-screen">
      {/* Header */}
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 shrink-0 z-20">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-500 hover:text-gray-900 transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="w-px h-5 bg-gray-200 shrink-0" />
          <Link to="/" className="flex items-center gap-1 sm:gap-2 text-primary-600 font-bold text-lg sm:text-xl tracking-tight shrink-0">
            IntellMeet
          </Link>
          <span className="text-gray-400 font-light text-base sm:text-xl shrink-0">/</span>
          <span className="text-gray-700 font-medium text-xs sm:text-sm truncate">Live Support Chat</span>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 max-w-3xl mx-auto w-full p-2 sm:p-4 md:p-6 flex flex-col overflow-hidden">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col flex-1 overflow-hidden">
          
          {/* Chat Header */}
          <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-primary-600 to-primary-700 text-white flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <HelpCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-lg leading-tight">IntellMeet Support Bot</h2>
              <p className="text-primary-100 text-xs">Typically replies instantly</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-gray-50/50">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 ${msg.type === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  msg.type === 'bot' ? 'bg-primary-100 text-primary-600' : 'bg-gray-200 text-gray-600'
                }`}>
                  {msg.type === 'bot' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>
                <div className={`px-4 py-2.5 rounded-2xl max-w-[80%] text-sm ${
                  msg.type === 'user' 
                    ? 'bg-primary-600 text-white rounded-tr-sm' 
                    : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="px-4 py-3 rounded-2xl bg-white border border-gray-200 rounded-tl-sm shadow-sm flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-gray-200 bg-white shrink-0">
            <form onSubmit={handleSend} className="relative flex items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message here..."
                className="w-full h-12 pl-4 pr-12 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
              />
              <button
                type="submit"
                disabled={!input.trim()}
                className="absolute right-2 w-8 h-8 flex items-center justify-center bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:hover:bg-primary-600 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            <p className="text-center text-[10px] text-gray-400 mt-2">
              By chatting, you agree to our Privacy Policy.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
