import React, { useState } from 'react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Copy, Check, ChevronRight, ChevronLeft } from 'lucide-react';
import { DrawingShape } from './DrawingCanvas';
import { toast } from 'sonner@2.0.3';

interface RealTimeCodePanelProps {
  shapes: DrawingShape[];
  graphPoints?: Array<{ x: number; y: number; color: string }[]>;
  isOpen: boolean;
  onToggle: () => void;
}

export const RealTimeCodePanel: React.FC<RealTimeCodePanelProps> = ({
  shapes,
  graphPoints = [],
  isOpen,
  onToggle
}) => {
  const [copied, setCopied] = useState(false);

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

          if (shape.strokeWidth > 0) {
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

          if (shape.strokeWidth > 0) {
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

      case 'line':
        if (shape.points.length >= 2) {
          const p1 = normalizeCoords(shape.points[0].x, shape.points[0].y);
          const p2 = normalizeCoords(shape.points[1].x, shape.points[1].y);

          shapeCode += `    glColor3f(${strokeColor.r.toFixed(3)}f, ${strokeColor.g.toFixed(3)}f, ${strokeColor.b.toFixed(3)}f);\n`;
          shapeCode += `    glLineWidth(${shape.strokeWidth}.0f);\n`;
          shapeCode += `    glBegin(GL_LINES);\n`;
          shapeCode += `        glVertex2f(${p1.x.toFixed(3)}f, ${p1.y.toFixed(3)}f);\n`;
          shapeCode += `        glVertex2f(${p2.x.toFixed(3)}f, ${p2.y.toFixed(3)}f);\n`;
          shapeCode += `    glEnd();\n`;
        }
        break;

      case 'polygon':
      case 'freehand':
        if (shape.points.length > 1) {
          if (shape.filled && shape.type === 'polygon') {
            shapeCode += `    glColor3f(${fillColor.r.toFixed(3)}f, ${fillColor.g.toFixed(3)}f, ${fillColor.b.toFixed(3)}f);\n`;
            shapeCode += `    glBegin(GL_POLYGON);\n`;
            shape.points.forEach(point => {
              const p = normalizeCoords(point.x, point.y);
              shapeCode += `        glVertex2f(${p.x.toFixed(3)}f, ${p.y.toFixed(3)}f);\n`;
            });
            shapeCode += `    glEnd();\n\n`;
          }

          if (shape.strokeWidth > 0) {
            shapeCode += `    glColor3f(${strokeColor.r.toFixed(3)}f, ${strokeColor.g.toFixed(3)}f, ${strokeColor.b.toFixed(3)}f);\n`;
            shapeCode += `    glLineWidth(${shape.strokeWidth}.0f);\n`;
            shapeCode += `    glBegin(${shape.type === 'polygon' ? 'GL_LINE_LOOP' : 'GL_LINE_STRIP'});\n`;
            shape.points.forEach(point => {
              const p = normalizeCoords(point.x, point.y);
              shapeCode += `        glVertex2f(${p.x.toFixed(3)}f, ${p.y.toFixed(3)}f);\n`;
            });
            shapeCode += `    glEnd();\n`;
          }
        }
        break;

      default:
        if (shape.points.length > 1) {
          if (shape.filled) {
            shapeCode += `    glColor3f(${fillColor.r.toFixed(3)}f, ${fillColor.g.toFixed(3)}f, ${fillColor.b.toFixed(3)}f);\n`;
            shapeCode += `    glBegin(GL_POLYGON);\n`;
            shape.points.forEach(point => {
              const p = normalizeCoords(point.x, point.y);
              shapeCode += `        glVertex2f(${p.x.toFixed(3)}f, ${p.y.toFixed(3)}f);\n`;
            });
            shapeCode += `    glEnd();\n\n`;
          }

          if (shape.strokeWidth > 0) {
            shapeCode += `    glColor3f(${strokeColor.r.toFixed(3)}f, ${strokeColor.g.toFixed(3)}f, ${strokeColor.b.toFixed(3)}f);\n`;
            shapeCode += `    glLineWidth(${shape.strokeWidth}.0f);\n`;
            shapeCode += `    glBegin(GL_LINE_LOOP);\n`;
            shape.points.forEach(point => {
              const p = normalizeCoords(point.x, point.y);
              shapeCode += `        glVertex2f(${p.x.toFixed(3)}f, ${p.y.toFixed(3)}f);\n`;
            });
            shapeCode += `    glEnd();\n`;
          }
        }
    }

    return shapeCode + '\n';
  };

  const generateGraphCode = (): string => {
    if (graphPoints.length === 0) return '';

    let code = '    // Graph plots\n';
    
    graphPoints.forEach((points, index) => {
      if (points.length < 2) return;
      
      const color = rgbToGLColor(points[0].color);
      code += `    // Graph function ${index + 1}\n`;
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

  const generateFullCode = (): string => {
    let fullCode = `#include <GL/glut.h>
#include <math.h>

void display() {
    glClear(GL_COLOR_BUFFER_BIT);
    glClearColor(1.0f, 1.0f, 1.0f, 1.0f);
    
`;

    shapes.forEach((shape, index) => {
      fullCode += generateShapeCode(shape, index);
    });

    fullCode += generateGraphCode();

    fullCode += `
    glFlush();
}

void init() {
    glMatrixMode(GL_PROJECTION);
    glLoadIdentity();
    gluOrtho2D(-1.0, 1.0, -1.0, 1.0);
    glMatrixMode(GL_MODELVIEW);
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

    return fullCode;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generateFullCode());
    setCopied(true);
    toast.success('Code copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <Button
        onClick={onToggle}
        className="fixed right-0 top-1/2 transform -translate-y-1/2 z-50 rounded-l-lg rounded-r-none"
        size="sm"
        style={{ right: isOpen ? '400px' : '0' }}
      >
        {isOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </Button>

      <div
        className={`fixed right-0 top-0 h-full w-[400px] bg-white shadow-2xl border-l-2 border-gray-300 transition-transform duration-300 z-40 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b bg-gray-50">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold">Real-Time Code</h3>
                <p className="text-xs text-gray-600">Live FreeGLUT preview</p>
              </div>
              <Button onClick={copyToClipboard} size="sm" variant="outline">
                {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                Copy
              </Button>
            </div>
          </div>

          <ScrollArea className="flex-1 p-4">
            <pre className="text-xs font-mono bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto">
              <code>{generateFullCode()}</code>
            </pre>
          </ScrollArea>

          <div className="p-3 border-t bg-gray-50 text-xs">
            <div className="flex justify-between text-gray-600">
              <span>Shapes: {shapes.length}</span>
              <span>Graphs: {graphPoints.length}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
