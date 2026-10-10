import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, MessageCircle } from 'lucide-react';

export default function GenericInfoPage() {
  const { pageId } = useParams();
  const navigate = useNavigate();

  const title = decodeURIComponent(pageId)
    .replace(/-/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans h-screen">
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0 z-20">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="w-px h-5 bg-gray-200" />
          <Link to="/" className="text-primary-600 font-bold text-xl tracking-tight">IntellMeet</Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center overflow-y-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-10 max-w-2xl w-full">
          <div className="w-16 h-16 bg-primary-50 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <ArrowRight className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{title}</h1>
          <p className="text-gray-600 mb-8 leading-relaxed">
            This is a placeholder page for <strong>{title}</strong>. In a complete implementation, this page would contain the full detailed information for this topic, such as integration details, company information, legal documents, or downloadable assets.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={() => navigate(-1)} className="px-6 py-2.5 rounded-full border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors">
              Go Back
            </button>
            <Link to="/support" className="px-6 py-2.5 rounded-full bg-primary-600 text-white font-medium hover:bg-primary-700 transition-colors">
              Visit Support Center
            </Link>
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
