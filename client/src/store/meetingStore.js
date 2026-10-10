import { create } from 'zustand';
import { meetingService } from '../services/meetingService';

import { useAuthStore } from './authStore';

export const useMeetingStore = create((set, get) => ({
  meetings: [],
  isLoading: false,
  error: null,

  fetchMeetings: async () => {
    set({ isLoading: true, error: null });
    try {
      const token = useAuthStore.getState().token;
      const data = await meetingService.getMeetings(token);
      set({ meetings: data, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  addMeeting: async (meetingData) => {
    try {
      const token = useAuthStore.getState().token;
      const newMeeting = await meetingService.createMeeting(meetingData, token);
      set((state) => ({ meetings: [newMeeting, ...state.meetings] }));
      return newMeeting;
    } catch (error) {
      throw error;
    }
  }
}));
