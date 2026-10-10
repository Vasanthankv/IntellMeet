const API_BASE_URL = 'http://localhost:5000/api';

export const meetingService = {
  getMeetings: async (token) => {
    const res = await fetch(`${API_BASE_URL}/meetings`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    return data.meetings;
  },
  
  getMeetingById: async (id, token) => {
    const res = await fetch(`${API_BASE_URL}/meetings/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    return data.meeting;
  },

  createMeeting: async (meetingData, token) => {
    const res = await fetch(`${API_BASE_URL}/meetings`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify(meetingData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    return data.meeting;
  }
};
