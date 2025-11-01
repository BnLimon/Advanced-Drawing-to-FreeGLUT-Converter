import React from 'react';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Slider } from './ui/slider';
import { Switch } from './ui/switch';
import { Square, Circle, Minus, Edit3, Hexagon, Triangle, Diameter, Star, Pentagon as PentagonIcon, Octagon, Spline, MapPin, Slice, Move, RotateCw, Maximize2 } from 'lucide-react';

interface ToolbarProps {
  currentTool: string;
  onToolChange: (tool: string) => void;
  currentColor: string;
  onColorChange: (color: string) => void;
  fillColor: string;
  onFillColorChange: (color: string) => void;
  strokeWidth: number;
  onStrokeWidthChange: (width: number) => void;
  filled: boolean;
  onFilledChange: (filled: boolean) => void;
  enableStroke: boolean;
  onEnableStrokeChange: (enabled: boolean) => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  currentTool,
  onToolChange,
  currentColor,
  onColorChange,
  fillColor,
  onFillColorChange,
  strokeWidth,
  onStrokeWidthChange,
  filled,
  onFilledChange,
  enableStroke,
  onEnableStrokeChange
}) => {
  const basicTools = [
    { id: 'rectangle', icon: Square, label: 'Rectangle' },
    { id: 'circle', icon: Circle, label: 'Circle' },
    { id: 'ellipse', icon: Diameter, label: 'Ellipse' },
    { id: 'triangle', icon: Triangle, label: 'Triangle' },
    { id: 'line', icon: Minus, label: 'Line' },
  ];

  const shapeTools = [
    { id: 'star', icon: Star, label: 'Star' },
    { id: 'pentagon', icon: PentagonIcon, label: 'Pentagon' },
    { id: 'hexagon', icon: Hexagon, label: 'Hexagon' },
    { id: 'polygon', icon: Octagon, label: 'Polygon' },
  ];

  const advancedTools = [
    { id: 'freehand', icon: Edit3, label: 'Freehand' },
    { id: 'bezier', icon: Spline, label: 'Bezier' },
    { id: 'arc', icon: Slice, label: 'Arc' },
    { id: 'point', icon: MapPin, label: 'Point' },
  ];

  const transformTools = [
    { id: 'move', icon: Move, label: 'Move' },
    { id: 'rotate', icon: RotateCw, label: 'Rotate' },
    { id: 'scale', icon: Maximize2, label: 'Scale' },
  ];

  const presetColors = [
    '#000000', '#FF0000', '#00FF00', '#0000FF',
    '#FFFF00', '#FF00FF', '#00FFFF', '#FFFFFF',
    '#808080', '#800000', '#008000', '#000080',
    '#FFA500', '#800080', '#008080', '#FFC0CB'
  ];

  return (
    <div className="p-6 bg-white rounded-lg shadow-md space-y-6 max-h-[800px] overflow-y-auto">
      <div>
        <Label className="mb-3 block">Basic Shapes</Label>
        <div className="grid grid-cols-1 gap-2">
          {basicTools.map(({ id, icon: Icon, label }) => (
            <Button
              key={id}
              onClick={() => onToolChange(id)}
              variant={currentTool === id ? 'default' : 'outline'}
              className="flex items-center gap-2 justify-start"
              size="sm"
            >
              <Icon className="w-4 h-4" />
              {label}
            </Button>
          ))}
        </div>
      </div>

      <div>
        <Label className="mb-3 block">Polygons</Label>
        <div className="grid grid-cols-1 gap-2">
          {shapeTools.map(({ id, icon: Icon, label }) => (
            <Button
              key={id}
              onClick={() => onToolChange(id)}
              variant={currentTool === id ? 'default' : 'outline'}
              className="flex items-center gap-2 justify-start"
              size="sm"
            >
              <Icon className="w-4 h-4" />
              {label}
            </Button>
          ))}
        </div>
      </div>

      <div>
        <Label className="mb-3 block">Advanced Tools</Label>
        <div className="grid grid-cols-1 gap-2">
          {advancedTools.map(({ id, icon: Icon, label }) => (
            <Button
              key={id}
              onClick={() => onToolChange(id)}
              variant={currentTool === id ? 'default' : 'outline'}
              className="flex items-center gap-2 justify-start"
              size="sm"
            >
              <Icon className="w-4 h-4" />
              {label}
            </Button>
          ))}
        </div>
      </div>

      <div>
        <Label className="mb-3 block">Transform Tools</Label>
        <div className="grid grid-cols-1 gap-2">
          {transformTools.map(({ id, icon: Icon, label }) => (
            <Button
              key={id}
              onClick={() => onToolChange(id)}
              variant={currentTool === id ? 'default' : 'outline'}
              className="flex items-center gap-2 justify-start"
              size="sm"
            >
              <Icon className="w-4 h-4" />
              {label}
            </Button>
          ))}
        </div>
      </div>

      <div className="border-t pt-4 space-y-4">
        <div className="flex items-center gap-2 p-3 bg-blue-50 rounded">
          <Switch
            id="enable-stroke"
            checked={enableStroke}
            onCheckedChange={onEnableStrokeChange}
          />
          <Label htmlFor="enable-stroke" className="cursor-pointer">Enable Stroke/Outline</Label>
        </div>

        {enableStroke && (
          <div>
            <Label htmlFor="stroke-color" className="mb-2 block">Stroke Color</Label>
            <div className="flex gap-2 items-center">
              <input
                id="stroke-color"
                type="color"
                value={currentColor}
                onChange={(e) => onColorChange(e.target.value)}
                className="w-16 h-10 rounded border cursor-pointer"
              />
              <input
                type="text"
                value={currentColor}
                onChange={(e) => onColorChange(e.target.value)}
                className="flex-1 px-3 py-2 border rounded text-sm"
                placeholder="#000000"
              />
            </div>
            <div className="grid grid-cols-8 gap-1 mt-2">
              {presetColors.map(color => (
                <button
                  key={color}
                  onClick={() => onColorChange(color)}
                  className="w-8 h-8 rounded border-2 border-gray-300 hover:border-gray-500 transition-colors"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>
        )}

        <div>
          <Label htmlFor="fill-color" className="mb-2 block">Fill Color</Label>
          <div className="flex gap-2 items-center">
            <input
              id="fill-color"
              type="color"
              value={fillColor}
              onChange={(e) => onFillColorChange(e.target.value)}
              className="w-16 h-10 rounded border cursor-pointer"
            />
            <input
              type="text"
              value={fillColor}
              onChange={(e) => onFillColorChange(e.target.value)}
              className="flex-1 px-3 py-2 border rounded text-sm"
              placeholder="#FFFFFF"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 p-3 bg-green-50 rounded">
          <Switch
            id="filled"
            checked={filled}
            onCheckedChange={onFilledChange}
          />
          <Label htmlFor="filled" className="cursor-pointer">Fill Shapes</Label>
        </div>
      </div>

      {enableStroke && (
        <div>
          <Label className="mb-2 block">Stroke Width: {strokeWidth}px</Label>
          <Slider
            value={[strokeWidth]}
            onValueChange={(value) => onStrokeWidthChange(value[0])}
            min={1}
            max={20}
            step={1}
            className="w-full"
          />
        </div>
      )}

      <div className="p-4 bg-amber-50 rounded-lg text-sm space-y-1">
        <p><strong>Tool Tips:</strong></p>
        <ul className="list-disc list-inside space-y-1 text-gray-700 text-xs">
          <li><strong>Polygon:</strong> Click to add points, double-click or Enter to finish</li>
          <li><strong>Bezier:</strong> Click 4 control points to create curve</li>
          <li><strong>Transform:</strong> Select a layer first, then use Move/Rotate/Scale</li>
          <li><strong>Move:</strong> Drag selected shape to reposition</li>
          <li><strong>Rotate:</strong> Drag to rotate selected shape</li>
          <li><strong>Scale:</strong> Drag to resize selected shape</li>
          <li>Press <strong>Escape</strong> to cancel multi-point tools</li>
        </ul>
      </div>
    </div>
  );
};
