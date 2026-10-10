import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Search, BookOpen, Clock, Eye, ChevronDown,
  ExternalLink, ThumbsUp, ThumbsDown, MessageCircle,
  Video, Users, Monitor, Zap, Shield, Settings, Tag
} from 'lucide-react';
import { supportTopics } from '../../data/mockSupportTopics';

const ICON_MAP = { Video, Users, Monitor, Zap, Shield, Settings };

const ACCENT_CLASSES = {
  blue:   { badge: 'bg-blue-100 text-blue-700',   header: 'from-blue-600 to-blue-500',   ring: 'focus:ring-blue-400' },
  green:  { badge: 'bg-green-100 text-green-700', header: 'from-green-600 to-green-500', ring: 'focus:ring-green-400' },
  purple: { badge: 'bg-purple-100 text-purple-700', header: 'from-purple-600 to-purple-500', ring: 'focus:ring-purple-400' },
  amber:  { badge: 'bg-amber-100 text-amber-700', header: 'from-amber-500 to-amber-400', ring: 'focus:ring-amber-400' },
  red:    { badge: 'bg-red-100 text-red-700',     header: 'from-red-600 to-red-500',     ring: 'focus:ring-red-400' },
  gray:   { badge: 'bg-gray-100 text-gray-700',   header: 'from-gray-600 to-gray-500',   ring: 'focus:ring-gray-400' },
};

