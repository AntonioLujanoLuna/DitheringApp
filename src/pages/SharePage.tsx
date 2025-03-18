import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useEditorStore, EditorSettings } from '../store/useEditorStore';
import Button from '../components/ui/Button';

const SharePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loadSettings } = useEditorStore();
  
  const [isLoading, setIsLoading] = useState(true);
  const [hasSettings, setHasSettings] = useState(false);
  const [settings, setSettings] = useState<Partial<EditorSettings> | null>(null);
  
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
      
      const parsedSettings: Partial<EditorSettings> = {};
      
      if (algorithm) parsedSettings.algorithm = algorithm as any;
      if (dotSize) parsedSettings.dotSize = parseInt(dotSize);
      if (contrast) parsedSettings.contrast = parseInt(contrast);
      if (colorMode) parsedSettings.colorMode = colorMode as any;
      if (spacing) parsedSettings.spacing = parseInt(spacing);
      if (angle) parsedSettings.angle = parseInt(angle);
      if (colors) parsedSettings.customColors = colors.split(',');
      
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
  
  return (
    <div className="container mx-auto px-4 py-16 max-w-lg">
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
                Explore Gallery
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SharePage;