import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import {
  Video,
  Users,
  Mic,
  Share2,
  Sparkles,
  Brain,
  FileText,
  CheckCircle2,
  Shield,
  Lock,
  Calendar,
  MessageSquare,
  Edit3,
  ArrowRight,
  ArrowUpRight,
  Check,
  Briefcase,
  GraduationCap,
  Laptop,
  UserCheck,
  ChevronRight,
} from 'lucide-react';

export default function SolutionsPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans flex flex-col text-gray-900 selection:bg-blue-100 selection:text-blue-900">
      {/* Navigation Header */}
      <header className="h-[70px] sticky top-0 z-50 flex items-center justify-between px-6 md:px-12 bg-[#0b1b3d] border-b border-blue-950/60 shadow-md">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
              <span className="text-[#0b1b3d] font-black text-base leading-none">IM</span>
            </div>
            <span className="text-white font-extrabold text-[22px] tracking-tight">IntellMeet</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-[15px] font-medium text-gray-200">
            <Link to="/info/solutions" className="text-white font-semibold flex items-center gap-1">
              Solutions
            </Link>
            <Link to="/info/ai" className="hover:text-white transition-colors flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" /> AI Companion
            </Link>
            <Link to="/info/pricing" className="hover:text-white transition-colors">
              Pricing
            </Link>
            <Link to="/support" className="hover:text-white transition-colors">
              Support
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            to="/join"
            className="text-gray-200 hover:text-white font-medium text-sm px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            Join Meeting
          </Link>

          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-4 py-2 rounded-full shadow-sm transition-colors flex items-center gap-1.5"
            >
              Dashboard
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="hidden sm:inline-block text-gray-200 hover:text-white font-medium text-sm px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-4 py-2 rounded-full shadow-sm transition-colors"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </header>

      {/* SECTION A: Hero Section */}
      <section className="bg-gradient-to-b from-[#0b1b3d] via-[#10234e] to-[#0b1b3d] text-white pt-16 pb-20 md:pt-24 md:pb-28 px-4 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs sm:text-sm font-semibold mb-6 shadow-sm">
            <Sparkles className="w-4 h-4 text-blue-300" />
            Intelligent Video Conferencing & Outcomes
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.15] mb-6">
            One Platform. Smarter Meetings. <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-indigo-200 to-cyan-200">
              Better Outcomes.
            </span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-blue-100/90 max-w-3xl mx-auto mb-10 leading-relaxed font-normal">
            IntelliMeet combines WebRTC high-definition video conferencing, real-time screen sharing, in-call collaboration, and automated Google Gemini AI summaries into a unified meeting workspace designed to turn conversations into actionable progress.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            {isAuthenticated ? (
              <Link
                to="/meetings/schedule"
                className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-base shadow-lg hover:shadow-blue-600/25 transition-all text-center"
              >
                Schedule a Meeting
              </Link>
            ) : (
              <Link
                to="/register"
                className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-base shadow-lg hover:shadow-blue-600/25 transition-all text-center"
              >
                Get Started Free
              </Link>
            )}

            <button
              onClick={() => scrollToSection('use-cases')}
              className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 font-semibold text-base transition-colors text-center"
            >
              Explore Solutions by Use Case
            </button>
          </div>

          {/* Interactive Platform Preview Mockup */}
          <div className="max-w-4xl mx-auto bg-slate-900/90 rounded-2xl border border-slate-700/80 shadow-2xl p-4 sm:p-6 text-left relative overflow-hidden backdrop-blur-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500 inline-block" />
                <span className="w-3 h-3 rounded-full bg-yellow-500 inline-block" />
                <span className="w-3 h-3 rounded-full bg-green-500 inline-block" />
                <span className="ml-2 text-xs font-mono text-slate-400">IntelliMeet Active Session • Room #409-281</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2.5 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                WebRTC HD Live
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Meeting View Area */}
              <div className="md:col-span-2 bg-slate-950 rounded-xl p-4 border border-slate-800 relative min-h-[220px] flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-300">
                    <Video className="w-3.5 h-3.5 text-blue-400" />
                    <span>Sprint Review & Product Planning</span>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">00:42:15</span>
                </div>

                <div className="my-auto text-center py-6">
                  <div className="w-16 h-16 rounded-full bg-blue-600/20 border border-blue-500/40 text-blue-300 flex items-center justify-center mx-auto mb-3">
                    <Users className="w-8 h-8" />
                  </div>
                  <p className="text-sm font-semibold text-slate-200">Active Speaker & Screen Share</p>
                  <p className="text-xs text-slate-400 mt-1">Direct peer-to-peer audio and low-latency video</p>
                </div>

                <div className="flex items-center justify-center gap-2 pt-2 border-t border-slate-900">
                  <div className="px-3 py-1 bg-slate-800 rounded-md text-xs text-slate-300 flex items-center gap-1.5">
                    <Mic className="w-3.5 h-3.5 text-emerald-400" /> Mic On
                  </div>
                  <div className="px-3 py-1 bg-slate-800 rounded-md text-xs text-slate-300 flex items-center gap-1.5">
                    <Share2 className="w-3.5 h-3.5 text-blue-400" /> Sharing Screen
                  </div>
                  <div className="px-3 py-1 bg-slate-800 rounded-md text-xs text-slate-300 flex items-center gap-1.5">
                    <Edit3 className="w-3.5 h-3.5 text-purple-400" /> Whiteboard
                  </div>
                </div>
              </div>

              {/* Real-time AI Side Panel */}
              <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-800">
                    <Brain className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">Gemini AI Output</span>
                  </div>

                  <div className="space-y-3">
                    <div className="bg-indigo-950/40 border border-indigo-800/40 rounded-lg p-2.5">
                      <p className="text-[11px] font-semibold text-indigo-300 mb-1 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Key Takeaway
                      </p>
                      <p className="text-xs text-slate-300 leading-snug">
                        Team approved v2 rollout for Q4; UI adjustments scheduled for sprint review.
                      </p>
                    </div>

                    <div className="bg-blue-950/40 border border-blue-800/40 rounded-lg p-2.5">
                      <p className="text-[11px] font-semibold text-blue-300 mb-1 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Action Item Extracted
                      </p>
                      <p className="text-xs text-slate-300 leading-snug">
                        Alex to benchmark API endpoint response times before Friday sync.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-900 text-center">
                  <span className="text-[11px] text-slate-400">Synced to Dashboard Tasks</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION B: Solutions by Use Case */}
      <section id="use-cases" className="py-20 md:py-24 bg-gray-50 border-b border-gray-200 scroll-mt-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-widest text-blue-600 mb-3">
              Purpose-Built Solutions
            </h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
              Tailored for Every Meeting Environment
            </h3>
            <p className="text-gray-600 text-base sm:text-lg">
              Explore how IntelliMeet addresses real operational hurdles across executive leadership, remote teams, digital education, and client consulting.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* 1. Business & Corporate Meetings */}
            <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-6">
                  <Briefcase className="w-6 h-6" />
                </div>
                <h4 className="text-2xl font-bold text-gray-900 mb-3">
                  Business &amp; Corporate Meetings
                </h4>
                
                <div className="space-y-4 mb-6">
                  <div>
                    <h5 className="text-xs font-bold uppercase tracking-wider text-red-500 mb-1">The Challenge</h5>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      High-stakes executive and department syncs generate critical decisions, but manual note-taking is fragmented and post-meeting follow-ups are delayed by hours or forgotten entirely.
                    </p>
                  </div>
                  
                  <div>
                    <h5 className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-1">The IntelliMeet Solution</h5>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Structured video conferencing with built-in host moderation and native Gemini AI summarization that compiles meeting minutes and assigns tasks before participants leave their desks.
                    </p>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4 mb-6">
                  <h5 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2.5">
                    Available Implemented Features:
                  </h5>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-blue-600 shrink-0" />
                      Scheduled Recurring Meetings
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-blue-600 shrink-0" />
                      Meeting Passcode Protection
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-blue-600 shrink-0" />
                      Gemini Executive Summaries
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-blue-600 shrink-0" />
                      Automated Task Extraction
                    </li>
                  </ul>
                </div>
              </div>

              <Link
                to={isAuthenticated ? '/meetings/schedule' : '/register'}
                className="inline-flex items-center justify-between px-5 py-3 rounded-xl bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-200 text-sm font-bold text-gray-800 hover:text-blue-700 transition-colors"
              >
                <span>{isAuthenticated ? 'Schedule a Business Meeting' : 'Start with Corporate Tools'}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* 2. Education & Online Learning */}
            <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-6">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <h4 className="text-2xl font-bold text-gray-900 mb-3">
                  Education &amp; Online Learning
                </h4>
                
                <div className="space-y-4 mb-6">
                  <div>
                    <h5 className="text-xs font-bold uppercase tracking-wider text-red-500 mb-1">The Challenge</h5>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Students struggle to absorb complex material while simultaneously taking rapid notes, leading to missed concepts and reduced classroom engagement.
                    </p>
                  </div>
                  
                  <div>
                    <h5 className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-1">The IntelliMeet Solution</h5>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Interactive virtual lecture rooms featuring full-screen presentation sharing, live participant chat, and automated transcripts that provide comprehensive study records.
                    </p>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4 mb-6">
                  <h5 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2.5">
                    Available Implemented Features:
                  </h5>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      Host Mute &amp; Camera Moderation
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      Multi-Tab Presentation Share
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      In-Session Real-Time Chat
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      Full Meeting Speech Transcripts
                    </li>
                  </ul>
                </div>
              </div>

              <Link
                to="/join"
                className="inline-flex items-center justify-between px-5 py-3 rounded-xl bg-gray-50 hover:bg-emerald-50 border border-gray-200 hover:border-emerald-200 text-sm font-bold text-gray-800 hover:text-emerald-700 transition-colors"
              >
                <span>Join a Classroom Session</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* 3. Remote Teams & Project Collaboration */}
            <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 mb-6">
                  <Laptop className="w-6 h-6" />
                </div>
                <h4 className="text-2xl font-bold text-gray-900 mb-3">
                  Remote Teams &amp; Project Collaboration
                </h4>
                
                <div className="space-y-4 mb-6">
                  <div>
                    <h5 className="text-xs font-bold uppercase tracking-wider text-red-500 mb-1">The Challenge</h5>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Distributed sprint teams experience visual disconnects, siloed notes across chat apps, and lost sprint goals when decisions aren't visually mapped out together.
                    </p>
                  </div>
                  
                  <div>
                    <h5 className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-1">The IntelliMeet Solution</h5>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      A dedicated digital whiteboard studio integrated into your meeting lifecycle, allowing teams to ideate collaboratively on a live canvas and export decisions directly to dashboard tasks.
                    </p>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4 mb-6">
                  <h5 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2.5">
                    Available Implemented Features:
                  </h5>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-purple-600 shrink-0" />
                      Whiteboard Drawing Studio
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-purple-600 shrink-0" />
                      Screen Sharing with Tab Audio
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-purple-600 shrink-0" />
                      Centralized Task Management
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-purple-600 shrink-0" />
                      Instant Ad-Hoc Room Creation
                    </li>
                  </ul>
                </div>
              </div>

              <Link
                to={isAuthenticated ? '/whiteboards' : '/register'}
                className="inline-flex items-center justify-between px-5 py-3 rounded-xl bg-gray-50 hover:bg-purple-50 border border-gray-200 hover:border-purple-200 text-sm font-bold text-gray-800 hover:text-purple-700 transition-colors"
              >
                <span>{isAuthenticated ? 'Open Whiteboard Studio' : 'Explore Team Collaboration'}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* 4. Client Meetings & Consultations */}
            <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 mb-6">
                  <UserCheck className="w-6 h-6" />
                </div>
                <h4 className="text-2xl font-bold text-gray-900 mb-3">
                  Client Meetings &amp; Consultations
                </h4>
                
                <div className="space-y-4 mb-6">
                  <div>
                    <h5 className="text-xs font-bold uppercase tracking-wider text-red-500 mb-1">The Challenge</h5>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      External clients resist downloading proprietary desktop software, undergoing complex installs, or creating accounts merely to participate in a 30-minute consultation.
                    </p>
                  </div>
                  
                  <div>
                    <h5 className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-1">The IntelliMeet Solution</h5>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      100% browser-based WebRTC connectivity. Clients join immediately via direct meeting links without installing software, while hosts preserve security via passcodes and waiting rooms.
                    </p>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4 mb-6">
                  <h5 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2.5">
                    Available Implemented Features:
                  </h5>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-amber-600 shrink-0" />
                      Zero-Download Browser Join
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-amber-600 shrink-0" />
                      Custom Meeting Registration Form
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-amber-600 shrink-0" />
                      Host Waiting Room &amp; Approval
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-amber-600 shrink-0" />
                      Instant Meeting Link Sharing
                    </li>
                  </ul>
                </div>
              </div>

              <Link
                to={isAuthenticated ? '/meetings/schedule' : '/register'}
                className="inline-flex items-center justify-between px-5 py-3 rounded-xl bg-gray-50 hover:bg-amber-50 border border-gray-200 hover:border-amber-200 text-sm font-bold text-gray-800 hover:text-amber-700 transition-colors"
              >
                <span>{isAuthenticated ? 'Schedule Client Call' : 'Try Frictionless Meetings'}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION C: Key Capabilities */}
      <section id="capabilities" className="py-20 md:py-24 bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-widest text-blue-600 mb-3">
              Platform Features
            </h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
              Comprehensive Real-Time &amp; AI Capabilities
            </h3>
            <p className="text-gray-600 text-base sm:text-lg">
              Every feature listed below is natively integrated into IntelliMeet, powered by modern WebRTC media standards and Google Gemini AI models.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-6 rounded-2xl border border-gray-200 bg-gray-50/50 hover:bg-white hover:border-blue-200 hover:shadow-lg transition-all group">
              <div className="w-12 h-12 rounded-xl bg-blue-100/80 text-blue-600 flex items-center justify-center mb-5 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Video className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-gray-900 mb-2">WebRTC Video &amp; Audio</h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                Direct peer-to-peer audio and video streaming with active speaker detection, device switching, and responsive video grid layouts.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-2xl border border-gray-200 bg-gray-50/50 hover:bg-white hover:border-blue-200 hover:shadow-lg transition-all group">
              <div className="w-12 h-12 rounded-xl bg-indigo-100/80 text-indigo-600 flex items-center justify-center mb-5 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <Share2 className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-gray-900 mb-2">Screen &amp; Tab Sharing</h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                Broadcast your entire desktop, single app window, or Chrome tab with system audio synchronization for fluid demos and slide decks.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-2xl border border-gray-200 bg-gray-50/50 hover:bg-white hover:border-blue-200 hover:shadow-lg transition-all group">
              <div className="w-12 h-12 rounded-xl bg-purple-100/80 text-purple-600 flex items-center justify-center mb-5 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <Brain className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-gray-900 mb-2">Gemini AI Summarization</h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                Natively connected to the Gemini AI cascade. Condenses lengthy discussions into structured summaries and key takeaways automatically.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-2xl border border-gray-200 bg-gray-50/50 hover:bg-white hover:border-blue-200 hover:shadow-lg transition-all group">
              <div className="w-12 h-12 rounded-xl bg-pink-100/80 text-pink-600 flex items-center justify-center mb-5 group-hover:bg-pink-600 group-hover:text-white transition-colors">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-gray-900 mb-2">Automated Task Extraction</h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                AI parses commitments made during the meeting and populates them into your personal Tasks dashboard with one-click completion.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 rounded-2xl border border-gray-200 bg-gray-50/50 hover:bg-white hover:border-blue-200 hover:shadow-lg transition-all group">
              <div className="w-12 h-12 rounded-xl bg-cyan-100/80 text-cyan-600 flex items-center justify-center mb-5 group-hover:bg-cyan-600 group-hover:text-white transition-colors">
                <Edit3 className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-gray-900 mb-2">Interactive Whiteboard</h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                Brainstorm visually on an infinite canvas with brush tools, geometric shapes, sticky notes, and quick PNG/SVG export capabilities.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 rounded-2xl border border-gray-200 bg-gray-50/50 hover:bg-white hover:border-blue-200 hover:shadow-lg transition-all group">
              <div className="w-12 h-12 rounded-xl bg-amber-100/80 text-amber-600 flex items-center justify-center mb-5 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                <Calendar className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-gray-900 mb-2">Scheduler &amp; Security</h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                Plan one-time or recurring meetings with custom timezones, access passcodes, and optional public registration workflows.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION D: How IntelliMeet Works */}
      <section id="how-it-works" className="py-20 md:py-24 bg-gray-50 border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-widest text-blue-600 mb-3">
              Simple Workflow
            </h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
              How IntelliMeet Powers Every Meeting
            </h3>
            <p className="text-gray-600 text-base sm:text-lg">
              From the initial calendar invite to the final AI-generated task list, here is how a complete meeting lifecycle works in IntelliMeet.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {/* Step 1 */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm relative flex flex-col">
              <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-black text-sm flex items-center justify-center mb-4">
                1
              </div>
              <h4 className="font-bold text-gray-900 text-base mb-2">Schedule or Launch</h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                Create an instant meeting room or schedule a planned session with title, date, duration, and time zone.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm relative flex flex-col">
              <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-black text-sm flex items-center justify-center mb-4">
                2
              </div>
              <h4 className="font-bold text-gray-900 text-base mb-2">Configure Access</h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                Share your unique 9-digit meeting ID, set optional passcodes, or configure public registration requirements.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm relative flex flex-col">
              <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-black text-sm flex items-center justify-center mb-4">
                3
              </div>
              <h4 className="font-bold text-gray-900 text-base mb-2">Join &amp; Collaborate</h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                Connect directly from any modern web browser. Share video, presentation screens, live chat, and whiteboard diagrams.
              </p>
            </div>

            {/* Step 4 */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm relative flex flex-col">
              <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-black text-sm flex items-center justify-center mb-4">
                4
              </div>
              <h4 className="font-bold text-gray-900 text-base mb-2">Generate AI Output</h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                Let Gemini AI analyze transcripts to create bulleted executive summaries, discussion points, and action items.
              </p>
            </div>

            {/* Step 5 */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm relative flex flex-col">
              <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-black text-sm flex items-center justify-center mb-4">
                5
              </div>
              <h4 className="font-bold text-gray-900 text-base mb-2">Review in Dashboard</h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                Access your past meeting archives, review saved summaries, and manage assigned tasks in one centralized hub.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION E: Security and Reliability */}
      <section className="py-20 md:py-24 bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-widest text-blue-600 mb-3">
              Trust &amp; Access Control
            </h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
              Security Built Into Every Session
            </h3>
            <p className="text-gray-600 text-base sm:text-lg">
              IntelliMeet enforces strict authentication, granular in-meeting host moderation, and encrypted transport protocols.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex gap-4 p-6 rounded-2xl border border-gray-200 bg-gray-50/60">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-gray-900 mb-1">Host Moderation &amp; Participant Controls</h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Meeting hosts retain full control to mute participant microphones, toggle cameras, restrict screen sharing, or remove uninvited guests to preserve meeting decorum.
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-6 rounded-2xl border border-gray-200 bg-gray-50/60">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-gray-900 mb-1">Passcode &amp; Access Authorization</h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Scheduled meetings can be locked with custom passcodes. Inbound participants must authenticate or pass validation before media streams are established.
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-6 rounded-2xl border border-gray-200 bg-gray-50/60">
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-gray-900 mb-1">Secure JWT Authentication</h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  User accounts and API routes are guarded by cryptographic JSON Web Tokens, bcrypt password hashing, and role-based authorization headers.
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-6 rounded-2xl border border-gray-200 bg-gray-50/60">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-gray-900 mb-1">Encrypted Transport &amp; Storage</h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  All peer-to-peer WebRTC media streams leverage DTLS/SRTP encryption. API traffic runs over HTTPS/WSS, and database records reside on encrypted MongoDB Atlas clusters.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION F: Final CTA */}
      <section className="bg-gradient-to-br from-[#0b1b3d] via-blue-950 to-[#0b1b3d] text-white py-20 px-4 text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto relative z-10">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-6 tracking-tight">
            Ready to Run Smarter Meetings?
          </h2>
          <p className="text-base sm:text-lg text-blue-100/90 max-w-2xl mx-auto mb-10 leading-relaxed">
            Experience high-fidelity WebRTC video collaboration paired with real Google Gemini AI meeting intelligence. No credit card required to start.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-base shadow-xl hover:shadow-blue-600/30 transition-all text-center"
              >
                Go to Dashboard
              </Link>
            ) : (
              <Link
                to="/register"
                className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-base shadow-xl hover:shadow-blue-600/30 transition-all text-center"
              >
                Create Free Account
              </Link>
            )}

            <Link
              to="/join"
              className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 font-semibold text-base transition-colors text-center"
            >
              Join an Existing Meeting
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#07132e] text-gray-400 py-12 px-6 border-t border-blue-950/80 text-sm">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-[#0b1b3d] font-black text-sm leading-none">IM</span>
            </div>
            <span className="text-white font-bold text-lg tracking-tight">IntellMeet</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm">
            <Link to="/info/solutions" className="text-white hover:underline">
              Solutions
            </Link>
            <Link to="/info/ai" className="hover:text-white transition-colors">
              AI Companion
            </Link>
            <Link to="/info/pricing" className="hover:text-white transition-colors">
              Pricing
            </Link>
            <Link to="/support" className="hover:text-white transition-colors">
              Support Center
            </Link>
            <Link to="/join" className="hover:text-white transition-colors">
              Join Meeting
            </Link>
            {isAuthenticated ? (
              <Link to="/dashboard" className="hover:text-white transition-colors">
                Dashboard
              </Link>
            ) : (
              <Link to="/login" className="hover:text-white transition-colors">
                Sign In
              </Link>
            )}
          </div>

          <p className="text-xs text-gray-500">
            &copy; {new Date().getFullYear()} IntellMeet. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
