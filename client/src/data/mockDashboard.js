export const mockDashboardData = {
  stats: [
    { title: "Total Meetings", value: "124", change: "+12%", trend: "up" },
    { title: "Hours Collaborated", value: "342", change: "+8%", trend: "up" },
    { title: "AI Summaries Generated", value: "118", change: "+15%", trend: "up" },
    { title: "Pending Tasks", value: "24", change: "-5%", trend: "down" },
  ],
  upcomingMeetings: [
    { id: 1, title: "Q3 Planning Session", time: "10:00 AM", date: "Today", attendees: 5 },
    { id: 2, title: "Engineering Sync", time: "1:00 PM", date: "Today", attendees: 12 },
    { id: 3, title: "Design Review", time: "3:30 PM", date: "Tomorrow", attendees: 4 },
  ],
  recentMeetings: [
    { id: 4, title: "Product Standup", date: "Yesterday", status: "Summarized" },
    { id: 5, title: "Client Kickoff", date: "Oct 12", status: "Summarized" },
  ],
  pendingTasks: [
    { id: 1, title: "Review Q3 Roadmap", due: "Today", priority: "High" },
    { id: 2, title: "Update API Documentation", due: "Tomorrow", priority: "Medium" },
    { id: 3, title: "Schedule 1:1s", due: "Friday", priority: "Low" },
  ],
  chartData: [
    { name: 'Mon', meetings: 4 },
    { name: 'Tue', meetings: 7 },
    { name: 'Wed', meetings: 5 },
    { name: 'Thu', meetings: 8 },
    { name: 'Fri', meetings: 6 },
    { name: 'Sat', meetings: 1 },
    { name: 'Sun', meetings: 0 },
  ],
  recentActivity: [
    { id: 1, text: "AI generated summary for Product Standup", time: "2 hours ago" },
    { id: 2, text: "Sarah assigned you a task: Review Q3 Roadmap", time: "4 hours ago" },
    { id: 3, text: "John Doe joined your team", time: "1 day ago" },
  ]
};
