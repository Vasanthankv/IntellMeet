import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, Users, ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';
import MeetingStatusBadge from './MeetingStatusBadge';

export default function MeetingCard({ meeting }) {
  const navigate = useNavigate();

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-lg font-semibold text-gray-900 truncate pr-4">{meeting.title}</h3>
        <MeetingStatusBadge status={meeting.status} />
      </div>
      
      <p className="text-sm text-gray-500 line-clamp-2 mb-4 h-10">
        {meeting.description}
      </p>
      
      <div className="grid grid-cols-2 gap-3 mb-4 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span>{meeting.date}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-400" />
          <span>{meeting.time} {meeting.duration ? `(${meeting.duration})` : ''}</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-4">
        <div className="flex items-center gap-1.5 text-sm text-gray-500">
          <Users className="w-4 h-4" />
          <span>{(meeting.participants || []).length}</span>
          
          <div className="flex -space-x-2 ml-2">
            {(meeting.participants || []).slice(0, 3).map(p => (
              <img key={p._id || p.id || p.name} src={p.avatar} alt={p.name} className="w-6 h-6 rounded-full border-2 border-white" title={p.name} />
            ))}
            {(meeting.participants || []).length > 3 && (
              <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[10px] font-medium text-gray-600">
                +{(meeting.participants || []).length - 3}
              </div>
            )}
          </div>
        </div>

        <Button 
          variant={meeting.status === 'Live' ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            const meetingTargetId = meeting.meetingId ? meeting.meetingId.replace(/\s/g, '') : (meeting._id || meeting.id);
            navigate(`/meetings/${meetingTargetId}`);
          }}
        >
          Details <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
