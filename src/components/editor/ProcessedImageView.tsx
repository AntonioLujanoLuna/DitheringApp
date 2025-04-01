import React, { forwardRef } from 'react';

interface ProcessedImageViewProps {
  // Add any necessary props, e.g., width, height if needed dynamically
  className?: string;
}

const ProcessedImageView = forwardRef<HTMLCanvasElement, ProcessedImageViewProps>(
  ({ className = "", ...props }, ref) => {
    return (
      <canvas
        ref={ref}
        className={`max-w-full ${className}`}
        {...props}
      />
    );
  }
);

ProcessedImageView.displayName = 'ProcessedImageView';

export default ProcessedImageView; 