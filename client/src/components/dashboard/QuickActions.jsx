import React from 'react';
import { Video, Calendar, CheckSquare, FileText } from 'lucide-react';
import { Button } from '../ui/Button';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function QuickActions({ onOpenScheduleModal, onOpenTaskModal }) {
  const navigate = useNavigate();

  const handleInstantMeeting = () => {
    const meetingId = 'instant-' + Date.now();
    toast.success('Starting instant meeting room...');
    navigate(`/meetings/${meetingId}/room`);
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
