import React from 'react';
import { Calendar, Users, ChevronRight, Video, Plus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function MeetingsListWidget({ upcoming = [], onOpenScheduleModal }) {
  const navigate = useNavigate();

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary-600" />
          Upcoming Meetings
        </h3>
        <Link to="/meetings" className="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center">
          View All <ChevronRight className="w-4 h-4 ml-1" />
        </Link>
      </div>
      
      <div className="space-y-3 flex-1">
        {upcoming.length === 0 ? (
          <div className="text-center py-10 px-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <Video className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-gray-800">No Upcoming Meetings</h4>
            <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
              You haven't scheduled any upcoming meetings yet. Create one now to start collaborating!
            </p>
            <button
              onClick={() => navigate('/meetings/schedule')}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-primary-600 text-white rounded-xl text-xs font-semibold hover:bg-primary-700 shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              Schedule a Meeting
            </button>
          </div>
        ) : (
          upcoming.map((meeting) => (
            <div
              key={meeting.id || meeting.meetingId}
              className="flex items-center justify-between p-3.5 bg-gray-50 hover:bg-white rounded-xl transition-all border border-gray-100 hover:border-primary-200 hover:shadow-sm"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 bg-primary-100 text-primary-700 rounded-xl flex flex-col items-center justify-center font-bold text-xs shrink-0">
                  <span className="text-[10px] uppercase font-semibold text-primary-500">MTG</span>
                  <span>{meeting.date === 'Today' ? 'TDY' : 'CAL'}</span>
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-semibold text-gray-900 truncate">{meeting.title}</h4>
                  <div className="mt-0.5 flex items-center flex-wrap text-xs text-gray-500 gap-3">
                    <span className="flex items-center"><Calendar className="w-3 h-3 mr-1 text-gray-400" /> {meeting.time || '10:00 AM'}</span>
                    <span className="flex items-center"><Users className="w-3 h-3 mr-1 text-gray-400" /> {meeting.attendees || 1} attendee</span>
                    <span className="flex items-center bg-gray-200 px-1.5 py-0.5 rounded font-mono text-[10px] text-gray-700">
                      ID: {meeting.meetingId || meeting.id || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  const targetRoomId = meeting.meetingId ? meeting.meetingId.replace(/\s/g, '') : (meeting._id || meeting.id || 'room');
                  navigate(`/meetings/${targetRoomId}/room`);
                }}
                className="ml-3 px-4 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors shrink-0"
              >
                Join
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
