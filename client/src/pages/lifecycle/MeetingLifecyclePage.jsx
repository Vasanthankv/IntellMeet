import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import MeetingLifecycleHub from '../../components/lifecycle/MeetingLifecycleHub';

const API_BASE = import.meta.env.VITE_API_BASE_URL || `${(typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1" ? "https://intellmeet-backend-h3md.onrender.com" : "http://localhost:5000")}/api`;

export default function MeetingLifecyclePage() {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMeeting = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE}/meetings/${meetingId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        if (data.success) {
          setMeeting(data.meeting);
        }
      } catch (err) {
        console.error('Error fetching meeting:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMeeting();
  }, [meetingId]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-8 space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(`/meetings/${meetingId}`)}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Meeting Details
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-20 text-slate-500">
          <RefreshCw className="w-6 h-6 animate-spin text-indigo-500 mr-3" />
          Loading Lifecycle Workspace...
        </div>
      ) : (
        <MeetingLifecycleHub meetingId={meetingId} initialMeeting={meeting} />
      )}
    </div>
  );
}
