import React from 'react';
import { Activity } from 'lucide-react';

export default function ActivityFeedWidget({ activity }) {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm col-span-full">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Activity className="w-5 h-5 text-primary-500" />
        Recent Activity
      </h3>
      
      <div className="relative border-l border-gray-200 ml-3 space-y-6">
        {activity.map((item, index) => (
          <div key={item.id} className="relative pl-6">
            <span className="absolute -left-1.5 top-1 w-3 h-3 rounded-full bg-primary-100 border-[3px] border-white ring-1 ring-gray-200"></span>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-gray-800">{item.text}</p>
              <time className="text-xs text-gray-500 mt-1 sm:mt-0">{item.time}</time>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
