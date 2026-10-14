import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import AuthLayout from './layouts/AuthLayout';
import AppLayout from './layouts/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/common/ErrorBoundary';

// Lazy-loaded pages for code splitting & fast initial page load
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const GenericModulePage = lazy(() => import('./pages/modules/GenericModulePage'));
const MeetingsIndex = lazy(() => import('./pages/meetings/MeetingsIndex'));
const ScheduleMeeting = lazy(() => import('./pages/meetings/ScheduleMeeting'));
const MeetingDetails = lazy(() => import('./pages/meetings/MeetingDetails'));
const MeetingRoom = lazy(() => import('./pages/meeting-room/MeetingRoom'));
const HomePage = lazy(() => import('./pages/public/HomePage'));
const JoinMeeting = lazy(() => import('./pages/public/JoinMeeting'));
const SupportPage = lazy(() => import('./pages/public/SupportPage'));
const SupportTopicPage = lazy(() => import('./pages/public/SupportTopicPage'));
const SupportArticlePage = lazy(() => import('./pages/public/SupportArticlePage'));
const SupportChatPage = lazy(() => import('./pages/public/SupportChatPage'));
const GenericInfoPage = lazy(() => import('./pages/public/GenericInfoPage'));
const PricingPage = lazy(() => import('./pages/public/PricingPage'));
const AiPage = lazy(() => import('./pages/public/AiPage'));
const ProfilePage = lazy(() => import('./pages/public/ProfilePage'));
const SettingsPage = lazy(() => import('./pages/settings/SettingsPage'));
const AdminCenterPage = lazy(() => import('./pages/admin/AdminCenterPage'));
const PasskeysPage = lazy(() => import('./pages/public/PasskeysPage'));
const NotificationsPage = lazy(() => import('./pages/public/NotificationsPage'));
const TasksPage = lazy(() => import('./pages/modules/TasksPage'));
const MeetingRegistrationPage = lazy(() => import('./pages/public/MeetingRegistrationPage'));
const AITemplateLayout = lazy(() => import('./pages/ai/AITemplateLayout'));
const AISummaryPage = lazy(() => import('./pages/ai/AISummaryPage'));
const AITranscriptPage = lazy(() => import('./pages/ai/AITranscriptPage'));
const AINotesPage = lazy(() => import('./pages/ai/AINotesPage'));
const AIRecordingPipelinePage = lazy(() => import('./pages/ai/AIRecordingPipelinePage'));
const WhiteboardDashboard = lazy(() => import('./pages/whiteboard/WhiteboardDashboard'));
const RecordingsPage = lazy(() => import('./pages/recordings/RecordingsPage'));
const PublicRecordingView = lazy(() => import('./pages/public/PublicRecordingView'));
const IntegrationsMarketplacePage = lazy(() => import('./pages/integrations/IntegrationsMarketplacePage'));
const MeetingLifecyclePage = lazy(() => import('./pages/lifecycle/MeetingLifecyclePage'));

function PageFallback() {
  return (
    <div className="min-h-screen bg-[#141414] flex flex-col items-center justify-center text-white">
      <div className="w-10 h-10 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-3"></div>
      <p className="text-xs text-gray-400 font-medium tracking-wide">Loading IntelliMeet...</p>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Suspense fallback={<PageFallback />}>
        <Routes>
          {/* Public Meeting & Support Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/join" element={<JoinMeeting />} />
          <Route path="/meeting/:meetingId" element={<JoinMeeting />} />
          <Route path="/meetings/:meetingId/prejoin" element={<JoinMeeting />} />
          <Route path="/meetings/:meetingId/room" element={<MeetingRoom />} />
          <Route path="/meeting/:meetingId/room" element={<MeetingRoom />} />
          <Route path="/meeting/register/:meetingId" element={<MeetingRegistrationPage />} />
          <Route path="/support" element={<SupportPage />} />
          <Route path="/support/profile" element={<ProfilePage />} />
          <Route path="/support/chat" element={<SupportChatPage />} />
          <Route path="/support/:topicSlug" element={<SupportTopicPage />} />
          <Route path="/support/article/:articleId" element={<SupportArticlePage />} />
          <Route path="/info/pricing" element={<PricingPage />} />
          <Route path="/info/ai" element={<AiPage />} />
          <Route path="/info/:pageId" element={<GenericInfoPage />} />
          <Route path="/recordings/share/:shareToken" element={<PublicRecordingView />} />
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
          </Route>

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            {/* Full Screen Routes */}
            <Route path="/whiteboards" element={<WhiteboardDashboard />} />
            <Route path="/whiteboards/:whiteboardId" element={<WhiteboardDashboard />} />
            
            {/* Standard Dashboard Layout Routes */}
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/settings/passkeys" element={<PasskeysPage />} />
              <Route path="/integrations" element={<IntegrationsMarketplacePage />} />
              <Route path="/marketplace" element={<IntegrationsMarketplacePage />} />
              <Route path="/admin" element={<AdminCenterPage />} />
              <Route path="/admin/*" element={<AdminCenterPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/tasks" element={<TasksPage />} />
              <Route path="/recordings" element={<RecordingsPage />} />
              <Route path="/modules/recordings" element={<RecordingsPage />} />
              <Route path="/modules/:type" element={<GenericModulePage />} />
              <Route path="/meetings" element={<MeetingsIndex />} />
              <Route path="/meetings/schedule" element={<ScheduleMeeting />} />
              <Route path="/meetings/:meetingId" element={<MeetingDetails />} />
              <Route path="/meetings/:meetingId/lifecycle" element={<MeetingLifecyclePage />} />
              
              {/* AI Intelligence Routes */}
              <Route element={<AITemplateLayout />}>
                <Route path="/meetings/:meetingId/summary" element={<AISummaryPage />} />
                <Route path="/meetings/:meetingId/transcript" element={<AITranscriptPage />} />
                <Route path="/meetings/:meetingId/notes" element={<AINotesPage />} />
                <Route path="/meetings/:meetingId/pipeline" element={<AIRecordingPipelinePage />} />
              </Route>
            </Route>
          </Route>

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
      </BrowserRouter>
      <Toaster position="top-right" />
    </ErrorBoundary>
  );
}

export default App;
