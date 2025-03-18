import React, { useState } from 'react';

export interface TabItem {
  id: string;
  label: React.ReactNode;
  content: React.ReactNode;
  disabled?: boolean;
}

interface TabsProps {
  tabs: TabItem[];
  defaultTabId?: string;
  onChange?: (tabId: string) => void;
  variant?: 'default' | 'pills' | 'underline';
  className?: string;
}

const Tabs: React.FC<TabsProps> = ({
  tabs,
  defaultTabId,
  onChange,
  variant = 'default',
  className = '',
}) => {
  // Set the default tab, defaulting to the first enabled tab
  const initialTabId = defaultTabId || tabs.find(tab => !tab.disabled)?.id || tabs[0]?.id;
  const [activeTabId, setActiveTabId] = useState(initialTabId);
  
  const handleTabClick = (tabId: string) => {
    setActiveTabId(tabId);
    onChange?.(tabId);
  };
  
  // Variants for tabs
  const variantStyles = {
    default: {
      tabsList: 'flex space-x-1 border-b border-gray-200',
      tab: (active: boolean, disabled: boolean) => `
        px-4 py-2 text-sm font-medium
        ${active 
          ? 'border-b-2 border-primary-500 text-primary-600' 
          : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `,
    },
    pills: {
      tabsList: 'flex space-x-1',
      tab: (active: boolean, disabled: boolean) => `
        px-4 py-2 text-sm font-medium rounded-md
        ${active 
          ? 'bg-primary-100 text-primary-700' 
          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `,
    },
    underline: {
      tabsList: 'flex space-x-8',
      tab: (active: boolean, disabled: boolean) => `
        py-4 px-1 text-sm font-medium border-b-2 
        ${active 
          ? 'border-primary-500 text-primary-600' 
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `,
    },
  };
  
  const currentVariant = variantStyles[variant];
  
  // Find active tab content
  const activeTab = tabs.find(tab => tab.id === activeTabId) || tabs[0];
  
  return (
    <div className={className}>
      <div className={currentVariant.tabsList} role="tablist">
        {tabs.map(tab => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTabId === tab.id}
            aria-controls={`tab-panel-${tab.id}`}
            id={`tab-${tab.id}`}
            className={currentVariant.tab(activeTabId === tab.id, !!tab.disabled)}
            onClick={() => !tab.disabled && handleTabClick(tab.id)}
            disabled={tab.disabled}
          >
            {tab.label}
          </button>
        ))}
      </div>
      
      <div 
        id={`tab-panel-${activeTab.id}`}
        role="tabpanel"
        aria-labelledby={`tab-${activeTab.id}`}
        className="py-4"
      >
        {activeTab.content}
      </div>
    </div>
  );
};

export default Tabs;