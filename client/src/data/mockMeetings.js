export const mockMeetingsData = [
  {
    id: "m1",
    title: "Q3 Planning Session",
    description: "Discussing the roadmap for Q3 and assigning key responsibilities.",
    date: "2026-10-15",
    time: "10:00 AM",
    duration: 60, // minutes
    host: "Admin User",
    status: "Scheduled", // Scheduled, Live, Completed, Cancelled
    joinLink: "/meetings/m1/room",
    participants: [
      { id: "u1", name: "Admin User", avatar: "https://i.pravatar.cc/150?u=a042581f4e29026024d" },
      { id: "u2", name: "John Doe", avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704d" },
      { id: "u3", name: "Sarah Smith", avatar: "https://i.pravatar.cc/150?u=a042581f4e29026705d" }
    ]
  },
  {
    id: "m2",
    title: "Engineering Sync",
    description: "Weekly sync for the engineering team to discuss blockers and progress.",
    date: "2026-10-15",
    time: "1:00 PM",
    duration: 30,
    host: "Sarah Smith",
    status: "Scheduled",
    joinLink: "/meetings/m2/room",
    participants: [
      { id: "u1", name: "Admin User", avatar: "https://i.pravatar.cc/150?u=a042581f4e29026024d" },
      { id: "u3", name: "Sarah Smith", avatar: "https://i.pravatar.cc/150?u=a042581f4e29026705d" }
    ]
  },
  {
    id: "m3",
    title: "Product Standup",
    description: "Daily product team standup.",
    date: "2026-10-14",
    time: "9:30 AM",
    duration: 15,
    host: "John Doe",
    status: "Completed",
    joinLink: "/meetings/m3/room",
    participants: [
      { id: "u1", name: "Admin User", avatar: "https://i.pravatar.cc/150?u=a042581f4e29026024d" },
      { id: "u2", name: "John Doe", avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704d" }
    ]
  }
];
