import React from 'react';
import { cn } from '../../utils';

export default function MeetingStatusBadge({ status }) {
  const styles = {
    Scheduled: "bg-blue-100 text-blue-700 border-blue-200",
    Live: "bg-red-100 text-red-700 border-red-200 animate-pulse",
    Completed: "bg-green-100 text-green-700 border-green-200",
    Cancelled: "bg-gray-100 text-gray-700 border-gray-200",
  };

  return (
    <span className={cn(
      "px-2.5 py-0.5 rounded-full text-xs font-semibold border",
      styles[status] || styles.Scheduled
    )}>
      {status === 'Live' && <span className="inline-block w-2 h-2 bg-red-600 rounded-full mr-1.5 mb-px animate-ping"></span>}
      {status}
    </span>
  );
}
