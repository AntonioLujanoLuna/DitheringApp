import React from 'react';
import { DitheringAlgorithm } from '../../store/useEditingSessionStore';

interface ImagePreviewHeaderProps {
  showComparison: boolean;
  toggleComparisonView: () => void;
  algorithm: DitheringAlgorithm;
  showRegionSelector: boolean;
  toggleRegionSelector: () => void;
  isProcessing: boolean;
  handleDownload: () => void;
  handleDownloadSVG: () => void;
}

const ImagePreviewHeader: React.FC<ImagePreviewHeaderProps> = ({ 
  showComparison, 
  toggleComparisonView, 
  algorithm, 
  showRegionSelector, 
  toggleRegionSelector, 
  isProcessing, 
  handleDownload, 
  handleDownloadSVG 
}) => {
  return (
    <div className="flex justify-between items-center">
      <h2 className="text-xl font-bold">
        Preview
      </h2>
      
      <div className="flex space-x-2">
        <button
          onClick={toggleComparisonView}
          className={`btn ${showComparison ? 'btn-primary' : 'btn-secondary'} flex items-center gap-2`}
          disabled={isProcessing}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12M8 12h12M8 17h12M4 7h.01M4 12h.01M4 17h.01" />
          </svg>
          {showComparison ? 'Standard View' : 'Comparison View'}
        </button>
        
        {algorithm === 'selective' && (
          <button
            onClick={toggleRegionSelector}
            className={`btn ${showRegionSelector ? 'btn-primary' : 'btn-secondary'} flex items-center gap-2`}
            disabled={isProcessing}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
            </svg>
            {showRegionSelector ? 'Hide Regions' : 'Manage Regions'}
          </button>
        )}
        
        <div className="dropdown dropdown-end">
          <button 
            className="btn btn-secondary flex items-center gap-2"
            disabled={isProcessing}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <ul className="dropdown-content z-10 menu p-2 shadow bg-base-100 rounded-box w-52">
            <li>
              <a onClick={handleDownload}>
                <span className="text-sm">PNG Image</span>
              </a>
            </li>
            <li>
              <a onClick={handleDownloadSVG}>
                <span className="text-sm">SVG Vector</span>
                {(algorithm === 'halftone' || algorithm === 'pattern') && 
                  <span className="badge badge-sm badge-primary">Recommended</span>
                }
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ImagePreviewHeader; 