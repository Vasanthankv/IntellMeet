import React, { useState } from 'react';
import { Bell, CheckCircle } from 'lucide-react';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Welcome to IntellMeet!', desc: 'Thanks for joining. Start by scheduling your first meeting or exploring AI features.', time: 'Just now', read: false },
    { id: 2, title: 'AI Summary Ready', desc: 'The AI summary for "Weekly Sync" has been generated and saved to your Hub.', time: '2 hours ago', read: false },
    { id: 3, title: 'Pro Trial Activated', desc: 'You have successfully unlocked unlimited meeting durations.', time: '1 day ago', read: true },
    { id: 4, title: 'New Feature: Passkeys', desc: 'You can now sign in without passwords using WebAuthn passkeys.', time: '2 days ago', read: true },
    { id: 5, title: 'Meeting Reminder', desc: 'Your scheduled meeting "Design Review" starts in 15 minutes.', time: '3 days ago', read: true }
  ]);

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const markAsRead = (id) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="max-w-4xl mx-auto py-10 px-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Bell className="w-6 h-6 text-blue-600" />
            Notifications
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {unreadCount} New
              </span>
            )}
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage all your account and meeting alerts here.</p>
        </div>
        {unreadCount > 0 && (
          <button 
            onClick={markAllAsRead}
            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 font-semibold text-sm rounded-lg transition-colors"
          >
            <CheckCircle className="w-4 h-4" />
            Mark all as read
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {notifications.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No notifications to display.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map(notif => (
              <div 
                key={notif.id}
                onClick={() => markAsRead(notif.id)}
                className={`p-6 flex gap-4 transition-colors cursor-pointer hover:bg-gray-50 ${notif.read ? 'opacity-70' : 'bg-blue-50/30'}`}
              >
                <div className="mt-1">
                  <div className={`w-3 h-3 rounded-full ${notif.read ? 'bg-gray-300' : 'bg-blue-600'}`}></div>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h3 className={`font-semibold ${notif.read ? 'text-gray-700' : 'text-gray-900'}`}>{notif.title}</h3>
                    <span className="text-xs text-gray-400 font-medium">{notif.time}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1 leading-relaxed">{notif.desc}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
