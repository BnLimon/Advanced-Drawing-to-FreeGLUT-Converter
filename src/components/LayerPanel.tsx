import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Input } from './ui/input';
import { Eye, EyeOff, Trash2, ChevronUp, ChevronDown, Lock, Unlock, Copy } from 'lucide-react';
import { DrawingShape } from './DrawingCanvas';
import { toast } from 'sonner@2.0.3';

interface LayerInfo {
  visible: boolean;
  locked: boolean;
  name: string;
}

interface LayerPanelProps {
  shapes: DrawingShape[];
  selectedShapeIndex: number | null;
  onSelectShape: (index: number | null) => void;
  onUpdateShape: (index: number, shape: DrawingShape) => void;
  onDeleteShape: (index: number) => void;
  onReorderShapes: (fromIndex: number, toIndex: number) => void;
  onDuplicateShape: (index: number) => void;
  layerVisibility: Map<number, boolean>;
  onLayerVisibilityChange: (visibility: Map<number, boolean>) => void;
}

export const LayerPanel: React.FC<LayerPanelProps> = ({
  shapes,
  selectedShapeIndex,
  onSelectShape,
  onUpdateShape,
  onDeleteShape,
  onReorderShapes,
  onDuplicateShape,
  layerVisibility,
  onLayerVisibilityChange
}) => {
  const [layerInfo, setLayerInfo] = useState<Map<number, LayerInfo>>(new Map());

  // Initialize layer info for new shapes
  useEffect(() => {
    const newInfo = new Map(layerInfo);
    shapes.forEach((shape, index) => {
      if (!newInfo.has(index)) {
        newInfo.set(index, {
          visible: true,
          locked: false,
          name: `${shape.type} ${index + 1}`
        });
      }
    });
    setLayerInfo(newInfo);
  }, [shapes.length]);

  const getLayerInfo = (index: number): LayerInfo => {
    return layerInfo.get(index) || {
      visible: true,
      locked: false,
      name: `${shapes[index]?.type || 'Shape'} ${index + 1}`
    };
  };

  const updateLayerInfo = (index: number, updates: Partial<LayerInfo>) => {
    const newInfo = new Map(layerInfo);
    const current = getLayerInfo(index);
    newInfo.set(index, { ...current, ...updates });
    setLayerInfo(newInfo);
  };

  const toggleVisibility = (index: number) => {
    const info = getLayerInfo(index);
    const newVisible = !info.visible;
    
    // Update local layer info
    updateLayerInfo(index, { visible: newVisible });
    
    // Update parent visibility map
    const newVisibility = new Map(layerVisibility);
    newVisibility.set(index, newVisible);
    onLayerVisibilityChange(newVisibility);
    
    toast.info(newVisible ? 'Layer shown' : 'Layer hidden');
  };

  const toggleLock = (index: number) => {
    const info = getLayerInfo(index);
    const newLocked = !info.locked;
    updateLayerInfo(index, { locked: newLocked });
    toast.info(newLocked ? 'Layer locked' : 'Layer unlocked');
  };

  const moveLayer = (fromIndex: number, direction: 'up' | 'down') => {
    const toIndex = direction === 'up' ? fromIndex + 1 : fromIndex - 1;
    if (toIndex < 0 || toIndex >= shapes.length) return;
    
    onReorderShapes(fromIndex, toIndex);
    
    // Swap layer info
    const newInfo = new Map(layerInfo);
    const fromInfo = getLayerInfo(fromIndex);
    const toInfo = getLayerInfo(toIndex);
    newInfo.set(fromIndex, toInfo);
    newInfo.set(toIndex, fromInfo);
    setLayerInfo(newInfo);
    
    // Swap visibility
    const newVisibility = new Map(layerVisibility);
    const fromVis = layerVisibility.get(fromIndex) !== false;
    const toVis = layerVisibility.get(toIndex) !== false;
    newVisibility.set(fromIndex, toVis);
    newVisibility.set(toIndex, fromVis);
    onLayerVisibilityChange(newVisibility);
    
    if (selectedShapeIndex === fromIndex) {
      onSelectShape(toIndex);
    } else if (selectedShapeIndex === toIndex) {
      onSelectShape(fromIndex);
    }
  };

  const deleteLayer = (index: number) => {
    // Confirm deletion
    if (!window.confirm(`Delete ${getLayerInfo(index).name}?`)) return;
    
    onDeleteShape(index);
    
    // Update layer info map - remove and adjust indices
    const newInfo = new Map<number, LayerInfo>();
    layerInfo.forEach((value, key) => {
      if (key < index) {
        newInfo.set(key, value);
      } else if (key > index) {
        newInfo.set(key - 1, value);
      }
    });
    setLayerInfo(newInfo);
    
    // Update visibility map
    const newVisibility = new Map<number, boolean>();
    layerVisibility.forEach((value, key) => {
      if (key < index) {
        newVisibility.set(key, value);
      } else if (key > index) {
        newVisibility.set(key - 1, value);
      }
    });
    onLayerVisibilityChange(newVisibility);
    
    toast.success('Layer deleted');
  };

  const duplicateLayer = (index: number) => {
    onDuplicateShape(index);
    toast.success('Layer duplicated');
  };

  const renameLayer = (index: number, name: string) => {
    updateLayerInfo(index, { name });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Layers</h3>
        <span className="text-xs text-gray-500">{shapes.length} layers</span>
      </div>

      {shapes.length === 0 ? (
        <div className="text-center py-8 text-gray-400 text-sm">
          No layers yet. Start drawing!
        </div>
      ) : (
        <ScrollArea className="h-[400px]">
          <div className="space-y-2">
            {[...shapes].reverse().map((shape, reverseIndex) => {
              const index = shapes.length - 1 - reverseIndex;
              const info = getLayerInfo(index);
              const isSelected = selectedShapeIndex === index;
              const isVisible = layerVisibility.get(index) !== false;

              return (
                <div
                  key={`layer-${index}`}
                  className={`border rounded-lg p-3 transition-all cursor-pointer ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  } ${!isVisible ? 'opacity-50' : ''}`}
                  onClick={() => {
                    if (!info.locked) {
                      onSelectShape(isSelected ? null : index);
                    }
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Input
                      value={info.name}
                      onChange={(e) => renameLayer(index, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 h-7 text-sm"
                      disabled={info.locked}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleVisibility(index);
                      }}
                      className="h-7 w-7 p-0"
                    >
                      {isVisible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    </Button>
                  </div>

                  <div className="flex items-center gap-1 text-xs text-gray-600 mb-2">
                    <div 
                      className="w-4 h-4 rounded border" 
                      style={{ backgroundColor: shape.fillColor }}
                    />
                    {shape.filled && <span className="px-1 py-0.5 bg-gray-100 rounded">Fill</span>}
                    {shape.strokeWidth > 0 && (
                      <>
                        <span className="px-1 py-0.5 bg-gray-100 rounded">
                          Stroke: {shape.strokeWidth}px
                        </span>
                        <div 
                          className="w-3 h-3 rounded-full border" 
                          style={{ backgroundColor: shape.color }}
                        />
                      </>
                    )}
                  </div>

                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        moveLayer(index, 'up');
                      }}
                      disabled={index === shapes.length - 1}
                      className="flex-1 h-7 text-xs"
                    >
                      <ChevronUp className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        moveLayer(index, 'down');
                      }}
                      disabled={index === 0}
                      className="flex-1 h-7 text-xs"
                    >
                      <ChevronDown className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLock(index);
                      }}
                      className="flex-1 h-7 text-xs"
                    >
                      {info.locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        duplicateLayer(index);
                      }}
                      className="flex-1 h-7 text-xs"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`Delete ${getLayerInfo(index).name}?`)) {
                          onDeleteShape(index);
                          
                          // Update visibility map
                          const newVisibility = new Map<number, boolean>();
                          layerVisibility.forEach((value, key) => {
                            if (key < index) {
                              newVisibility.set(key, value);
                            } else if (key > index) {
                              newVisibility.set(key - 1, value);
                            }
                          });
                          onLayerVisibilityChange(newVisibility);
                          
                          toast.success('Layer deleted');
                        }
                      }}
                      className="flex-1 h-7 text-xs text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      )}

      <div className="text-xs text-gray-500 space-y-1 pt-2 border-t">
        <p><strong>Layer Controls:</strong></p>
        <ul className="list-disc list-inside space-y-0.5">
          <li>Click to select/deselect layer</li>
          <li>Use arrows to reorder (top = drawn last)</li>
          <li>Lock to prevent editing</li>
          <li>Hide to remove from view</li>
        </ul>
      </div>
    </div>
  );
};
