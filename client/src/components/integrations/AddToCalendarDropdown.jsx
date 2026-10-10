import React, { useState, useRef, useEffect } from 'react';
import { Calendar, CalendarPlus, ChevronDown, Download, ExternalLink, Check, Globe } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AddToCalendarDropdown({ meeting, variant = 'primary' }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!meeting) return null;

  const meetingTitle = meeting.title || 'IntelliMeet Video Conference';
  const meetingId = (meeting.meetingId || meeting._id || 'meeting').toString().replace(/[\s-]/g, '');
  const meetingUrl = `http://localhost:5173/meetings/${meetingId}/room`;
  const passcode = meeting.passcode || '884920';
  const description = meeting.description || 'IntelliMeet meeting session with HD video, continuous chat, AI transcript & recording.';

  // Parse duration safely (handles "1 hr 0 min", "45 min", 60)
  let durationMinutes = 60;
  if (typeof meeting.duration === 'number') {
    durationMinutes = meeting.duration;
  } else if (typeof meeting.duration === 'string') {
    const hrMatch = meeting.duration.match(/(\d+)\s*hr/i);
    const minMatch = meeting.duration.match(/(\d+)\s*min/i);
    const hrs = hrMatch ? parseInt(hrMatch[1], 10) : 0;
    const mins = minMatch ? parseInt(minMatch[1], 10) : 0;
    if (hrs > 0 || mins > 0) {
      durationMinutes = hrs * 60 + mins;
    } else {
      const parsed = parseInt(meeting.duration, 10);
      if (!isNaN(parsed) && parsed > 0) durationMinutes = parsed;
    }
  }

  // Parse start date & time safely
  let startDate = new Date();
  try {
    if (meeting.date && typeof meeting.date === 'string') {
      const parts = meeting.date.split('-');
      if (parts.length === 3 && parts[0].length === 4) {
        startDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      } else {
        const parsed = new Date(meeting.date);
        if (!isNaN(parsed.getTime())) startDate = parsed;
      }
    }

    const timeStr = meeting.time || meeting.startTime;
    if (timeStr && typeof timeStr === 'string') {
      const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
      if (match) {
        let hours = parseInt(match[1], 10);
        const mins = parseInt(match[2], 10);
        const ampm = match[3]?.toUpperCase();
        if (ampm === 'PM' && hours < 12) hours += 12;
        if (ampm === 'AM' && hours === 12) hours = 0;
        startDate.setHours(hours, mins, 0, 0);
      }
    }
  } catch (e) {
    startDate = new Date();
  }

  if (isNaN(startDate.getTime())) {
    startDate = new Date();
  }

  let endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);
  if (isNaN(endDate.getTime())) {
    endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
  }

  const safeIsoString = (d) => {
    try {
      if (d instanceof Date && !isNaN(d.getTime())) {
        return d.toISOString();
      }
    } catch (e) {}
    return new Date().toISOString();
  };

  const formatGoogleDate = (date) => {
    return safeIsoString(date).replace(/-|:|\.\d\d\d/g, '');
  };

  const detailsText = `${description}\n\nJoin IntelliMeet Meeting:\n${meetingUrl}\n\nMeeting ID: ${meetingId}\nPasscode: ${passcode}\n\nHosted on IntelliMeet Platform.`;

  // 1. Google Calendar URL
  const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(meetingTitle)}&dates=${formatGoogleDate(startDate)}/${formatGoogleDate(endDate)}&details=${encodeURIComponent(detailsText)}&location=${encodeURIComponent(meetingUrl)}`;

  // 2. Outlook.com Personal
  const outlookLiveUrl = `https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(meetingTitle)}&startdt=${safeIsoString(startDate)}&enddt=${safeIsoString(endDate)}&body=${encodeURIComponent(detailsText)}&location=${encodeURIComponent(meetingUrl)}`;

  // 3. Microsoft 365 Work/School
  const office365Url = `https://outlook.office.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(meetingTitle)}&startdt=${safeIsoString(startDate)}&enddt=${safeIsoString(endDate)}&body=${encodeURIComponent(detailsText)}&location=${encodeURIComponent(meetingUrl)}`;

  // 4. Download universal .ICS file
  const downloadIcs = () => {
    const formatIcsDate = (date) => safeIsoString(date).replace(/-|:|\.\d\d\d/g, '');

    const icsLines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//IntellMeet//Meeting Calendar//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:REQUEST',
      'BEGIN:VEVENT',
      `UID:intellmeet-${meetingId}-${Date.now()}@intellmeet.com`,
      `DTSTAMP:${formatIcsDate(new Date())}`,
      `DTSTART:${formatIcsDate(startDate)}`,
      `DTEND:${formatIcsDate(endDate)}`,
      `SUMMARY:${meetingTitle.replace(/\n/g, ' ')}`,
      `DESCRIPTION:${detailsText.replace(/\n/g, '\\n')}`,
      `LOCATION:${meetingUrl}`,
      `URL:${meetingUrl}`,
      'STATUS:CONFIRMED',
      'BEGIN:VALARM',
      'TRIGGER:-PT15M',
      'ACTION:DISPLAY',
      'DESCRIPTION:Reminder: IntelliMeet meeting begins in 15 minutes',
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR'
    ];

    const blob = new Blob([icsLines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${meetingTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Calendar (.ics) invite downloaded!');
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={
          variant === 'primary'
            ? 'bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 shadow-md shadow-blue-600/20 text-xs'
            : 'bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 border border-white/15 text-xs'
        }
      >
        <CalendarPlus className="w-4 h-4" />
        <span>Add to Calendar</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-[#1F1F1F] border border-[#3A3A3A] rounded-2xl shadow-2xl py-2 z-50 text-xs text-gray-200 animate-in fade-in zoom-in-95 duration-100 divide-y divide-[#2E2E2E]">
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">
            Calendar Integrations (39.1 - 39.4)
          </div>

          <div className="py-1">
            {/* Google Calendar */}
            <a
              href={googleCalendarUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between px-3.5 py-2 hover:bg-white/5 transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                <span className="font-semibold text-gray-200 group-hover:text-white">Google Calendar</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-400" />
            </a>

            {/* Microsoft 365 Work/School */}
            <a
              href={office365Url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between px-3.5 py-2 hover:bg-white/5 transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
                <span className="font-semibold text-gray-200 group-hover:text-white">Microsoft 365 (Work)</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-gray-400 group-hover:text-sky-400" />
            </a>

            {/* Outlook.com Personal */}
            <a
              href={outlookLiveUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between px-3.5 py-2 hover:bg-white/5 transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-500"></span>
                <span className="font-semibold text-gray-200 group-hover:text-white">Outlook.com</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-gray-400 group-hover:text-cyan-400" />
            </a>
          </div>

          {/* Universal .ICS file download */}
          <div className="py-1">
            <button
              type="button"
              onClick={downloadIcs}
              className="w-full flex items-center justify-between px-3.5 py-2 hover:bg-white/5 transition-colors group text-left"
            >
              <div className="flex items-center gap-2.5">
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-semibold text-gray-200 group-hover:text-white">Download .ICS File</span>
              </div>
              <span className="text-[10px] text-gray-400 bg-white/5 px-1.5 py-0.5 rounded">Apple/Desktop</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
