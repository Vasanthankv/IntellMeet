// Part 21.17 Voice Translation Engine (Text-to-Speech)
// Distinct from Translated Captions: Speech -> Text -> Translation -> Text-to-Speech

class VoiceTranslationEngine {
  constructor() {
    this.synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.voices = [];
    this.enabled = false;
    this.volume = 1.0;
    this.rate = 1.0;
    this.pitch = 1.0;
    this.targetLanguage = 'ta';
    
    if (this.synth) {
      this.loadVoices();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  loadVoices() {
    if (!this.synth) return;
    this.voices = this.synth.getVoices();
  }

  setTargetLanguage(lang) {
    this.targetLanguage = lang;
  }

  setEnabled(val) {
    this.enabled = !!val;
    if (!this.enabled && this.synth) {
      this.synth.cancel();
    }
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  setRate(rate) {
    this.rate = Math.max(0.5, Math.min(2, rate));
  }

  setPitch(pitch) {
    this.pitch = Math.max(0.5, Math.min(2, pitch));
  }

  getVoiceForLanguage(langCode) {
    if (!this.voices || this.voices.length === 0) {
      this.loadVoices();
    }
    const code = (langCode || this.targetLanguage || 'en').toLowerCase().split('-')[0];
    
    // Find exact or prefix voice match
    const voice = this.voices.find(v => v.lang.toLowerCase().startsWith(code)) ||
                  this.voices.find(v => v.lang.toLowerCase().includes(code)) ||
                  this.voices[0];
    return voice || null;
  }

  speak(text, langCode) {
    if (!this.enabled || !this.synth || !text || !text.trim()) return;

    try {
      // Avoid queue backlog: cancel previous pending utterances if too many
      if (this.synth.pending) {
        this.synth.cancel();
      }

      const utterance = new SpeechSynthesisUtterance(text);
      const voice = this.getVoiceForLanguage(langCode || this.targetLanguage);
      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang;
      }
      utterance.volume = this.volume;
      utterance.rate = this.rate;
      utterance.pitch = this.pitch;

      this.synth.speak(utterance);
    } catch (e) {
      console.warn('VoiceTranslationEngine synthesis error:', e);
    }
  }

  stop() {
    if (this.synth) {
      this.synth.cancel();
    }
  }
}

export const voiceTranslator = new VoiceTranslationEngine();
export default voiceTranslator;
