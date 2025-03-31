// src/components/ui/Tabs.tsx
import React, { useState } from 'react';

export interface TabItem {
  id: string;
  label: string;
  content: React.ReactNode;
}

interface TabsProps {
  tabs: TabItem[];
  defaultTabId?: string;
  variant?: 'underline' | 'pills' | 'boxed';
  onChange?: (tabId: string) => void;
}

const Tabs: React.FC<TabsProps> = ({
  tabs,
  defaultTabId,
  variant = 'underline',
  onChange
}) => {
  const [activeTab, setActiveTab] = useState(defaultTabId || tabs[0].id);
  
  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    if (onChange) {
      onChange(tabId);
    }
  };
  
  const getTabStyles = (tabId: string) => {
    const isActive = activeTab === tabId;
    
    switch (variant) {
      case 'pills':
        return isActive
          ? 'bg-primary-100 text-primary-700 font-medium'
          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100';
      case 'boxed':
        return isActive
          ? 'bg-white border-t border-l border-r text-primary-600 font-medium'
          : 'bg-gray-50 text-gray-500 hover:text-gray-700 border';
      case 'underline':
      default:
        return isActive
          ? 'text-primary-600 border-b-2 border-primary-500 font-medium'
          : 'text-gray-500 hover:text-gray-700 hover:border-gray-300 border-b-2 border-transparent';
    }
  };
  
  const baseTabStyles = 'px-4 py-2 cursor-pointer transition-colors duration-200';
  
  return (
    <div className="w-full">
      <div className={`flex ${variant === 'underline' ? 'border-b border-gray-200' : ''}`}>
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`${baseTabStyles} ${getTabStyles(tab.id)}`}
            onClick={() => handleTabClick(tab.id)}
          >
            {tab.label}
          </div>
        ))}
      </div>
      
      <div className="py-4">
        {tabs.find(tab => tab.id === activeTab)?.content}
      </div>
    </div>
  );
};

export default Tabs;