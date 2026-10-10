import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '../../utils';

export default function StatCard({ title, value, change, trend }) {
  const isUp = trend === 'up';
  
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-3xl font-bold text-gray-900">{value}</span>
        <span className={cn(
          "flex items-center text-sm font-medium",
          isUp ? "text-green-600" : "text-red-600"
        )}>
          {isUp ? <ArrowUpRight className="w-4 h-4 mr-1" /> : <ArrowDownRight className="w-4 h-4 mr-1" />}
          {change}
        </span>
      </div>
    </div>
  );
}
