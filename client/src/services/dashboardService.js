const API_BASE_URL = '${(typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1" ? "https://intellmeet-backend-h3md.onrender.com" : "http://localhost:5000")}/api/dashboard';

export const dashboardService = {
  getStats: async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/stats`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      return data;
    } catch (error) {
      console.warn('Dashboard stats service error, falling back:', error.message);
      return null;
    }
  },

  scheduleMeeting: async (meetingData, token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/meetings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(meetingData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      return data.meeting;
    } catch (error) {
      console.error('Schedule meeting service error:', error);
      throw error;
    }
  },

  createTask: async (taskData, token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(taskData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      return data.task;
    } catch (error) {
      console.error('Create task service error:', error);
      throw error;
    }
  },

  toggleTask: async (taskId, token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/toggle`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      return data;
    } catch (error) {
      console.error('Toggle task service error:', error);
      throw error;
    }
  },
};
