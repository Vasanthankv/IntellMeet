import mongoose from 'mongoose';
import { MeetingTranscript } from '../models/MeetingTranscript.js';

const memoryTranscripts = new Map();

export const safeFindTranscript = async (meetingId) => {
  if (mongoose.connection.readyState === 1) {
    try {
      const doc = await Promise.race([
        MeetingTranscript.findOne({ meetingId }).sort({ createdAt: -1 }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000))
      ]);
      if (doc) return doc;
    } catch (e) {
      console.warn('DB MeetingTranscript read warning:', e.message);
    }
  }
  return memoryTranscripts.get(meetingId) || null;
};

export const safeSaveTranscript = async (transcript) => {
  if (mongoose.connection.readyState === 1 && transcript && typeof transcript.save === 'function') {
    try {
      return await Promise.race([
        transcript.save(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000))
      ]);
    } catch (e) {
      console.warn('DB MeetingTranscript save warning:', e.message);
    }
  }
  if (transcript && transcript.meetingId) {
    memoryTranscripts.set(transcript.meetingId, transcript);
  }
  return transcript;
};

export const getOrCreateTranscript = async (meetingId, defaults = {}) => {
  let tr = await safeFindTranscript(meetingId);
  if (!tr) {
    if (mongoose.connection.readyState === 1) {
      try {
        tr = await Promise.race([
          MeetingTranscript.create({
            meetingId,
            status: defaults.status || 'LIVE',
            startedAt: new Date(),
            segments: [],
            ...defaults
          }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000))
        ]);
      } catch (e) {
        console.warn('DB MeetingTranscript create fallback to memory:', e.message);
      }
    }
    if (!tr) {
      tr = {
        meetingId,
        transcriptId: 'tr_' + Math.random().toString(36).substring(2, 9),
        status: defaults.status || 'LIVE',
        startedAt: new Date(),
        segments: [],
        aiSummary: {},
        save: async function() { return this; }
      };
      memoryTranscripts.set(meetingId, tr);
    }
  }
  return tr;
};

export default {
  safeFindTranscript,
  safeSaveTranscript,
  getOrCreateTranscript
};
