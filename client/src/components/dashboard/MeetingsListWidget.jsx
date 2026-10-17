import React from 'react';
import { Calendar, Users, ChevronRight, Video, Plus, Clock, ExternalLink } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function MeetingsListWidget({ upcoming = [], isLoading = false, onOpenScheduleModal }) {
  const navigate = useNavigate();

  const formatMeetingDate = (dateVal) => {
    if (!dateVal || dateVal === 'Today') return 'Today';
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return dateVal;
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch (e) {
      return dateVal;
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          Upcoming Meetings
        </h3>
        <Link 
          to="/meetings" 
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center transition-colors"
        >
          View All <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
        </Link>
      </div>
      
      <div className="space-y-3 flex-1">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 animate-pulse flex items-center justify-between">
                <div className="flex items-center gap-3.5 flex-1 pr-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-xl shrink-0"></div>
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
                <div className="w-24 h-8 bg-gray-200 rounded-xl shrink-0"></div>
              </div>
            ))}
          </div>
        ) : upcoming.length === 0 ? (
          <div className="text-center py-10 px-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <Video className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-gray-800">No Upcoming Meetings</h4>
            <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
              You don't have any upcoming meetings scheduled right now. Schedule one now to start collaborating!
            </p>
            <button
              onClick={() => onOpenScheduleModal ? onOpenScheduleModal() : navigate('/meetings/schedule')}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Schedule a Meeting
            </button>
          </div>
        ) : (
          upcoming.map((meeting) => {
            const cleanRoomId = meeting.meetingId ? meeting.meetingId.replace(/[\s-]/g, '') : (meeting._id || meeting.id || 'room');
            const displayDate = formatMeetingDate(meeting.date);

            return (
              <div
                key={meeting.id || meeting.meetingId}
                className="flex items-center justify-between p-4 bg-gray-50 hover:bg-white rounded-2xl transition-all border border-gray-100 hover:border-blue-200 hover:shadow-md group"
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1 pr-2">
                  <div className="w-12 h-12 bg-blue-50 text-blue-700 rounded-xl flex flex-col items-center justify-center font-bold text-xs shrink-0 border border-blue-100">
                    <span className="text-[10px] uppercase font-bold text-blue-500">
                      {displayDate === 'Today' ? 'TDY' : 'MTG'}
                    </span>
                    <span className="text-[11px] leading-tight font-extrabold">{displayDate}</span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <button
                      onClick={() => navigate(`/meetings/${cleanRoomId}`)}
                      className="text-left font-bold text-gray-900 hover:text-blue-600 transition-colors truncate block max-w-full text-sm cursor-pointer"
                      title={meeting.title}
                    >
                      {meeting.title}
                    </button>
                    
                    <div className="mt-1 flex items-center flex-wrap text-xs text-gray-500 gap-x-3 gap-y-1">
                      <span className="flex items-center text-gray-600 font-medium">
                        <Clock className="w-3 h-3 mr-1 text-gray-400" /> 
                        {meeting.time || '10:00 AM'}
                      </span>
                      <span className="flex items-center text-gray-600">
                        <Users className="w-3 h-3 mr-1 text-gray-400" /> 
                        {meeting.attendees || 1} participant{meeting.attendees === 1 ? '' : 's'}
                      </span>
                      <span className="bg-gray-200/70 text-gray-700 px-1.5 py-0.5 rounded font-mono text-[10px]">
                        ID: {meeting.meetingId || cleanRoomId}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Explicit, Prominent Join Meeting Button */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => navigate(`/meetings/${cleanRoomId}/room`)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/20 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer hover:scale-[1.02]"
                    title={`Join meeting: ${meeting.title}`}
                  >
                    <Video className="w-3.5 h-3.5" />
                    Join Meeting
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
