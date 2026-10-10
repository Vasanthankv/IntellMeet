import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Calendar } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import MeetingCard from '../../components/meetings/MeetingCard';
import { useMeetingStore } from '../../store/meetingStore';

export default function MeetingsIndex() {
  const { meetings, fetchMeetings, isLoading } = useMeetingStore();
  const [activeTab, setActiveTab] = useState('upcoming');
  const navigate = useNavigate();

  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  const filteredMeetings = (meetings || []).filter(m => {
    const s = (m.status || 'scheduled').toLowerCase();
    if (activeTab === 'upcoming') {
      return !['completed', 'cancelled', 'archived'].includes(s);
    }
    return ['completed', 'cancelled', 'archived'].includes(s);
  });

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meetings</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your schedule and access past recordings.</p>
        </div>
        <Button className="shrink-0" onClick={() => navigate('/meetings/schedule')}>
          <Plus className="w-4 h-4 mr-2" />
          Schedule Meeting
        </Button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-1 flex w-fit mb-6 shadow-sm">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'upcoming' ? 'bg-primary-50 text-primary-700' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Upcoming & Live
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'history' ? 'bg-primary-50 text-primary-700' : 'text-gray-500 hover:text-gray-700'}`}
        >
          History
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1,2,3].map(i => (
            <div key={i} className="h-48 bg-gray-100 animate-pulse rounded-xl"></div>
          ))}
        </div>
      ) : filteredMeetings.length === 0 ? (
        <div className="text-center py-20 bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 text-gray-400 mb-4">
            <Calendar className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">No meetings found</h3>
          <p className="text-sm text-gray-500 mt-1">You don't have any {activeTab} meetings right now.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredMeetings.map(meeting => (
            <MeetingCard key={meeting.meetingId || meeting._id || meeting.id} meeting={meeting} />
          ))}
        </div>
      )}
    </div>
  );
}
