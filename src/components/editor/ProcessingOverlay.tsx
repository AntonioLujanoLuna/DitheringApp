import React from 'react';
import { useThemeStore } from '../../store/useThemeStore';

interface ProcessingOverlayProps {
  isProcessing: boolean;
  showProgress: boolean;
  progressPercent: number;
}

const ProcessingOverlay: React.FC<ProcessingOverlayProps> = ({ 
  isProcessing,
  showProgress,
  progressPercent
}) => {
  const { darkMode } = useThemeStore();

  if (!isProcessing) {
    return null;
  }

  return (
    <div className={`absolute inset-0 flex flex-col items-center justify-center z-10 ${darkMode ? 'bg-gray-800/70' : 'bg-white/70'}`}>
      {showProgress ? (
        <>
          <div className="w-48 mb-4">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
              <div 
                className="bg-primary-600 h-2.5 rounded-full transition-all duration-300" 
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
            <p className="text-center mt-2 text-sm text-gray-600 dark:text-gray-400">
              {progressPercent}% complete
            </p>
          </div>
        </>
      ) : (
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-600"></div>
      )}
    </div>
  );
};

export default ProcessingOverlay; 