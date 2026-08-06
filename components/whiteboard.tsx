'use client';

import * as React from 'react';
import { Eraser, Trash2, Download, Pencil, Type as TypeIcon, Square, Circle, Minus, Hand, ZoomIn, ZoomOut, Undo2, Redo2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Tool = 'pen' | 'eraser' | 'text' | 'rect' | 'circle' | 'line' | 'pan';

type Point = { x: number; y: number };
type Shape = {
  type: 'pen' | 'rect' | 'circle' | 'line' | 'text';
  points: Point[];
  text?: string;
  color: string;
  size: number;
};

type WhiteboardProps = {
  className?: string;
  onExplain?: (imageData: string) => void;
};

const COLORS = ['#1e293b', '#2563eb', '#dc2626', '#16a34a', '#ca8a04', '#7c3aed', '#0891b2'];

export function Whiteboard({ className, onExplain }: WhiteboardProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [tool, setTool] = React.useState<Tool>('pen');
  const [color, setColor] = React.useState('#1e293b');
  const [size, setSize] = React.useState(3);
  const [isDrawing, setIsDrawing] = React.useState(false);
  const [shapes, setShapes] = React.useState<Shape[]>([]);
  const [redoStack, setRedoStack] = React.useState<Shape[]>([]);
  const [currentShape, setCurrentShape] = React.useState<Shape | null>(null);
  const [zoom, setZoom] = React.useState(1);
  const [pan, setPan] = React.useState<Point>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = React.useState(false);
  const [panStart, setPanStart] = React.useState<Point>({ x: 0, y: 0 });
  const [textInput, setTextInput] = React.useState<{ x: number; y: number; value: string } | null>(null);
  const [aiExplanation, setAiExplanation] = React.useState<string | null>(null);

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / zoom - pan.x,
      y: (e.clientY - rect.top) / zoom - pan.y,
    };
  };

  const redraw = React.useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const isDark = document.documentElement.classList.contains('dark');
    const bgColor = isDark ? '#1a1a2e' : '#ffffff';
    const penDefaultColor = isDark ? '#e2e8f0' : '#1e293b';

    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.scale(zoom, zoom);
    ctx.translate(pan.x, pan.y);

    ctx.fillStyle = bgColor;
    ctx.fillRect(-pan.x, -pan.y, canvas.width / zoom, canvas.height / zoom);

    const drawShape = (shape: Shape) => {
      const shapeColor = shape.color === '#1e293b' && isDark ? penDefaultColor : shape.color;
      ctx.strokeStyle = shapeColor;
      ctx.fillStyle = shapeColor;
      ctx.lineWidth = shape.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (shape.type === 'pen') {
        ctx.beginPath();
        shape.points.forEach((p, i) => {
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();
      } else if (shape.type === 'rect' && shape.points.length >= 2) {
        const [s, e] = shape.points;
        ctx.strokeRect(s.x, s.y, e.x - s.x, e.y - s.y);
      } else if (shape.type === 'circle' && shape.points.length >= 2) {
        const [s, e] = shape.points;
        const r = Math.max(1, Math.hypot(e.x - s.x, e.y - s.y));
        ctx.beginPath();
        ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
        ctx.stroke();
      } else if (shape.type === 'line' && shape.points.length >= 2) {
        const [s, e] = shape.points;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(e.x, e.y);
        ctx.stroke();
      } else if (shape.type === 'text' && shape.text) {
        ctx.font = `${Math.max(8, shape.size * 6)}px sans-serif`;
        ctx.fillText(shape.text, shape.points[0].x, shape.points[0].y);
      }
    };

    shapes.forEach(drawShape);
    if (currentShape) drawShape(currentShape);

    ctx.restore();
  }, [shapes, currentShape, zoom, pan]);

  React.useEffect(() => {
    redraw();
  }, [redraw]);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const resize = () => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      redraw();
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [redraw]);

  // Touch support
  const getTouchPos = (e: React.TouchEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0] || e.changedTouches[0];
    return {
      x: (touch.clientX - rect.left) / zoom - pan.x,
      y: (touch.clientY - rect.top) / zoom - pan.y,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (tool === 'pan') {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x * zoom, y: e.clientY - pan.y * zoom });
      return;
    }
    if (tool === 'text') {
      const pos = getMousePos(e);
      setTextInput({ x: pos.x, y: pos.y, value: '' });
      return;
    }

    setIsDrawing(true);
    const pos = getMousePos(e);
    const isDark = document.documentElement.classList.contains('dark');
    const shapeType = tool === 'eraser' ? 'pen' : tool;
    const eraserColor = isDark ? '#1a1a2e' : '#ffffff';
    setCurrentShape({
      type: shapeType as Shape['type'],
      points: [pos],
      color: tool === 'eraser' ? eraserColor : color,
      size: tool === 'eraser' ? size * 4 : size,
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPanning) {
      setPan({ x: (e.clientX - panStart.x) / zoom, y: (e.clientY - panStart.y) / zoom });
      return;
    }
    if (!isDrawing || !currentShape) return;
    const pos = getMousePos(e);
    setCurrentShape({ ...currentShape, points: [...currentShape.points, pos] });
  };

  const handleMouseUp = () => {
    if (isPanning) { setIsPanning(false); return; }
    if (currentShape) {
      setShapes((prev) => [...prev, currentShape]);
      setRedoStack([]);
      setCurrentShape(null);
    }
    setIsDrawing(false);
  };

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (tool === 'pan') {
      setIsPanning(true);
      const touch = e.touches[0];
      setPanStart({ x: touch.clientX - pan.x * zoom, y: touch.clientY - pan.y * zoom });
      return;
    }
    if (tool === 'text') {
      const pos = getTouchPos(e);
      setTextInput({ x: pos.x, y: pos.y, value: '' });
      return;
    }
    setIsDrawing(true);
    const pos = getTouchPos(e);
    const isDark = document.documentElement.classList.contains('dark');
    const shapeType = tool === 'eraser' ? 'pen' : tool;
    const eraserColor = isDark ? '#1a1a2e' : '#ffffff';
    setCurrentShape({
      type: shapeType as Shape['type'],
      points: [pos],
      color: tool === 'eraser' ? eraserColor : color,
      size: tool === 'eraser' ? size * 4 : size,
    });
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (isPanning) {
      const touch = e.touches[0];
      setPan({ x: (touch.clientX - panStart.x) / zoom, y: (touch.clientY - panStart.y) / zoom });
      return;
    }
    if (!isDrawing || !currentShape) return;
    const pos = getTouchPos(e);
    setCurrentShape({ ...currentShape, points: [...currentShape.points, pos] });
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    handleMouseUp();
  };

  const handleTextSubmit = () => {
    if (textInput && textInput.value.trim()) {
      setShapes((prev) => [...prev, {
        type: 'text',
        points: [{ x: textInput.x, y: textInput.y }],
        text: textInput.value,
        color,
        size,
      }]);
      setRedoStack([]);
    }
    setTextInput(null);
  };

  const undo = () => {
    setShapes((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      setRedoStack((r) => [...r, last]);
      return prev.slice(0, -1);
    });
  };

  const redo = () => {
    setRedoStack((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      setShapes((s) => [...s, last]);
      return prev.slice(0, -1);
    });
  };

  const clearBoard = () => {
    setRedoStack([]);
    setShapes([]);
  };

  const downloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `whiteboard-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleAiExplain = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const imageData = canvas.toDataURL('image/png');
    if (onExplain) {
      onExplain(imageData);
    }
    setAiExplanation('The AI Tutor is analyzing your whiteboard content. Based on the diagrams and notes, here are some observations and explanations. (This feature will provide AI-generated explanations of your whiteboard drawings.)');
  };

  const tools: { tool: Tool; icon: typeof Pencil; label: string }[] = [
    { tool: 'pen', icon: Pencil, label: 'Draw' },
    { tool: 'eraser', icon: Eraser, label: 'Erase' },
    { tool: 'text', icon: TypeIcon, label: 'Text' },
    { tool: 'rect', icon: Square, label: 'Rectangle' },
    { tool: 'circle', icon: Circle, label: 'Circle' },
    { tool: 'line', icon: Minus, label: 'Line' },
    { tool: 'pan', icon: Hand, label: 'Pan' },
  ];

  return (
    <div className={cn('flex flex-col rounded-xl border bg-card shadow-soft', className)}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b p-3">
        <div className="flex gap-1">
          {tools.map((t) => (
            <button
              key={t.tool}
              onClick={() => setTool(t.tool)}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-lg border transition-colors',
                tool === t.tool ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-muted'
              )}
              title={t.label}
            >
              <t.icon className="h-4 w-4" />
            </button>
          ))}
        </div>

        <div className="mx-1 h-6 w-px bg-border" />

        {/* Color picker */}
        <div className="flex gap-1">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={cn(
                'h-6 w-6 rounded-full border-2 transition-transform',
                color === c ? 'scale-110 border-primary' : 'border-border'
              )}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        <div className="mx-1 h-6 w-px bg-border" />

        {/* Size */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Size</span>
          <input
            type="range"
            min="1"
            max="12"
            value={size}
            onChange={(e) => setSize(parseInt(e.target.value))}
            className="w-20"
          />
        </div>

        <div className="mx-1 h-6 w-px bg-border" />

        {/* Undo/Redo */}
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" onClick={undo} disabled={shapes.length === 0} title="Undo">
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={redo} disabled={redoStack.length === 0} title="Redo">
            <Redo2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="mx-1 h-6 w-px bg-border" />

        {/* Zoom */}
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-xs text-muted-foreground">{Math.round(zoom * 100)}%</span>
          <Button size="sm" variant="ghost" onClick={() => setZoom(Math.min(3, zoom + 0.1))}>
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>

        <div className="ml-auto flex gap-1">
          <Button size="sm" variant="ghost" onClick={handleAiExplain} title="AI Explain">
            <Sparkles className="mr-1 h-4 w-4" /> AI Explain
          </Button>
          <Button size="sm" variant="ghost" onClick={downloadImage} title="Download">
            <Download className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" className="text-rose-600" onClick={clearBoard} title="Clear">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Canvas */}
      <div ref={containerRef} className="relative flex-1 overflow-hidden" style={{ minHeight: '400px' }}>
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className={cn(
            'absolute inset-0 touch-none',
            tool === 'pan' ? 'cursor-grab' : tool === 'text' ? 'cursor-text' : 'cursor-crosshair'
          )}
        />
        {textInput && (
          <div
            className="absolute z-10"
            style={{ left: textInput.x * zoom + pan.x * zoom, top: textInput.y * zoom + pan.y * zoom }}
          >
            <input
              autoFocus
              value={textInput.value}
              onChange={(e) => setTextInput({ ...textInput, value: e.target.value })}
              onKeyDown={(e) => { if (e.key === 'Enter') handleTextSubmit(); if (e.key === 'Escape') setTextInput(null); }}
              onBlur={handleTextSubmit}
              className="rounded border bg-background px-2 py-1 text-sm shadow-sm"
              style={{ color }}
              placeholder="Type text..."
            />
          </div>
        )}
      </div>

      {/* AI Explanation */}
      {aiExplanation && (
        <div className="border-t bg-blue-50 p-4 dark:bg-blue-900/20">
          <div className="flex items-start gap-2">
            <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-blue-500" />
            <div>
              <p className="text-sm font-semibold text-blue-700 dark:text-blue-400">AI Tutor Analysis</p>
              <p className="mt-1 text-sm text-muted-foreground">{aiExplanation}</p>
              <Button size="sm" variant="ghost" className="mt-2" onClick={() => setAiExplanation(null)}>
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
