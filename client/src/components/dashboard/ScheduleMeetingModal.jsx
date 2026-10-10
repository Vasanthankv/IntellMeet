import React, { useState } from 'react';
import { X, Calendar, Clock, Video, Users, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ScheduleMeetingModal({ isOpen, onClose, onMeetingCreated }) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('Today');
  const [time, setTime] = useState('10:00 AM');
  const [duration, setDuration] = useState('45 mins');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Please enter a meeting title');
      return;
    }

    try {
      setIsLoading(true);
      await onMeetingCreated({
        title,
        date,
        time,
        duration,
      });
      setTitle('');
      onClose();
    } catch (error) {
      toast.error(error.message || 'Failed to schedule meeting');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-primary-50 text-primary-600 rounded-xl">
            <Video className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Schedule New Meeting</h3>
            <p className="text-xs text-gray-500">Set up a session and invite your team</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Meeting Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Q3 Strategic Planning Sync"
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Date</label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <select
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="Today">Today</option>
                  <option value="Tomorrow">Tomorrow</option>
                  <option value="Next Monday">Next Monday</option>
                  <option value="Custom Date">Custom Date</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Time</label>
              <div className="relative">
                <Clock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <select
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="09:00 AM">09:00 AM</option>
                  <option value="10:00 AM">10:00 AM</option>
                  <option value="11:30 AM">11:30 AM</option>
                  <option value="02:00 PM">02:00 PM</option>
                  <option value="04:30 PM">04:30 PM</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Expected Duration</label>
            <div className="grid grid-cols-3 gap-2">
              {['30 mins', '45 mins', '60 mins'].map((dur) => (
                <button
                  type="button"
                  key={dur}
                  onClick={() => setDuration(dur)}
                  className={`py-2 text-xs font-semibold rounded-lg border transition-all ${
                    duration === dur
                      ? 'bg-primary-600 border-primary-600 text-white shadow-sm'
                      : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {dur}
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 bg-gradient-to-r from-primary-50 to-indigo-50 rounded-xl border border-primary-100 flex items-center gap-2 text-xs text-primary-800">
            <Sparkles className="w-4 h-4 text-primary-600 shrink-0" />
            <span>AI Assistant will automatically generate meeting summary & action items.</span>
          </div>

          <div className="pt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-xs font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 bg-primary-600 text-white rounded-xl text-xs font-semibold hover:bg-primary-700 shadow-sm transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Creating...' : 'Schedule Meeting'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
