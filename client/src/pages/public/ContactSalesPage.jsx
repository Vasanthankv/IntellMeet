import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { getApiBaseUrl } from '../../utils/apiConfig';
import {
  Mail,
  Building2,
  Users,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Send,
  Loader2,
  Clock,
  Check,
  Headphones,
} from 'lucide-react';

export default function ContactSalesPage() {
  const { isAuthenticated } = useAuthStore();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    teamSize: '11-50',
    enquiryType: 'Enterprise Deployment',
    message: '',
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(null);

  const validate = () => {
    const errors = {};
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      errors.name = 'Full name must be at least 2 characters.';
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!formData.email.trim() || !emailRegex.test(formData.email.trim())) {
      errors.email = 'Please provide a valid business email address.';
    }

    if (!formData.company.trim() || formData.company.trim().length < 2) {
      errors.company = 'Company or organization name is required.';
    }

    if (!formData.message.trim() || formData.message.trim().length < 10) {
      errors.message = 'Please provide details with at least 10 characters.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: null }));
    }
    if (submitError) {
      setSubmitError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate() || isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch(`${getApiBaseUrl()}/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSubmitSuccess({
          enquiryId: data.enquiryId,
          message: data.message,
          name: formData.name,
          email: formData.email,
        });
      } else {
        setSubmitError(data.message || 'Failed to submit enquiry. Please check your inputs.');
        if (data.errors) {
          setFieldErrors(data.errors);
        }
      }
    } catch (err) {
      setSubmitError(err.message || 'Network error connecting to the server. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setFormData({
      name: '',
      email: '',
      company: '',
      teamSize: '11-50',
      enquiryType: 'Enterprise Deployment',
      message: '',
    });
    setFieldErrors({});
    setSubmitSuccess(null);
    setSubmitError(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col text-gray-900 selection:bg-blue-100 selection:text-blue-900">
      {/* Header */}
      <header className="h-[70px] sticky top-0 z-50 flex items-center justify-between px-4 sm:px-6 md:px-12 bg-[#0b1b3d] border-b border-blue-950/60 shadow-md">
        <div className="flex items-center gap-4 sm:gap-8">
          <Link to="/" className="flex items-center gap-2 sm:gap-2.5 group">
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-white rounded-lg flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
              <span className="text-[#0b1b3d] font-black text-sm sm:text-base leading-none">IM</span>
            </div>
            <span className="text-white font-extrabold text-[18px] sm:text-[22px] tracking-tight">IntellMeet</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-[15px] font-medium text-gray-200">
            <Link to="/info/solutions" className="hover:text-white transition-colors">
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

        <div className="flex items-center gap-2 sm:gap-4">
          <Link
            to="/join"
            className="text-gray-200 hover:text-white font-medium text-xs sm:text-sm px-2.5 sm:px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            Join
          </Link>

          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm px-3.5 sm:px-4 py-2 rounded-full shadow-sm transition-colors flex items-center gap-1.5"
            >
              Dashboard
              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
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
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm px-3.5 sm:px-4 py-2 rounded-full shadow-sm transition-colors"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Intro */}
      <section className="bg-gradient-to-b from-[#0b1b3d] via-[#10234e] to-[#0b1b3d] text-white pt-12 pb-16 sm:pt-16 sm:pb-20 px-4 text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs sm:text-sm font-semibold mb-4 sm:mb-6 shadow-sm">
            <Headphones className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-300" />
            Enterprise Sales &amp; Custom Deployments
          </div>

          <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-4 sm:mb-6 leading-tight">
            Let's Talk About Your Meeting Needs
          </h1>

          <p className="text-sm sm:text-lg text-blue-100/90 max-w-2xl mx-auto leading-relaxed">
            Whether you are evaluating enterprise video conferencing, custom security controls, volume licensing, or automated Google Gemini AI workflows, our team is ready to assist.
          </p>
        </div>
      </section>

      {/* Main Content Area: Form & Value Props */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-3 sm:px-6 -mt-8 sm:-mt-10 pb-16 sm:pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
          {/* Left Column: Form or Success Confirmation (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-2xl shadow-xl border border-gray-200 p-5 sm:p-8 md:p-10 relative">
            {submitSuccess ? (
              <div className="py-8 text-center animate-fadeIn">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                  <CheckCircle2 className="w-10 h-10" />
                </div>

                <h2 className="text-2xl font-bold text-gray-900 mb-3">Enquiry Received!</h2>

                <p className="text-gray-600 mb-6 leading-relaxed max-w-md mx-auto text-sm sm:text-base">
                  Thank you, <strong>{submitSuccess.name}</strong>. Your enquiry has been securely logged in our system. A solutions representative will review your requirements and respond to{' '}
                  <span className="font-semibold text-blue-600">{submitSuccess.email}</span> within 1 business day.
                </p>

                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 max-w-sm mx-auto mb-8 text-xs text-left text-gray-600 space-y-1">
                  <p>
                    <span className="font-semibold text-gray-700">Reference ID:</span>{' '}
                    <code className="text-blue-700 bg-blue-50 px-1 py-0.5 rounded font-mono">
                      #{String(submitSuccess.enquiryId).slice(-8).toUpperCase()}
                    </code>
                  </p>
                  <p>
                    <span className="font-semibold text-gray-700">Status:</span> New / Queued for Review
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    onClick={handleResetForm}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-full border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors text-sm"
                  >
                    Send Another Message
                  </button>
                  <Link
                    to="/info/solutions"
                    className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors text-sm"
                  >
                    Explore Solutions
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate>
                <div className="mb-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                    Send a Message to Our Sales Team
                  </h2>
                  <p className="text-sm text-gray-500">
                    Fill out the form below and an IntelliMeet product specialist will get back to you shortly.
                  </p>
                </div>

                {submitError && (
                  <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-sm text-red-700">
                    <AlertCircle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold">Unable to submit enquiry</p>
                      <p className="text-xs text-red-600 mt-0.5">{submitError}</p>
                    </div>
                  </div>
                )}

                <div className="space-y-5">
                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g. Sarah Jenkins"
                      className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 ${
                        fieldErrors.name
                          ? 'border-red-300 focus:ring-red-200 bg-red-50/30'
                          : 'border-gray-200 focus:border-blue-500 focus:ring-blue-100'
                      }`}
                    />
                    {fieldErrors.name && (
                      <p className="text-xs text-red-600 mt-1 font-medium">{fieldErrors.name}</p>
                    )}
                  </div>

                  {/* Business Email & Company */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                        Business Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="sarah@company.com"
                        className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 ${
                          fieldErrors.email
                            ? 'border-red-300 focus:ring-red-200 bg-red-50/30'
                            : 'border-gray-200 focus:border-blue-500 focus:ring-blue-100'
                        }`}
                      />
                      {fieldErrors.email && (
                        <p className="text-xs text-red-600 mt-1 font-medium">{fieldErrors.email}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                        Company / Org <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="company"
                        value={formData.company}
                        onChange={handleChange}
                        placeholder="Acme Technologies"
                        className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 ${
                          fieldErrors.company
                            ? 'border-red-300 focus:ring-red-200 bg-red-50/30'
                            : 'border-gray-200 focus:border-blue-500 focus:ring-blue-100'
                        }`}
                      />
                      {fieldErrors.company && (
                        <p className="text-xs text-red-600 mt-1 font-medium">{fieldErrors.company}</p>
                      )}
                    </div>
                  </div>

                  {/* Team Size & Enquiry Type */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                        Team Size
                      </label>
                      <select
                        name="teamSize"
                        value={formData.teamSize}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white"
                      >
                        <option value="1-10">1 - 10 members</option>
                        <option value="11-50">11 - 50 members</option>
                        <option value="51-200">51 - 200 members</option>
                        <option value="201-1000">201 - 1,000 members</option>
                        <option value="1000+">1,000+ members</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                        Enquiry Type
                      </label>
                      <select
                        name="enquiryType"
                        value={formData.enquiryType}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white"
                      >
                        <option value="Enterprise Deployment">Enterprise Deployment</option>
                        <option value="Custom AI & Security Requirements">
                          Custom AI &amp; Security Requirements
                        </option>
                        <option value="Volume Pricing & Licensing">Volume Pricing &amp; Licensing</option>
                        <option value="Technical Integration / API">Technical Integration / API</option>
                        <option value="Other">Other General Inquiry</option>
                      </select>
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                      Your Message / Requirements <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="message"
                      rows={4}
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Please describe your organization's use case, expected meeting frequency, or questions about IntelliMeet features..."
                      className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 resize-none ${
                        fieldErrors.message
                          ? 'border-red-300 focus:ring-red-200 bg-red-50/30'
                          : 'border-gray-200 focus:border-blue-500 focus:ring-blue-100'
                      }`}
                    />
                    {fieldErrors.message && (
                      <p className="text-xs text-red-600 mt-1 font-medium">{fieldErrors.message}</p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Sending Enquiry...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Submit Sales Enquiry</span>
                      </>
                    )}
                  </button>

                  <p className="text-xs text-gray-400 text-center">
                    By submitting this form, your request is securely stored in our encrypted database and handled pursuant to our privacy standards.
                  </p>
                </div>
              </form>
            )}
          </div>

          {/* Right Column: Verified Value Propositions & Direct Channels (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Why IntelliMeet Card */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                Why Teams Choose IntelliMeet
              </h3>

              <ul className="space-y-4 text-sm text-gray-600">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-gray-900">Real Gemini AI Integration:</strong> Automated summaries, key takeaways, and action items generated natively from live transcripts.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-gray-900">Zero-Install WebRTC Meetings:</strong> High-definition audio and video conferencing that works instantly in any modern web browser.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-gray-900">Interactive Collaboration:</strong> Built-in digital whiteboard studio, screen sharing with tab audio, and persistent in-room chat.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-gray-900">Enterprise Access Security:</strong> Passcode-protected meetings, waiting rooms, and host moderation controls.
                  </span>
                </li>
              </ul>
            </div>

            {/* Direct Contact Card */}
            <div className="bg-[#0b1b3d] text-white rounded-2xl p-6 sm:p-8 shadow-md border border-blue-900">
              <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-400" />
                Direct Communication
              </h3>
              <p className="text-xs text-blue-200 mb-6 leading-relaxed">
                Prefer direct correspondence or have an urgent question regarding your existing deployment?
              </p>

              <div className="space-y-3 text-xs text-blue-100">
                <div className="flex items-center gap-3 bg-blue-950/60 p-3 rounded-xl border border-blue-800">
                  <Mail className="w-4 h-4 text-blue-400 shrink-0" />
                  <div>
                    <p className="font-semibold text-white">Sales &amp; Partnership Email</p>
                    <a href="mailto:sales@intellmeet.com" className="text-blue-300 hover:underline">
                      sales@intellmeet.com
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-blue-950/60 p-3 rounded-xl border border-blue-800">
                  <Clock className="w-4 h-4 text-blue-400 shrink-0" />
                  <div>
                    <p className="font-semibold text-white">Response Commitment</p>
                    <p className="text-blue-300">Within 1 business day (Mon - Fri)</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-blue-900/60">
                <Link
                  to="/support"
                  className="text-xs font-semibold text-blue-300 hover:text-white flex items-center justify-between group"
                >
                  <span>Looking for technical documentation or help?</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

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
            <Link to="/info/solutions" className="hover:text-white transition-colors">
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
