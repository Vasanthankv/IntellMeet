import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Globe, Search, ChevronDown, Video, Phone, CheckSquare, MessageSquare, Plus, Calendar, Star, LayoutGrid, X } from 'lucide-react';

export default function HomePage() {
  const navigate = useNavigate();
  const [showBanner, setShowBanner] = useState(true);

  const [activeMenu, setActiveMenu] = useState(null);

  return (
    <div className="min-h-screen font-sans flex flex-col bg-[#0b1b3d] text-white overflow-hidden">
      
      {/* ===== TOP NAVBAR ===== */}
      <header className="h-[70px] flex items-center justify-between px-6 md:px-10 shrink-0 z-50 bg-[#0b1b3d] relative border-b border-[#1e3a8a]">
        <div className="flex items-center gap-8 h-full">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-[#0b1b3d] font-extrabold text-base leading-none">IM</span>
            </div>
            <span className="text-white font-extrabold text-[24px] tracking-tight">IntellMeet</span>
          </Link>

          {/* Nav Links */}
          <nav className="hidden lg:flex items-center gap-6 text-[15px] font-medium text-gray-200 h-full">
            
            {/* Products Mega Menu */}
            <div 
              className="h-full flex items-center"
              onMouseEnter={() => setActiveMenu('products')}
              onMouseLeave={() => setActiveMenu(null)}
            >
              <button className="flex items-center gap-1 hover:text-white transition-colors">
                Products <ChevronDown className={`w-4 h-4 transition-transform ${activeMenu === 'products' ? 'rotate-180' : ''}`} />
              </button>
              {activeMenu === 'products' && (
                <div className="absolute top-[70px] left-0 w-full bg-white text-gray-900 shadow-2xl border-b border-gray-200 p-8 grid grid-cols-4 gap-8 z-50 animate-in fade-in slide-in-from-top-2">
                  <div>
                    <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wider">AI Productivity</h3>
                    <ul className="space-y-3">
                      <li><Link to="/info/ai" className="text-gray-600 hover:text-blue-600 font-medium">IntellMeet AI Companion</Link></li>
                      <li><Link to="/notes" className="text-gray-600 hover:text-blue-600 font-medium">My Notes</Link></li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wider">Communications</h3>
                    <ul className="space-y-3">
                      <li><Link to="/join" className="text-gray-600 hover:text-blue-600 font-medium">Join Meeting</Link></li>
                      <li><Link to="/info/solutions" className="text-gray-600 hover:text-blue-600 font-medium">Solutions by Use Case</Link></li>
                      <li><Link to="/info/contact-sales" className="text-gray-600 hover:text-blue-600 font-medium">Contact Sales</Link></li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wider">Collaboration</h3>
                    <ul className="space-y-3">
                      <li><Link to="/whiteboards" className="text-gray-600 hover:text-blue-600 font-medium">Whiteboard Studio</Link></li>
                      <li><Link to="/tasks" className="text-gray-600 hover:text-blue-600 font-medium">Tasks</Link></li>
                      <li><Link to="/recordings" className="text-gray-600 hover:text-blue-600 font-medium">Recordings</Link></li>
                    </ul>
                  </div>
                  <div className="bg-blue-50 p-6 rounded-xl">
                    <h3 className="font-bold text-blue-900 mb-2">Upgrade to Pro</h3>
                    <p className="text-sm text-blue-700 mb-4">Get unlimited meetings and advanced AI features.</p>
                    <Link to="/info/pricing" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full text-sm font-semibold inline-block">View Plans</Link>
                  </div>
                </div>
              )}
            </div>

            {/* AI Menu */}
            <Link to="/info/ai" className="flex items-center gap-1 hover:text-white transition-colors">
              <Star className="w-4 h-4 text-blue-400" /> AI
            </Link>
            
            <Link to="/info/solutions" className="flex items-center gap-1 hover:text-white transition-colors">
              Solutions <ChevronDown className="w-4 h-4" />
            </Link>
            <Link to="/info/pricing" className="hover:text-white transition-colors">Pricing</Link>
          </nav>
        </div>

        {/* Right Buttons */}
        <div className="flex items-center gap-5 h-full">
          <button className="text-gray-300 hover:text-white"><Search className="w-5 h-5" /></button>
          
          {/* Meet Dropdown */}
          <div 
            className="h-full flex items-center relative"
            onMouseEnter={() => setActiveMenu('meet')}
            onMouseLeave={() => setActiveMenu(null)}
          >
            <button className="hidden md:flex items-center gap-1 text-[15px] font-medium text-gray-200 hover:text-white">
              Meet <ChevronDown className={`w-4 h-4 transition-transform ${activeMenu === 'meet' ? 'rotate-180' : ''}`} />
            </button>
            {activeMenu === 'meet' && (
              <div className="absolute top-[60px] right-0 w-48 bg-white text-gray-900 shadow-xl rounded-xl border border-gray-200 py-2 z-50">
                <Link to="/join" className="block px-4 py-2 hover:bg-gray-50 font-medium text-sm">Join a Meeting</Link>
                <Link to="/meetings/schedule" className="block px-4 py-2 hover:bg-gray-50 font-medium text-sm">Host a Meeting</Link>
              </div>
            )}
          </div>

          <Link to="/support" className="hidden md:block text-[15px] font-medium text-gray-200 hover:text-white">Support</Link>
          <Link to="/info/contact-sales" className="hidden md:flex items-center border border-white text-white px-4 py-1.5 rounded-full text-sm font-semibold hover:bg-white/10 transition-colors">Contact Sales</Link>
          
          <div className="h-6 w-px bg-gray-600 mx-1 hidden md:block"></div>

          {/* User Profile */}
          <div 
            className="h-full flex items-center relative"
            onMouseEnter={() => setActiveMenu('user')}
            onMouseLeave={() => setActiveMenu(null)}
          >
            <button className="w-9 h-9 rounded-full bg-blue-500 text-white font-bold flex items-center justify-center text-sm ring-2 ring-white/20">
              U
            </button>
            {activeMenu === 'user' && (
              <div className="absolute top-[60px] right-0 w-48 bg-white text-gray-900 shadow-xl rounded-xl border border-gray-200 py-2 z-50">
                <Link to="/login" className="block px-4 py-2 hover:bg-gray-50 font-medium text-sm">Sign In</Link>
                <Link to="/register" className="block px-4 py-2 hover:bg-gray-50 font-medium text-sm">Sign Up Free</Link>
                <div className="h-px bg-gray-200 my-1"></div>
                <Link to="/dashboard" className="block px-4 py-2 hover:bg-gray-50 font-medium text-sm text-blue-600">Go to Dashboard</Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ===== AI BANNER ===== */}
      {showBanner && (
        <div className="mx-6 my-2 bg-gradient-to-r from-[#172554] to-[#1e3a8a] border border-blue-800/50 rounded-xl py-3 px-6 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-4 flex-1 justify-center">
            <span className="text-sm md:text-base font-medium text-blue-50">
              AI note taking across platforms that's secure, personalized, and under your control.
            </span>
            <Link to="/info/ai-notes" className="bg-pink-600 hover:bg-pink-700 text-white text-sm font-semibold px-4 py-1.5 rounded-full transition-colors whitespace-nowrap">
              Explore My Notes
            </Link>
          </div>
          <button onClick={() => setShowBanner(false)} className="text-gray-400 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ===== HERO SECTION ===== */}
      <main className="flex-1 flex flex-col items-center justify-start text-center pt-16 md:pt-24 px-4 bg-gradient-to-b from-[#0b1b3d] to-[#1d4ed8]">
        <h1 className="text-5xl md:text-[64px] font-bold text-white max-w-4xl leading-tight mb-6 tracking-tight font-serif">
          Find out what's possible<br />when work connects
        </h1>
        <p className="text-lg md:text-xl text-blue-100 max-w-2xl mb-10">
          Bridge the gap between talking and doing with the AI-first work platform built for you.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 mb-24">
          <Link to="/info/solutions" className="bg-[#0b1b3d] hover:bg-[#07132e] border border-blue-900 text-white text-[15px] font-bold px-8 py-3.5 rounded-full shadow-lg transition-colors w-full sm:w-auto text-center">
            Explore solutions
          </Link>
          <Link to="/info/pricing" className="bg-white hover:bg-gray-100 text-[#0b1b3d] text-[15px] font-bold px-8 py-3.5 rounded-full shadow-lg transition-colors w-full sm:w-auto text-center">
            Find your plan
          </Link>
        </div>

        {/* Feature Cards Bottom */}
        <div className="w-full max-w-7xl px-4 grid grid-cols-2 md:grid-cols-5 gap-4 pb-12 mt-auto">
          {/* Meetings Card */}
          <Link to="/join" className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-3xl p-6 h-[200px] flex flex-col shadow-xl cursor-pointer hover:-translate-y-1 transition-transform group">
            <div className="flex items-center gap-2 text-white font-bold text-lg mb-auto">
              <Video className="w-5 h-5" /> Meetings
            </div>
            <div className="w-full h-[80px] bg-white/20 rounded-t-xl group-hover:h-[90px] transition-all"></div>
          </Link>
          
          {/* My Notes Card */}
          <Link to="/notes" className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-3xl p-6 h-[200px] flex flex-col shadow-xl cursor-pointer hover:-translate-y-1 transition-transform group">
            <div className="flex items-center gap-2 text-white font-bold text-lg mb-auto">
              <CheckSquare className="w-5 h-5" /> My Notes
            </div>
            <div className="w-full h-[80px] bg-white/90 rounded-t-xl overflow-hidden group-hover:h-[90px] transition-all p-3 text-left">
              <div className="w-full h-2 bg-gray-200 rounded-full mb-2"></div>
              <div className="w-3/4 h-2 bg-gray-200 rounded-full"></div>
            </div>
          </Link>

          {/* Whiteboard Studio Card */}
          <Link to="/whiteboards" className="bg-gradient-to-br from-[#1e3a8a] to-[#172554] rounded-3xl p-6 h-[200px] flex flex-col shadow-xl cursor-pointer hover:-translate-y-1 transition-transform group">
            <div className="flex items-center gap-2 text-white font-bold text-lg mb-auto">
              <Star className="w-5 h-5 text-blue-300" /> Whiteboard
            </div>
            <div className="w-full h-[80px] bg-gradient-to-tr from-blue-900 to-indigo-900 rounded-t-xl border border-blue-500/30 group-hover:h-[90px] transition-all flex justify-center items-center">
               <div className="w-12 h-1 bg-blue-400 rounded-full"></div>
            </div>
          </Link>

          {/* AI Productivity Suite Card */}
          <Link to="/info/ai" className="bg-gradient-to-br from-blue-300 to-cyan-200 rounded-3xl p-6 h-[200px] flex flex-col shadow-xl cursor-pointer hover:-translate-y-1 transition-transform group">
            <div className="flex items-center gap-2 text-[#0b1b3d] font-bold text-lg mb-auto">
              <LayoutGrid className="w-5 h-5" /> AI Companion
            </div>
            <div className="w-full h-[80px] bg-white rounded-t-xl shadow-inner group-hover:h-[90px] transition-all flex items-center justify-center gap-2">
               <div className="w-6 h-6 rounded bg-pink-500"></div>
               <div className="w-6 h-6 rounded bg-green-500"></div>
               <div className="w-6 h-6 rounded bg-blue-500"></div>
            </div>
          </Link>

          {/* Contact Sales Card */}
          <Link to="/info/contact-sales" className="bg-gradient-to-br from-gray-700 to-gray-900 rounded-3xl p-6 h-[200px] flex flex-col shadow-xl cursor-pointer hover:-translate-y-1 transition-transform group">
            <div className="flex items-center gap-2 text-white font-bold text-lg mb-auto">
              <Phone className="w-5 h-5" /> Contact Sales
            </div>
            <div className="w-12 h-12 bg-blue-500 rounded-full self-end mt-auto flex items-center justify-center">
               <MessageSquare className="w-6 h-6 text-white" />
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}
