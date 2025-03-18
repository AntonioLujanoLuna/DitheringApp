import React from 'react';
import ImageCard from '../components/gallery/ImageCard';
import { ImageItem } from '../store/useGalleryStore';
import Button from '../components/ui/Button';

interface GalleryGridProps {
  images: ImageItem[];
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => Promise<void>;
  onLike: (imageId: string) => Promise<void>;
  onUnlike: (imageId: string) => Promise<void>;
  onDelete?: (imageId: string) => Promise<void>;
  onApplySettings?: (settings: any) => void;
  emptyMessage?: string;
}

const GalleryGrid: React.FC<GalleryGridProps> = ({
  images,
  isLoading,
  hasMore,
  onLoadMore,
  onLike,
  onUnlike,
  onDelete,
  onApplySettings,
  emptyMessage = 'No images found'
}) => {
  const [loadMoreLoading, setLoadMoreLoading] = React.useState(false);
  
  const handleLoadMore = async () => {
    if (loadMoreLoading || !hasMore) return;
    
    try {
      setLoadMoreLoading(true);
      await onLoadMore();
    } catch (error) {
      console.error('Error loading more images:', error);
    } finally {
      setLoadMoreLoading(false);
    }
  };
  
  if (isLoading && images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        <p className="mt-4 text-gray-500">Loading images...</p>
      </div>
    );
  }
  
  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] border-2 border-dashed border-gray-300 rounded-lg p-8">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-16 w-16 text-gray-400 mb-4" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={1.5} 
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
          />
        </svg>
        <p className="text-lg text-gray-500">{emptyMessage}</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {images.map(image => (
          <ImageCard
            key={image.id}
            image={image}
            onLike={onLike}
            onUnlike={onUnlike}
            onDelete={onDelete}
            onApplySettings={onApplySettings}
          />
        ))}
      </div>
      
      {hasMore && (
        <div className="flex justify-center mt-8">
          <Button
            onClick={handleLoadMore}
            isLoading={loadMoreLoading}
            variant="secondary"
            leftIcon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            }
          >
            Load More
          </Button>
        </div>
      )}
    </div>
  );
};

export default GalleryGrid;