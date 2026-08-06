import type { WhiteboardState } from "./types";

export class WhiteboardEngine {
  private state: WhiteboardState = {
    isActive: false,
    currentTopic: null,
    diagramType: null,
    elements: [],
  };
  private listeners: Set<(state: WhiteboardState) => void> = new Set();

  shouldUseWhiteboard(topic: string, content: string): boolean {
    const indicators = [
      "flowchart", "diagram", "process", "steps", "algorithm", "workflow",
      "compare", "versus", "vs", "difference", "table",
      "graph", "chart", "equation", "formula", "calculate",
      "mind map", "concept map", "hierarchy", "structure",
    ];
    const lower = (topic + " " + content).toLowerCase();
    return indicators.some((ind) => lower.includes(ind));
  }

  detectDiagramType(topic: string, content: string): WhiteboardState["diagramType"] {
    const lower = (topic + " " + content).toLowerCase();
    if (lower.includes("equation") || lower.includes("formula") || lower.includes("calculate")) return "equation";
    if (lower.includes("flowchart") || lower.includes("process") || lower.includes("algorithm") || lower.includes("workflow")) return "flowchart";
    if (lower.includes("mind map") || lower.includes("concept map") || lower.includes("hierarchy")) return "mindmap";
    if (lower.includes("table") || lower.includes("compare") || lower.includes("versus")) return "table";
    if (lower.includes("graph") || lower.includes("chart")) return "graph";
    return "drawing";
  }

  activate(topic: string, diagramType: WhiteboardState["diagramType"]) {
    this.state = { ...this.state, isActive: true, currentTopic: topic, diagramType };
    this.notifyListeners();
  }

  deactivate() {
    this.state = { isActive: false, currentTopic: null, diagramType: null, elements: [] };
    this.notifyListeners();
  }

  addElement(element: unknown) {
    this.state = { ...this.state, elements: [...this.state.elements, element] };
    this.notifyListeners();
  }

  clearElements() {
    this.state = { ...this.state, elements: [] };
    this.notifyListeners();
  }

  getState(): WhiteboardState { return this.state; }

  onStateChange(callback: (state: WhiteboardState) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners() {
    this.listeners.forEach((cb) => cb(this.state));
  }
}
