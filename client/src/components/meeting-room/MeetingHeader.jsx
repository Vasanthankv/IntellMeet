import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export default function MeetingHeader({ title, elapsed }) {
  const navigate = useNavigate();

  return (
    <div className="h-16 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-6 shrink-0 z-10 relative">
      <div className="flex items-center gap-4">
        <h1 className="text-white font-semibold text-lg">{title}</h1>
        <div className="px-2 py-1 bg-gray-800 rounded-md text-xs font-medium text-gray-300">
          {elapsed}
        </div>
      </div>
      
      <Button 
        variant="destructive" 
        className="bg-red-600 hover:bg-red-700 text-white font-medium"
        onClick={() => navigate('/meetings')}
      >
        <LogOut className="w-4 h-4 mr-2" />
        Leave
      </Button>
    </div>
  );
}
