import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search, ChevronRight, ChevronDown, Video, Mic, Monitor, Shield,
  HelpCircle, MessageCircle, BookOpen, Zap, Users, Settings,
  ArrowLeft, ExternalLink, Clock, ThumbsUp, ThumbsDown, User
} from 'lucide-react';
import { supportTopics } from '../../data/mockSupportTopics';

const ICON_MAP = { Video, Users, Monitor, Zap, Shield, Settings };

const supportCategories = Object.values(supportTopics).map(t => ({
  slug: t.slug,
  icon: ICON_MAP[t.icon] || BookOpen,
  color: t.color,
  title: t.title,
  description: t.description,
  articles: t.articles.length,
}));

const popularArticles = [
  { title: 'How to join a meeting with a Meeting ID', time: '2 min read' },
  { title: 'Setting up your camera and microphone', time: '3 min read' },
  { title: 'How to schedule a meeting and invite participants', time: '4 min read' },
  { title: 'Using the AI Meeting Assistant during a call', time: '5 min read' },
  { title: 'How to view and share AI-generated meeting summaries', time: '3 min read' },
  { title: 'Screen sharing: tips and troubleshooting', time: '4 min read' },
];

const faqs = [
  {
    q: 'How do I join a meeting without an account?',
    a: 'You can join a meeting using a Meeting ID on our home page. Simply enter the Meeting ID provided by the host and click "Join". For audio and video features, you may be prompted to enter your name.',
  },
  {
    q: 'My camera is not working. What should I do?',
    a: 'First, check that your browser has permission to access the camera. Go to your browser settings → Privacy → Camera and make sure IntellMeet is allowed. Also ensure no other application is using the camera simultaneously.',
  },
  {
    q: 'How does the AI summary work?',
    a: 'IntellMeet automatically transcribes your meeting using speech-to-text technology. After the meeting ends, our AI processes the transcript to generate a summary, extract key decisions, action items, and risk points — all available in the AI Intelligence section.',
  },
  {
    q: 'Can I download the meeting transcript?',
    a: 'Yes! After a meeting is completed, navigate to the meeting details page, click on "View Transcript", and use the download button to export the transcript as a text or PDF file.',
  },
  {
    q: 'How many participants can join a meeting?',
    a: 'IntellMeet supports up to 500 participants in a single meeting room. For larger enterprise events, please contact our sales team for SFU-powered large-scale conference solutions.',
  },
];

