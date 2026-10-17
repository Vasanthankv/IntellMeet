import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '../../utils';

export default function StatCard({ title, value, change, trend, isLoading = false }) {
  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm animate-pulse">
        <div className="h-3.5 bg-gray-200 rounded w-1/2 mb-3"></div>
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
        <div className="h-3 bg-gray-100 rounded w-1/4"></div>
      </div>
    );
  }

  const isUp = trend === 'up';
  
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{title}</h3>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-3xl font-extrabold text-gray-900">{value}</span>
        {change && (
          <span className={cn(
            "flex items-center text-xs font-semibold",
            isUp ? "text-green-600" : "text-gray-500"
          )}>
            {isUp && <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />}
            {change}
          </span>
        )}
      </div>
    </div>
  );
}
