import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Clock, Eye, MessageCircle, ThumbsUp, ThumbsDown } from 'lucide-react';

export default function SupportArticlePage() {
  const { articleId } = useParams();
  const navigate = useNavigate();

  // In a real app, you would fetch the article content based on the articleId
  const articleTitle = decodeURIComponent(articleId).replace(/-/g, ' ');

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
          <Link to="/support" className="text-gray-700 font-medium text-sm hover:text-gray-900">Support Center</Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 md:p-12">
          {/* Article Header */}
          <div className="mb-8 border-b border-gray-100 pb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4 capitalize">{articleTitle}</h1>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> 3 min read</span>
              <span className="flex items-center gap-1"><Eye className="w-4 h-4" /> 12k views</span>
              <span className="bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full font-medium text-xs">Help Article</span>
            </div>
          </div>

          {/* Article Body (Placeholder) */}
          <div className="prose prose-blue max-w-none text-gray-700">
            <p className="text-lg mb-6">
              This is a placeholder page for the article: <strong>{articleTitle}</strong>.
            </p>
            <p className="mb-4">
              In a fully implemented system, this page would fetch the actual content from a CMS or database. 
              The content would include detailed instructions, screenshots, and troubleshooting steps related to the topic.
            </p>
            <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4">Step-by-Step Guide</h3>
            <ol className="list-decimal pl-5 space-y-3 mb-8">
              <li>Log in to your IntellMeet account.</li>
              <li>Navigate to the relevant section in your dashboard.</li>
              <li>Follow the specific instructions for <em>{articleTitle}</em>.</li>
              <li>Save your changes or confirm the action.</li>
            </ol>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg mb-8">
              <p className="text-blue-800 text-sm font-medium">
                <strong>Note:</strong> If you are still experiencing issues, please make sure your app is updated to the latest version.
              </p>
            </div>
          </div>

          {/* Article Footer / Feedback */}
          <div className="mt-12 pt-8 border-t border-gray-100 flex flex-col items-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Was this article helpful?</h3>
            <div className="flex items-center gap-4">
              <button className="flex items-center gap-2 px-6 py-2.5 rounded-full border border-gray-200 text-gray-600 hover:border-green-400 hover:text-green-600 hover:bg-green-50 transition-colors">
                <ThumbsUp className="w-5 h-5" /> Yes
              </button>
              <button className="flex items-center gap-2 px-6 py-2.5 rounded-full border border-gray-200 text-gray-600 hover:border-red-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                <ThumbsDown className="w-5 h-5" /> No
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-6">
              Still need help? <Link to="/support" className="text-primary-600 hover:underline">Contact our support team</Link>.
            </p>
          </div>
        </div>
      </main>

      {/* Floating Chat Button */}
      <button
        onClick={() => navigate('/support/chat')}
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary-600 hover:bg-primary-700 rounded-full flex items-center justify-center text-white shadow-xl hover:scale-105 transition-all z-50"
      >
        <MessageCircle className="w-6 h-6" />
      </button>
    </div>
  );
}
