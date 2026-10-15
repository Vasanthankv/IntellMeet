import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, AlignLeft, Bot, Activity, Layers } from 'lucide-react';
import { meetingService } from '../../services/meetingService';

export default function AITemplateLayout() {
  const { meetingId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState(null);

  useEffect(() => {
    meetingService.getMeetingById(meetingId)
      .then(setMeeting)
      .catch(() => {
        setMeeting({ title: `Meeting Session ${meetingId}`, date: new Date().toLocaleDateString() });
      });
  }, [meetingId]);

  if (!meeting) return <div className="p-8 text-center text-gray-500">Loading AI Intelligence...</div>;

  const tabs = [
    { name: 'Summary & Insights', path: `/meetings/${meetingId}/summary`, icon: Activity },
    { name: 'Full Transcript', path: `/meetings/${meetingId}/transcript`, icon: AlignLeft },
    { name: 'My Notes', path: `/meetings/${meetingId}/notes`, icon: FileText },
    { name: 'AI Recording Pipeline', path: `/meetings/${meetingId}/pipeline`, icon: Layers },
  ];

  return (
    <div className="max-w-6xl mx-auto flex flex-col h-full">
      <div className="mb-6">
        <button 
          onClick={() => navigate(`/meetings/${meetingId}`)}
          className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Meeting Details
        </button>
        
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-indigo-100 rounded-lg text-indigo-700">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI Intelligence</h1>
            <p className="text-sm text-gray-500">Generated for: {meeting.title} ({meeting.date})</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-t-xl border border-gray-200 border-b-0 px-4 flex gap-6 mt-4">
        {tabs.map(tab => {
          const isActive = location.pathname === tab.path;
          return (
            <Link
              key={tab.name}
              to={tab.path}
              className={`flex items-center gap-2 py-4 px-2 border-b-2 text-sm font-medium transition-colors ${
                isActive 
                  ? 'border-indigo-600 text-indigo-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.name}
            </Link>
          );
        })}
      </div>
      
      <div className="flex-1 bg-white border border-gray-200 rounded-b-xl rounded-tr-xl p-6 shadow-sm">
        <Outlet />
      </div>
    </div>
  );
}
