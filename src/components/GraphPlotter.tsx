import React, { useRef, useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Slider } from './ui/slider';
import { Plus, Trash2, Eye, EyeOff } from 'lucide-react';

interface GraphFunction {
  id: string;
  expression: string;
  color: string;
  visible: boolean;
}

interface GraphPlotterProps {
  onGraphPointsChange?: (points: Array<{ x: number; y: number; color: string }[]>) => void;
}

export const GraphPlotter: React.FC<GraphPlotterProps> = ({ onGraphPointsChange }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [functions, setFunctions] = useState<GraphFunction[]>([
    { id: '1', expression: 'sin(x)', color: '#FF0000', visible: true },
    { id: '2', expression: 'x = 3', color: '#00AA00', visible: true },
  ]);
  const [xMin, setXMin] = useState(-10);
  const [xMax, setXMax] = useState(10);
  const [yMin, setYMin] = useState(-10);
  const [yMax, setYMax] = useState(10);
  const [showGrid, setShowGrid] = useState(true);
  const [gridSpacing, setGridSpacing] = useState(1);

  useEffect(() => {
    drawGraph();
  }, [functions, xMin, xMax, yMin, yMax, showGrid, gridSpacing]);

  const parseEquation = (expr: string): { type: 'y', eval: (x: number) => number } | { type: 'x', value: number } | null => {
    try {
      // Check if it's an implicit equation like x = 5
      const xEqualsMatch = expr.match(/^\s*x\s*=\s*([-+]?\d+\.?\d*)\s*$/);
      if (xEqualsMatch) {
        return { type: 'x', value: parseFloat(xEqualsMatch[1]) };
      }

      // Check if it's y = expression
      let expression = expr;
      const yEqualsMatch = expr.match(/^\s*y\s*=\s*(.+)$/);
      if (yEqualsMatch) {
        expression = yEqualsMatch[1];
      }

      const safeExpr = expression
        .replace(/\^/g, '**')
        .replace(/sin/g, 'Math.sin')
        .replace(/cos/g, 'Math.cos')
        .replace(/tan/g, 'Math.tan')
        .replace(/sqrt/g, 'Math.sqrt')
        .replace(/abs/g, 'Math.abs')
        .replace(/log/g, 'Math.log')
        .replace(/ln/g, 'Math.log')
        .replace(/exp/g, 'Math.exp')
        .replace(/pi/g, 'Math.PI')
        .replace(/e(?![a-z])/g, 'Math.E');

      const func = new Function('x', `return ${safeExpr}`);
      return { type: 'y', eval: (x: number) => func(x) };
    } catch (error) {
      return null;
    }
  };

  const graphToCanvas = (graphX: number, graphY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const canvasX = ((graphX - xMin) / (xMax - xMin)) * canvas.width;
    const canvasY = ((yMax - graphY) / (yMax - yMin)) * canvas.height;
    return { x: canvasX, y: canvasY };
  };

  const drawGraph = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (showGrid) {
      ctx.strokeStyle = '#e0e0e0';
      ctx.lineWidth = 1;

      for (let x = Math.ceil(xMin / gridSpacing) * gridSpacing; x <= xMax; x += gridSpacing) {
        const canvasPos = graphToCanvas(x, 0);
        ctx.beginPath();
        ctx.moveTo(canvasPos.x, 0);
        ctx.lineTo(canvasPos.x, canvas.height);
        ctx.stroke();
      }

      for (let y = Math.ceil(yMin / gridSpacing) * gridSpacing; y <= yMax; y += gridSpacing) {
        const canvasPos = graphToCanvas(0, y);
        ctx.beginPath();
        ctx.moveTo(0, canvasPos.y);
        ctx.lineTo(canvas.width, canvasPos.y);
        ctx.stroke();
      }
    }

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;

    const xAxisY = graphToCanvas(0, 0).y;
    if (xAxisY >= 0 && xAxisY <= canvas.height) {
      ctx.beginPath();
      ctx.moveTo(0, xAxisY);
      ctx.lineTo(canvas.width, xAxisY);
      ctx.stroke();
    }

    const yAxisX = graphToCanvas(0, 0).x;
    if (yAxisX >= 0 && yAxisX <= canvas.width) {
      ctx.beginPath();
      ctx.moveTo(yAxisX, 0);
      ctx.lineTo(yAxisX, canvas.height);
      ctx.stroke();
    }

    ctx.fillStyle = '#000000';
    ctx.font = '12px monospace';

    for (let x = Math.ceil(xMin); x <= Math.floor(xMax); x++) {
      if (x === 0) continue;
      const pos = graphToCanvas(x, 0);
      ctx.fillText(x.toString(), pos.x - 10, pos.y + 15);
    }

    for (let y = Math.ceil(yMin); y <= Math.floor(yMax); y++) {
      if (y === 0) continue;
      const pos = graphToCanvas(0, y);
      ctx.fillText(y.toString(), pos.x + 5, pos.y + 5);
    }

    // Collect all graph points for FreeGLUT code generation
    const allGraphPoints: Array<{ x: number; y: number; color: string }[]> = [];

    functions.forEach(func => {
      if (!func.visible) return;

      const parsed = parseEquation(func.expression);
      if (!parsed) return;

      ctx.strokeStyle = func.color;
      ctx.lineWidth = 2;
      
      const functionPoints: { x: number; y: number; color: string }[] = [];

      if (parsed.type === 'x') {
        // Vertical line: x = constant
        const canvasX = graphToCanvas(parsed.value, 0).x;
        ctx.beginPath();
        ctx.moveTo(canvasX, 0);
        ctx.lineTo(canvasX, canvas.height);
        ctx.stroke();

        // Collect points for vertical line
        for (let y = yMin; y <= yMax; y += (yMax - yMin) / 100) {
          const canvasPos = graphToCanvas(parsed.value, y);
          functionPoints.push({
            x: canvasPos.x,
            y: canvasPos.y,
            color: func.color
          });
        }
      } else {
        // Regular y = f(x) function
        ctx.beginPath();
        let started = false;
        const step = (xMax - xMin) / canvas.width;

        for (let x = xMin; x <= xMax; x += step) {
          const y = parsed.eval(x);
          
          if (isNaN(y) || !isFinite(y)) {
            started = false;
            continue;
          }

          const canvasPos = graphToCanvas(x, y);

          if (canvasPos.y < -100 || canvasPos.y > canvas.height + 100) {
            started = false;
            continue;
          }

          // Collect points for code generation
          functionPoints.push({
            x: canvasPos.x,
            y: canvasPos.y,
            color: func.color
          });

          if (!started) {
            ctx.moveTo(canvasPos.x, canvasPos.y);
            started = true;
          } else {
            ctx.lineTo(canvasPos.x, canvasPos.y);
          }
        }

        ctx.stroke();
      }
      
      if (functionPoints.length > 0) {
        allGraphPoints.push(functionPoints);
      }
    });

    // Pass graph points to parent for code generation
    if (onGraphPointsChange) {
      onGraphPointsChange(allGraphPoints);
    }
  };

  const addFunction = () => {
    const newFunc: GraphFunction = {
      id: Date.now().toString(),
      expression: 'x^2',
      color: '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'),
      visible: true
    };
    const newFunctions = [...functions, newFunc];
    setFunctions(newFunctions);
  };

  const updateFunction = (id: string, updates: Partial<GraphFunction>) => {
    const newFunctions = functions.map(f => 
      f.id === id ? { ...f, ...updates } : f
    );
    setFunctions(newFunctions);
  };

  const deleteFunction = (id: string) => {
    const newFunctions = functions.filter(f => f.id !== id);
    setFunctions(newFunctions);
  };

  return (
    <div className="flex gap-4">
      <div className="flex-1">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="border-2 border-gray-300 rounded-lg bg-white"
        />
      </div>

      <div className="w-80 space-y-4">
        <div className="bg-white p-4 rounded-lg shadow-md space-y-4">
          <div className="flex justify-between items-center">
            <Label>Functions ({functions.length})</Label>
            <Button onClick={addFunction} size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          </div>

          <div className="space-y-3 max-h-80 overflow-y-auto">
            {functions.map(func => (
              <div key={func.id} className="p-3 border rounded-lg space-y-2 bg-gray-50">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={func.expression}
                    onChange={(e) => updateFunction(func.id, { expression: e.target.value })}
                    className="flex-1 px-2 py-1 border rounded text-sm font-mono"
                    placeholder="e.g., sin(x)"
                  />
                  <input
                    type="color"
                    value={func.color}
                    onChange={(e) => updateFunction(func.id, { color: e.target.value })}
                    className="w-10 h-8 rounded border cursor-pointer"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateFunction(func.id, { visible: !func.visible })}
                    className="flex-1 gap-1"
                  >
                    {func.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    {func.visible ? 'Hide' : 'Show'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteFunction(func.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md space-y-4">
          <Label>View Range</Label>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="x-min" className="text-xs">X Min</Label>
              <Input
                id="x-min"
                type="number"
                value={xMin}
                onChange={(e) => setXMin(parseFloat(e.target.value) || -10)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="x-max" className="text-xs">X Max</Label>
              <Input
                id="x-max"
                type="number"
                value={xMax}
                onChange={(e) => setXMax(parseFloat(e.target.value) || 10)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="y-min" className="text-xs">Y Min</Label>
              <Input
                id="y-min"
                type="number"
                value={yMin}
                onChange={(e) => setYMin(parseFloat(e.target.value) || -10)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="y-max" className="text-xs">Y Max</Label>
              <Input
                id="y-max"
                type="number"
                value={yMax}
                onChange={(e) => setYMax(parseFloat(e.target.value) || 10)}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label>Grid Spacing: {gridSpacing.toFixed(1)}</Label>
            <Slider
              value={[gridSpacing]}
              onValueChange={(value) => setGridSpacing(value[0])}
              min={0.1}
              max={5}
              step={0.1}
              className="mt-2"
            />
          </div>
        </div>

        <div className="bg-blue-50 p-3 rounded-lg text-sm space-y-1">
          <p><strong>Supported expressions:</strong></p>
          <ul className="list-disc list-inside text-xs space-y-1">
            <li><strong>Functions:</strong> sin(x), cos(x), tan(x)</li>
            <li><strong>Operations:</strong> sqrt(x), abs(x)</li>
            <li><strong>Powers:</strong> x^2, x^3</li>
            <li><strong>Vertical lines:</strong> x = 5</li>
            <li><strong>Logs:</strong> log(x), ln(x), exp(x)</li>
            <li><strong>Constants:</strong> pi, e</li>
            <li><strong>Example:</strong> sin(x)*cos(x/2)</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
