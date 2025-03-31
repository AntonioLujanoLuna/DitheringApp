import React from 'react';
import { useRegionStore, Region } from '../../store/useRegionStore';

const RegionList: React.FC = () => {
  const { 
    regions, 
    activeRegionId, 
    selectRegion, 
    deleteRegion, 
    moveRegionUp, 
    moveRegionDown 
  } = useRegionStore();

  const handleRegionClick = (region: Region) => {
    selectRegion(region.id);
  };

  if (regions.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        No regions defined. Use the tools above to create regions.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-md font-medium">Regions</h3>
      <div className="max-h-60 overflow-y-auto">
        {regions.map((region) => (
          <div 
            key={region.id}
            className={`flex justify-between items-center p-2 rounded cursor-pointer ${
              region.id === activeRegionId ? 'bg-blue-100 border border-blue-300' : 'hover:bg-gray-100'
            }`}
            onClick={() => handleRegionClick(region)}
          >
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-sm font-medium">{region.name}</span>
              <span className="text-xs text-gray-500">{region.algorithm}</span>
            </div>
            
            <div className="flex space-x-1">
              <button 
                className="text-gray-500 hover:text-blue-500"
                onClick={(e) => {
                  e.stopPropagation();
                  moveRegionUp(region.id);
                }}
                title="Move Up"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
              </button>
              
              <button 
                className="text-gray-500 hover:text-blue-500"
                onClick={(e) => {
                  e.stopPropagation();
                  moveRegionDown(region.id);
                }}
                title="Move Down"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
              
              <button 
                className="text-gray-500 hover:text-red-500"
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm(`Delete region "${region.name}"?`)) {
                    deleteRegion(region.id);
                  }
                }}
                title="Delete"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RegionList; 