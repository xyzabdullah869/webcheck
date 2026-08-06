import type { AvatarState } from "./types";

export class AvatarRenderer {
  private state: AvatarState = {
    isTalking: false,
    expression: "neutral",
  };
  private listeners: Set<(state: AvatarState) => void> = new Set();

  startTalking() {
    this.state = { ...this.state, isTalking: true, expression: "explaining" };
    this.notifyListeners();
  }

  stopTalking() {
    this.state = { ...this.state, isTalking: false, expression: "neutral" };
    this.notifyListeners();
  }

  setExpression(expression: AvatarState["expression"]) {
    this.state = { ...this.state, expression };
    this.notifyListeners();
  }

  getIsTalking(): boolean { return this.state.isTalking; }
  getState(): AvatarState { return this.state; }

  onStateChange(callback: (state: AvatarState) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners() {
    this.listeners.forEach((cb) => cb(this.state));
  }
}

let avatarInstance: AvatarRenderer | null = null;

export function getAvatarRenderer(): AvatarRenderer {
  if (!avatarInstance) {
    avatarInstance = new AvatarRenderer();
  }
  return avatarInstance;
}
