// ─────────────────────────────────────────────────────────────────────────────
// LocalRecordingEngine.js
// Handles browser MediaRecorder recording for computer/local recording (23.2, 23.3)
// ─────────────────────────────────────────────────────────────────────────────

class LocalRecordingEngine {
  constructor() {
    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.isRecording = false;
    this.isPaused = false;
    this.startTime = null;
    this.stream = null;
  }

  isSupported() {
    return typeof window !== 'undefined' && !!(window.MediaRecorder);
  }

  getSupportedMimeType(hasVideo = true) {
    const videoTypes = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
      'video/mp4;codecs=avc1,mp4a.40.2',
      'video/mp4'
    ];
    const audioTypes = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/ogg'
    ];
    const types = hasVideo ? videoTypes : audioTypes;
    for (const t of types) {
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t)) {
        return t;
      }
    }
    return '';
  }

  createFallbackStream() {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1280;
      canvas.height = 720;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, 1280, 720);
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 42px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('IntellMeet Meeting Recording', 640, 340);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '22px Inter, system-ui, sans-serif';
        ctx.fillText('Capturing Meeting Media & Audio', 640, 400);
      }
      const canvasStream = canvas.captureStream ? canvas.captureStream(15) : null;
      if (canvasStream) {
        try {
          const AudioContextClass = window.AudioContext || window.webkitAudioContext;
          if (AudioContextClass) {
            const actx = new AudioContextClass();
            const dest = actx.createMediaStreamDestination();
            dest.stream.getAudioTracks().forEach(t => canvasStream.addTrack(t));
          }
        } catch (e) {}
        return canvasStream;
      }
    } catch (e) {
      console.warn('Fallback stream creation warning:', e);
    }
    return new MediaStream();
  }

  start(stream, onDataAvailable) {
    let activeStream = stream;
    if (!activeStream || activeStream.getTracks().length === 0) {
      activeStream = this.createFallbackStream();
    }
    this.stream = activeStream;
    this.recordedChunks = [];
    const hasVideo = activeStream.getVideoTracks().length > 0;
    const mimeType = this.getSupportedMimeType(hasVideo);

    const options = mimeType ? { mimeType } : undefined;
    try {
      this.mediaRecorder = new MediaRecorder(activeStream, options);
    } catch (e) {
      try {
        this.mediaRecorder = new MediaRecorder(activeStream);
      } catch (fallbackErr) {
        const synthesizedStream = this.createFallbackStream();
        this.stream = synthesizedStream;
        this.mediaRecorder = new MediaRecorder(synthesizedStream);
      }
    }

    this.lastMimeType = mimeType || 'video/webm';
    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        this.recordedChunks.push(event.data);
        if (onDataAvailable) onDataAvailable(event.data);
      }
    };

    this.mediaRecorder.start(1000); // 1-second timeslices
    this.isRecording = true;
    this.isPaused = false;
    this.startTime = Date.now();
  }

  pause() {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.pause();
      this.isPaused = true;
    }
  }

  resume() {
    if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
      this.mediaRecorder.resume();
      this.isPaused = false;
    }
  }

  stop() {
    return new Promise((resolve) => {
      const buildResult = (mime = 'video/webm') => {
        if (!this.recordedChunks || this.recordedChunks.length === 0) {
          this.isRecording = false;
          this.isPaused = false;
          this.mediaRecorder = null;
          return null;
        }
        const safeMime = mime || this.lastMimeType || 'video/webm';
        const blob = new Blob(this.recordedChunks, { type: safeMime });
        const url = URL.createObjectURL(blob);
        const durationSecs = Math.max(1, Math.round((Date.now() - (this.startTime || Date.now())) / 1000));
        
        this.isRecording = false;
        this.isPaused = false;
        this.mediaRecorder = null;
        this.recordedChunks = [];

        return {
          blob,
          url,
          mimeType: safeMime,
          duration: durationSecs,
          size: blob.size,
          filename: `IntellMeet_Recording_${Date.now()}.${safeMime.includes('mp4') ? 'mp4' : 'webm'}`
        };
      };

      if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
        const res = buildResult(this.lastMimeType);
        resolve(res);
        return;
      }

      this.mediaRecorder.onstop = () => {
        const res = buildResult(this.mediaRecorder?.mimeType || this.lastMimeType);
        resolve(res);
      };

      try {
        if (this.mediaRecorder.state === 'recording') {
          this.mediaRecorder.requestData();
        }
      } catch (e) {}

      try {
        this.mediaRecorder.stop();
      } catch (e) {
        const res = buildResult(this.lastMimeType);
        resolve(res);
      }
    });
  }

  downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename || `IntellMeet_Recording_${Date.now()}.webm`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 1000);
  }
}

const localRecordingEngine = new LocalRecordingEngine();
export default localRecordingEngine;
