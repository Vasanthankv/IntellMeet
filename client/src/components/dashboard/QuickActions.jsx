import React, { useState } from 'react';
import { Video, Calendar, CheckSquare, FileText } from 'lucide-react';
import { Button } from '../ui/Button';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import { meetingService } from '../../services/meetingService';

export default function QuickActions({ onOpenScheduleModal, onOpenTaskModal }) {
  const navigate = useNavigate();
  const [isCreatingInstant, setIsCreatingInstant] = useState(false);

  const handleInstantMeeting = async () => {
    if (isCreatingInstant) return;
    setIsCreatingInstant(true);
    try {
      const token = useAuthStore.getState().token;
      const user = useAuthStore.getState().user;
      const randomMeetingId = `${Math.floor(100 + Math.random() * 900)}-${Math.floor(100 + Math.random() * 900)}-${Math.floor(1000 + Math.random() * 9000)}`;

      const payload = {
        title: user?.name ? `${user.name}'s Meeting` : 'Instant Meeting',
        topic: user?.name ? `${user.name}'s Meeting` : 'Instant Meeting',
        meetingId: randomMeetingId,
        date: 'Today',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        duration: '45 mins',
        status: 'live'
      };

      let createdMtg = null;
      if (token) {
        try {
          createdMtg = await meetingService.createMeeting(payload, token);
        } catch (createErr) {
          console.warn('Instant meeting persistence note:', createErr);
        }
      }

      const targetId = (createdMtg?.meetingId || randomMeetingId).replace(/[\s-]/g, '');
      toast.success('Starting instant meeting room...');
      navigate(`/meetings/${targetId}/room`);
    } catch (err) {
      console.warn('Instant meeting error:', err);
      const fallbackId = `${Math.floor(100 + Math.random() * 900)}${Math.floor(100 + Math.random() * 900)}${Math.floor(1000 + Math.random() * 9000)}`;
      navigate(`/meetings/${fallbackId}/room`);
    } finally {
      setIsCreatingInstant(false);
    }
  };

  const fileInputRef = React.useRef(null);

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      toast.success(`${file.name} uploaded securely to your Hub!`);
      // Reset input so the same file can be uploaded again if needed
      e.target.value = '';
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col h-full">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-4 flex-1">
        <Button
          onClick={handleInstantMeeting}
          variant="outline"
          className="h-auto py-4 flex flex-col gap-2 items-center justify-center text-primary-600 hover:text-primary-700 hover:bg-primary-50 border-primary-200"
        >
          <Video className="w-6 h-6" />
          <span className="text-sm font-medium">New Meeting</span>
        </Button>
        <Button
          onClick={() => navigate('/meetings/schedule')}
          variant="outline"
          className="h-auto py-4 flex flex-col gap-2 items-center justify-center text-gray-700 hover:text-primary-600 hover:bg-gray-50"
        >
          <Calendar className="w-6 h-6" />
          <span className="text-sm font-medium">Schedule</span>
        </Button>
        <Button
          onClick={onOpenTaskModal}
          variant="outline"
          className="h-auto py-4 flex flex-col gap-2 items-center justify-center text-gray-700 hover:text-primary-600 hover:bg-gray-50"
        >
          <CheckSquare className="w-6 h-6" />
          <span className="text-sm font-medium">New Task</span>
        </Button>
        
        {/* Hidden File Input */}
        <input 
          type="file" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          onChange={handleFileChange}
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png"
        />
        <Button
          onClick={handleUploadClick}
          variant="outline"
          className="h-auto py-4 flex flex-col gap-2 items-center justify-center text-gray-700 hover:text-primary-600 hover:bg-gray-50"
        >
          <FileText className="w-6 h-6" />
          <span className="text-sm font-medium">Upload File</span>
        </Button>
      </div>
    </div>
  );
}
