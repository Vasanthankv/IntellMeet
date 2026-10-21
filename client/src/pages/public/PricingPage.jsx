import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, ArrowRight, Sparkles } from 'lucide-react';

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false);

  return (
    <div className="min-h-screen bg-white font-sans flex flex-col selection:bg-blue-100 selection:text-blue-900">
      {/* Header */}
      <header className="h-[70px] flex items-center justify-between px-4 sm:px-6 md:px-10 shrink-0 bg-[#0b1b3d] border-b border-blue-950/60 shadow-md">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
            <span className="text-[#0b1b3d] font-black text-base leading-none">IM</span>
          </div>
          <span className="text-white font-extrabold text-[20px] sm:text-[24px] tracking-tight">IntellMeet</span>
        </Link>
        <div className="flex items-center gap-3 sm:gap-4 text-sm font-medium">
          <Link to="/info/solutions" className="text-gray-300 hover:text-white transition-colors hidden sm:inline">
            Solutions
          </Link>
          <Link to="/login" className="text-white font-semibold hover:text-blue-200">
            Sign In
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <div className="bg-gradient-to-b from-[#0b1b3d] via-[#10234e] to-blue-950 py-12 sm:py-16 md:py-20 px-4 text-center text-white relative overflow-hidden">
        <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-white mb-4 sm:mb-6 tracking-tight max-w-4xl mx-auto">
          Choose the Right Plan for Your Team
        </h1>
        <p className="text-sm sm:text-base md:text-lg text-blue-100/90 mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed">
          From quick 1-on-1 video calls to enterprise-wide collaboration with automated Google Gemini AI summaries, IntellMeet delivers clear, predictable pricing.
        </p>

        {/* Real Interactive Billing Toggle */}
        <div className="inline-flex max-w-full bg-blue-900/60 p-1 sm:p-1.5 rounded-full border border-blue-700/60 mb-8 sm:mb-12 shadow-inner">
          <button
            onClick={() => setIsAnnual(false)}
            className={`px-3.5 sm:px-6 py-1.5 sm:py-2 rounded-full font-bold text-xs sm:text-sm transition-all cursor-pointer ${
              !isAnnual ? 'bg-white text-[#0b1b3d] shadow-sm' : 'text-blue-200 hover:text-white'
            }`}
          >
            Pay Monthly
          </button>
          <button
            onClick={() => setIsAnnual(true)}
            className={`px-3.5 sm:px-6 py-1.5 sm:py-2 rounded-full font-semibold text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-1 sm:gap-1.5 ${
              isAnnual ? 'bg-white text-[#0b1b3d] shadow-sm' : 'text-blue-200 hover:text-white'
            }`}
          >
            <span>Pay Annually</span>
            <span className="text-[10px] sm:text-[11px] bg-emerald-500/20 text-emerald-300 px-1.5 sm:px-2 py-0.5 rounded-full font-bold">
              Save 20%
            </span>
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-4 -mt-8 sm:-mt-10 pb-16 sm:pb-24 grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 w-full">
        {/* Basic Plan */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 sm:p-8 flex flex-col hover:shadow-2xl transition-shadow relative">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Basic</h3>
          <p className="text-gray-500 text-sm mb-6 h-10">Free video meetings for personal use.</p>
          <div className="mb-6">
            <span className="text-5xl font-extrabold text-gray-900">$0</span>
            <span className="text-gray-500 text-sm ml-1">/month</span>
          </div>
          <Link
            to="/register"
            className="w-full py-3 px-4 bg-white border-2 border-blue-600 text-blue-600 font-bold rounded-xl text-center hover:bg-blue-50 transition-colors mb-8 text-sm"
          >
            Sign Up Free
          </Link>
          <div className="space-y-4 flex-1">
            <p className="font-semibold text-gray-900 text-sm">Included Capabilities:</p>
            <ul className="space-y-3 text-sm text-gray-700">
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <span>Up to 100 participants per meeting</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <span>WebRTC HD audio and video</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <span>Full screen and application tab sharing</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <span>Interactive Whiteboard canvas</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <span>Real-time in-meeting chat</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Pro Plan */}
        <div className="bg-[#0b1b3d] rounded-2xl shadow-2xl border border-blue-800 p-6 sm:p-8 flex flex-col relative transform md:-translate-y-4">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest shadow-md">
            Most Popular
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">Pro</h3>
          <p className="text-blue-200 text-sm mb-6 h-10">Enhanced collaboration for small teams and power hosts.</p>
          <div className="mb-6">
            <span className="text-5xl font-extrabold text-white">
              {isAnnual ? '$11.99' : '$14.99'}
            </span>
            <span className="text-blue-200 text-sm ml-1">/month/host</span>
          </div>
          <Link
            to="/register"
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-center transition-colors mb-8 shadow-lg text-sm"
          >
            Get Started with Pro
          </Link>
          <div className="space-y-4 flex-1">
            <p className="font-semibold text-white text-sm">Everything in Basic, plus:</p>
            <ul className="space-y-3 text-sm text-blue-100">
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <span>Google Gemini AI Meeting Summaries</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <span>Automated AI Action-Item &amp; Task extraction</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <span>Continuous speech-to-text transcript archives</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <span>Scheduled recurring meetings with custom passcodes</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <span>Full personal note-taking drawer</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Business / Enterprise Plan */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 sm:p-8 flex flex-col hover:shadow-2xl transition-shadow relative">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Business</h3>
          <p className="text-gray-500 text-sm mb-6 h-10">Advanced governance and custom enterprise deployments.</p>
          <div className="mb-6">
            <span className="text-5xl font-extrabold text-gray-900">
              {isAnnual ? '$17.59' : '$21.99'}
            </span>
            <span className="text-gray-500 text-sm ml-1">/month/host</span>
          </div>
          <Link
            to="/info/contact-sales"
            className="w-full py-3 px-4 bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-bold rounded-xl text-center transition-colors mb-8 text-sm"
          >
            Contact Sales for Volume
          </Link>
          <div className="space-y-4 flex-1">
            <p className="font-semibold text-gray-900 text-sm">Everything in Pro, plus:</p>
            <ul className="space-y-3 text-sm text-gray-700">
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <span>Up to 300 attendees per session</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <span>Dedicated organization administration &amp; user management</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <span>Custom Gemini AI prompt &amp; summary configuration</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <span>Direct onboarding and SLA support commitment</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
