import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Copy, Check, Download } from 'lucide-react';
import { DrawingShape } from './DrawingCanvas';
import { toast } from 'sonner@2.0.3';

interface CodeGeneratorProps {
  shapes: DrawingShape[];
  graphPoints?: Array<{ x: number; y: number; color: string }[]>;
}

export const CodeGenerator: React.FC<CodeGeneratorProps> = ({ shapes, graphPoints = [] }) => {
  const [code, setCode] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    generateCode();
  }, [shapes, graphPoints]);

  const rgbToGLColor = (hex: string): { r: number; g: number; b: number } => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16) / 255,
      g: parseInt(result[2], 16) / 255,
      b: parseInt(result[3], 16) / 255
    } : { r: 0, g: 0, b: 0 };
  };

  const normalizeCoords = (x: number, y: number, width: number = 1200, height: number = 700) => {
    const glX = (x / width) * 2 - 1;
    const glY = 1 - (y / height) * 2;
    return { x: glX, y: glY };
  };

  const generateShapeCode = (shape: DrawingShape, index: number): string => {
    let shapeCode = '';
    const strokeColor = rgbToGLColor(shape.color);
    const fillColor = rgbToGLColor(shape.fillColor);
    const useStroke = shape.strokeWidth > 0;

    shapeCode += `    // Shape ${index + 1}: ${shape.type}\n`;

    switch (shape.type) {
      case 'rectangle':
        if (shape.points.length === 2) {
          const p1 = normalizeCoords(shape.points[0].x, shape.points[0].y);
          const p2 = normalizeCoords(shape.points[1].x, shape.points[1].y);

          if (shape.filled) {
            shapeCode += `    glColor3f(${fillColor.r.toFixed(3)}f, ${fillColor.g.toFixed(3)}f, ${fillColor.b.toFixed(3)}f);\n`;
            shapeCode += `    glBegin(GL_QUADS);\n`;
            shapeCode += `        glVertex2f(${p1.x.toFixed(3)}f, ${p1.y.toFixed(3)}f);\n`;
            shapeCode += `        glVertex2f(${p2.x.toFixed(3)}f, ${p1.y.toFixed(3)}f);\n`;
            shapeCode += `        glVertex2f(${p2.x.toFixed(3)}f, ${p2.y.toFixed(3)}f);\n`;
            shapeCode += `        glVertex2f(${p1.x.toFixed(3)}f, ${p2.y.toFixed(3)}f);\n`;
            shapeCode += `    glEnd();\n\n`;
          }

          if (useStroke) {
            shapeCode += `    glColor3f(${strokeColor.r.toFixed(3)}f, ${strokeColor.g.toFixed(3)}f, ${strokeColor.b.toFixed(3)}f);\n`;
            shapeCode += `    glLineWidth(${shape.strokeWidth}.0f);\n`;
            shapeCode += `    glBegin(GL_LINE_LOOP);\n`;
            shapeCode += `        glVertex2f(${p1.x.toFixed(3)}f, ${p1.y.toFixed(3)}f);\n`;
            shapeCode += `        glVertex2f(${p2.x.toFixed(3)}f, ${p1.y.toFixed(3)}f);\n`;
            shapeCode += `        glVertex2f(${p2.x.toFixed(3)}f, ${p2.y.toFixed(3)}f);\n`;
            shapeCode += `        glVertex2f(${p1.x.toFixed(3)}f, ${p2.y.toFixed(3)}f);\n`;
            shapeCode += `    glEnd();\n`;
          }
        }
        break;

      case 'circle':
        if (shape.points.length === 2) {
          const center = normalizeCoords(shape.points[0].x, shape.points[0].y);
          const radius = Math.sqrt(
            Math.pow(shape.points[1].x - shape.points[0].x, 2) +
            Math.pow(shape.points[1].y - shape.points[0].y, 2)
          ) / 600;

          if (shape.filled) {
            shapeCode += `    glColor3f(${fillColor.r.toFixed(3)}f, ${fillColor.g.toFixed(3)}f, ${fillColor.b.toFixed(3)}f);\n`;
            shapeCode += `    glBegin(GL_TRIANGLE_FAN);\n`;
            shapeCode += `        glVertex2f(${center.x.toFixed(3)}f, ${center.y.toFixed(3)}f);\n`;
            shapeCode += `        for(int i = 0; i <= 360; i++) {\n`;
            shapeCode += `            float angle = i * 3.14159f / 180.0f;\n`;
            shapeCode += `            glVertex2f(${center.x.toFixed(3)}f + cos(angle) * ${radius.toFixed(3)}f, ${center.y.toFixed(3)}f + sin(angle) * ${radius.toFixed(3)}f);\n`;
            shapeCode += `        }\n`;
            shapeCode += `    glEnd();\n\n`;
          }

          if (useStroke) {
            shapeCode += `    glColor3f(${strokeColor.r.toFixed(3)}f, ${strokeColor.g.toFixed(3)}f, ${strokeColor.b.toFixed(3)}f);\n`;
            shapeCode += `    glLineWidth(${shape.strokeWidth}.0f);\n`;
            shapeCode += `    glBegin(GL_LINE_LOOP);\n`;
            shapeCode += `        for(int i = 0; i <= 360; i++) {\n`;
            shapeCode += `            float angle = i * 3.14159f / 180.0f;\n`;
            shapeCode += `            glVertex2f(${center.x.toFixed(3)}f + cos(angle) * ${radius.toFixed(3)}f, ${center.y.toFixed(3)}f + sin(angle) * ${radius.toFixed(3)}f);\n`;
            shapeCode += `        }\n`;
            shapeCode += `    glEnd();\n`;
          }
        }
        break;

      case 'ellipse':
        if (shape.points.length === 2) {
          const center = normalizeCoords(shape.points[0].x, shape.points[0].y);
          const radiusX = Math.abs(shape.points[1].x - shape.points[0].x) / 600;
          const radiusY = Math.abs(shape.points[1].y - shape.points[0].y) / 350;

          if (shape.filled) {
            shapeCode += `    glColor3f(${fillColor.r.toFixed(3)}f, ${fillColor.g.toFixed(3)}f, ${fillColor.b.toFixed(3)}f);\n`;
            shapeCode += `    glBegin(GL_TRIANGLE_FAN);\n`;
            shapeCode += `        glVertex2f(${center.x.toFixed(3)}f, ${center.y.toFixed(3)}f);\n`;
            shapeCode += `        for(int i = 0; i <= 360; i++) {\n`;
            shapeCode += `            float angle = i * 3.14159f / 180.0f;\n`;
            shapeCode += `            glVertex2f(${center.x.toFixed(3)}f + cos(angle) * ${radiusX.toFixed(3)}f, ${center.y.toFixed(3)}f + sin(angle) * ${radiusY.toFixed(3)}f);\n`;
            shapeCode += `        }\n`;
            shapeCode += `    glEnd();\n\n`;
          }

          if (useStroke) {
            shapeCode += `    glColor3f(${strokeColor.r.toFixed(3)}f, ${strokeColor.g.toFixed(3)}f, ${strokeColor.b.toFixed(3)}f);\n`;
            shapeCode += `    glLineWidth(${shape.strokeWidth}.0f);\n`;
            shapeCode += `    glBegin(GL_LINE_LOOP);\n`;
            shapeCode += `        for(int i = 0; i <= 360; i++) {\n`;
            shapeCode += `            float angle = i * 3.14159f / 180.0f;\n`;
            shapeCode += `            glVertex2f(${center.x.toFixed(3)}f + cos(angle) * ${radiusX.toFixed(3)}f, ${center.y.toFixed(3)}f + sin(angle) * ${radiusY.toFixed(3)}f);\n`;
            shapeCode += `        }\n`;
            shapeCode += `    glEnd();\n`;
          }
        }
        break;

      case 'line':
        if (shape.points.length >= 2) {
          const p1 = normalizeCoords(shape.points[0].x, shape.points[0].y);
          const p2 = normalizeCoords(shape.points[1].x, shape.points[1].y);

          shapeCode += `    glColor3f(${strokeColor.r.toFixed(3)}f, ${strokeColor.g.toFixed(3)}f, ${strokeColor.b.toFixed(3)}f);\n`;
          shapeCode += `    glLineWidth(${Math.max(shape.strokeWidth, 1)}.0f);\n`;
          shapeCode += `    glBegin(GL_LINES);\n`;
          shapeCode += `        glVertex2f(${p1.x.toFixed(3)}f, ${p1.y.toFixed(3)}f);\n`;
          shapeCode += `        glVertex2f(${p2.x.toFixed(3)}f, ${p2.y.toFixed(3)}f);\n`;
          shapeCode += `    glEnd();\n`;
        }
        break;

      case 'triangle':
      case 'star':
      case 'pentagon':
      case 'hexagon':
      case 'polygon':
      case 'freehand':
        if (shape.points.length > 1) {
          if (shape.filled && shape.type !== 'freehand') {
            shapeCode += `    glColor3f(${fillColor.r.toFixed(3)}f, ${fillColor.g.toFixed(3)}f, ${fillColor.b.toFixed(3)}f);\n`;
            shapeCode += `    glBegin(GL_POLYGON);\n`;
            shape.points.forEach(point => {
              const p = normalizeCoords(point.x, point.y);
              shapeCode += `        glVertex2f(${p.x.toFixed(3)}f, ${p.y.toFixed(3)}f);\n`;
            });
            shapeCode += `    glEnd();\n\n`;
          }

          if (useStroke) {
            shapeCode += `    glColor3f(${strokeColor.r.toFixed(3)}f, ${strokeColor.g.toFixed(3)}f, ${strokeColor.b.toFixed(3)}f);\n`;
            shapeCode += `    glLineWidth(${shape.strokeWidth}.0f);\n`;
            shapeCode += `    glBegin(${shape.type === 'freehand' ? 'GL_LINE_STRIP' : 'GL_LINE_LOOP'});\n`;
            shape.points.forEach(point => {
              const p = normalizeCoords(point.x, point.y);
              shapeCode += `        glVertex2f(${p.x.toFixed(3)}f, ${p.y.toFixed(3)}f);\n`;
            });
            shapeCode += `    glEnd();\n`;
          }
        }
        break;

      case 'bezier':
        if (shape.controlPoints && shape.controlPoints.length === 4) {
          const points: { x: number; y: number }[] = [];
          for (let t = 0; t <= 1; t += 0.01) {
            const x = Math.pow(1 - t, 3) * shape.controlPoints[0].x +
                     3 * Math.pow(1 - t, 2) * t * shape.controlPoints[1].x +
                     3 * (1 - t) * Math.pow(t, 2) * shape.controlPoints[2].x +
                     Math.pow(t, 3) * shape.controlPoints[3].x;
            const y = Math.pow(1 - t, 3) * shape.controlPoints[0].y +
                     3 * Math.pow(1 - t, 2) * t * shape.controlPoints[1].y +
                     3 * (1 - t) * Math.pow(t, 2) * shape.controlPoints[2].y +
                     Math.pow(t, 3) * shape.controlPoints[3].y;
            points.push({ x, y });
          }

          if (useStroke && points.length > 0) {
            shapeCode += `    glColor3f(${strokeColor.r.toFixed(3)}f, ${strokeColor.g.toFixed(3)}f, ${strokeColor.b.toFixed(3)}f);\n`;
            shapeCode += `    glLineWidth(${shape.strokeWidth}.0f);\n`;
            shapeCode += `    glBegin(GL_LINE_STRIP);\n`;
            points.forEach(point => {
              const p = normalizeCoords(point.x, point.y);
              shapeCode += `        glVertex2f(${p.x.toFixed(3)}f, ${p.y.toFixed(3)}f);\n`;
            });
            shapeCode += `    glEnd();\n`;
          }
        }
        break;

      case 'point':
        if (shape.points.length > 0) {
          shapeCode += `    glColor3f(${strokeColor.r.toFixed(3)}f, ${strokeColor.g.toFixed(3)}f, ${strokeColor.b.toFixed(3)}f);\n`;
          shapeCode += `    glPointSize(${Math.max(shape.strokeWidth * 2, 5)}.0f);\n`;
          shapeCode += `    glBegin(GL_POINTS);\n`;
          shape.points.forEach(point => {
            const p = normalizeCoords(point.x, point.y);
            shapeCode += `        glVertex2f(${p.x.toFixed(3)}f, ${p.y.toFixed(3)}f);\n`;
          });
          shapeCode += `    glEnd();\n`;
        }
        break;
    }

    return shapeCode + '\n';
  };

  const generateGraphCode = (): string => {
    if (graphPoints.length === 0) return '';

    let code = '    // Graph plots from mathematical functions\n';
    
    graphPoints.forEach((points, index) => {
      if (points.length < 2) return;
      
      const color = rgbToGLColor(points[0].color);
      code += `    // Graph function ${index + 1} - ${points.length} vertices\n`;
      code += `    glColor3f(${color.r.toFixed(3)}f, ${color.g.toFixed(3)}f, ${color.b.toFixed(3)}f);\n`;
      code += `    glLineWidth(2.0f);\n`;
      code += `    glBegin(GL_LINE_STRIP);\n`;
      
      points.forEach(point => {
        const p = normalizeCoords(point.x, point.y, 800, 600);
        code += `        glVertex2f(${p.x.toFixed(3)}f, ${p.y.toFixed(3)}f);\n`;
      });
      
      code += `    glEnd();\n\n`;
    });

    return code;
  };

  const generateCode = () => {
    let fullCode = `/*
 * FreeGLUT Drawing Code
 * Generated by Advanced Drawing to FreeGLUT Converter
 * 
 * To compile in CodeBlocks:
 * 1. Install FreeGLUT library
 * 2. Link libraries: -lfreeglut -lopengl32 -lglu32
 * 3. Compile and run
 */

#include <GL/glut.h>
#include <math.h>

void display() {
    glClear(GL_COLOR_BUFFER_BIT);
    glClearColor(1.0f, 1.0f, 1.0f, 1.0f);  // White background
    
`;

    // Generate code for drawn shapes
    shapes.forEach((shape, index) => {
      fullCode += generateShapeCode(shape, index);
    });

    // Generate code for graph plots
    fullCode += generateGraphCode();

    fullCode += `
    glFlush();
}

void init() {
    glMatrixMode(GL_PROJECTION);
    glLoadIdentity();
    gluOrtho2D(-1.0, 1.0, -1.0, 1.0);
    glMatrixMode(GL_MODELVIEW);
    glEnable(GL_LINE_SMOOTH);
    glEnable(GL_POINT_SMOOTH);
    glHint(GL_LINE_SMOOTH_HINT, GL_NICEST);
    glHint(GL_POINT_SMOOTH_HINT, GL_NICEST);
}

int main(int argc, char** argv) {
    glutInit(&argc, argv);
    glutInitDisplayMode(GLUT_SINGLE | GLUT_RGB);
    glutInitWindowSize(800, 600);
    glutInitWindowPosition(100, 100);
    glutCreateWindow("Generated Drawing");
    
    init();
    glutDisplayFunc(display);
    
    glutMainLoop();
    return 0;
}`;

    setCode(fullCode);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success('FreeGLUT code copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadCode = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'freeglut_drawing.cpp';
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Code downloaded as freeglut_drawing.cpp');
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl">FreeGLUT C++ Code</h3>
          <p className="text-sm text-gray-600 mt-1">
            Complete FreeGLUT code ready for CodeBlocks • {shapes.length} shapes • {graphPoints.length} graph functions
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={downloadCode} variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Download .cpp
          </Button>
          <Button onClick={copyToClipboard} className="gap-2">
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy Code'}
          </Button>
        </div>
      </div>

      <Textarea
        value={code}
        readOnly
        className="font-mono text-sm h-[600px] bg-gray-900 text-green-400 border-gray-700"
        placeholder="Draw shapes or plot graphs to generate FreeGLUT code..."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg space-y-2">
          <p className="font-semibold">How to use in CodeBlocks:</p>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Install FreeGLUT library</li>
            <li>Create Console Application project</li>
            <li>Copy and paste generated code</li>
            <li>Configure linker: -lfreeglut -lopengl32 -lglu32</li>
            <li>Build and run</li>
          </ol>
        </div>

        <div className="bg-green-50 p-4 rounded-lg space-y-2">
          <p className="font-semibold">Code Features:</p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>Optimized OpenGL primitives</li>
            <li>Accurate color conversion (RGB to GL)</li>
            <li>Normalized coordinates (-1 to 1)</li>
            <li>Anti-aliasing enabled</li>
            <li>Graph plots as line strips</li>
            <li>Ready to compile and run</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
