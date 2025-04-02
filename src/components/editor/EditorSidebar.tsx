import React from 'react';
import ImageUploader from './ImageUploader';
import SettingsPanel from './SettingsPanel';

interface EditorSidebarProps {
  showUploader: boolean;
  onUpload: () => void;
  isMobile: boolean;
  onSavePreset: () => void;
  onBeforeChange: () => void;
}

const EditorSidebar: React.FC<EditorSidebarProps> = ({
  showUploader,
  onUpload,
  isMobile,
  onSavePreset,
  onBeforeChange
}) => {
  return (
    <div className="lg:col-span-1 space-y-6">
      {showUploader && (
        <div className="mb-6">
          <ImageUploader onUpload={onUpload} />
        </div>
      )}
      
      <SettingsPanel 
        onSavePreset={onSavePreset} 
        onBeforeChange={onBeforeChange} 
      />
    </div>
  );
};

export default EditorSidebar; 