export default function SupportTopicPage() {
  const { topicSlug } = useParams();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [openFaq, setOpenFaq] = useState(null);
  const [feedback, setFeedback] = useState({});

  const topic = supportTopics[topicSlug];

  if (!topic) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
        <p className="text-2xl font-bold text-gray-700">Topic not found</p>
        <button onClick={() => navigate('/support')}
          className="text-primary-600 underline text-sm">← Back to Support Center</button>
      </div>
    );
  }

  const Icon = ICON_MAP[topic.icon] || BookOpen;
  const accent = ACCENT_CLASSES[topic.accent] || ACCENT_CLASSES.blue;

  const filtered = topic.articles.filter(a =>
    search === '' ||
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
  );

  // Other topics for sidebar nav
  const otherTopics = Object.values(supportTopics).filter(t => t.slug !== topicSlug);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">

      {/* ── Navbar ── */}
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-20 shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/support')}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="w-px h-5 bg-gray-200" />
          <Link to="/" className="text-primary-600 font-bold text-xl tracking-tight">IntellMeet</Link>
          <span className="text-gray-400 text-xl font-light">/</span>
          <Link to="/support" className="text-gray-500 text-sm hover:text-gray-800 transition-colors">Support Center</Link>
          <span className="text-gray-400 text-xl font-light">/</span>
          <span className="text-gray-800 font-semibold text-sm">{topic.title}</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm font-medium text-primary-600 hover:text-primary-500 hidden sm:block">Sign In</Link>
          <button onClick={() => navigate('/register')}
            className="text-sm font-semibold px-5 py-2 bg-primary-600 text-white rounded-full hover:bg-primary-700 transition-colors shadow-sm">
            Sign Up Free
          </button>
        </div>
      </header>

      {/* ── Hero Banner ── */}
      <div className={`bg-gradient-to-br ${accent.header} py-14 px-6 text-center`}>
        <div className={`w-16 h-16 rounded-2xl ${topic.color} flex items-center justify-center mx-auto mb-4 shadow-lg`}>
          <Icon className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">{topic.title}</h1>
        <p className="text-white/80 mb-8 text-sm">{topic.description}</p>
        <div className="max-w-lg mx-auto relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder={`Search ${topic.title} articles...`}
            className={`w-full h-12 pl-12 pr-5 rounded-xl border-0 bg-white shadow-lg text-gray-800 text-sm focus:outline-none focus:ring-4 ${accent.ring} placeholder:text-gray-400`} />
        </div>
      </div>

      {/* ── Main ── */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

          {/* ── Left: Articles ── */}
          <div className="lg:col-span-3 space-y-8">

            {/* Article Count */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary-500" />
                {search ? `Results for "${search}"` : 'All Articles'}
              </h2>
              <span className="text-xs text-gray-400 bg-white border border-gray-200 rounded-full px-3 py-1 shadow-sm">
                {filtered.length} of {topic.articles.length} articles
              </span>
            </div>

            {/* Articles Grid */}
            {filtered.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filtered.map(article => {
                  const encodedTitle = encodeURIComponent(article.title.toLowerCase().replace(/ /g, '-'));
                  return (
                  <Link key={article.id} to={`/support/article/${encodedTitle}`}
                    className="flex flex-col gap-3 bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-primary-300 transition-all text-left group">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-gray-900 group-hover:text-primary-600 transition-colors leading-snug">
                        {article.title}
                      </p>
                      <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-primary-400 transition-colors shrink-0 mt-0.5" />
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{article.time}</span>
                      <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{article.views} views</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {article.tags.map(tag => (
                        <span key={tag} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${accent.badge}`}>
                          <Tag className="w-2.5 h-2.5" />{tag}
                        </span>
                      ))}
                    </div>
                  </Link>
                  )
                })}
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 px-6 py-14 text-center shadow-sm">
                <p className="text-gray-400 text-sm">No articles matched <strong>"{search}"</strong></p>
                <button onClick={() => setSearch('')} className="mt-3 text-xs text-primary-600 underline">Clear search</button>
              </div>
            )}

            {/* FAQs */}
            {topic.faqs?.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
                <div className="space-y-3">
                  {topic.faqs.map((faq, i) => (
                    <div key={i} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                      <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors">
                        <span className="text-sm font-semibold text-gray-900 pr-4">{faq.q}</span>
                        <ChevronDown className={`w-5 h-5 text-gray-400 shrink-0 transition-transform duration-200 ${openFaq === i ? 'rotate-180 text-primary-500' : ''}`} />
                      </button>
                      {openFaq === i && (
                        <div className="px-6 pb-5">
                          <div className="h-px bg-gray-100 mb-4" />
                          <p className="text-sm text-gray-600 leading-relaxed">{faq.a}</p>
                          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100">
                            <span className="text-xs text-gray-400">Was this helpful?</span>
                            {['yes', 'no'].map(val => (
                              <button key={val} onClick={() => setFeedback(prev => ({ ...prev, [i]: val }))}
                                className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                                  feedback[i] === val
                                    ? val === 'yes' ? 'bg-green-50 border-green-300 text-green-600' : 'bg-red-50 border-red-300 text-red-600'
                                    : 'border-gray-200 text-gray-500 hover:border-gray-400'
                                }`}>
                                {val === 'yes' ? <ThumbsUp className="w-3.5 h-3.5" /> : <ThumbsDown className="w-3.5 h-3.5" />}
                                {val === 'yes' ? 'Yes' : 'No'}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Right Sidebar ── */}
          <div className="space-y-5">
            {/* Still need help */}
            <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl p-5 text-white shadow-md">
              <MessageCircle className="w-7 h-7 text-primary-200 mb-3" />
              <h3 className="font-bold text-base">Still need help?</h3>
              <p className="text-primary-100 text-xs mt-1 mb-4 leading-relaxed">
                Our support team is available 24/7 to resolve any issue.
              </p>
              <Link to="/support/chat" className="block text-center w-full py-2 bg-white text-primary-700 font-semibold rounded-lg hover:bg-primary-50 transition-colors text-sm mb-2">
                Chat with Support
              </Link>
              <button className="w-full py-2 bg-primary-500/40 text-white font-medium rounded-lg hover:bg-primary-500/60 transition-colors text-sm border border-primary-400">
                Submit a Ticket
              </button>
            </div>

            {/* Browse Other Topics */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h3 className="font-bold text-gray-900 text-sm mb-4">Browse Other Topics</h3>
              <ul className="space-y-2">
                {otherTopics.map(t => {
                  const OtherIcon = ICON_MAP[t.icon] || BookOpen;
                  return (
                    <li key={t.slug}>
                      <Link to={`/support/${t.slug}`}
                        className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors group">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${t.color}`}>
                          <OtherIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-800 group-hover:text-primary-600 transition-colors">{t.title}</p>
                          <p className="text-[10px] text-gray-400">{t.articles.length} articles</p>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* Floating Chat Bubble */}
      <button onClick={() => navigate('/support/chat')}
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary-600 hover:bg-primary-700 rounded-full flex items-center justify-center text-white shadow-xl hover:scale-105 transition-all z-50">
        <MessageCircle className="w-6 h-6" />
      </button>
    </div>
  );
}
