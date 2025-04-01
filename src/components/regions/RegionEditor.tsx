import React, { useState, useEffect } from 'react';
import { useEditingSessionStore, DitheringAlgorithm } from '../../store/useEditingSessionStore';
import AlgorithmSelector from '../editor/settings/AlgorithmSelector';

interface RegionEditorProps {
  regionId: string;
}

const RegionEditor: React.FC<RegionEditorProps> = ({ regionId }) => {
  const { regions, activeRegionId, updateRegion } = useEditingSessionStore();
  const currentRegion = regions.find(r => r.id === regionId);
  
  if (!currentRegion) {
    return (
      <div className="mt-4 p-4 border border-gray-200 rounded bg-gray-50 text-center text-gray-500">
        Select a region to edit its properties
      </div>
    );
  }
  
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateRegion(currentRegion.id, { name: e.target.value });
  };
  
  const handleAlgorithmChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateRegion(currentRegion.id, { 
      algorithm: e.target.value as DitheringAlgorithm 
    });
  };
  
  const handleFeatherChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateRegion(currentRegion.id, { 
      feather: parseFloat(e.target.value) 
    });
  };
  
  const handleDotSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateRegion(currentRegion.id, { 
      dotSize: parseInt(e.target.value, 10) 
    });
  };
  
  const handleSpacingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateRegion(currentRegion.id, { 
      spacing: parseInt(e.target.value, 10) 
    });
  };
  
  const handleAngleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateRegion(currentRegion.id, { 
      angle: parseInt(e.target.value, 10) 
    });
  };
  
  const handleThresholdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateRegion(currentRegion.id, { 
      threshold: parseInt(e.target.value, 10) 
    });
  };
  
  // For circle-specific properties
  const handleCenterXChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (currentRegion.type !== 'circle') return;
    updateRegion(currentRegion.id, { 
      centerX: parseFloat(e.target.value) 
    });
  };
  
  const handleCenterYChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (currentRegion.type !== 'circle') return;
    updateRegion(currentRegion.id, { 
      centerY: parseFloat(e.target.value) 
    });
  };
  
  const handleRadiusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (currentRegion.type !== 'circle') return;
    updateRegion(currentRegion.id, { 
      radius: parseFloat(e.target.value) 
    });
  };
  
  // For rectangle-specific properties
  const handleX1Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (currentRegion.type !== 'rectangle') return;
    updateRegion(currentRegion.id, { 
      x1: parseFloat(e.target.value) 
    });
  };
  
  const handleY1Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (currentRegion.type !== 'rectangle') return;
    updateRegion(currentRegion.id, { 
      y1: parseFloat(e.target.value) 
    });
  };
  
  const handleX2Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (currentRegion.type !== 'rectangle') return;
    updateRegion(currentRegion.id, { 
      x2: parseFloat(e.target.value) 
    });
  };
  
  const handleY2Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (currentRegion.type !== 'rectangle') return;
    updateRegion(currentRegion.id, { 
      y2: parseFloat(e.target.value) 
    });
  };
  
  return (
    <div className="mt-4 space-y-4">
      <h3 className="text-md font-medium">Edit Region</h3>
      
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Name
          <input
            type="text"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            value={currentRegion.name}
            onChange={handleNameChange}
          />
        </label>
        
        <label className="block text-sm font-medium text-gray-700">
          Dithering Algorithm
          <select
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            value={currentRegion.algorithm}
            onChange={handleAlgorithmChange}
          >
            <option value="ordered">Ordered</option>
            <option value="floydSteinberg">Floyd-Steinberg</option>
            <option value="atkinson">Atkinson</option>
            <option value="halftone">Halftone</option>
            <option value="jarvisJudiceNinke">Jarvis-Judice-Ninke</option>
            <option value="stucki">Stucki</option>
            <option value="burkes">Burkes</option>
            <option value="sierraLite">Sierra Lite</option>
            <option value="random">Random</option>
            <option value="voidAndCluster">Void and Cluster</option>
            <option value="blueNoise">Blue Noise</option>
            <option value="riemersma">Riemersma</option>
            <option value="directBinarySearch">Direct Binary Search</option>
            <option value="pattern">Pattern</option>
          </select>
        </label>
        
        <label className="block text-sm font-medium text-gray-700">
          Edge Feathering
          <input
            type="range"
            min="0"
            max="0.5"
            step="0.01"
            className="mt-1 block w-full"
            value={currentRegion.feather}
            onChange={handleFeatherChange}
          />
          <div className="text-xs text-gray-500 mt-1">
            {(currentRegion.feather * 100).toFixed(0)}% feathering
          </div>
        </label>
        
        {/* Algorithm-specific properties */}
        {(currentRegion.algorithm === 'ordered' || 
          currentRegion.algorithm === 'halftone' || 
          currentRegion.algorithm === 'pattern') && (
          <label className="block text-sm font-medium text-gray-700">
            Dot Size
            <input
              type="range"
              min="1"
              max="10"
              step="1"
              className="mt-1 block w-full"
              value={currentRegion.dotSize || 4}
              onChange={handleDotSizeChange}
            />
            <div className="text-xs text-gray-500 mt-1">
              {currentRegion.dotSize || 4}
            </div>
          </label>
        )}
        
        {currentRegion.algorithm === 'halftone' && (
          <>
            <label className="block text-sm font-medium text-gray-700">
              Spacing
              <input
                type="range"
                min="2"
                max="20"
                step="1"
                className="mt-1 block w-full"
                value={currentRegion.spacing || 5}
                onChange={handleSpacingChange}
              />
              <div className="text-xs text-gray-500 mt-1">
                {currentRegion.spacing || 5}
              </div>
            </label>
            
            <label className="block text-sm font-medium text-gray-700">
              Angle
              <input
                type="range"
                min="0"
                max="90"
                step="5"
                className="mt-1 block w-full"
                value={currentRegion.angle || 45}
                onChange={handleAngleChange}
              />
              <div className="text-xs text-gray-500 mt-1">
                {currentRegion.angle || 45}°
              </div>
            </label>
          </>
        )}
        
        {(currentRegion.algorithm === 'floydSteinberg' || 
          currentRegion.algorithm === 'atkinson' || 
          currentRegion.algorithm === 'jarvisJudiceNinke' || 
          currentRegion.algorithm === 'stucki' || 
          currentRegion.algorithm === 'burkes' || 
          currentRegion.algorithm === 'sierraLite' || 
          currentRegion.algorithm === 'random' || 
          currentRegion.algorithm === 'voidAndCluster' || 
          currentRegion.algorithm === 'blueNoise' || 
          currentRegion.algorithm === 'riemersma' || 
          currentRegion.algorithm === 'directBinarySearch') && (
          <label className="block text-sm font-medium text-gray-700">
            Threshold
            <input
              type="range"
              min="0"
              max="255"
              step="1"
              className="mt-1 block w-full"
              value={currentRegion.threshold || 128}
              onChange={handleThresholdChange}
            />
            <div className="text-xs text-gray-500 mt-1">
              {currentRegion.threshold || 128}
            </div>
          </label>
        )}
        
        {/* Region-specific properties */}
        {currentRegion.type === 'circle' && (
          <div className="space-y-2 border-t pt-2 mt-2">
            <h4 className="text-sm font-medium">Circle Properties</h4>
            
            <div className="grid grid-cols-2 gap-2">
              <label className="block text-sm font-medium text-gray-700">
                Center X
                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.01"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={currentRegion.centerX}
                  onChange={handleCenterXChange}
                />
              </label>
              
              <label className="block text-sm font-medium text-gray-700">
                Center Y
                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.01"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={currentRegion.centerY}
                  onChange={handleCenterYChange}
                />
              </label>
            </div>
            
            <label className="block text-sm font-medium text-gray-700">
              Radius
              <input
                type="range"
                min="0.01"
                max="0.5"
                step="0.01"
                className="mt-1 block w-full"
                value={currentRegion.radius}
                onChange={handleRadiusChange}
              />
              <div className="text-xs text-gray-500 mt-1">
                {(currentRegion.radius! * 100).toFixed(0)}%
              </div>
            </label>
          </div>
        )}
        
        {currentRegion.type === 'rectangle' && (
          <div className="space-y-2 border-t pt-2 mt-2">
            <h4 className="text-sm font-medium">Rectangle Properties</h4>
            
            <div className="grid grid-cols-2 gap-2">
              <label className="block text-sm font-medium text-gray-700">
                X1
                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.01"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={currentRegion.x1}
                  onChange={handleX1Change}
                />
              </label>
              
              <label className="block text-sm font-medium text-gray-700">
                Y1
                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.01"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={currentRegion.y1}
                  onChange={handleY1Change}
                />
              </label>
              
              <label className="block text-sm font-medium text-gray-700">
                X2
                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.01"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={currentRegion.x2}
                  onChange={handleX2Change}
                />
              </label>
              
              <label className="block text-sm font-medium text-gray-700">
                Y2
                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.01"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={currentRegion.y2}
                  onChange={handleY2Change}
                />
              </label>
            </div>
          </div>
        )}
        
        {currentRegion.type === 'polygon' && (
          <div className="space-y-2 border-t pt-2 mt-2">
            <h4 className="text-sm font-medium">Polygon Properties</h4>
            <p className="text-xs text-gray-500">
              Polygon vertices can be edited directly on the canvas.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RegionEditor; 