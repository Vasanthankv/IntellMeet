import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { dashboardService } from '../services/dashboardService';
import StatCard from '../components/dashboard/StatCard';
import QuickActions from '../components/dashboard/QuickActions';
import AnalyticsChart from '../components/dashboard/AnalyticsChart';
import MeetingsListWidget from '../components/dashboard/MeetingsListWidget';
import PendingTasksWidget from '../components/dashboard/PendingTasksWidget';
import ScheduleMeetingModal from '../components/dashboard/ScheduleMeetingModal';
import AddTaskModal from '../components/dashboard/AddTaskModal';
import { Calendar, Plus, RefreshCw, Video } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const { user, token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalMeetings: 0,
    hoursCollaborated: 0,
    aiSummariesGenerated: 0,
    pendingTasks: 0,
  });
  const [upcomingMeetings, setUpcomingMeetings] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [weeklyActivity, setWeeklyActivity] = useState([0, 0, 0, 0, 0, 0, 0]);

  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isTaskOpen, setIsTaskOpen] = useState(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await dashboardService.getStats(token);
      if (res && res.success) {
        setStats(res.stats || {
          totalMeetings: 0,
          hoursCollaborated: 0,
          aiSummariesGenerated: 0,
          pendingTasks: 0,
        });
        setUpcomingMeetings(res.upcomingMeetings || []);
        setTasks(res.tasks || []);
        if (res.weeklyActivity) setWeeklyActivity(res.weeklyActivity);
      }
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [token]);

  const handleScheduleMeeting = async (meetingData) => {
    try {
      const createdMeeting = await dashboardService.scheduleMeeting(meetingData, token);
      toast.success(`Meeting "${createdMeeting.title}" scheduled successfully!`);
      // Refresh live dashboard data from MongoDB
      fetchDashboardData();
    } catch (error) {
      toast.error(error.message || 'Failed to schedule meeting');
    }
  };

  const handleCreateTask = async (taskData) => {
    try {
      await dashboardService.createTask(taskData, token);
      toast.success('New task added!');
      fetchDashboardData();
    } catch (error) {
      toast.error(error.message || 'Failed to add task');
    }
  };

  const handleToggleTask = async (taskId) => {
    try {
      await dashboardService.toggleTask(taskId, token);
      fetchDashboardData();
    } catch (error) {
      toast.error('Failed to toggle task');
    }
  };

  // Convert 7-day array to chart format
  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const chartData = DAYS.map((day, idx) => ({
    name: day,
    meetings: weeklyActivity[idx] || 0,
  }));

  const statCardsData = [
    {
      title: 'Total Meetings',
      value: stats.totalMeetings.toString(),
      change: stats.totalMeetings > 0 ? `+${stats.totalMeetings} total` : '0',
      changeType: 'positive',
    },
    {
      title: 'Hours Collaborated',
      value: `${stats.hoursCollaborated} hrs`,
      change: stats.hoursCollaborated > 0 ? `+${stats.hoursCollaborated}h` : '0h',
      changeType: 'positive',
    },
    {
      title: 'AI Summaries Generated',
      value: stats.aiSummariesGenerated.toString(),
      change: stats.aiSummariesGenerated > 0 ? `+${stats.aiSummariesGenerated}` : '0',
      changeType: 'positive',
    },
    {
      title: 'Pending Tasks',
      value: stats.pendingTasks.toString(),
      change: stats.pendingTasks > 0 ? `${stats.pendingTasks} active` : 'All done',
      changeType: stats.pendingTasks > 0 ? 'negative' : 'positive',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            Welcome back, {user?.name || 'User'}! 👋
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Here's what's happening with your team and meetings today.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={fetchDashboardData}
            className="p-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
            title="Refresh Stats"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setIsScheduleOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl shadow-md transition-colors"
          >
            <Calendar className="w-4 h-4" />
            Schedule Meeting
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCardsData.map((stat, i) => (
          <StatCard key={i} {...stat} isLoading={loading} />
        ))}
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Chart + Actions + Tasks) */}
        <div className="lg:col-span-2 space-y-6">
          <AnalyticsChart data={chartData} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <QuickActions
              onOpenScheduleModal={() => setIsScheduleOpen(true)}
              onOpenTaskModal={() => setIsTaskOpen(true)}
            />
            <PendingTasksWidget
              tasks={tasks}
              onToggleTask={handleToggleTask}
              onOpenTaskModal={() => setIsTaskOpen(true)}
            />
          </div>
        </div>

        {/* Right Column (Upcoming Meetings) */}
        <div className="space-y-6">
          <MeetingsListWidget
            upcoming={upcomingMeetings}
            isLoading={loading}
            onOpenScheduleModal={() => setIsScheduleOpen(true)}
          />
        </div>
      </div>

      {/* Modals */}
      <ScheduleMeetingModal
        isOpen={isScheduleOpen}
        onClose={() => setIsScheduleOpen(false)}
        onMeetingCreated={handleScheduleMeeting}
      />
      <AddTaskModal
        isOpen={isTaskOpen}
        onClose={() => setIsTaskOpen(false)}
        onTaskCreated={handleCreateTask}
      />
    </div>
  );
}
