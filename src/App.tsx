import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { DrawingCanvas, DrawingShape } from './components/DrawingCanvas';
import { Toolbar } from './components/Toolbar';
import { GraphPlotter } from './components/GraphPlotter';
import { CodeGenerator } from './components/CodeGenerator';
import { RealTimeCodePanel } from './components/RealTimeCodePanel';
import { LayerPanel } from './components/LayerPanel';
import { AboutPage } from './components/AboutPage';
import { Toaster } from './components/ui/sonner';
import { Code2, Paintbrush, LineChart, Layers, User } from 'lucide-react';
import { Button } from './components/ui/button';

export default function App() {
  const [currentTool, setCurrentTool] = useState('rectangle');
  const [currentColor, setCurrentColor] = useState('#000000');
  const [fillColor, setFillColor] = useState('#FFFFFF');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [filled, setFilled] = useState(false);
  const [enableStroke, setEnableStroke] = useState(true);
  const [shapes, setShapes] = useState<DrawingShape[]>([]);
  const [graphPoints, setGraphPoints] = useState<Array<{ x: number; y: number; color: string }[]>>([]);
  const [codePanelOpen, setCodePanelOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('drawing');
  const [selectedShapeIndex, setSelectedShapeIndex] = useState<number | null>(null);
  const [layerVisibility, setLayerVisibility] = useState<Map<number, boolean>>(new Map());

  const handleLayerVisibilityChange = (visibility: Map<number, boolean>) => {
    setLayerVisibility(visibility);
  };

  const handleUpdateShape = (index: number, shape: DrawingShape) => {
    const newShapes = [...shapes];
    newShapes[index] = shape;
    setShapes(newShapes);
  };

  const handleDeleteShape = (index: number) => {
    const newShapes = shapes.filter((_, i) => i !== index);
    setShapes(newShapes);
    if (selectedShapeIndex === index) {
      setSelectedShapeIndex(null);
    } else if (selectedShapeIndex !== null && selectedShapeIndex > index) {
      setSelectedShapeIndex(selectedShapeIndex - 1);
    }
  };

  const handleReorderShapes = (fromIndex: number, toIndex: number) => {
    const newShapes = [...shapes];
    const [removed] = newShapes.splice(fromIndex, 1);
    newShapes.splice(toIndex, 0, removed);
    setShapes(newShapes);
  };

  const handleDuplicateShape = (index: number) => {
    const shape = shapes[index];
    if (shape) {
      const duplicated = {
        ...shape,
        points: shape.points.map(p => ({ x: p.x + 20, y: p.y + 20 })),
        controlPoints: shape.controlPoints?.map(p => ({ x: p.x + 20, y: p.y + 20 }))
      };
      const newShapes = [...shapes];
      newShapes.splice(index + 1, 0, duplicated);
      setShapes(newShapes);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <Toaster position="top-right" />
      <RealTimeCodePanel
        shapes={shapes}
        graphPoints={graphPoints}
        isOpen={codePanelOpen}
        onToggle={() => setCodePanelOpen(!codePanelOpen)}
      />
      
      <div className="container mx-auto px-4 py-8" style={{ marginRight: codePanelOpen ? '400px' : '0' }}>
        <div className="mb-8 text-center">
          <h1 className="text-5xl mb-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Advanced Drawing to FreeGLUT Converter
          </h1>
          <p className="text-gray-600 text-lg">
            Comprehensive paint tool with graph plotting and real-time FreeGLUT C++ code generation
          </p>
          <div className="mt-4">
            <Button
              onClick={() => setCodePanelOpen(!codePanelOpen)}
              variant={codePanelOpen ? 'default' : 'outline'}
              className="gap-2"
            >
              <Code2 className="w-4 h-4" />
              {codePanelOpen ? 'Hide' : 'Show'} Real-Time Code Panel
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-3xl mx-auto grid-cols-4 mb-6 h-12">
            <TabsTrigger value="drawing" className="gap-2 text-base">
              <Paintbrush className="w-5 h-5" />
              Drawing Canvas
            </TabsTrigger>
            <TabsTrigger value="graph" className="gap-2 text-base">
              <LineChart className="w-5 h-5" />
              Graph Plotter
            </TabsTrigger>
            <TabsTrigger value="code" className="gap-2 text-base">
              <Code2 className="w-5 h-5" />
              Full Code View
            </TabsTrigger>
            <TabsTrigger value="about" className="gap-2 text-base">
              <User className="w-5 h-5" />
              About
            </TabsTrigger>
          </TabsList>

          <TabsContent value="drawing" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              <div className="lg:col-span-1">
                <Toolbar
                  currentTool={currentTool}
                  onToolChange={setCurrentTool}
                  currentColor={currentColor}
                  onColorChange={setCurrentColor}
                  fillColor={fillColor}
                  onFillColorChange={setFillColor}
                  strokeWidth={strokeWidth}
                  onStrokeWidthChange={setStrokeWidth}
                  filled={filled}
                  onFilledChange={setFilled}
                  enableStroke={enableStroke}
                  onEnableStrokeChange={setEnableStroke}
                />
              </div>

              <div className="lg:col-span-3">
                <div className="bg-white p-6 rounded-lg shadow-lg">
                  <div className="mb-4 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-blue-600" />
                    <h2 className="text-xl">Drawing Canvas</h2>
                    <span className="ml-auto text-sm text-gray-600">
                      {shapes.length} shapes
                      {selectedShapeIndex !== null && (
                        <span className="ml-2 text-blue-600">• Layer {selectedShapeIndex + 1} selected</span>
                      )}
                    </span>
                  </div>
                  <DrawingCanvas
                    shapes={shapes}
                    onShapesChange={setShapes}
                    currentTool={currentTool}
                    currentColor={currentColor}
                    fillColor={fillColor}
                    strokeWidth={strokeWidth}
                    filled={filled}
                    enableStroke={enableStroke}
                    selectedShapeIndex={selectedShapeIndex}
                    onSelectShape={setSelectedShapeIndex}
                    layerVisibility={layerVisibility}
                  />
                </div>
              </div>

              <div className="lg:col-span-1">
                <LayerPanel
                  shapes={shapes}
                  selectedShapeIndex={selectedShapeIndex}
                  onSelectShape={setSelectedShapeIndex}
                  onUpdateShape={handleUpdateShape}
                  onDeleteShape={handleDeleteShape}
                  onReorderShapes={handleReorderShapes}
                  onDuplicateShape={handleDuplicateShape}
                  layerVisibility={layerVisibility}
                  onLayerVisibilityChange={handleLayerVisibilityChange}
                />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h3 className="text-xl mb-4">Comprehensive Features</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold mb-2">Basic Shapes</h4>
                  <ul className="text-sm space-y-1 text-gray-700">
                    <li>• Rectangle & Square</li>
                    <li>• Circle & Ellipse</li>
                    <li>• Lines & Triangles</li>
                    <li>• Customizable fill & stroke</li>
                  </ul>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-semibold mb-2">Polygon Tools</h4>
                  <ul className="text-sm space-y-1 text-gray-700">
                    <li>• Star shapes</li>
                    <li>• Pentagon & Hexagon</li>
                    <li>• Custom polygons</li>
                    <li>• Multi-point drawing</li>
                  </ul>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <h4 className="font-semibold mb-2">Advanced Drawing</h4>
                  <ul className="text-sm space-y-1 text-gray-700">
                    <li>• Freehand sketching</li>
                    <li>• Bezier curves</li>
                    <li>• Arc/sector drawing</li>
                    <li>• Point markers</li>
                  </ul>
                </div>
                <div className="p-4 bg-amber-50 rounded-lg">
                  <h4 className="font-semibold mb-2">Canvas & Layers</h4>
                  <ul className="text-sm space-y-1 text-gray-700">
                    <li>• Grid with snap-to-grid</li>
                    <li>• Coordinate axes display</li>
                    <li>• Undo/Redo support</li>
                    <li>• Layer management</li>
                    <li>• Move & duplicate shapes</li>
                    <li>• Real-time coordinates</li>
                  </ul>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="graph" className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <div className="mb-4 flex items-center gap-2">
                <LineChart className="w-5 h-5 text-purple-600" />
                <h2 className="text-2xl">Mathematical Graph Plotter</h2>
              </div>
              <p className="text-gray-600 mb-6">
                Plot multiple mathematical functions with Desmos-like functionality. All graphs are automatically converted to FreeGLUT code!
              </p>
              <GraphPlotter onGraphPointsChange={setGraphPoints} />
            </div>

            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h3 className="text-xl mb-4">Graph Plotter Features</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold mb-2">Multiple Functions</h4>
                  <ul className="text-sm space-y-1 text-gray-700">
                    <li>• Plot unlimited functions</li>
                    <li>• Individual color control</li>
                    <li>• Show/hide functions</li>
                    <li>• Real-time plotting</li>
                  </ul>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-semibold mb-2">Math Support</h4>
                  <ul className="text-sm space-y-1 text-gray-700">
                    <li>• Trigonometric functions</li>
                    <li>• Algebraic expressions</li>
                    <li>• Vertical lines (x = 5)</li>
                    <li>• Exponential & logarithmic</li>
                    <li>• Constants (π, e)</li>
                  </ul>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <h4 className="font-semibold mb-2">Code Generation</h4>
                  <ul className="text-sm space-y-1 text-gray-700">
                    <li>• Automatic vertex collection</li>
                    <li>• Optimized GL_LINE_STRIP</li>
                    <li>• Color preservation</li>
                    <li>• Ready for CodeBlocks</li>
                  </ul>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="code" className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <CodeGenerator shapes={shapes} graphPoints={graphPoints} />
            </div>
          </TabsContent>

          <TabsContent value="about">
            <AboutPage />
          </TabsContent>
        </Tabs>

        <footer className="mt-12 p-6 bg-white rounded-lg shadow-lg text-center">
          <h3 className="text-lg mb-2">About This Tool</h3>
          <p className="text-sm text-gray-600 max-w-3xl mx-auto">
            This comprehensive drawing-to-FreeGLUT converter provides professional-grade tools for creating 
            graphics that can be directly converted to C++ OpenGL code. Features include advanced shape tools, 
            mathematical graph plotting, layer management with transform tools, real-time code generation, and full 
            CodeBlocks compatibility. Perfect for learning OpenGL graphics programming!
          </p>
          <div className="mt-4 flex justify-center gap-4 text-xs text-gray-500">
            <span>• {shapes.length} Drawing Shapes</span>
            <span>• {graphPoints.length} Graph Functions</span>
            <span>• Real-time FreeGLUT Code</span>
            <span>• Move/Rotate/Scale Tools</span>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            Created by <button onClick={() => setActiveTab('about')} className="text-blue-600 hover:underline">Mahbub Hasan</button> © 2025
          </div>
        </footer>
      </div>
    </div>
  );
}
