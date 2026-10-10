import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Brain, FileText, Bot } from 'lucide-react';

export default function AiPage() {
  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
      {/* Header */}
      <header className="h-[70px] flex items-center justify-between px-6 md:px-10 shrink-0 bg-[#0b1b3d]">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center shadow-sm">
            <span className="text-[#0b1b3d] font-extrabold text-base leading-none">IM</span>
          </div>
          <span className="text-white font-extrabold text-[24px] tracking-tight">IntellMeet</span>
        </Link>
        <Link to="/login" className="text-white font-semibold hover:text-blue-200">Sign In</Link>
      </header>

      {/* Hero */}
      <div className="bg-gradient-to-br from-indigo-900 via-blue-900 to-[#0b1b3d] text-white py-24 px-4 overflow-hidden relative">
        <div className="absolute top-0 right-0 p-32 opacity-10">
          <Brain className="w-96 h-96" />
        </div>
        <div className="max-w-6xl mx-auto relative z-10 flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-800/50 rounded-full text-blue-200 font-semibold text-sm mb-6 border border-blue-700">
              <Sparkles className="w-4 h-4 text-blue-300" /> Introducing IntellMeet AI
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">Work smarter, <br/>not harder.</h1>
            <p className="text-xl text-blue-100 mb-8 max-w-xl mx-auto md:mx-0">
              Empower your teams with real-time transcriptions, intelligent meeting summaries, and automated task extraction, all built natively into IntellMeet.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center md:justify-start">
              <Link to="/register" className="bg-white text-blue-900 font-bold px-8 py-3.5 rounded-full shadow-lg hover:bg-gray-100 transition-colors">
                Try AI for Free
              </Link>
            </div>
          </div>
          <div className="flex-1 w-full relative">
            {/* Mockup UI */}
            <div className="bg-gray-900 rounded-2xl border border-gray-700 shadow-2xl p-6 relative">
               <div className="flex items-center gap-2 mb-4">
                 <div className="w-3 h-3 rounded-full bg-red-500"></div>
                 <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                 <div className="w-3 h-3 rounded-full bg-green-500"></div>
               </div>
               <div className="bg-gray-800 rounded-lg p-4 mb-4">
                 <div className="flex items-center gap-3 mb-2">
                   <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold">JD</div>
                   <div className="h-4 w-32 bg-gray-700 rounded"></div>
                 </div>
                 <div className="h-2 w-full bg-gray-700 rounded mb-2"></div>
                 <div className="h-2 w-3/4 bg-gray-700 rounded"></div>
               </div>
               {/* AI overlay box */}
               <div className="absolute -bottom-6 -right-6 bg-white rounded-xl shadow-xl p-5 border border-gray-200 animate-bounce">
                  <div className="flex items-center gap-3 mb-2">
                    <Bot className="w-6 h-6 text-indigo-600" />
                    <span className="font-bold text-gray-900 text-sm">AI Summary Generated</span>
                  </div>
                  <p className="text-xs text-gray-500">3 Action items detected.</p>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">Everything you need to stay productive</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Live Captions</h3>
              <p className="text-gray-600">Never miss a word. IntellMeet AI converts speech to text in real-time, displaying closed captions directly on your video grid.</p>
            </div>
            <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-6">
                <Brain className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Meeting Summaries</h3>
              <p className="text-gray-600">Stop taking notes. Get a comprehensive, AI-generated summary of your entire meeting sent to your dashboard the moment you hang up.</p>
            </div>
            <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100">
              <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center mb-6">
                <Sparkles className="w-6 h-6 text-pink-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Action Items</h3>
              <p className="text-gray-600">IntellMeet AI automatically extracts action items and assigns them to your Tasks module so your team can get straight to work.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
