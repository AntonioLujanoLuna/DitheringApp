import React from 'react';
import { useThemeStore } from '../../store/useThemeStore';
import Button from '../ui/Button';
import { toast } from 'react-hot-toast';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareLink: string;
  onViewSharePage: () => void;
}

const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  shareLink,
  onViewSharePage
}) => {
  const { darkMode } = useThemeStore();
  
  if (!isOpen) return null;
  
  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${darkMode ? 'bg-gray-900/80' : 'bg-gray-100/80'}`}>
      <div className={`w-full max-w-md rounded-lg shadow-xl p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <h2 className="text-xl font-bold mb-4">Share Your Creation</h2>
        
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Share this link to let others apply these exact settings to their own images. The link includes a preview of your current result.
          </p>
          
          <div className="flex">
            <input
              type="text"
              value={shareLink}
              readOnly
              className="flex-1 p-2 border border-gray-300 rounded-l-md text-sm"
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText(shareLink);
                toast.success('Link copied to clipboard!');
              }}
              className="bg-primary-500 text-white px-3 py-2 rounded-r-md hover:bg-primary-600"
            >
              Copy
            </button>
          </div>
          
          <div className="flex justify-between mt-2">
            <button
              onClick={() => {
                window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent('Check out this image effect I created!')}&url=${encodeURIComponent(shareLink)}`, '_blank');
              }}
              className="text-blue-400 hover:text-blue-500"
            >
              Share on Twitter
            </button>
            
            <button
              onClick={onViewSharePage}
              className="text-primary-600 hover:text-primary-700"
            >
              View Share Page
            </button>
          </div>
        </div>
        
        <div className="flex justify-end mt-6 gap-2">
          <Button
            onClick={onClose}
            variant="secondary"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ShareModal; 