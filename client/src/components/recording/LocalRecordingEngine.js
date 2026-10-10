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

  getSupportedMimeType() {
    const types = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
      'video/mp4;codecs=avc1,mp4a.40.2',
      'video/mp4'
    ];
    for (const t of types) {
      if (MediaRecorder.isTypeSupported(t)) {
        return t;
      }
    }
    return '';
  }

  start(stream, onDataAvailable) {
    if (!stream) {
      throw new Error('No media stream available for local recording');
    }
    this.stream = stream;
    this.recordedChunks = [];
    const mimeType = this.getSupportedMimeType();

    const options = mimeType ? { mimeType } : undefined;
    try {
      this.mediaRecorder = new MediaRecorder(stream, options);
    } catch (e) {
      this.mediaRecorder = new MediaRecorder(stream);
    }

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
      if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
        resolve(null);
        return;
      }

      this.mediaRecorder.onstop = () => {
        const mimeType = this.mediaRecorder.mimeType || 'video/webm';
        const blob = new Blob(this.recordedChunks, { type: mimeType });
        const url = URL.createObjectURL(blob);
        const durationSecs = Math.max(1, Math.round((Date.now() - (this.startTime || Date.now())) / 1000));
        
        this.isRecording = false;
        this.isPaused = false;
        this.mediaRecorder = null;

        resolve({
          blob,
          url,
          mimeType,
          duration: durationSecs,
          size: blob.size,
          filename: `IntellMeet_Local_Recording_${Date.now()}.${mimeType.includes('mp4') ? 'mp4' : 'webm'}`
        });
      };

      this.mediaRecorder.stop();
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
