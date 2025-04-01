import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useGalleryStore } from '../store/useGalleryStore';
import { useEditingSessionStore } from '../store/useEditingSessionStore';
import GalleryGrid from './GalleryGrid';
import Button from '../components/ui/Button';

const MyGallery: React.FC = () => {
  const { 
    myImages, 
    isLoading, 
    fetchMyImages, 
    loadMoreMyImages, 
    hasMoreMyImages,
    likeImage,
    unlikeImage,
    deleteImage,
    error
  } = useGalleryStore();
  
  const { loadSettings } = useEditingSessionStore();
  
  useEffect(() => {
    fetchMyImages();
  }, [fetchMyImages]);
  
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);
  
  const handleApplySettings = (settings: any) => {
    try {
      loadSettings(settings);
      toast.success('Settings applied to editor');
    } catch (error) {
      console.error('Error applying settings:', error);
      toast.error('Failed to apply settings to editor');
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Collection</h1>
          <p className="text-gray-500 mt-1">Your personal gallery of processed images</p>
        </div>
        
        <div className="mt-4 md:mt-0">
          <Link to="/editor">
            <Button 
              variant="primary"
              leftIcon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              }
            >
              Create New Image
            </Button>
          </Link>
        </div>
      </div>
      
      <GalleryGrid 
        images={myImages}
        isLoading={isLoading}
        hasMore={hasMoreMyImages}
        onLoadMore={loadMoreMyImages}
        onLike={likeImage}
        onUnlike={unlikeImage}
        onDelete={deleteImage}
        onApplySettings={handleApplySettings}
        emptyMessage="You haven't saved any images yet. Create one in the editor!"
      />
    </div>
  );
};

export default MyGallery;