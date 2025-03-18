import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useGalleryStore } from '../store/useGalleryStore';
import { useEditorStore } from '../store/useEditorStore';
import { useAuthStore } from '../store/useAuthStore';
import GalleryGrid from './GalleryGrid'; // Fixed import path
import Button from '../components/ui/Button';
import Tabs, { TabItem } from '../components/ui/Tabs';

// Simple Ad component - normally would be more sophisticated
const AdBanner: React.FC = () => (
  <div className="flex items-center justify-center py-4 px-6 bg-gray-100 border border-gray-200 rounded-lg text-center my-8">
    <p className="text-gray-600">
      <span className="text-xs uppercase font-medium text-gray-400 mr-2">SPONSORED</span>
      Want to enhance your design toolkit? Try PhotoFusion Pro - 20% off with code HALFTONE.
    </p>
  </div>
);

const CommunityGallery: React.FC = () => {
  const { 
    communityImages, 
    isLoading, 
    fetchCommunityImages, 
    loadMoreCommunityImages, 
    hasMoreCommunityImages,
    likeImage,
    unlikeImage,
    error
  } = useGalleryStore();
  
  const { loadSettings } = useEditorStore();
  const { user } = useAuthStore();
  
  const [filter, setFilter] = useState<'all' | 'popular' | 'recent'>('recent');
  
  useEffect(() => {
    fetchCommunityImages();
  }, [fetchCommunityImages]);
  
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
  
  // Apply filter to the images
  const filteredImages = [...communityImages].sort((a, b) => {
    if (filter === 'popular') {
      return b.like_count - a.like_count;
    } else if (filter === 'recent') {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
    return 0;
  });
  
  const tabs: TabItem[] = [
    {
      id: 'recent',
      label: 'Recent',
      content: null
    },
    {
      id: 'popular',
      label: 'Popular',
      content: null
    }
  ];
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Community Gallery</h1>
          <p className="text-gray-500 mt-1">Explore creations shared by other users</p>
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
              Create Your Own
            </Button>
          </Link>
        </div>
      </div>
      
      <div className="flex justify-between items-center mb-6">
        <Tabs 
          tabs={tabs}
          defaultTabId={filter}
          onChange={(tabId) => setFilter(tabId as 'all' | 'popular' | 'recent')}
          variant="pills"
        />
        
        {!user && (
          <div className="bg-primary-50 text-primary-700 px-4 py-2 rounded-lg text-sm">
            <Link to="/login" className="font-medium hover:underline">Sign in</Link> to like images and save your favorites
          </div>
        )}
      </div>
      
      <GalleryGrid 
        images={filteredImages}
        isLoading={isLoading}
        hasMore={hasMoreCommunityImages}
        onLoadMore={loadMoreCommunityImages}
        onLike={likeImage}
        onUnlike={unlikeImage}
        onApplySettings={handleApplySettings}
        emptyMessage="No community images found. Be the first to share your creation!"
      />
      
      {/* Ad placeholders - in a real app, these would be dynamic ads */}
      {filteredImages.length >= 4 && <AdBanner />}
      {filteredImages.length >= 12 && <AdBanner />}
      
      <div className="mt-12 bg-gray-50 rounded-lg p-6 border border-gray-200">
        <h2 className="text-xl font-bold mb-3">About the Community Gallery</h2>
        <p className="text-gray-600 mb-4">
          This gallery showcases images created and shared by our community. When you create an image in the editor, 
          you can choose to share it here for others to see, like, and use as inspiration.
        </p>
        <p className="text-gray-600">
          By sharing your creations, you help others discover new techniques and possibilities with halftone dithering.
          All shared images will display your username and allow others to apply your settings to the editor.
        </p>
      </div>
    </div>
  );
};

export default CommunityGallery;