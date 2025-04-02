import React from 'react';

interface SkeletonProps {
  width?: string;
  height?: string;
  rounded?: string;
  className?: string;
}

const Skeleton: React.FC<SkeletonProps> = ({
  width = 'full',
  height = '20px',
  rounded = 'md',
  className = '',
}) => {
  return (
    <div
      className={`
        animate-pulse bg-gray-200 dark:bg-gray-700 
        ${width !== 'full' ? `w-${width}` : 'w-full'}
        h-${height} rounded-${rounded} ${className}
      `}
    />
  );
};

export interface ImageCardSkeletonProps {
  className?: string;
}

export const ImageCardSkeleton: React.FC<ImageCardSkeletonProps> = ({ className = '' }) => {
  return (
    <div className={`bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden animate-pulse ${className}`}>
      <div className="aspect-square bg-gray-200 dark:bg-gray-700"></div>
      <div className="p-4 space-y-3">
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
      </div>
    </div>
  );
};

export default Skeleton; 