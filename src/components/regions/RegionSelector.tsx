import React, { useState, useRef, useEffect, RefObject } from 'react';
import { useEditingSessionStore, Region, RegionType, DitheringAlgorithm } from '../../store/useEditingSessionStore';
import { FiPlus, FiCircle, FiSquare, FiEdit3 } from 'react-icons/fi';
import Button from '../ui/Button';
import RegionList from './RegionList';
import RegionEditor from './RegionEditor';

interface RegionSelectorProps {
  originalImage: HTMLImageElement;
  canvasRef: RefObject<HTMLCanvasElement>;
}

const RegionSelector: React.FC<RegionSelectorProps> = ({ originalImage, canvasRef }) => {
  const imageWidth = originalImage.width;
  const imageHeight = originalImage.height;
  const { regions, addRegion, activeRegionId, selectRegion } = useEditingSessionStore();
  const [activeMode, setActiveMode] = useState<'select' | 'create'>('select');
  const [creatingType, setCreatingType] = useState<RegionType>('circle');
  const [drawingPoints, setDrawingPoints] = useState<[number, number][]>([]);
  const regionCanvasRef = useRef<HTMLCanvasElement>(null);
  const [activeTool, setActiveTool] = useState<RegionType | null>(null);

  // Redraw regions when they change
  useEffect(() => {
    drawRegions();
  }, [regions, activeRegionId, imageWidth, imageHeight]);

  const drawRegions = () => {
    const canvas = regionCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set canvas size to match image dimensions
    canvas.width = imageWidth;
    canvas.height = imageHeight;

    // Draw each region
    regions.forEach((region) => {
      const isActive = region.id === activeRegionId;
      
      // Set styles based on region selection state
      ctx.strokeStyle = isActive ? '#3b82f6' : '#64748b';
      ctx.lineWidth = isActive ? 2 : 1;
      ctx.setLineDash(isActive ? [] : [5, 5]);
      
      if (region.type === 'circle' && region.centerX !== undefined && 
          region.centerY !== undefined && region.radius !== undefined) {
        
        const centerX = region.centerX * imageWidth;
        const centerY = region.centerY * imageHeight;
        const radius = region.radius * Math.min(imageWidth, imageHeight);
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.stroke();
        
        if (isActive) {
          // Draw control points
          drawControlPoint(ctx, centerX, centerY);
          drawControlPoint(ctx, centerX + radius, centerY);
        }
      }
      else if (region.type === 'rectangle' && region.x1 !== undefined && 
               region.y1 !== undefined && region.x2 !== undefined && region.y2 !== undefined) {
        
        const x1 = region.x1 * imageWidth;
        const y1 = region.y1 * imageHeight;
        const x2 = region.x2 * imageWidth;
        const y2 = region.y2 * imageHeight;
        const width = x2 - x1;
        const height = y2 - y1;
        
        ctx.beginPath();
        ctx.rect(x1, y1, width, height);
        ctx.stroke();
        
        if (isActive) {
          // Draw control points at corners
          drawControlPoint(ctx, x1, y1);
          drawControlPoint(ctx, x2, y1);
          drawControlPoint(ctx, x1, y2);
          drawControlPoint(ctx, x2, y2);
        }
      }
      else if (region.type === 'polygon' && region.vertices) {
        const vertices = region.vertices.map(([x, y]) => [
          x * imageWidth,
          y * imageHeight
        ]);
        
        if (vertices.length > 0) {
          ctx.beginPath();
          ctx.moveTo(vertices[0][0], vertices[0][1]);
          
          for (let i = 1; i < vertices.length; i++) {
            ctx.lineTo(vertices[i][0], vertices[i][1]);
          }
          
          ctx.closePath();
          ctx.stroke();
          
          if (isActive) {
            // Draw control points at each vertex
            vertices.forEach(([x, y]) => {
              drawControlPoint(ctx, x, y);
            });
          }
        }
      }
    });

    // Draw current points when creating a polygon
    if (activeMode === 'create' && creatingType === 'polygon' && drawingPoints.length > 0) {
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      
      const scaledPoints = drawingPoints.map(([x, y]) => [
        x * imageWidth,
        y * imageHeight
      ]) as [number, number][];
      
      ctx.beginPath();
      ctx.moveTo(scaledPoints[0][0], scaledPoints[0][1]);
      
      for (let i = 1; i < scaledPoints.length; i++) {
        ctx.lineTo(scaledPoints[i][0], scaledPoints[i][1]);
      }
      
      ctx.stroke();
      
      // Draw points
      scaledPoints.forEach(([x, y]) => {
        drawControlPoint(ctx, x, y);
      });
    }
  };

  const drawControlPoint = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.stroke();
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = regionCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / imageWidth;
    const y = (e.clientY - rect.top) / imageHeight;

    if (activeMode === 'select') {
      // Select region if clicked on one
      const clickedRegion = findRegionAtPoint(x, y);
      if (clickedRegion) {
        selectRegion(clickedRegion.id);
      }
    } else if (activeMode === 'create') {
      // Create region based on type
      if (creatingType === 'circle') {
        createCircleRegion(x, y);
        setActiveMode('select');
      } else if (creatingType === 'rectangle') {
        if (drawingPoints.length === 0) {
          setDrawingPoints([[x, y]]);
        } else {
          createRectangleRegion(drawingPoints[0][0], drawingPoints[0][1], x, y);
          setDrawingPoints([]);
          setActiveMode('select');
        }
      } else if (creatingType === 'polygon') {
        // Add point to polygon
        const newPoints = [...drawingPoints, [x, y]] as [number, number][];
        setDrawingPoints(newPoints);
        
        // Double click to complete polygon
        if (e.detail === 2 && newPoints.length >= 3) {
          createPolygonRegion(newPoints);
          setDrawingPoints([]);
          setActiveMode('select');
        }
      }
    }
  };

  const findRegionAtPoint = (x: number, y: number): Region | undefined => {
    // Check from top to bottom (last drawn to first drawn)
    for (let i = regions.length - 1; i >= 0; i--) {
      const region = regions[i];
      
      if (region.type === 'circle' && region.centerX !== undefined && 
          region.centerY !== undefined && region.radius !== undefined) {
        
        const dx = x - region.centerX;
        const dy = y - region.centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance <= region.radius) {
          return region;
        }
      }
      else if (region.type === 'rectangle' && region.x1 !== undefined && 
               region.y1 !== undefined && region.x2 !== undefined && region.y2 !== undefined) {
        
        const minX = Math.min(region.x1, region.x2);
        const maxX = Math.max(region.x1, region.x2);
        const minY = Math.min(region.y1, region.y2);
        const maxY = Math.max(region.y1, region.y2);
        
        if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
          return region;
        }
      }
      else if (region.type === 'polygon' && region.vertices && region.vertices.length > 0) {
        if (isPointInPolygon(x, y, region.vertices)) {
          return region;
        }
      }
    }
    
    return undefined;
  };

  const isPointInPolygon = (x: number, y: number, vertices: [number, number][]): boolean => {
    let inside = false;
    for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
      const xi = vertices[i][0], yi = vertices[i][1];
      const xj = vertices[j][0], yj = vertices[j][1];
      
      const intersect = ((yi > y) !== (yj > y))
          && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    
    return inside;
  };

  const createCircleRegion = (centerX: number, centerY: number) => {
    const radius = 0.1; // Default radius as 10% of min dimension
    
    addRegion({
      type: 'circle',
      name: `Circle Region ${regions.length + 1}`,
      algorithm: 'ordered',
      feather: 0,
      centerX,
      centerY,
      radius,
    });
  };

  const createRectangleRegion = (x1: number, y1: number, x2: number, y2: number) => {
    addRegion({
      type: 'rectangle',
      name: `Rectangle Region ${regions.length + 1}`,
      algorithm: 'ordered',
      feather: 0,
      x1,
      y1,
      x2,
      y2,
    });
  };

  const createPolygonRegion = (vertices: [number, number][]) => {
    addRegion({
      type: 'polygon',
      name: `Polygon Region ${regions.length + 1}`,
      algorithm: 'ordered',
      feather: 0,
      vertices,
    });
  };

  const handleShapeButtonClick = (type: RegionType) => {
    setCreatingType(type);
    setActiveMode('create');
    setDrawingPoints([]);
  };

  const cancelDrawing = () => {
    setActiveMode('select');
    setDrawingPoints([]);
  };

  const startRegionCreation = (type: RegionType) => {
    setActiveTool(type);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Selective Dithering Regions</h2>
        
        <div className="flex space-x-2">
          <button
            className={`btn btn-sm ${activeMode === 'select' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveMode('select')}
          >
            Select
          </button>
          <button
            className={`btn btn-sm ${activeMode === 'create' && creatingType === 'circle' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => handleShapeButtonClick('circle')}
          >
            Circle
          </button>
          <button
            className={`btn btn-sm ${activeMode === 'create' && creatingType === 'rectangle' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => handleShapeButtonClick('rectangle')}
          >
            Rectangle
          </button>
          <button
            className={`btn btn-sm ${activeMode === 'create' && creatingType === 'polygon' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => handleShapeButtonClick('polygon')}
          >
            Polygon
          </button>
          {activeMode === 'create' && (
            <button
              className="btn btn-sm btn-danger"
              onClick={cancelDrawing}
            >
              Cancel
            </button>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <canvas
              ref={regionCanvasRef}
              className="w-full"
              onClick={handleCanvasClick}
              style={{ cursor: activeMode === 'select' ? 'pointer' : 'crosshair' }}
            />
          </div>
          
          {activeMode === 'create' && (
            <div className="mt-2 text-sm text-gray-600">
              {creatingType === 'circle' && 'Click to place circle center'}
              {creatingType === 'rectangle' && (
                drawingPoints.length === 0 
                  ? 'Click to set first corner' 
                  : 'Click to set opposite corner'
              )}
              {creatingType === 'polygon' && 'Click to add points, double-click to complete'}
            </div>
          )}
        </div>
        
        <div className="lg:col-span-1">
          <div className="border border-gray-200 rounded-lg p-4">
            <RegionList />
            <RegionEditor />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegionSelector; 