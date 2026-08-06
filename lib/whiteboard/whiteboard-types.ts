export type WhiteboardTool =
  | "drawing"
  | "flowchart"
  | "graph"
  | "math"
  | "diagram"
  | "animation";

export type WhiteboardElement = {
  id: string;
  tool: WhiteboardTool;
  layer: number;
  properties: Record<string, unknown>;
};

export type WhiteboardState = {
  elements: WhiteboardElement[];
  activeTool: WhiteboardTool | null;
  width: number;
  height: number;
};

export const SUPPORTED_WHITEBOARD_TOOLS: WhiteboardTool[] = [
  "drawing",
  "flowchart",
  "graph",
  "math",
  "diagram",
  "animation",
];

export function createEmptyWhiteboard(): WhiteboardState {
  return { elements: [], activeTool: null, width: 1920, height: 1080 };
}
