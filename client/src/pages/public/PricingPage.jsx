import React from 'react';
import { Link } from 'react-router-dom';
import { Check, ArrowRight } from 'lucide-react';

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white font-sans flex flex-col">
      {/* Simple Header */}
      <header className="h-[70px] flex items-center justify-between px-6 md:px-10 shrink-0 bg-[#0b1b3d]">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center shadow-sm">
            <span className="text-[#0b1b3d] font-extrabold text-base leading-none">IM</span>
          </div>
          <span className="text-white font-extrabold text-[24px] tracking-tight">IntellMeet</span>
        </Link>
        <Link to="/login" className="text-white font-semibold hover:text-blue-200">Sign In</Link>
      </header>

      {/* Hero Section */}
      <div className="bg-gradient-to-b from-[#0b1b3d] to-blue-900 py-20 px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">Choose the right plan for your team</h1>
        <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
          Whether you're hosting quick 1-on-1s or massive global webinars, IntellMeet has a plan designed for you.
        </p>
        <div className="inline-flex bg-blue-800 p-1 rounded-full border border-blue-700 mb-12">
          <button className="px-6 py-2 rounded-full bg-white text-[#0b1b3d] font-bold text-sm shadow-sm">Pay Monthly</button>
          <button className="px-6 py-2 rounded-full text-white font-semibold text-sm hover:text-blue-100">Pay Annually (Save 20%)</button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-4 -mt-10 pb-24 grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Basic Plan */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 flex flex-col hover:shadow-2xl transition-shadow relative">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Basic</h3>
          <p className="text-gray-500 text-sm mb-6 h-10">Free meetings for personal use.</p>
          <div className="mb-6">
            <span className="text-5xl font-extrabold text-gray-900">$0</span>
            <span className="text-gray-500">/month/user</span>
          </div>
          <Link to="/register" className="w-full py-3 px-4 bg-white border-2 border-blue-600 text-blue-600 font-bold rounded-lg text-center hover:bg-blue-50 transition-colors mb-8">
            Sign Up Free
          </Link>
          <div className="space-y-4 flex-1">
            <p className="font-semibold text-gray-900">Features:</p>
            <ul className="space-y-3">
              <li className="flex items-start gap-3"><Check className="w-5 h-5 text-blue-500 shrink-0" /><span className="text-sm text-gray-700">Meetings up to 40 minutes</span></li>
              <li className="flex items-start gap-3"><Check className="w-5 h-5 text-blue-500 shrink-0" /><span className="text-sm text-gray-700">100 Attendees per meeting</span></li>
              <li className="flex items-start gap-3"><Check className="w-5 h-5 text-blue-500 shrink-0" /><span className="text-sm text-gray-700">Basic Whiteboard</span></li>
              <li className="flex items-start gap-3"><Check className="w-5 h-5 text-blue-500 shrink-0" /><span className="text-sm text-gray-700">Team Chat</span></li>
            </ul>
          </div>
        </div>

        {/* Pro Plan */}
        <div className="bg-[#0b1b3d] rounded-2xl shadow-2xl border border-blue-800 p-8 flex flex-col relative transform md:-translate-y-4">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest shadow-md">
            Most Popular
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">Pro</h3>
          <p className="text-blue-200 text-sm mb-6 h-10">Everything you need for small teams.</p>
          <div className="mb-6">
            <span className="text-5xl font-extrabold text-white">$14.99</span>
            <span className="text-blue-200">/month/user</span>
          </div>
          <Link to="/register" className="w-full py-3 px-4 bg-blue-600 text-white font-bold rounded-lg text-center hover:bg-blue-700 transition-colors mb-8 shadow-lg">
            Buy Now
          </Link>
          <div className="space-y-4 flex-1">
            <p className="font-semibold text-white">Everything in Basic, plus:</p>
            <ul className="space-y-3">
              <li className="flex items-start gap-3"><Check className="w-5 h-5 text-blue-400 shrink-0" /><span className="text-sm text-blue-50">Unlimited meeting duration (up to 30 hrs)</span></li>
              <li className="flex items-start gap-3"><Check className="w-5 h-5 text-blue-400 shrink-0" /><span className="text-sm text-blue-50">IntellMeet AI Companion (Live Captions & Summary)</span></li>
              <li className="flex items-start gap-3"><Check className="w-5 h-5 text-blue-400 shrink-0" /><span className="text-sm text-blue-50">5GB Cloud Recording storage</span></li>
              <li className="flex items-start gap-3"><Check className="w-5 h-5 text-blue-400 shrink-0" /><span className="text-sm text-blue-50">Essential Apps (Notes, Tasks, Recordings)</span></li>
            </ul>
          </div>
        </div>

        {/* Business Plan */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 flex flex-col hover:shadow-2xl transition-shadow relative">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Business</h3>
          <p className="text-gray-500 text-sm mb-6 h-10">Advanced features for growing companies.</p>
          <div className="mb-6">
            <span className="text-5xl font-extrabold text-gray-900">$21.99</span>
            <span className="text-gray-500">/month/user</span>
          </div>
          <Link to="/register" className="w-full py-3 px-4 bg-white border-2 border-blue-600 text-blue-600 font-bold rounded-lg text-center hover:bg-blue-50 transition-colors mb-8">
            Buy Now
          </Link>
          <div className="space-y-4 flex-1">
            <p className="font-semibold text-gray-900">Everything in Pro, plus:</p>
            <ul className="space-y-3">
              <li className="flex items-start gap-3"><Check className="w-5 h-5 text-blue-500 shrink-0" /><span className="text-sm text-gray-700">300 Attendees per meeting</span></li>
              <li className="flex items-start gap-3"><Check className="w-5 h-5 text-blue-500 shrink-0" /><span className="text-sm text-gray-700">Single Sign-On (SSO)</span></li>
              <li className="flex items-start gap-3"><Check className="w-5 h-5 text-blue-500 shrink-0" /><span className="text-sm text-gray-700">Managed domains & Branding</span></li>
              <li className="flex items-start gap-3"><Check className="w-5 h-5 text-blue-500 shrink-0" /><span className="text-sm text-gray-700">Unlimited Cloud Recording</span></li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
}
