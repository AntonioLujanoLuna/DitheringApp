import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ImageItem } from '../../store/useGalleryStore';
import { useAuthStore } from '../../store/useAuthStore';

interface ImageCardProps {
  image: ImageItem;
  onLike: (imageId: string) => Promise<void>;
  onUnlike: (imageId: string) => Promise<void>;
  onDelete?: (imageId: string) => Promise<void>;
  onApplySettings?: (settings: any) => void;
}

const ImageCard: React.FC<ImageCardProps> = ({
  image,
  onLike,
  onUnlike,
  onDelete,
  onApplySettings,
}) => {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  
  const isOwner = user && user.id === image.user_id;
  
  const handleLikeToggle = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      if (image.user_has_liked) {
        await onUnlike(image.id);
      } else {
        await onLike(image.id);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDelete = async () => {
    if (!isOwner || !onDelete) return;
    
    if (window.confirm('Are you sure you want to delete this image? This action cannot be undone.')) {
      try {
        setIsLoading(true);
        await onDelete(image.id);
      } catch (error) {
        console.error('Error deleting image:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };
  
  return (
    <div className="group relative bg-white rounded-lg shadow-md overflow-hidden">
      {/* Image */}
      <Link to={`/gallery/image/${image.id}`} className="block relative aspect-square">
        <img 
          src={image.processed_url} 
          alt={image.title} 
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
      </Link>
      
      {/* Overlay with title */}
      <Link to={`/gallery/image/${image.id}`} className="block">
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-4 text-white">
          <h3 className="font-semibold truncate">{truncateText(image.title, 30)}</h3>
          <p className="text-sm text-gray-300">
            {image.username || 'Anonymous'} • {new Date(image.created_at).toLocaleDateString()}
          </p>
        </div>
      </Link>
      
      {/* Like button and count */}
      <div className="absolute top-3 left-3 flex items-center space-x-1 bg-black/40 rounded-full px-2.5 py-1 text-white">
        <button 
          onClick={handleLikeToggle} 
          disabled={!user || isLoading}
          className="focus:outline-none"
          aria-label={image.user_has_liked ? "Unlike image" : "Like image"}
        >
          {image.user_has_liked ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 hover:text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          )}
        </button>
        <span className="text-sm">{image.like_count}</span>
      </div>
      
      {/* Action menu (for owner or settings) */}
      {(isOwner || onApplySettings) && (
        <div className="absolute top-3 right-3">
          <button 
            onClick={() => setShowMenu(!showMenu)}
            className="bg-black/40 rounded-full p-1.5 text-white hover:bg-black/60 focus:outline-none"
            aria-label="Options"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
          
          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
              <div className="py-1">
                {onApplySettings && (
                  <button
                    onClick={() => {
                      onApplySettings(image.processing_settings);
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100"
                  >
                    Apply Settings to Editor
                  </button>
                )}
                
                {isOwner && onDelete && (
                  <button
                    onClick={handleDelete}
                    className="w-full px-4 py-2 text-sm text-left text-red-600 hover:bg-red-50"
                  >
                    Delete Image
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
        </div>
      )}
    </div>
  );
};

export default ImageCard;