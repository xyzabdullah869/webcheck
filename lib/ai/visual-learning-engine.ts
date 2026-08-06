import type { VisualItem } from "./types";

export type VisualLearningState = {
  isVisible: boolean;
  items: VisualItem[];
};

export class VisualLearningEngine {
  private state: VisualLearningState = { isVisible: false, items: [] };
  private listeners: Set<(state: VisualLearningState) => void> = new Set();

  shouldShowVisual(topic: string, content: string): boolean {
    const indicators = [
      "code", "function", "class", "method", "```",
      "table", "| --- |",
      "formula", "equation", "=",
      "chart", "graph", "axis",
      "timeline", "year", "date",
      "diagram", "flow",
    ];
    const lower = (topic + " " + content).toLowerCase();
    return indicators.some((ind) => lower.includes(ind));
  }

  buildVisualItemsFromContent(topic: string, content: string): VisualItem[] {
    const items: VisualItem[] = [];

    const codeBlocks = content.match(/```(\w+)?\n([\s\S]*?)```/g);
    if (codeBlocks) {
      for (const block of codeBlocks) {
        const match = block.match(/```(\w+)?\n([\s\S]*?)```/);
        if (match) {
          items.push({
            id: `visual_code_${items.length}`,
            type: "code",
            title: "Code Example",
            content: match[2].trim(),
            language: match[1] ?? "text",
          });
        }
      }
    }

    if (content.includes("|") && content.includes("---")) {
      const tableMatch = content.match(/(\|[^\n]+\|\n\|[-: |]+\n(?:\|[^\n]+\|\n?)+)/);
      if (tableMatch) {
        items.push({
          id: `visual_table_${items.length}`,
          type: "table",
          title: "Comparison Table",
          content: tableMatch[1].trim(),
        });
      }
    }

    const formulas = content.match(/\$[^$]+\$|\\\[.*?\\\]/g);
    if (formulas) {
      for (const formula of formulas.slice(0, 3)) {
        items.push({
          id: `visual_formula_${items.length}`,
          type: "formula",
          title: "Formula",
          content: formula,
        });
      }
    }

    return items;
  }

  show(items: VisualItem[]) {
    if (items.length === 0) return;
    this.state = { isVisible: true, items };
    this.notifyListeners();
  }

  hide() {
    this.state = { isVisible: false, items: [] };
    this.notifyListeners();
  }

  getState(): VisualLearningState { return this.state; }

  onStateChange(callback: (state: VisualLearningState) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners() {
    this.listeners.forEach((cb) => cb(this.state));
  }
}
