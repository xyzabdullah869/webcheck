import type { VoiceType, SupportedLanguage, VoiceSettings } from "./types";

const LANGUAGE_CODE_MAP: Record<SupportedLanguage, string> = {
  en: "en-US",
  ur: "ur-PK",
  "roman-ur": "en-US",
  mixed: "en-US",
};

export type VoiceState = {
  isSpeaking: boolean;
  isPaused: boolean;
  queueLength: number;
};

export class VoiceEngine {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private settings: VoiceSettings | null = null;
  private isSpeaking = false;
  private isPaused = false;
  private queue: string[] = [];
  private onStateChangeCallback: ((state: VoiceState) => void) | null = null;

  constructor() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      this.synth = window.speechSynthesis;
      this.loadVoices();
      if (this.synth && this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  private loadVoices() {
    if (this.synth) {
      this.voices = this.synth.getVoices();
    }
  }

  setSettings(settings: VoiceSettings) {
    this.settings = settings;
  }

  setOnStateChange(cb: (state: VoiceState) => void) {
    this.onStateChangeCallback = cb;
  }

  private notifyStateChange() {
    if (this.onStateChangeCallback) {
      this.onStateChangeCallback({
        isSpeaking: this.isSpeaking,
        isPaused: this.isPaused,
        queueLength: this.queue.length,
      });
    }
  }

  private selectVoice(voiceType: VoiceType, language: SupportedLanguage): SpeechSynthesisVoice | null {
    if (!this.synth || this.voices.length === 0) return null;
    const langCode = LANGUAGE_CODE_MAP[language] ?? "en-US";

    const femaleNames = ["female", "samantha", "victoria", "karen", "moira", "tessa", "fiona", "zira", "susan"];
    const maleNames = ["male", "daniel", "alex", "fred", "david", "george", "rishi"];

    const preferredNames = voiceType === "female" ? femaleNames : maleNames;
    const langVoices = this.voices.filter((v) => v.lang.startsWith(langCode.split("-")[0]));
    const searchPool = langVoices.length > 0 ? langVoices : this.voices;

    for (const name of preferredNames) {
      const match = searchPool.find((v) => v.name.toLowerCase().includes(name));
      if (match) return match;
    }

    return searchPool[0] ?? this.voices[0] ?? null;
  }

  async speak(text: string, voiceType: VoiceType, language: SupportedLanguage): Promise<void> {
    if (!this.synth) return;

    const cleanText = text.replace(/[*#`_~>|]/g, "").replace(/\[.*?\]/g, "").trim();
    if (!cleanText) return;

    this.stop();

    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(cleanText);
      const voice = this.selectVoice(voiceType, language);
      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang;
      } else {
        utterance.lang = LANGUAGE_CODE_MAP[language] ?? "en-US";
      }

      const speed = this.settings?.speakingSpeed ?? 1.0;
      const pitch = this.settings?.pitch ?? 1.0;
      const volume = this.settings?.volume ?? 1.0;

      utterance.rate = Math.min(Math.max(speed, 0.5), 2.0);
      utterance.pitch = Math.min(Math.max(pitch, 0), 2);
      utterance.volume = Math.min(Math.max(volume, 0), 1);

      utterance.onstart = () => {
        this.isSpeaking = true;
        this.isPaused = false;
        this.notifyStateChange();
      };

      utterance.onend = () => {
        this.isSpeaking = false;
        this.isPaused = false;
        this.currentUtterance = null;
        this.notifyStateChange();
        resolve();
      };

      utterance.onerror = () => {
        this.isSpeaking = false;
        this.isPaused = false;
        this.currentUtterance = null;
        this.notifyStateChange();
        resolve();
      };

      this.currentUtterance = utterance;
      if (this.synth) {
        this.synth.speak(utterance);
      }
    });
  }

  pause() {
    if (this.synth && this.isSpeaking && !this.isPaused) {
      this.synth.pause();
      this.isPaused = true;
      this.notifyStateChange();
    }
  }

  resume() {
    if (this.synth && this.isPaused) {
      this.synth.resume();
      this.isPaused = false;
      this.notifyStateChange();
    }
  }

  stop() {
    if (this.synth) {
      this.synth.cancel();
    }
    this.isSpeaking = false;
    this.isPaused = false;
    this.currentUtterance = null;
    this.queue = [];
    this.notifyStateChange();
  }

  getAvailableVoices(): SpeechSynthesisVoice[] {
    return this.voices;
  }

  isSupported(): boolean {
    return this.synth !== null;
  }

  getState(): VoiceState {
    return {
      isSpeaking: this.isSpeaking,
      isPaused: this.isPaused,
      queueLength: this.queue.length,
    };
  }
}

let voiceEngineInstance: VoiceEngine | null = null;

export function getVoiceEngine(): VoiceEngine {
  if (!voiceEngineInstance) {
    voiceEngineInstance = new VoiceEngine();
  }
  return voiceEngineInstance;
}
