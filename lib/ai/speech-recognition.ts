import type { SupportedLanguage } from "./types";

const RECOGNITION_LANG_MAP: Record<SupportedLanguage, string> = {
  en: "en-US",
  ur: "ur-PK",
  "roman-ur": "en-US",
  mixed: "en-US",
};

type SpeechRecognitionInstance = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
};

type SpeechRecognitionEvent = {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: { isFinal: boolean; [index: number]: { transcript: string } };
  };
};

type SpeechRecognitionErrorEvent = { error: string };

export class SpeechRecognitionEngine {
  private recognition: SpeechRecognitionInstance | null = null;
  private isListening = false;
  private currentLang: SupportedLanguage = "en";
  private onResult: ((text: string, isFinal: boolean) => void) | null = null;
  private onError: ((error: string) => void) | null = null;
  private onEnd: (() => void) | null = null;
  private shouldRestart = false;

  constructor() {
    if (typeof window !== "undefined") {
      const w = window as unknown as {
        SpeechRecognition?: new () => SpeechRecognitionInstance;
        webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
      };
      const SRClass = w.SpeechRecognition ?? w.webkitSpeechRecognition;
      if (SRClass) {
        this.recognition = new SRClass();
      }
    }
  }

  isSupported(): boolean { return this.recognition !== null; }

  setLanguage(lang: SupportedLanguage) {
    this.currentLang = lang;
    if (this.recognition) {
      this.recognition.lang = RECOGNITION_LANG_MAP[lang] ?? "en-US";
    }
  }

  setCallbacks(callbacks: {
    onResult: (text: string, isFinal: boolean) => void;
    onError?: (error: string) => void;
    onEnd?: () => void;
  }) {
    this.onResult = callbacks.onResult;
    this.onError = callbacks.onError ?? null;
    this.onEnd = callbacks.onEnd ?? null;
  }

  start(continuous = false) {
    if (!this.recognition || this.isListening) return;
    this.shouldRestart = continuous;
    this.recognition.continuous = continuous;
    this.recognition.interimResults = true;
    this.recognition.lang = RECOGNITION_LANG_MAP[this.currentLang] ?? "en-US";

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimText = "";
      let finalText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalText += transcript;
        else interimText += transcript;
      }
      if (finalText && this.onResult) this.onResult(finalText.trim(), true);
      else if (interimText && this.onResult) this.onResult(interimText.trim(), false);
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (this.onError) this.onError(event.error ?? "Unknown error");
    };

    this.recognition.onend = () => {
      this.isListening = false;
      if (this.shouldRestart) {
        try { this.recognition?.start(); this.isListening = true; } catch {}
      } else {
        if (this.onEnd) this.onEnd();
      }
    };

    try {
      this.recognition.start();
      this.isListening = true;
    } catch (err) {
      if (this.onError) this.onError(err instanceof Error ? err.message : "Failed to start");
    }
  }

  stop() {
    this.shouldRestart = false;
    if (this.recognition && this.isListening) {
      try { this.recognition.stop(); } catch {}
    }
    this.isListening = false;
  }

  getIsListening(): boolean { return this.isListening; }
}

let speechRecognitionInstance: SpeechRecognitionEngine | null = null;

export function getSpeechRecognition(): SpeechRecognitionEngine {
  if (!speechRecognitionInstance) {
    speechRecognitionInstance = new SpeechRecognitionEngine();
  }
  return speechRecognitionInstance;
}
