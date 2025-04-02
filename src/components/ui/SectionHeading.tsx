import React from 'react';

interface SectionHeadingProps {
  children: React.ReactNode;
  className?: string;
}

const SectionHeading: React.FC<SectionHeadingProps> = ({ 
  children,
  className = ''
}) => {
  return (
    <h3 className={`text-lg font-semibold pb-2 mb-4 border-b border-gray-200 dark:border-gray-700 ${className}`}>
      {children}
    </h3>
  );
};

export default SectionHeading; 