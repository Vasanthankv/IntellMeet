import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Shield,
  FileText,
  Lock,
  Sparkles,
  HelpCircle,
  ExternalLink,
  CheckCircle2,
  MessageCircle,
} from 'lucide-react';

export default function GenericInfoPage() {
  const { pageId } = useParams();
  const navigate = useNavigate();

  const slug = (pageId || '').toLowerCase().trim();
  const title = decodeURIComponent(pageId || '')
    .replace(/-/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  // Content configuration based on route category
  const isTerms = slug.includes('terms') || slug.includes('legal');
  const isPrivacy = slug.includes('privacy');
  const isTrust = slug.includes('trust') || slug.includes('security');
  const isProduct = slug.includes('product') || slug.includes('ai') || slug.includes('note') || slug.includes('phone') || slug.includes('chat') || slug.includes('intellmate');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900 selection:bg-blue-100 selection:text-blue-900">
      {/* Header */}
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0 sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="w-px h-5 bg-gray-200" />
          <Link to="/" className="text-blue-600 font-extrabold text-xl tracking-tight">
            IntellMeet
          </Link>
          <span className="text-gray-400 font-light text-base hidden sm:inline">/</span>
          <span className="text-gray-600 text-sm font-medium hidden sm:inline">{title}</span>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <Link to="/info/solutions" className="text-gray-600 hover:text-blue-600 font-medium hidden md:inline">
            Solutions
          </Link>
          <Link to="/support" className="text-gray-600 hover:text-blue-600 font-medium">
            Support
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 sm:p-12">
          {/* Badge & Title */}
          <div className="mb-8 border-b border-gray-100 pb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-4">
              {isTerms && <FileText className="w-3.5 h-3.5" />}
              {isPrivacy && <Lock className="w-3.5 h-3.5" />}
              {isTrust && <Shield className="w-3.5 h-3.5" />}
              {isProduct && <Sparkles className="w-3.5 h-3.5" />}
              {!isTerms && !isPrivacy && !isTrust && !isProduct && <HelpCircle className="w-3.5 h-3.5" />}
              IntellMeet Documentation &amp; Information
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mb-3">
              {title}
            </h1>
            <p className="text-sm text-gray-500">
              Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
          </div>

          {/* Body Content by Category */}
          <div className="space-y-6 text-gray-700 text-sm sm:text-base leading-relaxed">
            {isTerms && (
              <>
                <p>
                  Welcome to IntelliMeet. By accessing or using our video conferencing, real-time collaboration, and AI-powered meeting services, you agree to comply with and be bound by the following Terms of Service.
                </p>

                <h3 className="text-lg font-bold text-gray-900 pt-4">1. Authorized Platform Use</h3>
                <p>
                  IntelliMeet provides peer-to-peer WebRTC video, screen sharing, audio communication, digital whiteboard tools, and automated meeting summarization. You agree not to misuse the platform to transmit unlawful material, violate intellectual property rights, or disrupt communication services for other users.
                </p>

                <h3 className="text-lg font-bold text-gray-900 pt-4">2. Meeting Security &amp; Access Controls</h3>
                <p>
                  Meeting organizers ("Hosts") are responsible for managing meeting participant access, configuring meeting passcodes, and admitting attendees. Attendees must respect host moderation controls, including microphone and camera permissions.
                </p>

                <h3 className="text-lg font-bold text-gray-900 pt-4">3. AI Processing &amp; Transcripts</h3>
                <p>
                  When enabled by meeting participants, meeting audio transcripts are processed through Google Gemini AI models strictly to generate structured summaries, key takeaways, and action items. AI outputs are delivered directly to your account dashboard and are not used to train public foundation models without explicit consent.
                </p>

                <h3 className="text-lg font-bold text-gray-900 pt-4">4. Account Responsibility</h3>
                <p>
                  You are responsible for maintaining the confidentiality of your credentials and tokens. If you suspect unauthorized access to your meeting account, please contact our support team immediately.
                </p>
              </>
            )}

            {isPrivacy && (
              <>
                <p>
                  IntelliMeet values your privacy and is dedicated to protecting your personal information and meeting data through robust security architecture and transparent data practices.
                </p>

                <h3 className="text-lg font-bold text-gray-900 pt-4">1. Data We Collect</h3>
                <p>
                  We collect account registration data (name, email address, password hash via bcrypt), meeting metadata (meeting titles, scheduled times, participant counts), and meeting outcomes that you explicitly save (summaries, action items, whiteboard canvases).
                </p>

                <h3 className="text-lg font-bold text-gray-900 pt-4">2. Real-Time Media Transmission</h3>
                <p>
                  Video, audio, and screen sharing streams are transmitted using WebRTC with direct peer-to-peer mesh encryption (DTLS/SRTP). Your live media streams are not recorded or inspected on our servers unless meeting recording is initiated by the host.
                </p>

                <h3 className="text-lg font-bold text-gray-900 pt-4">3. Data Retention &amp; Storage</h3>
                <p>
                  Saved meeting data, transcripts, and account settings reside securely on encrypted MongoDB Atlas database clusters with TLS in transit and encryption at rest.
                </p>

                <h3 className="text-lg font-bold text-gray-900 pt-4">4. Your Data Rights</h3>
                <p>
                  You have the right to inspect, download, or delete your saved meeting records and transcripts at any time from your account settings.
                </p>
              </>
            )}

            {isTrust && (
              <>
                <p>
                  IntelliMeet is architected with modern defense-in-depth principles to ensure reliable uptime, end-to-end transport encryption, and granular meeting access control.
                </p>

                <h3 className="text-lg font-bold text-gray-900 pt-4">Infrastructure &amp; Security Highlights</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    <strong>WebRTC DTLS/SRTP:</strong> Direct browser-to-browser media encryption protecting video and audio streams.
                  </li>
                  <li>
                    <strong>Transport Layer Security:</strong> All API and WebSocket signaling traffic is secured using TLS 1.3 / HTTPS / WSS.
                  </li>
                  <li>
                    <strong>Role-Based Host Governance:</strong> Hosts can mute participants, lock screen sharing, require passcodes, and control entry through waiting rooms.
                  </li>
                  <li>
                    <strong>Encrypted Database:</strong> Persistent data is hosted on dedicated MongoDB Atlas clusters with automated encrypted backups.
                  </li>
                </ul>
              </>
            )}

            {isProduct && (
              <>
                <p>
                  IntelliMeet provides an integrated suite of real-time communication tools designed to streamline meetings and eliminate post-meeting busywork.
                </p>

                <h3 className="text-lg font-bold text-gray-900 pt-4">Explore Related IntelliMeet Capabilities</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <Link
                    to="/info/solutions"
                    className="p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-colors block"
                  >
                    <h4 className="font-bold text-gray-900 mb-1 flex items-center justify-between">
                      Solutions Overview
                      <ExternalLink className="w-4 h-4 text-blue-600" />
                    </h4>
                    <p className="text-xs text-gray-600">
                      Explore purpose-built solutions for business, remote teams, education, and clients.
                    </p>
                  </Link>

                  <Link
                    to="/info/ai"
                    className="p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-colors block"
                  >
                    <h4 className="font-bold text-gray-900 mb-1 flex items-center justify-between">
                      AI Companion
                      <ExternalLink className="w-4 h-4 text-blue-600" />
                    </h4>
                    <p className="text-xs text-gray-600">
                      Learn how Gemini AI generates summaries and extracts actionable tasks.
                    </p>
                  </Link>
                </div>
              </>
            )}

            {!isTerms && !isPrivacy && !isTrust && !isProduct && (
              <>
                <p>
                  Information, guidelines, and specifications regarding <strong>{title}</strong> within the IntelliMeet platform.
                </p>
                <p>
                  IntelliMeet integrates high-definition video conferencing, real-time screen sharing, interactive digital whiteboards, and native Google Gemini AI processing to make meetings productive and actionable.
                </p>
              </>
            )}
          </div>

          {/* Action Row */}
          <div className="mt-10 pt-8 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <Link
              to="/info/solutions"
              className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Solutions
            </Link>

            <div className="flex items-center gap-3">
              <Link
                to="/info/contact-sales"
                className="px-5 py-2.5 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-semibold transition-colors"
              >
                Contact Sales
              </Link>
              <Link
                to="/support"
                className="px-5 py-2.5 rounded-full bg-blue-600 text-white hover:bg-blue-700 text-sm font-semibold transition-colors"
              >
                Support Center
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Floating Chat Button */}
      <button
        onClick={() => navigate('/support/chat')}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center text-white shadow-xl hover:scale-105 transition-all z-50"
        title="Open Support Chat"
      >
        <MessageCircle className="w-6 h-6" />
      </button>
    </div>
  );
}
