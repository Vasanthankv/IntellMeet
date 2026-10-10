import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, Video, Calendar, Clock, Users, Shield, Copy, Check, 
  Trash2, Globe, FileText, BarChart2, Mic, Lock, Share2, Mail, 
  CalendarPlus, UserPlus, ExternalLink, Send, Download, UserCheck, UserX, AlertCircle, Sparkles,
  MessageSquare, Paperclip, Pin, Image as ImageIcon, Layers
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';
import ContinuousMeetingChat from '../../components/chat/ContinuousMeetingChat';
import MeetingPrepWorkspace from '../../components/meetings/MeetingPrepWorkspace';
import AddToCalendarDropdown from '../../components/integrations/AddToCalendarDropdown';
import ExportSummaryIntegrationModal from '../../components/integrations/ExportSummaryIntegrationModal';
import MeetingLifecycleHub from '../../components/lifecycle/MeetingLifecycleHub';

export default function MeetingDetails() {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);
  
  // Contacts modal state
  const [showContactsModal, setShowContactsModal] = useState(false);
  const [orgContacts, setOrgContacts] = useState([]);
  const [selectedContacts, setSelectedContacts] = useState([]);

  // Registrants state (Part 4)
  const [registrations, setRegistrations] = useState([]);
  const [loadingRegs, setLoadingRegs] = useState(false);
  const [copiedRegLink, setCopiedRegLink] = useState(false);
  const [regFilter, setRegFilter] = useState('all');
  const [showExportIntegrationModal, setShowExportIntegrationModal] = useState(false);
  const [detailsWorkspaceTab, setDetailsWorkspaceTab] = useState('lifecycle');

  const { user } = useAuthStore();

  useEffect(() => {
    const fetchMeeting = async () => {
      try {
        const token = localStorage.getItem('intellmeet_token') || localStorage.getItem('token');
        const cleanMeetingId = meetingId ? meetingId.replace(/[\s-]/g, '') : '';
        const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

        const res = await fetch(`http://localhost:5000/api/meetings/${encodeURIComponent(cleanMeetingId || meetingId || '')}`, {
          headers: authHeader
        });
        const data = await res.json();
        if (data.success && data.meeting) {
          setMeeting(data.meeting);
        } else {
          // Fallback search in all meetings
          const listRes = await fetch('http://localhost:5000/api/meetings', {
            headers: authHeader
          });
          const listData = await listRes.json();
          const allMeetings = listData.meetings || [];
          const found = allMeetings.find(m => 
            m.meetingId === meetingId || 
            (m.meetingId && m.meetingId.replace(/[\s-]/g, '') === cleanMeetingId) ||
            m._id === meetingId || 
            m.id === meetingId
          );
          if (found) {
            setMeeting(found);
          } else if ((!meetingId || meetingId === 'undefined') && allMeetings.length > 0) {
            // Auto-recover from invalid URL param by showing the latest meeting
            setMeeting(allMeetings[0]);
          }
        }
      } catch (err) {
        console.error('Failed to load meeting details:', err);
      } finally {
        setLoading(false);
      }
    };

    const fetchContacts = async () => {
      try {
        const token = localStorage.getItem('intellmeet_token') || localStorage.getItem('token');
        const res = await fetch('http://localhost:5000/api/users', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setOrgContacts(data.users || []);
        }
      } catch (err) {
        console.error('Failed to fetch org contacts:', err);
      }
    };

    fetchMeeting();
    fetchContacts();
  }, [meetingId]);

  const formatRegDate = (dateVal) => {
    if (!dateVal) return 'Recently';
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return 'Recently';
      return `${d.toLocaleDateString()} at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } catch (e) {
      return 'Recently';
    }
  };

  const safeLocaleString = (dateVal) => {
    if (!dateVal) return new Date().toLocaleString();
    try {
      const d = new Date(dateVal);
      return isNaN(d.getTime()) ? new Date().toLocaleString() : d.toLocaleString();
    } catch (e) {
      return new Date().toLocaleString();
    }
  };

  const cleanRoomId = meeting?.meetingId ? meeting.meetingId.replace(/\s/g, '') : (meeting?._id || '');
  const joinUrl = `http://localhost:5173/join?meetingId=${cleanRoomId}${meeting?.passcode ? `&pwd=${meeting.passcode}` : ''}`;

  const copyLink = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopiedLink(true);
    toast.success('Meeting link copied to clipboard!');
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const copyFullInvitation = () => {
    if (!meeting) return;
    const text = `IntellMeet Meeting Invitation\n\nTopic: ${meeting.title}\nTime: ${meeting.date} at ${meeting.time} ${meeting.timezone || ''}\n\nJoin IntellMeet Meeting:\n${joinUrl}\n\nMeeting ID: ${meeting.meetingId}\nPasscode: ${meeting.passcode || 'None required'}\n\nOne tap mobile:\n+1 (669) 900-6833,,${cleanRoomId}#`;
    
    navigator.clipboard.writeText(text);
    setCopiedInvite(true);
    toast.success('Complete meeting invitation copied!');
    setTimeout(() => setCopiedInvite(false), 3000);
  };

  const sendEmailInvite = () => {
    if (!meeting) return;
    const subject = encodeURIComponent(`Invitation: ${meeting.title}`);
    const body = encodeURIComponent(
      `Hi,\n\nYou are invited to join an IntellMeet video meeting:\n\nTopic: ${meeting.title}\nTime: ${meeting.date} at ${meeting.time}\n\nJoin Link:\n${joinUrl}\n\nMeeting ID: ${meeting.meetingId}\nPasscode: ${meeting.passcode || 'None required'}\n\nSee you there!`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  const addToCalendar = () => {
    if (!meeting) return;
    // Generate .ics iCalendar file content
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//IntellMeet//Meeting//EN',
      'BEGIN:VEVENT',
      `SUMMARY:${meeting.title}`,
      `DESCRIPTION:Join IntellMeet: ${joinUrl}\\nMeeting ID: ${meeting.meetingId}\\nPasscode: ${meeting.passcode || ''}`,
      `LOCATION:${joinUrl}`,
      `STATUS:CONFIRMED`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${meeting.title.replace(/\s+/g, '_')}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Calendar (.ics) invite downloaded!');
  };

  const handleSendToContacts = () => {
    if (selectedContacts.length === 0) {
      toast.error('Please select at least one contact to invite');
      return;
    }
    toast.success(`Meeting invitation sent to ${selectedContacts.length} contact(s)!`);
    setShowContactsModal(false);
    setSelectedContacts([]);
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this scheduled meeting?')) return;
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:5000/api/meetings/${meeting.meetingId || meeting._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Meeting deleted');
      navigate('/meetings');
    } catch (e) {
      toast.error('Failed to delete meeting');
    }
  };

  // Part 4: Registration Fetching and Actions
  const fetchRegistrations = async () => {
    if (!meeting) return;
    setLoadingRegs(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/meetings/${meeting.meetingId || meeting._id}/registrations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setRegistrations(data.registrations || []);
      }
    } catch (err) {
      console.error('Failed to fetch registrations:', err);
    } finally {
      setLoadingRegs(false);
    }
  };

  useEffect(() => {
    if (meeting?.registration?.required) {
      fetchRegistrations();
    }
  }, [meeting]);

  const regUrl = `http://localhost:5173/meeting/register/${cleanRoomId}`;

  const copyRegLink = () => {
    navigator.clipboard.writeText(regUrl);
    setCopiedRegLink(true);
    toast.success('Registration link copied to clipboard!');
    setTimeout(() => setCopiedRegLink(false), 3000);
  };

  const handleUpdateRegStatus = async (regId, status) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/meetings/${meeting.meetingId || meeting._id}/registrations/${regId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Registrant marked as ${status}`);
        fetchRegistrations();
      } else {
        toast.error(data.message || 'Failed to update status');
      }
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleDeleteReg = async (regId) => {
    if (!window.confirm('Are you sure you want to remove this registration?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/meetings/${meeting.meetingId || meeting._id}/registrations/${regId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Registrant removed');
        fetchRegistrations();
      } else {
        toast.error(data.message || 'Failed to remove registrant');
      }
    } catch (err) {
      toast.error('Failed to delete registrant');
    }
  };

  const exportCSV = () => {
    if (!registrations.length) {
      toast.error('No registrants to export');
      return;
    }
    const headers = ['Registration ID', 'Name', 'Email', 'Organization', 'Status', 'Registered At'];
    const rows = registrations.map(r => [
      `"${r.registrationId || ''}"`,
      `"${r.name || ''}"`,
      `"${r.email || ''}"`,
      `"${r.organization || ''}"`,
      `"${r.status || ''}"`,
      `"${safeLocaleString(r.registeredAt || r.createdAt)}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Registrants_${(meeting.title || 'Meeting').replace(/[^a-zA-Z0-9]/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Registrants exported to CSV');
  };

  if (loading) return <div className="p-12 text-center text-gray-500 font-medium">Loading meeting details...</div>;
  if (!meeting) return (
    <div className="p-12 text-center">
      <p className="text-red-500 font-bold mb-4">Meeting not found</p>
      <Button onClick={() => navigate('/meetings')} variant="outline">Back to Meetings</Button>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6">
      
      {/* Top Breadcrumb */}
      <button 
        onClick={() => navigate('/meetings')}
        className="flex items-center text-xs font-bold text-gray-500 hover:text-blue-600 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Upcoming Meetings
      </button>

      {/* Top Banner Actions */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
              Scheduled
            </span>
            {meeting.recurring && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                Recurring
              </span>
            )}
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{meeting.title}</h1>
          <p className="text-xs text-gray-500 mt-1">{meeting.description || 'No agenda description provided'}</p>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            onClick={() => navigate(`/meetings/${cleanRoomId}/room`)} 
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-7 py-3 rounded-2xl shadow-lg shadow-blue-600/25 flex items-center gap-2"
          >
            <Video className="w-4 h-4" /> Start Meeting
          </Button>
          <button 
            onClick={handleDelete}
            className="p-3 border border-gray-200 rounded-2xl text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Delete Meeting"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* SPECIFICATION CARD: DIRECT MEETING INVITATION ACTIONS */}
      <div className="bg-gradient-to-br from-blue-900 to-indigo-950 rounded-3xl text-white p-6 md:p-8 shadow-xl mb-8 relative overflow-hidden">
        
        {/* Subtle decorative background pattern */}
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-xl">
              <Share2 className="w-5 h-5 text-blue-300" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Meeting Invitation</h2>
              <p className="text-xs text-blue-200">Share with participants to connect seamlessly</p>
            </div>
          </div>
        </div>

        <div className="space-y-4 text-xs">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-white/10">
            <div>
              <span className="text-blue-300 block text-[11px] font-semibold uppercase tracking-wider mb-1">Meeting</span>
              <p className="text-sm font-bold text-white">{meeting.title}</p>
            </div>
            <div>
              <span className="text-blue-300 block text-[11px] font-semibold uppercase tracking-wider mb-1">Date & Time</span>
              <p className="text-sm font-bold text-white">{meeting.date} at {meeting.time}</p>
              <p className="text-[10px] text-blue-300">{meeting.timezone || '(UTC+05:30) India Standard Time'}</p>
            </div>
          </div>

          <div>
            <span className="text-blue-300 block text-[11px] font-semibold uppercase tracking-wider mb-1">Meeting Link</span>
            <div className="p-3 bg-black/30 border border-white/15 rounded-xl font-mono text-xs text-blue-200 truncate select-all">
              {joinUrl}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-1">
            <div className="p-3 bg-black/20 border border-white/10 rounded-xl">
              <span className="text-blue-300 block text-[11px] font-medium">Meeting ID</span>
              <p className="text-base font-bold font-mono text-white tracking-wider mt-0.5">{meeting.meetingId}</p>
            </div>
            <div className="p-3 bg-black/20 border border-white/10 rounded-xl">
              <span className="text-blue-300 block text-[11px] font-medium">Passcode</span>
              <p className="text-base font-bold font-mono text-white tracking-widest uppercase mt-0.5">
                {meeting.passcode || 'None'}
              </p>
            </div>
          </div>

          {/* Direct Action Buttons as specified in Part 3 */}
          <div className="pt-4 flex flex-wrap gap-2.5">
            <button
              onClick={copyLink}
              className="bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 border border-white/15 shadow-sm"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              {copiedLink ? 'Link Copied!' : 'Copy Link'}
            </button>

            <button
              onClick={copyFullInvitation}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 shadow-md shadow-blue-900/50"
            >
              {copiedInvite ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              {copiedInvite ? 'Invitation Copied!' : 'Copy Invitation'}
            </button>

            <button
              onClick={sendEmailInvite}
              className="bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 border border-white/15"
            >
              <Mail className="w-4 h-4" /> Email
            </button>

            {/* Part 39: Calendar Integrations Dropdown */}
            <AddToCalendarDropdown meeting={meeting} variant="secondary" />

            {/* Part 39: Export Summary to Workplace Apps (Slack, Jira, Salesforce) */}
            <button
              onClick={() => setShowExportIntegrationModal(true)}
              className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 px-4 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 border border-purple-500/30 shadow-sm text-xs"
              title="Share AI summary, tasks and notes to Slack, Jira, Salesforce or Drive"
            >
              <Share2 className="w-4 h-4 text-purple-400" /> Export & Integrate (39)
            </button>

            <button
              onClick={() => setShowContactsModal(true)}
              className="bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 border border-white/15"
            >
              <UserPlus className="w-4 h-4" /> Invite Contacts
            </button>

            <button
              onClick={() => {
                const el = document.getElementById('meeting-prep-section');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 px-4 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 border border-emerald-500/30 shadow-sm"
              title="Agenda, Pre-reads, and Shared Meeting Notes (Part 36)"
            >
              <FileText className="w-4 h-4 text-emerald-400" /> Agenda & Prep
            </button>

            <button
              onClick={() => {
                const el = document.getElementById('meeting-chat-section');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 px-4 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 border border-blue-500/30 shadow-sm"
              title="Continuous Meeting Chat (Before, During, and After Meeting)"
            >
              <MessageSquare className="w-4 h-4 text-blue-400" /> Meeting Chat
            </button>

            <button
              onClick={() => navigate(`/meetings/${meeting.meetingId || meeting._id}/notes`)}
              className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 px-4 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 border border-amber-500/30 shadow-sm"
              title="Open My Notes & Personal AI Enhancement"
            >
              <FileText className="w-4 h-4" /> My Notes
            </button>

            <button
              onClick={() => navigate(`/meetings/${meeting.meetingId || meeting._id}/summary`)}
              className="bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 px-4 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 border border-indigo-500/30 shadow-sm"
              title="View Post-Meeting AI Summary & Insights"
            >
              <Sparkles className="w-4 h-4 text-amber-300" /> AI Summary & Insights
            </button>

            <button
              onClick={() => navigate('/recordings')}
              className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 px-4 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 border border-purple-500/30 shadow-sm"
              title="View Smart Cloud Recording with Highlights & Chapters"
            >
              <Video className="w-4 h-4 text-purple-300" /> Smart Recording
            </button>

            <button
              onClick={() => {
                setDetailsWorkspaceTab('lifecycle');
                const el = document.getElementById('meeting-lifecycle-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 px-4 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 border border-emerald-500/30 shadow-sm"
              title="View Complete Meeting Lifecycle Hub (Part 40)"
            >
              <Layers className="w-4 h-4 text-emerald-400" /> Lifecycle Hub (Part 40)
            </button>
          </div>

        </div>
      </div>

      {/* Details Grid: Security, Alternative Hosts, Audio */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 md:p-8 space-y-6 text-xs text-gray-700">
        <h3 className="font-bold uppercase tracking-wider text-gray-400 text-[11px]">Access Control & Preferences</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200">
            <span className="font-bold text-gray-900 block mb-1">Waiting Room</span>
            <span className={`inline-flex items-center gap-1 font-semibold ${
              meeting.waitingRoom ? 'text-emerald-600' : 'text-gray-400'
            }`}>
              <Shield className="w-3.5 h-3.5" />
              {meeting.waitingRoom ? 'Enabled (Host admits)' : 'Disabled (Direct entry)'}
            </span>
          </div>

          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200">
            <span className="font-bold text-gray-900 block mb-1">Authentication Check</span>
            <span className="font-semibold text-gray-700">
              {meeting.authentication?.required ? 'Signed-in users only' : 'Guests allowed without account'}
            </span>
          </div>

          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200">
            <span className="font-bold text-gray-900 block mb-1">Registration Gate</span>
            <span className="font-semibold text-gray-700">
              {meeting.registration?.required ? 'Registration Required' : 'Open invitation'}
            </span>
          </div>
        </div>

        {/* Alternative Hosts */}
        {meeting.alternativeHosts && meeting.alternativeHosts.length > 0 && (
          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200">
            <span className="font-bold text-gray-900 block mb-1.5">Alternative Hosts</span>
            <div className="flex flex-wrap gap-2">
              {meeting.alternativeHosts.map((h, i) => (
                <span key={i} className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-gray-800 font-medium">
                  {h}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* PART 4: MEETING REGISTRATION & REGISTRANTS MANAGEMENT */}
      {meeting.registration?.required ? (
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 md:p-8 space-y-6 mt-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
                  <UserCheck className="w-4 h-4" />
                </span>
                <h3 className="font-bold text-base text-gray-900">Meeting Registration & Registrants</h3>
              </div>
              <p className="text-xs text-gray-500">
                Manage participant sign-ups, approval workflows, and registrant details for this meeting.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={exportCSV}
                disabled={registrations.length === 0}
                className="px-3.5 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors"
                title="Download CSV of all registrants"
              >
                <Download className="w-3.5 h-3.5" /> Export CSV
              </button>
            </div>
          </div>

          {/* Registration Link Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wider block">
                Attendee Registration Link
              </span>
              <p className="text-xs text-blue-700 font-mono break-all select-all">
                {regUrl}
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-blue-800">
                <span>
                  Approval Policy: <strong className="capitalize">{meeting.registration?.approvalType || 'automatic'}</strong>
                </span>
                {meeting.registration?.allowedDomains?.length > 0 && (
                  <span>
                    • Allowed Domains: <strong>{meeting.registration.allowedDomains.join(', ')}</strong>
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 self-start md:self-center">
              <button
                onClick={copyRegLink}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 flex items-center gap-1.5 transition-all"
              >
                {copiedRegLink ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedRegLink ? 'Copied' : 'Copy Link'}
              </button>
              <a
                href={regUrl}
                target="_blank"
                rel="noreferrer"
                className="p-2 border border-blue-200 bg-white rounded-xl text-blue-600 hover:bg-blue-50 transition-colors"
                title="Preview Registration Portal"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3 text-xs">
            {[
              { id: 'all', label: 'All Registrants', count: registrations.length },
              { id: 'pending', label: 'Pending Approval', count: registrations.filter(r => r.status === 'Pending').length },
              { id: 'approved', label: 'Approved', count: registrations.filter(r => r.status === 'Approved').length },
              { id: 'rejected', label: 'Rejected', count: registrations.filter(r => r.status === 'Rejected').length },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setRegFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                  regFilter === tab.id
                    ? 'bg-gray-900 text-white shadow-sm'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  regFilter === tab.id ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Registrants Table */}
          {loadingRegs ? (
            <div className="py-12 text-center text-xs text-gray-400 font-medium">Loading registrants...</div>
          ) : registrations.filter(r => regFilter === 'all' || r.status?.toLowerCase() === regFilter).length === 0 ? (
            <div className="py-12 text-center border border-dashed border-gray-200 rounded-2xl">
              <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-gray-700">No {regFilter !== 'all' ? regFilter : ''} registrants found</p>
              <p className="text-[11px] text-gray-400 mt-1 max-w-sm mx-auto">
                Share the registration link above with participants. Submissions will appear here in real time.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-gray-200 rounded-2xl">
              <table className="w-full text-left text-xs text-gray-600">
                <thead className="bg-gray-50 text-[11px] text-gray-400 font-bold uppercase tracking-wider border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-4">Attendee</th>
                    <th className="py-3 px-4">Organization</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Registered Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {registrations
                    .filter(r => regFilter === 'all' || r.status?.toLowerCase() === regFilter)
                    .map(reg => (
                      <tr key={reg._id || reg.registrationId} className="hover:bg-gray-50/70 transition-colors">
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-gray-900">{reg.name}</p>
                          <p className="text-[11px] text-gray-500 font-mono">{reg.email}</p>
                          {reg.customAnswers?.length > 0 && (
                            <div className="mt-1 space-y-0.5">
                              {reg.customAnswers.map((ca, idx) => (
                                <p key={idx} className="text-[10px] text-gray-500">
                                  <span className="font-medium text-gray-700">{ca.question}:</span> {ca.answer}
                                </p>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-gray-700">
                          {reg.organization || '—'}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            reg.status === 'Approved'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : reg.status === 'Rejected'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {reg.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-gray-500 text-[11px]">
                          {formatRegDate(reg.registeredAt || reg.createdAt)}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {reg.status !== 'Approved' && (
                              <button
                                onClick={() => handleUpdateRegStatus(reg.registrationId || reg._id, 'Approved')}
                                className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1"
                                title="Approve Registrant"
                              >
                                <UserCheck className="w-3 h-3" /> Approve
                              </button>
                            )}
                            {reg.status !== 'Rejected' && (
                              <button
                                onClick={() => handleUpdateRegStatus(reg.registrationId || reg._id, 'Rejected')}
                                className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1"
                                title="Reject Registrant"
                              >
                                <UserX className="w-3 h-3" /> Reject
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteReg(reg.registrationId || reg._id)}
                              className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Delete Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 mt-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gray-100 text-gray-500 rounded-2xl">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-900">Registration is Disabled</h4>
              <p className="text-xs text-gray-500">Participants can join this meeting directly with the meeting link without pre-registering.</p>
            </div>
          </div>
          <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-semibold text-gray-600">
            Open Entry
          </span>
        </div>
      )}

      {/* MEETING WORKSPACES & LIFECYCLE SECTIONS */}
      <div className="mt-10" id="meeting-lifecycle-section">
        {/* Workspace Nav Switcher */}
        <div className="flex items-center gap-2 mb-6 border-b border-gray-200 pb-3 overflow-x-auto">
          <button
            onClick={() => setDetailsWorkspaceTab('lifecycle')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              detailsWorkspaceTab === 'lifecycle'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Layers className="w-4 h-4" /> Complete Meeting Lifecycle (Part 40)
          </button>
          <button
            onClick={() => setDetailsWorkspaceTab('prep')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              detailsWorkspaceTab === 'prep'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <FileText className="w-4 h-4" /> Agenda & Preparation (Part 36)
          </button>
          <button
            onClick={() => setDetailsWorkspaceTab('chat')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              detailsWorkspaceTab === 'chat'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <MessageSquare className="w-4 h-4" /> Continuous Chat (Part 35)
          </button>
          <button
            onClick={() => setDetailsWorkspaceTab('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              detailsWorkspaceTab === 'all'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Globe className="w-4 h-4" /> View All Sections
          </button>
        </div>

        {/* Tab 1: Part 40 Complete Meeting Lifecycle Hub */}
        {(detailsWorkspaceTab === 'lifecycle' || detailsWorkspaceTab === 'all') && (
          <div className="mb-10">
            <MeetingLifecycleHub meetingId={meeting.meetingId || meetingId} initialMeeting={meeting} />
          </div>
        )}

        {/* Tab 2: Part 36 Agenda, Pre-reads & Shared Meeting Notes */}
        {(detailsWorkspaceTab === 'prep' || detailsWorkspaceTab === 'all') && (
          <div className="mb-10" id="meeting-prep-section">
            <MeetingPrepWorkspace
              meeting={meeting}
              meetingId={meetingId}
              user={user}
              isLiveMeeting={false}
            />
          </div>
        )}

        {/* Tab 3: Part 35 Continuous Meeting Chat */}
        {(detailsWorkspaceTab === 'chat' || detailsWorkspaceTab === 'all') && (
          <div className="mb-10" id="meeting-chat-section">
            <ContinuousMeetingChat
              meeting={meeting}
              meetingId={meetingId}
              user={user}
              onOpenRoom={() => navigate(`/meetings/${cleanRoomId}/room`)}
            />
          </div>
        )}
      </div>

      {/* INVITE CONTACTS MODAL */}
      {showContactsModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full border border-gray-200 overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                Invite Team Contacts
              </h3>
              <button onClick={() => setShowContactsModal(false)} className="text-gray-400 hover:text-gray-600 text-lg font-bold">×</button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <p className="text-gray-500">Select colleagues from your organization to send a meeting invite:</p>

              <div className="max-h-60 overflow-y-auto space-y-2 border border-gray-200 rounded-2xl p-2">
                {orgContacts.map(c => {
                  const isSelected = selectedContacts.includes(c.email);
                  return (
                    <div 
                      key={c._id || c.id} 
                      onClick={() => {
                        setSelectedContacts(prev => 
                          isSelected ? prev.filter(e => e !== c.email) : [...prev, c.email]
                        );
                      }}
                      className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                        isSelected ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50 border-gray-100'
                      }`}
                    >
                      <div>
                        <p className="font-bold text-gray-900">{c.name}</p>
                        <p className="text-[11px] text-gray-500">{c.email} • {c.department}</p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={isSelected} 
                        readOnly 
                        className="w-4 h-4 accent-blue-600 rounded" 
                      />
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 flex justify-between items-center">
                <span className="text-[11px] text-gray-500">{selectedContacts.length} selected</span>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setShowContactsModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 font-bold hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSendToContacts}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-600/20 flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" /> Send Invites
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Part 39: Export Summary to Integrations Modal */}
      <ExportSummaryIntegrationModal
        isOpen={showExportIntegrationModal}
        onClose={() => setShowExportIntegrationModal(false)}
        meetingId={meetingId}
        meetingTitle={meeting?.title}
        summaryText={meeting?.description || 'Meeting completed with action items assigned.'}
      />

    </div>
  );
}