export default function SupportPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaq, setOpenFaq] = useState(null);
  const [feedback, setFeedback] = useState({});

  const filteredFaqs = faqs.filter(faq =>
    searchQuery === '' ||
    faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.a.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredArticles = popularArticles.filter(a =>
    searchQuery === '' || a.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0 sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="w-px h-5 bg-gray-200" />
          <Link to="/" className="flex items-center gap-2 text-primary-600 font-bold text-xl tracking-tight">
            IntellMeet
          </Link>
          <span className="text-gray-400 font-light text-xl">/</span>
          <span className="text-gray-700 font-medium text-sm">Support Center</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/profile"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-medium text-gray-700 transition-colors"
          >
            <User className="w-4 h-4 text-primary-600" />
            My Profile
          </Link>
          <Link to="/login" className="text-sm font-medium text-primary-600 hover:text-primary-500 hidden sm:block">
            Sign In
          </Link>
          <button
            onClick={() => navigate('/register')}
            className="text-sm font-semibold px-5 py-2 bg-primary-600 text-white rounded-full hover:bg-primary-700 transition-colors shadow-sm"
          >
            Sign Up Free
          </button>
        </div>
      </header>

      {/* Hero Search Banner */}
      <div className="bg-gradient-to-br from-primary-700 via-primary-600 to-primary-500 py-16 px-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <HelpCircle className="w-7 h-7 text-primary-200" />
          <h1 className="text-3xl md:text-4xl font-bold text-white">How can we help you?</h1>
        </div>
        <p className="text-primary-100 text-base mt-2 mb-8 max-w-xl mx-auto">
          Search our knowledge base, browse guides, or reach out to our support team.
        </p>
        <div className="max-w-xl mx-auto relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search for help (e.g. 'join meeting', 'AI summary', 'camera')"
            className="w-full h-14 pl-12 pr-5 rounded-xl border-0 bg-white shadow-lg text-gray-800 text-sm focus:outline-none focus:ring-4 focus:ring-white/30 placeholder:text-gray-400"
          />
        </div>
      </div>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-12">

        {/* Quick User Profile Card */}
        <div className="mb-10 p-5 bg-gradient-to-r from-primary-900 via-primary-800 to-indigo-900 rounded-2xl text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
              <User className="w-6 h-6 text-primary-200" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">User Profile & Account Hub</h3>
              <p className="text-xs text-primary-200 mt-0.5">
                View your personal meeting ID, subscription tier, account security, and meeting preferences.
              </p>
            </div>
          </div>
          <Link
            to="/profile"
            className="shrink-0 px-5 py-2.5 bg-white text-primary-900 rounded-xl text-xs font-bold hover:bg-primary-50 transition-colors shadow-md flex items-center gap-1.5"
          >
            <span>View My Profile</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Support Categories */}
        <section className="mb-14">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary-500" />
            Browse by Topic
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {supportCategories.map((cat) => (
              <Link
                key={cat.slug}
                to={`/support/${cat.slug}`}
                className="flex items-start gap-4 p-5 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-primary-300 transition-all text-left group"
              >
                <div className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${cat.color}`}>
                  <cat.icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">{cat.title}</h3>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-primary-500 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{cat.description}</p>
                  <p className="text-xs font-medium text-primary-600 mt-2">{cat.articles} articles</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Popular Articles */}
          <div className="lg:col-span-2">
            <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-8">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">
                  {searchQuery ? 'Search Results' : 'Popular Articles'}
                </h2>
                {filteredArticles.length > 0 && (
                  <span className="text-xs text-gray-400">{filteredArticles.length} results</span>
                )}
              </div>
              <ul className="divide-y divide-gray-100">
                {filteredArticles.length > 0 ? filteredArticles.map((article, i) => {
                  const encodedTitle = encodeURIComponent(article.title.toLowerCase().replace(/ /g, '-'));
                  return (
                  <li key={i}>
                    <Link to={`/support/article/${encodedTitle}`} className="w-full flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors group text-left">
                      <BookOpen className="w-5 h-5 text-gray-300 shrink-0 group-hover:text-primary-400 transition-colors" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 group-hover:text-primary-600 transition-colors">
                          {article.title}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <Clock className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-400">{article.time}</span>
                        </div>
                      </div>
                      <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-primary-400 transition-colors shrink-0" />
                    </Link>
                  </li>
                  )
                }) : (
                  <li className="px-6 py-10 text-center">
                    <p className="text-gray-400 text-sm">No articles found for "<strong>{searchQuery}</strong>"</p>
                    <p className="text-gray-400 text-xs mt-1">Try different keywords or contact support.</p>
                  </li>
                )}
              </ul>
            </section>

            {/* FAQ Section */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-primary-500" />
                Frequently Asked Questions
              </h2>
              <div className="space-y-3">
                {filteredFaqs.length > 0 ? filteredFaqs.map((faq, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
                  >
                    <button
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}
                      className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-sm font-semibold text-gray-900 pr-4">{faq.q}</span>
                      <ChevronDown
                        className={`w-5 h-5 text-gray-400 shrink-0 transition-transform duration-200 ${openFaq === i ? 'rotate-180 text-primary-500' : ''}`}
                      />
                    </button>
                    {openFaq === i && (
                      <div className="px-6 pb-5">
                        <div className="h-px bg-gray-100 mb-4" />
                        <p className="text-sm text-gray-600 leading-relaxed">{faq.a}</p>
                        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100">
                          <span className="text-xs text-gray-400">Was this helpful?</span>
                          <button
                            onClick={() => setFeedback(prev => ({ ...prev, [i]: 'yes' }))}
                            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                              feedback[i] === 'yes'
                                ? 'bg-green-50 border-green-300 text-green-600'
                                : 'border-gray-200 text-gray-500 hover:border-green-300 hover:text-green-600'
                            }`}
                          >
                            <ThumbsUp className="w-3.5 h-3.5" /> Yes
                          </button>
                          <button
                            onClick={() => setFeedback(prev => ({ ...prev, [i]: 'no' }))}
                            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                              feedback[i] === 'no'
                                ? 'bg-red-50 border-red-300 text-red-600'
                                : 'border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-600'
                            }`}
                          >
                            <ThumbsDown className="w-3.5 h-3.5" /> No
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )) : (
                  <div className="bg-white rounded-xl border border-gray-200 px-6 py-10 text-center shadow-sm">
                    <p className="text-gray-400 text-sm">No FAQs matched "<strong>{searchQuery}</strong>"</p>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Right Sidebar — Contact & Resources */}
          <div className="space-y-6">
            {/* Contact Support */}
            <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl p-6 text-white shadow-md">
              <MessageCircle className="w-8 h-8 text-primary-200 mb-3" />
              <h3 className="font-bold text-lg">Still need help?</h3>
              <p className="text-primary-100 text-sm mt-1 mb-5 leading-relaxed">
                Our support team is available 24/7 to help you resolve any issue quickly.
              </p>
              <Link to="/support/chat" className="block text-center w-full py-2.5 bg-white text-primary-700 font-semibold rounded-lg hover:bg-primary-50 transition-colors text-sm shadow-sm">
                Chat with Support
              </Link>
              <button className="w-full mt-2 py-2.5 bg-primary-500/50 text-white font-medium rounded-lg hover:bg-primary-500/70 transition-colors text-sm border border-primary-400">
                Submit a Ticket
              </button>
            </div>

            {/* Quick Tips */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" /> Quick Tips
              </h3>
              <ul className="space-y-3 text-sm text-gray-600">
                {[
                  'Use a wired connection for the best meeting quality.',
                  'Close unused browser tabs to improve performance.',
                  'Grant camera and mic permissions before joining.',
                  'Ask the host to enable AI summary before starting.',
                  'Use the AI Assistant to get instant meeting insights.',
                ].map((tip, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex items-center justify-center shrink-0 mt-px">
                      {i + 1}
                    </span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* System Status */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h3 className="font-bold text-gray-900 mb-4">System Status</h3>
              {[
                { name: 'Video Conferencing', ok: true },
                { name: 'AI Transcription', ok: true },
                { name: 'File Storage', ok: true },
                { name: 'Notifications', ok: true },
              ].map((service) => (
                <div key={service.name} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <span className="text-sm text-gray-600">{service.name}</span>
                  <span className={`flex items-center gap-1.5 text-xs font-semibold ${service.ok ? 'text-green-600' : 'text-red-500'}`}>
                    <span className={`w-2 h-2 rounded-full ${service.ok ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    {service.ok ? 'Operational' : 'Disrupted'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* ─── Enterprise Footer ─── */}
      <footer className="bg-[#0d1b3e] text-gray-300 pt-14 pb-0 relative">

        {/* Give Feedback Tab — left side */}
        <div className="fixed left-0 top-1/2 -translate-y-1/2 z-50">
          <button
            className="bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold py-3 px-2 rounded-r-lg shadow-lg tracking-wider transition-colors"
            style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
          >
            Give Feedback
          </button>
        </div>

        {/* Main link columns */}
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-10 pb-12 border-b border-gray-700">

            {/* Column 1 – About */}
            <div>
              <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">About</h4>
              <ul className="space-y-2.5">
                {['Integrations', 'Partners', 'Investors', 'Press', 'Sustainability & ESG', 'IntellMeet Cares', 'Media Kit', 'How-to Videos', 'Developer Platform', 'IntellMeet Store'].map(item => (
                  <li key={item}>
                    <Link to={`/info/${item.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`} className="text-sm text-gray-400 hover:text-white transition-colors">{item}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 2 – Download */}
            <div>
              <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">Download</h4>
              <ul className="space-y-2.5">
                {['Outlook Plug-in', 'iPhone / iPad App', 'Android App', 'IntellMeet Virtual Backgrounds', 'Browser Extension', 'Desktop Client', 'Rooms Controller'].map(item => (
                  <li key={item}>
                    <Link to={`/info/${item.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`} className="text-sm text-gray-400 hover:text-white transition-colors">{item}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3 – Sales */}
            <div>
              <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">Sales</h4>
              <ul className="space-y-2.5">
                {['Plans & Pricing', 'Contact Sales', 'Request a Demo', 'Webinars and Events', 'IntellMeet Experience Center', 'Partner Solutions'].map(item => (
                  <li key={item}>
                    <Link to={`/info/${item.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`} className="text-sm text-gray-400 hover:text-white transition-colors">{item}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 4 – Support */}
            <div>
              <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">Support</h4>
              <ul className="space-y-2.5">
                {['Test IntellMeet', 'Account', 'Support Center', 'Live Training', 'Feedback', 'Contact Us', 'Accessibility', 'Submit a Ticket'].map(item => {
                  if (item === 'Support Center') return <li key={item}><Link to="/support" className="text-sm text-gray-400 hover:text-white transition-colors">{item}</Link></li>;
                  return (
                  <li key={item}>
                    <Link to={`/info/${item.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`} className="text-sm text-gray-400 hover:text-white transition-colors">{item}</Link>
                  </li>
                  )
                })}
              </ul>
            </div>

            {/* Column 5 – Community */}
            <div>
              <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">Community</h4>
              <ul className="space-y-2.5">
                {['IntellMeet Community', 'Developer Forum', 'Blog', 'Security Bulletin', 'Privacy, Security & Legal Policies', 'Modern Slavery Statement'].map(item => (
                  <li key={item}>
                    <Link to={`/info/${item.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`} className="text-sm text-gray-400 hover:text-white transition-colors leading-snug">{item}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Contact row */}
          <div className="py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border-b border-gray-700">
            {/* Phone numbers */}
            <div>
              <p className="text-gray-400 text-xs mb-1 font-medium uppercase tracking-wider">Get in touch</p>
              <a href="tel:+18887999666" className="block text-white font-bold text-lg hover:text-primary-400 transition-colors">+1.888.799.9666</a>
              <a href="tel:+18883031012" className="block text-white font-bold text-lg hover:text-primary-400 transition-colors">+1.888.303.1012</a>
            </div>

            {/* Social icons */}
            <div className="flex items-center gap-5">
              {/* LinkedIn */}
              <a href="#" aria-label="LinkedIn" className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
              {/* Twitter / X */}
              <a href="#" aria-label="Twitter" className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              {/* YouTube */}
              <a href="#" aria-label="YouTube" className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
              {/* Facebook */}
              <a href="#" aria-label="Facebook" className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              {/* Instagram */}
              <a href="#" aria-label="Instagram" className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Bottom copyright bar */}
          <div className="py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
            <p>Copyright ©2026 IntellMeet Communications, Inc. All rights reserved.</p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link to="/info/terms" className="hover:text-white transition-colors">Terms</Link>
              <Link to="/info/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link to="/info/trust-center" className="hover:text-white transition-colors">Trust Center</Link>
              <Link to="/info/legal-compliance" className="hover:text-white transition-colors">Legal &amp; Compliance</Link>
              <Link to="/info/privacy-choices" className="hover:text-white transition-colors flex items-center gap-1.5">
                <span className="w-5 h-3.5 rounded-sm overflow-hidden inline-flex">
                  <span className="w-1/2 bg-blue-600 inline-block"></span>
                  <span className="w-1/2 bg-primary-400 inline-block"></span>
                </span>
                Your privacy choices
              </Link>
              <Link to="/info/cookie-settings" className="hover:text-white transition-colors">Cookie Settings</Link>
            </div>
          </div>
        </div>

        {/* Floating chat button */}
        <button
          onClick={() => navigate('/support/chat')}
          className="fixed bottom-6 right-6 w-14 h-14 bg-primary-600 hover:bg-primary-700 rounded-full flex items-center justify-center text-white shadow-xl transition-transform hover:scale-105 z-50"
          aria-label="Open chat"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      </footer>
    </div>
  );
}
