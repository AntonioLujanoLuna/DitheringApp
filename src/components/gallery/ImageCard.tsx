// src/components/gallery/ImageCard.tsx
import React from 'react';
import { ImageItem } from '../../store/useGalleryStore';

interface ImageCardProps {
  image: ImageItem;
  onDelete?: (imageId: string) => Promise<void>;
  onApplySettings?: (settings: any) => void;
  onLike?: (imageId: string) => Promise<void>;
  onUnlike?: (imageId: string) => Promise<void>;
}

const ImageCard: React.FC<ImageCardProps> = ({
  image,
  onDelete,
  onApplySettings,
  onLike,
  onUnlike
}) => {
  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="relative aspect-square">
        <img 
          src={image.processedUrl} 
          alt={image.title}
          className="w-full h-full object-cover"
        />
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold text-lg truncate">{image.title}</h3>
        {image.description && (
          <p className="text-gray-600 text-sm mt-1 line-clamp-2">{image.description}</p>
        )}
        
        <div className="flex justify-between items-center mt-4">
          <div className="text-sm text-gray-500">
            {new Date(image.created_at).toLocaleDateString()}
          </div>
          
          <div className="flex space-x-1">
            {onApplySettings && image.processingSettings && (
              <button
                onClick={() => onApplySettings(image.processingSettings)}
                className="p-1.5 text-gray-500 hover:text-primary-600"
                title="Apply these settings to the editor"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            )}
            
            {onDelete && (
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete this image?')) {
                    onDelete(image.id);
                  }
                }}
                className="p-1.5 text-gray-500 hover:text-red-600"
                title="Delete this image"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageCard;