import React, { useRef, useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Undo2, Redo2, Trash2, Grid3x3, Download } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

export interface DrawingShape {
  type: 'rectangle' | 'circle' | 'line' | 'polygon' | 'freehand' | 'triangle' | 'ellipse' | 'arc' | 'bezier' | 'star' | 'pentagon' | 'hexagon' | 'point';
  points: { x: number; y: number }[];
  color: string;
  fillColor: string;
  strokeWidth: number;
  filled: boolean;
  controlPoints?: { x: number; y: number }[];
  radius?: number;
  startAngle?: number;
  endAngle?: number;
  rotation?: number;
  scale?: { x: number; y: number };
}

interface DrawingCanvasProps {
  shapes: DrawingShape[];
  onShapesChange: (shapes: DrawingShape[]) => void;
  currentTool: string;
  currentColor: string;
  fillColor: string;
  strokeWidth: number;
  filled: boolean;
  enableStroke: boolean;
  selectedShapeIndex: number | null;
  onSelectShape: (index: number | null) => void;
  layerVisibility: Map<number, boolean>;
}

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  shapes: externalShapes,
  onShapesChange,
  currentTool,
  currentColor,
  fillColor,
  strokeWidth,
  filled,
  enableStroke,
  selectedShapeIndex,
  onSelectShape,
  layerVisibility
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [shapes, setShapes] = useState<DrawingShape[]>([]);

  // Sync external shapes with internal state
  useEffect(() => {
    setShapes(externalShapes);
  }, [externalShapes]);
  const [currentShape, setCurrentShape] = useState<DrawingShape | null>(null);
  const [history, setHistory] = useState<DrawingShape[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [showGrid, setShowGrid] = useState(true);
  const [gridSize, setGridSize] = useState(20);
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [polygonPoints, setPolygonPoints] = useState<{ x: number; y: number }[]>([]);
  const [bezierControlPoints, setBezierControlPoints] = useState<{ x: number; y: number }[]>([]);
  const [showAxes, setShowAxes] = useState(true);
  const [axisOrigin, setAxisOrigin] = useState({ x: 600, y: 350 });
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [isDraggingShape, setIsDraggingShape] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [transformMode, setTransformMode] = useState<'move' | 'rotate' | 'scale' | null>(null);

  useEffect(() => {
    redrawCanvas();
  }, [shapes, showGrid, gridSize, currentShape, polygonPoints, bezierControlPoints, showAxes, axisOrigin, selectedShapeIndex, mousePos, layerVisibility]);

  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;

    if (snapToGrid) {
      x = Math.round(x / gridSize) * gridSize;
      y = Math.round(y / gridSize) * gridSize;
    }

    return { x, y };
  };

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (showGrid) {
      ctx.strokeStyle = '#e0e0e0';
      ctx.lineWidth = 0.5;
      
      for (let x = 0; x <= canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      
      for (let y = 0; y <= canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
    }

    // Draw axes
    if (showAxes) {
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      
      // X-axis
      ctx.beginPath();
      ctx.moveTo(0, axisOrigin.y);
      ctx.lineTo(canvas.width, axisOrigin.y);
      ctx.stroke();
      
      // Y-axis
      ctx.beginPath();
      ctx.moveTo(axisOrigin.x, 0);
      ctx.lineTo(axisOrigin.x, canvas.height);
      ctx.stroke();
      
      // Draw axis markers and labels
      ctx.fillStyle = '#000000';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      
      // X-axis markers
      for (let x = 0; x <= canvas.width; x += 50) {
        if (Math.abs(x - axisOrigin.x) < 5) continue;
        ctx.beginPath();
        ctx.moveTo(x, axisOrigin.y - 5);
        ctx.lineTo(x, axisOrigin.y + 5);
        ctx.stroke();
        
        const label = (x - axisOrigin.x).toString();
        ctx.fillText(label, x, axisOrigin.y + 18);
      }
      
      // Y-axis markers
      ctx.textAlign = 'right';
      for (let y = 0; y <= canvas.height; y += 50) {
        if (Math.abs(y - axisOrigin.y) < 5) continue;
        ctx.beginPath();
        ctx.moveTo(axisOrigin.x - 5, y);
        ctx.lineTo(axisOrigin.x + 5, y);
        ctx.stroke();
        
        const label = (axisOrigin.y - y).toString();
        ctx.fillText(label, axisOrigin.x - 10, y + 4);
      }
      
      // Origin label
      ctx.textAlign = 'right';
      ctx.fillText('0', axisOrigin.x - 10, axisOrigin.y + 18);
      
      // Axis labels
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('X', canvas.width - 15, axisOrigin.y - 10);
      ctx.fillText('Y', axisOrigin.x + 15, 15);
    }

    shapes.forEach((shape, index) => {
      const isVisible = layerVisibility.get(index) !== false;
      if (isVisible) {
        drawShape(ctx, shape, index === selectedShapeIndex);
      }
    });
    
    if (currentShape) {
      drawShape(ctx, currentShape);
    }

    // Draw polygon preview
    if (currentTool === 'polygon' && polygonPoints.length > 0) {
      ctx.strokeStyle = currentColor;
      ctx.fillStyle = 'rgba(0, 100, 255, 0.1)';
      ctx.lineWidth = strokeWidth;
      
      ctx.beginPath();
      ctx.moveTo(polygonPoints[0].x, polygonPoints[0].y);
      for (let i = 1; i < polygonPoints.length; i++) {
        ctx.lineTo(polygonPoints[i].x, polygonPoints[i].y);
      }
      ctx.stroke();
      
      // Draw points
      polygonPoints.forEach((point, index) => {
        ctx.fillStyle = index === 0 ? '#00ff00' : '#ff0000';
        ctx.beginPath();
        ctx.arc(point.x, point.y, 4, 0, 2 * Math.PI);
        ctx.fill();
      });
    }

    // Draw bezier control points
    if (currentTool === 'bezier' && bezierControlPoints.length > 0) {
      bezierControlPoints.forEach((point, index) => {
        ctx.fillStyle = '#0000ff';
        ctx.beginPath();
        ctx.arc(point.x, point.y, 4, 0, 2 * Math.PI);
        ctx.fill();
        
        ctx.fillStyle = '#000000';
        ctx.fillText(`P${index}`, point.x + 6, point.y - 6);
      });

      if (bezierControlPoints.length >= 2) {
        ctx.strokeStyle = '#0000ff';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        for (let i = 0; i < bezierControlPoints.length - 1; i++) {
          ctx.moveTo(bezierControlPoints[i].x, bezierControlPoints[i].y);
          ctx.lineTo(bezierControlPoints[i + 1].x, bezierControlPoints[i + 1].y);
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // Draw mouse coordinates
    if (mousePos) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(mousePos.x + 15, mousePos.y - 25, 100, 20);
      ctx.fillStyle = '#ffffff';
      ctx.font = '11px monospace';
      ctx.textAlign = 'left';
      const relX = (mousePos.x - axisOrigin.x).toFixed(0);
      const relY = (axisOrigin.y - mousePos.y).toFixed(0);
      ctx.fillText(`(${relX}, ${relY})`, mousePos.x + 20, mousePos.y - 10);
    }
  };

  const drawShape = (ctx: CanvasRenderingContext2D, shape: DrawingShape, isSelected: boolean = false) => {
    const useStroke = shape.strokeWidth > 0;
    
    ctx.strokeStyle = shape.color;
    ctx.fillStyle = shape.fillColor;
    ctx.lineWidth = shape.strokeWidth;

    switch (shape.type) {
      case 'rectangle':
        if (shape.points.length === 2) {
          const width = shape.points[1].x - shape.points[0].x;
          const height = shape.points[1].y - shape.points[0].y;
          if (shape.filled) {
            ctx.fillRect(shape.points[0].x, shape.points[0].y, width, height);
          }
          if (useStroke) {
            ctx.strokeRect(shape.points[0].x, shape.points[0].y, width, height);
          }
        }
        break;

      case 'circle':
        if (shape.points.length === 2) {
          const radius = Math.sqrt(
            Math.pow(shape.points[1].x - shape.points[0].x, 2) +
            Math.pow(shape.points[1].y - shape.points[0].y, 2)
          );
          ctx.beginPath();
          ctx.arc(shape.points[0].x, shape.points[0].y, radius, 0, 2 * Math.PI);
          if (shape.filled) ctx.fill();
          if (useStroke) ctx.stroke();
        }
        break;

      case 'ellipse':
        if (shape.points.length === 2) {
          const radiusX = Math.abs(shape.points[1].x - shape.points[0].x);
          const radiusY = Math.abs(shape.points[1].y - shape.points[0].y);
          ctx.beginPath();
          ctx.ellipse(shape.points[0].x, shape.points[0].y, radiusX, radiusY, 0, 0, 2 * Math.PI);
          if (shape.filled) ctx.fill();
          if (useStroke) ctx.stroke();
        }
        break;

      case 'arc':
        if (shape.points.length === 2 && shape.startAngle !== undefined && shape.endAngle !== undefined) {
          const radius = Math.sqrt(
            Math.pow(shape.points[1].x - shape.points[0].x, 2) +
            Math.pow(shape.points[1].y - shape.points[0].y, 2)
          );
          ctx.beginPath();
          ctx.arc(shape.points[0].x, shape.points[0].y, radius, shape.startAngle, shape.endAngle);
          if (shape.filled) {
            ctx.lineTo(shape.points[0].x, shape.points[0].y);
            ctx.fill();
          }
          if (useStroke) ctx.stroke();
        }
        break;

      case 'line':
        if (shape.points.length === 2) {
          ctx.beginPath();
          ctx.moveTo(shape.points[0].x, shape.points[0].y);
          ctx.lineTo(shape.points[1].x, shape.points[1].y);
          ctx.stroke();
        }
        break;

      case 'triangle':
        if (shape.points.length === 3) {
          ctx.beginPath();
          ctx.moveTo(shape.points[0].x, shape.points[0].y);
          ctx.lineTo(shape.points[1].x, shape.points[1].y);
          ctx.lineTo(shape.points[2].x, shape.points[2].y);
          ctx.closePath();
          if (shape.filled) ctx.fill();
          if (useStroke) ctx.stroke();
        }
        break;

      case 'star':
        if (shape.points.length === 2) {
          const centerX = shape.points[0].x;
          const centerY = shape.points[0].y;
          const radius = Math.sqrt(
            Math.pow(shape.points[1].x - centerX, 2) +
            Math.pow(shape.points[1].y - centerY, 2)
          );
          const innerRadius = radius * 0.5;
          const spikes = 5;

          ctx.beginPath();
          for (let i = 0; i < spikes * 2; i++) {
            const angle = (i * Math.PI) / spikes - Math.PI / 2;
            const r = i % 2 === 0 ? radius : innerRadius;
            const x = centerX + Math.cos(angle) * r;
            const y = centerY + Math.sin(angle) * r;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
          if (shape.filled) ctx.fill();
          if (useStroke) ctx.stroke();
        }
        break;

      case 'pentagon':
      case 'hexagon':
        if (shape.points.length === 2) {
          const centerX = shape.points[0].x;
          const centerY = shape.points[0].y;
          const radius = Math.sqrt(
            Math.pow(shape.points[1].x - centerX, 2) +
            Math.pow(shape.points[1].y - centerY, 2)
          );
          const sides = shape.type === 'pentagon' ? 5 : 6;

          ctx.beginPath();
          for (let i = 0; i < sides; i++) {
            const angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
          if (shape.filled) ctx.fill();
          if (useStroke) ctx.stroke();
        }
        break;

      case 'bezier':
        if (shape.controlPoints && shape.controlPoints.length === 4) {
          ctx.beginPath();
          ctx.moveTo(shape.controlPoints[0].x, shape.controlPoints[0].y);
          ctx.bezierCurveTo(
            shape.controlPoints[1].x, shape.controlPoints[1].y,
            shape.controlPoints[2].x, shape.controlPoints[2].y,
            shape.controlPoints[3].x, shape.controlPoints[3].y
          );
          if (useStroke) ctx.stroke();
        }
        break;

      case 'point':
        if (shape.points.length > 0) {
          shape.points.forEach(point => {
            ctx.fillStyle = shape.color;
            ctx.beginPath();
            ctx.arc(point.x, point.y, Math.max(shape.strokeWidth, 3), 0, 2 * Math.PI);
            ctx.fill();
          });
        }
        break;

      case 'polygon':
      case 'freehand':
        if (shape.points.length > 1) {
          ctx.beginPath();
          ctx.moveTo(shape.points[0].x, shape.points[0].y);
          for (let i = 1; i < shape.points.length; i++) {
            ctx.lineTo(shape.points[i].x, shape.points[i].y);
          }
          if (shape.type === 'polygon') {
            ctx.closePath();
            if (shape.filled) ctx.fill();
          }
          if (useStroke) ctx.stroke();
        }
        break;
    }

    // Draw selection highlight
    if (isSelected && shape.points.length > 0) {
      ctx.strokeStyle = '#0066ff';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      
      // Calculate bounding box
      const xs = shape.points.map(p => p.x);
      const ys = shape.points.map(p => p.y);
      const minX = Math.min(...xs) - 10;
      const maxX = Math.max(...xs) + 10;
      const minY = Math.min(...ys) - 10;
      const maxY = Math.max(...ys) + 10;
      
      ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);
      ctx.setLineDash([]);
      
      // Draw control points
      shape.points.forEach(point => {
        ctx.fillStyle = '#0066ff';
        ctx.beginPath();
        ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      });
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const point = getCanvasCoordinates(e);

    // Handle transform tools
    if (['move', 'rotate', 'scale'].includes(currentTool)) {
      if (selectedShapeIndex !== null) {
        const shape = shapes[selectedShapeIndex];
        if (shape && isPointInShape(point, shape)) {
          setIsDraggingShape(true);
          setTransformMode(currentTool as 'move' | 'rotate' | 'scale');
          const xs = shape.points.map(p => p.x);
          const ys = shape.points.map(p => p.y);
          const centerX = (Math.min(...xs) + Math.max(...xs)) / 2;
          const centerY = (Math.min(...ys) + Math.max(...ys)) / 2;
          setDragOffset({ x: point.x - centerX, y: point.y - centerY });
          return;
        }
      } else {
        toast.warning('Please select a layer first');
        return;
      }
    }

    if (currentTool === 'polygon') {
      setPolygonPoints([...polygonPoints, point]);
      return;
    }

    if (currentTool === 'bezier') {
      const newPoints = [...bezierControlPoints, point];
      setBezierControlPoints(newPoints);
      
      if (newPoints.length === 4) {
        const newShape: DrawingShape = {
          type: 'bezier',
          points: newPoints,
          controlPoints: newPoints,
          color: currentColor,
          fillColor: fillColor,
          strokeWidth: enableStroke ? strokeWidth : 0,
          filled: filled
        };
        const newShapes = [...shapes, newShape];
        setShapes(newShapes);
        addToHistory(newShapes);
        onShapesChange(newShapes);
        setBezierControlPoints([]);
        toast.success('Bezier curve created!');
      }
      return;
    }

    setIsDrawing(true);

    const newShape: DrawingShape = {
      type: currentTool as DrawingShape['type'],
      points: [point],
      color: currentColor,
      fillColor: fillColor,
      strokeWidth: enableStroke ? strokeWidth : 0,
      filled: filled,
      startAngle: 0,
      endAngle: Math.PI * 2
    };

    setCurrentShape(newShape);
  };

  const isPointInShape = (point: { x: number; y: number }, shape: DrawingShape): boolean => {
    if (shape.points.length === 0) return false;
    
    const xs = shape.points.map(p => p.x);
    const ys = shape.points.map(p => p.y);
    const minX = Math.min(...xs) - 10;
    const maxX = Math.max(...xs) + 10;
    const minY = Math.min(...ys) - 10;
    const maxY = Math.max(...ys) + 10;
    
    return point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const point = getCanvasCoordinates(e);
    setMousePos(point);

    if (isDraggingShape && selectedShapeIndex !== null && transformMode) {
      const shape = shapes[selectedShapeIndex];
      if (shape) {
        const xs = shape.points.map(p => p.x);
        const ys = shape.points.map(p => p.y);
        const centerX = (Math.min(...xs) + Math.max(...xs)) / 2;
        const centerY = (Math.min(...ys) + Math.max(...ys)) / 2;
        
        let updatedShape = { ...shape };

        if (transformMode === 'move') {
          // Move: translate all points
          const newCenterX = point.x - dragOffset.x;
          const newCenterY = point.y - dragOffset.y;
          const deltaX = newCenterX - centerX;
          const deltaY = newCenterY - centerY;
          
          updatedShape = {
            ...shape,
            points: shape.points.map(p => ({ x: p.x + deltaX, y: p.y + deltaY })),
            controlPoints: shape.controlPoints?.map(p => ({ x: p.x + deltaX, y: p.y + deltaY }))
          };
        } else if (transformMode === 'rotate') {
          // Rotate: calculate angle and rotate points around center
          const angle1 = Math.atan2(dragOffset.y, dragOffset.x);
          const angle2 = Math.atan2(point.y - centerY, point.x - centerX);
          const rotation = angle2 - angle1;
          
          updatedShape = {
            ...shape,
            rotation: (shape.rotation || 0) + rotation,
            points: shape.points.map(p => {
              const dx = p.x - centerX;
              const dy = p.y - centerY;
              const cos = Math.cos(rotation);
              const sin = Math.sin(rotation);
              return {
                x: centerX + (dx * cos - dy * sin),
                y: centerY + (dx * sin + dy * cos)
              };
            }),
            controlPoints: shape.controlPoints?.map(p => {
              const dx = p.x - centerX;
              const dy = p.y - centerY;
              const cos = Math.cos(rotation);
              const sin = Math.sin(rotation);
              return {
                x: centerX + (dx * cos - dy * sin),
                y: centerY + (dx * sin + dy * cos)
              };
            })
          };
          
          setDragOffset({ x: point.x - centerX, y: point.y - centerY });
        } else if (transformMode === 'scale') {
          // Scale: change distance from center
          const dist1 = Math.sqrt(dragOffset.x * dragOffset.x + dragOffset.y * dragOffset.y);
          const dist2 = Math.sqrt((point.x - centerX) ** 2 + (point.y - centerY) ** 2);
          const scale = dist2 / (dist1 || 1);
          
          updatedShape = {
            ...shape,
            scale: { 
              x: (shape.scale?.x || 1) * scale, 
              y: (shape.scale?.y || 1) * scale 
            },
            points: shape.points.map(p => {
              const dx = p.x - centerX;
              const dy = p.y - centerY;
              return {
                x: centerX + dx * scale,
                y: centerY + dy * scale
              };
            }),
            controlPoints: shape.controlPoints?.map(p => {
              const dx = p.x - centerX;
              const dy = p.y - centerY;
              return {
                x: centerX + dx * scale,
                y: centerY + dy * scale
              };
            })
          };
          
          setDragOffset({ x: point.x - centerX, y: point.y - centerY });
        }
        
        const newShapes = [...shapes];
        newShapes[selectedShapeIndex] = updatedShape;
        setShapes(newShapes);
        onShapesChange(newShapes);
      }
      return;
    }

    if (!isDrawing || !currentShape) return;

    if (currentTool === 'freehand') {
      setCurrentShape({
        ...currentShape,
        points: [...currentShape.points, point]
      });
    } else if (['rectangle', 'circle', 'line', 'ellipse', 'arc', 'star', 'pentagon', 'hexagon'].includes(currentTool)) {
      setCurrentShape({
        ...currentShape,
        points: [currentShape.points[0], point]
      });
    }

    redrawCanvas();
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDraggingShape) {
      setIsDraggingShape(false);
      setTransformMode(null);
      addToHistory(shapes);
      toast.success(`Shape ${transformMode}d successfully`);
      return;
    }

    if (!isDrawing || !currentShape) return;

    const point = getCanvasCoordinates(e);

    const finalShape = {
      ...currentShape,
      points: currentTool === 'freehand' ? currentShape.points : 
              [...currentShape.points.slice(0, -1), point]
    };

    if (currentTool === 'point') {
      finalShape.points = [point];
    }

    const newShapes = [...shapes, finalShape];
    setShapes(newShapes);
    addToHistory(newShapes);
    onShapesChange(newShapes);
    setCurrentShape(null);
    setIsDrawing(false);
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (currentTool === 'polygon' && polygonPoints.length >= 3) {
      const newShape: DrawingShape = {
        type: 'polygon',
        points: polygonPoints,
        color: currentColor,
        fillColor: fillColor,
        strokeWidth: enableStroke ? strokeWidth : 0,
        filled: filled
      };
      
      const newShapes = [...shapes, newShape];
      setShapes(newShapes);
      addToHistory(newShapes);
      onShapesChange(newShapes);
      setPolygonPoints([]);
      toast.success('Polygon created!');
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (polygonPoints.length > 0) {
        setPolygonPoints([]);
        toast.info('Polygon cancelled');
      }
      if (bezierControlPoints.length > 0) {
        setBezierControlPoints([]);
        toast.info('Bezier cancelled');
      }
    } else if (e.key === 'Enter' && polygonPoints.length >= 3) {
      const newShape: DrawingShape = {
        type: 'polygon',
        points: polygonPoints,
        color: currentColor,
        fillColor: fillColor,
        strokeWidth: enableStroke ? strokeWidth : 0,
        filled: filled
      };
      
      const newShapes = [...shapes, newShape];
      setShapes(newShapes);
      addToHistory(newShapes);
      onShapesChange(newShapes);
      setPolygonPoints([]);
      toast.success('Polygon created!');
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [polygonPoints, bezierControlPoints, currentColor, fillColor, strokeWidth, filled]);

  const addToHistory = (newShapes: DrawingShape[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newShapes);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setShapes(history[newIndex]);
      onShapesChange(history[newIndex]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setShapes(history[newIndex]);
      onShapesChange(history[newIndex]);
    }
  };

  const clearCanvas = () => {
    const newShapes: DrawingShape[] = [];
    setShapes(newShapes);
    addToHistory(newShapes);
    onShapesChange(newShapes);
    setPolygonPoints([]);
    setBezierControlPoints([]);
  };

  const downloadAsImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = 'drawing.png';
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2 items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div className="flex gap-2">
          <Button
            onClick={undo}
            disabled={historyIndex === 0}
            variant="outline"
            size="sm"
          >
            <Undo2 className="w-4 h-4" />
          </Button>
          <Button
            onClick={redo}
            disabled={historyIndex === history.length - 1}
            variant="outline"
            size="sm"
          >
            <Redo2 className="w-4 h-4" />
          </Button>
          <Button
            onClick={clearCanvas}
            variant="outline"
            size="sm"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
          <Button
            onClick={downloadAsImage}
            variant="outline"
            size="sm"
          >
            <Download className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              id="show-grid"
              checked={showGrid}
              onCheckedChange={setShowGrid}
            />
            <Label htmlFor="show-grid" className="flex items-center gap-1">
              <Grid3x3 className="w-4 h-4" />
              Grid
            </Label>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="snap-grid"
              checked={snapToGrid}
              onCheckedChange={setSnapToGrid}
            />
            <Label htmlFor="snap-grid">Snap</Label>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="show-axes"
              checked={showAxes}
              onCheckedChange={setShowAxes}
            />
            <Label htmlFor="show-axes">Axes</Label>
          </div>

          <div className="flex items-center gap-2">
            <Label>Grid Size:</Label>
            <Slider
              value={[gridSize]}
              onValueChange={(value) => setGridSize(value[0])}
              min={10}
              max={50}
              step={5}
              className="w-24"
            />
            <span className="text-sm w-8">{gridSize}</span>
          </div>
        </div>
      </div>

      {(polygonPoints.length > 0 || bezierControlPoints.length > 0 || ['move', 'rotate', 'scale'].includes(currentTool)) && (
        <div className="p-3 bg-blue-100 border border-blue-300 rounded-lg">
          {polygonPoints.length > 0 && (
            <p className="text-sm">
              <strong>Polygon Mode:</strong> {polygonPoints.length} points added. 
              Double-click or press Enter to finish. Press Escape to cancel.
            </p>
          )}
          {bezierControlPoints.length > 0 && (
            <p className="text-sm">
              <strong>Bezier Mode:</strong> {bezierControlPoints.length}/4 control points. 
              Press Escape to cancel.
            </p>
          )}
          {['move', 'rotate', 'scale'].includes(currentTool) && (
            <p className="text-sm">
              <strong>{currentTool.charAt(0).toUpperCase() + currentTool.slice(1)} Mode:</strong> 
              {selectedShapeIndex !== null 
                ? ` Layer ${selectedShapeIndex + 1} selected. Click and drag to ${currentTool}.`
                : ' Please select a layer from the Layers panel first.'}
            </p>
          )}
        </div>
      )}

      <div className="border-2 border-gray-300 rounded-lg overflow-hidden">
        <canvas
          ref={canvasRef}
          width={1200}
          height={700}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onDoubleClick={handleDoubleClick}
          className="cursor-crosshair bg-white"
        />
      </div>
    </div>
  );
};
