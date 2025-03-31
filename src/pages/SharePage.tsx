import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useEditorStore, EditorSettings } from '../store/useEditorStore';
import Button from '../components/ui/Button';
import DitheredQRCode from '../components/ui/DitheredQRCode';

const SharePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loadSettings } = useEditorStore();
  
  const [isLoading, setIsLoading] = useState(true);
  const [hasSettings, setHasSettings] = useState(false);
  const [settings, setSettings] = useState<Partial<EditorSettings> | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  // Parse the URL parameters to extract settings
  useEffect(() => {
    try {
      setIsLoading(true);
      
      const algorithm = searchParams.get('algorithm');
      const dotSize = searchParams.get('dotSize');
      const contrast = searchParams.get('contrast');
      const colorMode = searchParams.get('colorMode');
      const spacing = searchParams.get('spacing');
      const angle = searchParams.get('angle');
      const colors = searchParams.get('colors');
      const preview = searchParams.get('preview');
      
      const parsedSettings: Partial<EditorSettings> = {};
      
      if (algorithm) parsedSettings.algorithm = algorithm as any;
      if (dotSize) parsedSettings.dotSize = parseInt(dotSize);
      if (contrast) parsedSettings.contrast = parseInt(contrast);
      if (colorMode) parsedSettings.colorMode = colorMode as any;
      if (spacing) parsedSettings.spacing = parseInt(spacing);
      if (angle) parsedSettings.angle = parseInt(angle);
      if (colors) parsedSettings.customColors = colors.split(',');
      
      // Set preview image if available
      if (preview) {
        setPreviewImage(decodeURIComponent(preview));
      }
      
      // Check if we have enough valid settings
      if (Object.keys(parsedSettings).length > 0) {
        setSettings(parsedSettings);
        setHasSettings(true);
      } else {
        setHasSettings(false);
      }
    } catch (error) {
      console.error('Error parsing settings from URL:', error);
      setHasSettings(false);
    } finally {
      setIsLoading(false);
    }
  }, [searchParams]);
  
  const handleApplySettings = () => {
    if (!settings) return;
    
    try {
      loadSettings(settings);
      toast.success('Settings applied to editor');
      navigate('/editor');
    } catch (error) {
      console.error('Error applying settings:', error);
      toast.error('Failed to apply settings to editor');
    }
  };
  
  const generateShareLinks = () => {
    const currentUrl = window.location.href;
    return {
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent('Check out these awesome dithering settings I created!')}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`,
      pinterest: previewImage 
        ? `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(currentUrl)}&media=${encodeURIComponent(previewImage)}&description=${encodeURIComponent('Dithering art settings')}`
        : null,
    };
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }
  
  if (!hasSettings) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-lg">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-16 w-16 text-gray-400 mx-auto mb-4" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1.5} 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
            />
          </svg>
          <h1 className="text-2xl font-bold mb-4">Invalid Share Link</h1>
          <p className="text-gray-600 mb-6">
            This share link doesn't contain valid dithering settings. It may be incomplete or malformed.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-3">
            <Link to="/editor">
              <Button variant="primary">
                Go to Editor
              </Button>
            </Link>
            <Link to="/gallery/community">
              <Button variant="secondary">
                Explore Community Gallery
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  const shareLinks = generateShareLinks();
  
  return (
    <div className="container mx-auto px-4 py-16 max-w-2xl">
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-6">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-16 w-16 text-primary-500 mx-auto mb-4" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1.5} 
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" 
            />
          </svg>
          <h1 className="text-2xl font-bold mb-2">Shared Dithering Settings</h1>
          <p className="text-gray-600">
            Someone has shared image processing settings with you. Apply these settings to create similar effects in the editor.
          </p>
        </div>
        
        {/* Enhanced section with dithered QR code */}
        <DitheredQRCode 
          value={window.location.href}
          size={180}
          algorithm={settings?.algorithm || 'halftone'}
          dotSize={settings?.dotSize || 3}
          contrast={settings?.contrast || 50}
          colorMode={settings?.colorMode || 'bw'}
          spacing={settings?.spacing || 5}
          angle={settings?.angle || 45}
          customColors={settings?.customColors || ['#000000', '#ffffff']}
          title="Dithering Settings"
          description="Scan this code to apply these exact settings to your images"
          imagePreview={previewImage || undefined}
          includePreview={true}
        />
        
        {/* Social sharing section */}
        <div className="mt-8 border-t border-gray-200 pt-6">
          <h3 className="font-semibold text-lg mb-4">Share with others</h3>
          
          <div className="flex flex-wrap justify-center gap-3 mb-6">
            <a 
              href={shareLinks.twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 bg-blue-400 text-white rounded-full hover:bg-blue-500 transition-colors"
              title="Share on Twitter"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
              </svg>
            </a>
            
            <a 
              href={shareLinks.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
              title="Share on Facebook"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </a>
            
            <a 
              href={shareLinks.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 bg-blue-700 text-white rounded-full hover:bg-blue-800 transition-colors"
              title="Share on LinkedIn"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </a>
            
            {shareLinks.pinterest && (
              <a 
                href={shareLinks.pinterest}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                title="Share on Pinterest"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z"/>
                </svg>
              </a>
            )}
            
            <button 
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                toast.success('Link copied to clipboard!');
              }}
              className="p-3 bg-gray-500 text-white rounded-full hover:bg-gray-600 transition-colors"
              title="Copy link to clipboard"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
            </button>
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
          <h2 className="font-semibold text-gray-700 mb-3">Settings Summary</h2>
          <dl className="space-y-2 text-sm">
            {settings?.algorithm && (
              <div className="flex justify-between">
                <dt className="text-gray-500">Algorithm:</dt>
                <dd className="font-medium text-gray-900">{settings.algorithm}</dd>
              </div>
            )}
            {settings?.dotSize !== undefined && (
              <div className="flex justify-between">
                <dt className="text-gray-500">Dot Size:</dt>
                <dd className="font-medium text-gray-900">{settings.dotSize}px</dd>
              </div>
            )}
            {settings?.contrast !== undefined && (
              <div className="flex justify-between">
                <dt className="text-gray-500">Contrast:</dt>
                <dd className="font-medium text-gray-900">{settings.contrast}%</dd>
              </div>
            )}
            {settings?.colorMode && (
              <div className="flex justify-between">
                <dt className="text-gray-500">Color Mode:</dt>
                <dd className="font-medium text-gray-900">{settings.colorMode}</dd>
              </div>
            )}
            {settings?.spacing !== undefined && (
              <div className="flex justify-between">
                <dt className="text-gray-500">Spacing:</dt>
                <dd className="font-medium text-gray-900">{settings.spacing}px</dd>
              </div>
            )}
            {settings?.angle !== undefined && (
              <div className="flex justify-between">
                <dt className="text-gray-500">Angle:</dt>
                <dd className="font-medium text-gray-900">{settings.angle}°</dd>
              </div>
            )}
            {settings?.customColors && settings.customColors.length > 0 && (
              <div>
                <dt className="text-gray-500 mb-1">Custom Colors:</dt>
                <dd className="flex flex-wrap gap-1">
                  {settings.customColors.map((color, index) => (
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
        
        <div className="flex flex-col space-y-3">
          <Button
            onClick={handleApplySettings}
            variant="primary"
            fullWidth
          >
            Apply Settings to Editor
          </Button>
          
          <div className="flex justify-between">
            <Link to="/editor">
              <Button variant="ghost">
                Go to Editor
              </Button>
            </Link>
            
            <Link to="/gallery/community">
              <Button variant="ghost">
                Community Gallery
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SharePage;