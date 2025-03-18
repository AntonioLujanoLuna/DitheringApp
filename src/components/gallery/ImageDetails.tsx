import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useGalleryStore, ImageItem } from '../../store/useGalleryStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useEditorStore } from '../../store/useEditorStore';
import Button from '../../components/ui/Button';
import { toast } from 'react-toastify';
import { QRCodeSVG } from 'qrcode.react';

interface ImageDetailData extends Omit<ImageItem, 'processing_settings'> {
  processing_settings: any;
  original_url: string;
}

const ImageDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { likeImage, unlikeImage, deleteImage, fetchImageById } = useGalleryStore();
  const { loadSettings } = useEditorStore();
  
  const [image, setImage] = useState<ImageDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [shareURL, setShareURL] = useState('');
  
  useEffect(() => {
    if (!id) return;
    
    const loadImage = async () => {
      try {
        setIsLoading(true);
        const imageData = await fetchImageById(id);
        setImage(imageData);
        
        // Generate share URL
        const baseUrl = window.location.origin;
        setShareURL(`${baseUrl}/gallery/image/${id}`);
      } catch (error) {
        console.error('Error loading image:', error);
        toast.error('Failed to load image details');
        navigate('/gallery/community');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadImage();
  }, [id, fetchImageById, navigate]);
  
  const isOwner = user && image && user.id === image.user_id;
  
  const handleLikeToggle = async () => {
    if (!user || !image) return;
    
    try {
      setIsLiking(true);
      if (image.user_has_liked) {
        await unlikeImage(image.id);
        setImage({
          ...image,
          user_has_liked: false,
          like_count: Math.max(0, image.like_count - 1)
        });
      } else {
        await likeImage(image.id);
        setImage({
          ...image,
          user_has_liked: true,
          like_count: image.like_count + 1
        });
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Failed to like/unlike image');
    } finally {
      setIsLiking(false);
    }
  };
  
  const handleDelete = async () => {
    if (!isOwner || !image) return;
    
    if (window.confirm('Are you sure you want to delete this image? This action cannot be undone.')) {
      try {
        setIsDeleting(true);
        await deleteImage(image.id);
        toast.success('Image deleted successfully');
        navigate('/gallery/my');
      } catch (error) {
        console.error('Error deleting image:', error);
        toast.error('Failed to delete image');
        setIsDeleting(false);
      }
    }
  };
  
  const handleApplySettings = () => {
    if (!image) return;
    
    try {
      loadSettings(image.processing_settings);
      toast.success('Settings applied to editor');
      navigate('/editor');
    } catch (error) {
      console.error('Error applying settings:', error);
      toast.error('Failed to apply settings to editor');
    }
  };
  
  const handleCopyShareLink = () => {
    navigator.clipboard.writeText(shareURL)
      .then(() => {
        toast.success('Share link copied to clipboard!');
      })
      .catch(() => {
        toast.error('Failed to copy link. Please try again.');
      });
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }
  
  if (!image) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                Image not found. It may have been deleted or made private.
              </p>
            </div>
          </div>
          <div className="mt-4">
            <Link to="/gallery/community" className="text-primary-600 hover:text-primary-500">
              &larr; Back to Gallery
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column: Image */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-4 border-b">
              <h1 className="text-2xl font-bold text-gray-900">{image.title}</h1>
              <div className="flex items-center mt-2 text-gray-500">
                <span>
                  By {image.username || 'Anonymous'} • {new Date(image.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
            
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-100 rounded-lg p-2">
                  <p className="text-sm text-gray-500 mb-2">Original Image</p>
                  <img 
                    src={image.original_url} 
                    alt={`Original of ${image.title}`} 
                    className="max-w-full max-h-[60vh] object-contain mx-auto"
                  />
                </div>
                
                <div className="bg-gray-100 rounded-lg p-2">
                  <p className="text-sm text-gray-500 mb-2">Processed Image</p>
                  <img 
                    src={image.processed_url} 
                    alt={image.title} 
                    className="max-w-full max-h-[60vh] object-contain mx-auto"
                  />
                </div>
              </div>
              
              {image.description && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Description</h3>
                  <p className="text-gray-600">{image.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Right column: Actions and settings */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
            {/* Actions */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={handleLikeToggle}
                    disabled={!user || isLiking}
                    className="focus:outline-none"
                    aria-label={image.user_has_liked ? "Unlike image" : "Like image"}
                  >
                    {image.user_has_liked ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500 hover:text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    )}
                  </button>
                  <span className="text-gray-600">{image.like_count} likes</span>
                </div>
                
                <button 
                  onClick={handleCopyShareLink}
                  className="flex items-center space-x-1 text-gray-600 hover:text-primary-600"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  <span>Share</span>
                </button>
              </div>
              
              <Button
                onClick={() => setShowQRCode(!showQRCode)}
                variant="secondary"
                leftIcon={
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                }
              >
                {showQRCode ? 'Hide QR Code' : 'Show QR Code'}
              </Button>
              
              {showQRCode && (
                <div className="mt-3 p-4 bg-white rounded-lg shadow border flex justify-center">
                  <QRCodeSVG value={shareURL} size={180} />
                </div>
              )}
            </div>
            
            {/* Apply to editor */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Use This Look</h3>
              <Button 
                onClick={handleApplySettings}
                variant="primary"
                fullWidth
                leftIcon={
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                  </svg>
                }
              >
                Apply Settings to Editor
              </Button>
            </div>
            
            {/* Processing settings */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Processing Details</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500">Algorithm:</dt>
                  <dd className="font-medium text-gray-900">{image.processing_settings.algorithm}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Dot Size:</dt>
                  <dd className="font-medium text-gray-900">{image.processing_settings.dotSize}px</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Contrast:</dt>
                  <dd className="font-medium text-gray-900">{image.processing_settings.contrast}%</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Color Mode:</dt>
                  <dd className="font-medium text-gray-900">{image.processing_settings.colorMode}</dd>
                </div>
                {image.processing_settings.colorMode === 'custom' && (
                  <div>
                    <dt className="text-gray-500 mb-1">Custom Colors:</dt>
                    <dd className="flex flex-wrap gap-1">
                      {image.processing_settings.customColors.map((color: string, index: number) => (
                        <div 
                          key={index} 
                          className="w-6 h-6 rounded-full border border-gray-300" 
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
            
            {/* Delete action (for owner) */}
            {isOwner && (
              <div className="pt-4 border-t border-gray-200">
                <Button 
                  onClick={handleDelete}
                  variant="danger"
                  isLoading={isDeleting}
                  leftIcon={
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  }
                >
                  Delete Image
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="mt-6">
        <Link to="/gallery/community" className="text-primary-600 hover:text-primary-500">
          &larr; Back to Gallery
        </Link>
      </div>
    </div>
  );
};

export default ImageDetails;