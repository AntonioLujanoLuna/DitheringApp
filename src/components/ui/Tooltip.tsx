import React from 'react';

interface TooltipProps {
  children: React.ReactNode;
  text: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

const Tooltip: React.FC<TooltipProps> = ({ 
  children, 
  text, 
  position = 'top' 
}) => {
  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 -translate-y-2 mb-1',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 translate-y-2 mt-1',
    left: 'right-full top-1/2 transform -translate-y-1/2 -translate-x-2 mr-1',
    right: 'left-full top-1/2 transform -translate-y-1/2 translate-x-2 ml-1'
  };

  const arrowClasses = {
    top: 'top-full left-1/2 transform -translate-x-1/2 border-t-gray-900',
    bottom: 'bottom-full left-1/2 transform -translate-x-1/2 border-b-gray-900',
    left: 'left-full top-1/2 transform -translate-y-1/2 border-l-gray-900',
    right: 'right-full top-1/2 transform -translate-y-1/2 border-r-gray-900'
  };

  return (
    <div className="relative group">
      {children}
      <div 
        className={`
          absolute ${positionClasses[position]} px-2 py-1 bg-gray-900 dark:bg-gray-800
          text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 
          group-hover:visible transition-all duration-200 z-50 whitespace-nowrap
        `}
      >
        {text}
        <div 
          className={`
            absolute ${arrowClasses[position]} border-4 border-transparent
          `}
        >
        </div>
      </div>
    </div>
  );
};

export default Tooltip; 