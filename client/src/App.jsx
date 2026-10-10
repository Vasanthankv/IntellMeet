import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import AuthLayout from './layouts/AuthLayout';
import AppLayout from './layouts/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import Dashboard from './pages/Dashboard';
import GenericModulePage from './pages/modules/GenericModulePage';
import MeetingsIndex from './pages/meetings/MeetingsIndex';
import ScheduleMeeting from './pages/meetings/ScheduleMeeting';
import MeetingDetails from './pages/meetings/MeetingDetails';
import MeetingRoom from './pages/meeting-room/MeetingRoom';
import HomePage from './pages/public/HomePage';
import JoinMeeting from './pages/public/JoinMeeting';
import SupportPage from './pages/public/SupportPage';
import SupportTopicPage from './pages/public/SupportTopicPage';
import SupportArticlePage from './pages/public/SupportArticlePage';
import SupportChatPage from './pages/public/SupportChatPage';
import GenericInfoPage from './pages/public/GenericInfoPage';
import PricingPage from './pages/public/PricingPage';
import AiPage from './pages/public/AiPage';
import ProfilePage from './pages/public/ProfilePage';
import SettingsPage from './pages/settings/SettingsPage';
import AdminCenterPage from './pages/admin/AdminCenterPage';
import PasskeysPage from './pages/public/PasskeysPage';
import NotificationsPage from './pages/public/NotificationsPage';
import TasksPage from './pages/modules/TasksPage';
import MeetingRegistrationPage from './pages/public/MeetingRegistrationPage';
import AITemplateLayout from './pages/ai/AITemplateLayout';
import AISummaryPage from './pages/ai/AISummaryPage';
import AITranscriptPage from './pages/ai/AITranscriptPage';
import AINotesPage from './pages/ai/AINotesPage';
import AIRecordingPipelinePage from './pages/ai/AIRecordingPipelinePage';
import WhiteboardDashboard from './pages/whiteboard/WhiteboardDashboard';
import RecordingsPage from './pages/recordings/RecordingsPage';
import PublicRecordingView from './pages/public/PublicRecordingView';
import IntegrationsMarketplacePage from './pages/integrations/IntegrationsMarketplacePage';
import MeetingLifecyclePage from './pages/lifecycle/MeetingLifecyclePage';
import ErrorBoundary from './components/common/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/join" element={<JoinMeeting />} />
          <Route path="/meetings/:meetingId/prejoin" element={<JoinMeeting />} />
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
            <Route path="/meetings/:meetingId/room" element={<MeetingRoom />} />
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
      </BrowserRouter>
      <Toaster position="top-right" />
    </ErrorBoundary>
  );
}

export default App;
