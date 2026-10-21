import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Globe, Search, ChevronDown, Video, Phone, CheckSquare, MessageSquare, Plus, Calendar, Star, LayoutGrid, X, Menu } from 'lucide-react';

export default function HomePage() {
  const navigate = useNavigate();
  const [showBanner, setShowBanner] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);

  return (
    <div className="min-h-screen font-sans flex flex-col bg-[#0b1b3d] text-white overflow-x-hidden">
      
      {/* ===== TOP NAVBAR ===== */}
      <header className="h-[70px] flex items-center justify-between px-4 sm:px-6 md:px-10 shrink-0 z-50 bg-[#0b1b3d] relative border-b border-[#1e3a8a]">
        <div className="flex items-center gap-3 sm:gap-8 h-full">
          {/* Mobile hamburger menu toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Open mobile navigation menu"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-[#0b1b3d] font-extrabold text-base leading-none">IM</span>
            </div>
            <span className="text-white font-extrabold text-[20px] sm:text-[24px] tracking-tight">IntellMeet</span>
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

      {/* ===== MOBILE NAVIGATION DRAWER ===== */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex animate-in fade-in duration-200">
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)} 
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-[#0b1b3d] border-r border-[#1e3a8a] shadow-2xl z-10 h-full text-white">
            <div className="h-[70px] flex items-center justify-between px-6 border-b border-[#1e3a8a] shrink-0">
              <Link 
                to="/" 
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 group"
              >
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                  <span className="text-[#0b1b3d] font-extrabold text-sm leading-none">IM</span>
                </div>
                <span className="text-white font-extrabold text-lg tracking-tight">IntellMeet</span>
              </Link>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Close navigation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
              {/* Core Links */}
              <div>
                <p className="text-[11px] font-bold text-blue-400 uppercase tracking-wider mb-3">Navigation</p>
                <div className="space-y-2">
                  <Link to="/join" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm font-semibold text-gray-200 hover:text-white">
                    Join a Meeting
                  </Link>
                  <Link to="/meetings/schedule" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm font-semibold text-gray-200 hover:text-white">
                    Host a Meeting
                  </Link>
                  <Link to="/info/solutions" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm font-semibold text-gray-200 hover:text-white">
                    Solutions
                  </Link>
                  <Link to="/info/pricing" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm font-semibold text-gray-200 hover:text-white">
                    Pricing
                  </Link>
                  <Link to="/support" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm font-semibold text-gray-200 hover:text-white">
                    Support Center
                  </Link>
                  <Link to="/info/contact-sales" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm font-semibold text-gray-200 hover:text-white">
                    Contact Sales
                  </Link>
                </div>
              </div>

              {/* Products Section */}
              <div className="border-t border-[#1e3a8a] pt-6">
                <p className="text-[11px] font-bold text-blue-400 uppercase tracking-wider mb-3">Products & Collaboration</p>
                <div className="space-y-2">
                  <Link to="/info/ai" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 py-2 text-sm font-semibold text-gray-200 hover:text-white">
                    <Star className="w-4 h-4 text-blue-400" /> IntellMeet AI
                  </Link>
                  <Link to="/notes" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 py-2 text-sm font-semibold text-gray-200 hover:text-white">
                    <CheckSquare className="w-4 h-4 text-blue-400" /> My Notes
                  </Link>
                  <Link to="/whiteboards" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 py-2 text-sm font-semibold text-gray-200 hover:text-white">
                    <LayoutGrid className="w-4 h-4 text-blue-400" /> Whiteboard Studio
                  </Link>
                  <Link to="/tasks" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 py-2 text-sm font-semibold text-gray-200 hover:text-white">
                    <CheckSquare className="w-4 h-4 text-blue-400" /> Tasks
                  </Link>
                  <Link to="/recordings" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 py-2 text-sm font-semibold text-gray-200 hover:text-white">
                    <Video className="w-4 h-4 text-blue-400" /> Recordings
                  </Link>
                </div>
              </div>

              {/* Authentication Actions */}
              <div className="border-t border-[#1e3a8a] pt-6 space-y-3">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full py-2.5 text-center text-sm font-bold border border-white/20 rounded-xl hover:bg-white/10 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full py-2.5 text-center text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg transition-colors"
                >
                  Sign Up Free
                </Link>
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full py-2 text-center text-xs font-semibold text-blue-300 hover:underline"
                >
                  Go to Dashboard &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== AI BANNER ===== */}
      {showBanner && (
        <div className="mx-3 sm:mx-6 my-2 bg-gradient-to-r from-[#172554] to-[#1e3a8a] border border-blue-800/50 rounded-xl py-3 px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 flex-1 text-center sm:text-left justify-center">
            <span className="text-xs sm:text-sm md:text-base font-medium text-blue-50 leading-snug">
              AI note taking across platforms that's secure, personalized, and under your control.
            </span>
            <Link to="/info/ai-notes" className="bg-pink-600 hover:bg-pink-700 text-white text-xs sm:text-sm font-semibold px-4 py-1.5 rounded-full transition-colors whitespace-nowrap shrink-0">
              Explore My Notes
            </Link>
          </div>
          <button onClick={() => setShowBanner(false)} className="text-gray-400 hover:text-white p-1 self-end sm:self-center" aria-label="Dismiss banner">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ===== HERO SECTION ===== */}
      <main className="flex-1 flex flex-col items-center justify-start text-center pt-10 sm:pt-16 md:pt-24 px-4 bg-gradient-to-b from-[#0b1b3d] to-[#1d4ed8]">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[64px] font-bold text-white max-w-4xl leading-tight mb-4 sm:mb-6 tracking-tight font-serif">
          Find out what's possible<br />when work connects
        </h1>
        <p className="text-base sm:text-lg md:text-xl text-blue-100 max-w-2xl mb-8 sm:mb-10 px-2">
          Bridge the gap between talking and doing with the AI-first work platform built for you.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 mb-16 sm:mb-24 w-full sm:w-auto px-4">
          <Link to="/info/solutions" className="bg-[#0b1b3d] hover:bg-[#07132e] border border-blue-900 text-white text-sm sm:text-[15px] font-bold px-8 py-3.5 rounded-full shadow-lg transition-colors w-full sm:w-auto text-center">
            Explore solutions
          </Link>
          <Link to="/info/pricing" className="bg-white hover:bg-gray-100 text-[#0b1b3d] text-sm sm:text-[15px] font-bold px-8 py-3.5 rounded-full shadow-lg transition-colors w-full sm:w-auto text-center">
            Find your plan
          </Link>
        </div>

        {/* Feature Cards Bottom */}
        <div className="w-full max-w-7xl px-2 sm:px-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 pb-12 mt-auto">
          {/* Meetings Card */}
          <Link to="/join" className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-3xl p-5 sm:p-6 min-h-[160px] sm:h-[200px] flex flex-col shadow-xl cursor-pointer hover:-translate-y-1 transition-transform group">
            <div className="flex items-center gap-2 text-white font-bold text-base sm:text-lg mb-auto">
              <Video className="w-5 h-5" /> Meetings
            </div>
            <div className="w-full h-[60px] sm:h-[80px] bg-white/20 rounded-t-xl group-hover:h-[70px] sm:group-hover:h-[90px] transition-all"></div>
          </Link>
          
          {/* My Notes Card */}
          <Link to="/notes" className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-3xl p-5 sm:p-6 min-h-[160px] sm:h-[200px] flex flex-col shadow-xl cursor-pointer hover:-translate-y-1 transition-transform group">
            <div className="flex items-center gap-2 text-white font-bold text-base sm:text-lg mb-auto">
              <CheckSquare className="w-5 h-5" /> My Notes
            </div>
            <div className="w-full h-[60px] sm:h-[80px] bg-white/90 rounded-t-xl overflow-hidden group-hover:h-[70px] sm:group-hover:h-[90px] transition-all p-3 text-left">
              <div className="w-full h-2 bg-gray-200 rounded-full mb-2"></div>
              <div className="w-3/4 h-2 bg-gray-200 rounded-full"></div>
            </div>
          </Link>

          {/* Whiteboard Studio Card */}
          <Link to="/whiteboards" className="bg-gradient-to-br from-[#1e3a8a] to-[#172554] rounded-3xl p-5 sm:p-6 min-h-[160px] sm:h-[200px] flex flex-col shadow-xl cursor-pointer hover:-translate-y-1 transition-transform group">
            <div className="flex items-center gap-2 text-white font-bold text-base sm:text-lg mb-auto">
              <Star className="w-5 h-5 text-blue-300" /> Whiteboard
            </div>
            <div className="w-full h-[60px] sm:h-[80px] bg-gradient-to-tr from-blue-900 to-indigo-900 rounded-t-xl border border-blue-500/30 group-hover:h-[70px] sm:group-hover:h-[90px] transition-all flex justify-center items-center">
               <div className="w-12 h-1 bg-blue-400 rounded-full"></div>
            </div>
          </Link>

          {/* AI Productivity Suite Card */}
          <Link to="/info/ai" className="bg-gradient-to-br from-blue-300 to-cyan-200 rounded-3xl p-5 sm:p-6 min-h-[160px] sm:h-[200px] flex flex-col shadow-xl cursor-pointer hover:-translate-y-1 transition-transform group">
            <div className="flex items-center gap-2 text-[#0b1b3d] font-bold text-base sm:text-lg mb-auto">
              <LayoutGrid className="w-5 h-5" /> AI Companion
            </div>
            <div className="w-full h-[60px] sm:h-[80px] bg-white rounded-t-xl shadow-inner group-hover:h-[70px] sm:group-hover:h-[90px] transition-all flex items-center justify-center gap-2">
               <div className="w-6 h-6 rounded bg-pink-500"></div>
               <div className="w-6 h-6 rounded bg-green-500"></div>
               <div className="w-6 h-6 rounded bg-blue-500"></div>
            </div>
          </Link>

          {/* Contact Sales Card */}
          <Link to="/info/contact-sales" className="bg-gradient-to-br from-gray-700 to-gray-900 rounded-3xl p-5 sm:p-6 min-h-[160px] sm:h-[200px] flex flex-col shadow-xl cursor-pointer hover:-translate-y-1 transition-transform group sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 text-white font-bold text-base sm:text-lg mb-auto">
              <Phone className="w-5 h-5" /> Contact Sales
            </div>
            <div className="w-10 sm:w-12 h-10 sm:h-12 bg-blue-500 rounded-full self-end mt-auto flex items-center justify-center">
               <MessageSquare className="w-5 sm:w-6 h-5 sm:h-6 text-white" />
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}
