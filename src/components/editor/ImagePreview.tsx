import React, { useEffect, useRef, useState } from 'react';
import { useEditorStore } from '../../store/useEditorStore';
import { processImage } from '../../lib/algorithms';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'react-toastify';

const ImagePreview: React.FC = () => {
  const { 
    originalImage, 
    algorithm, 
    dotSize, 
    contrast, 
    colorMode, 
    spacing, 
    angle,
    customColors,
    isProcessing,
    setIsProcessing
  } = useEditorStore();
  
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [showQRCode, setShowQRCode] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const downloadLinkRef = useRef<HTMLAnchorElement>(null);
  
  // Process the image when parameters change
  useEffect(() => {
    if (!originalImage) {
      setProcessedImageUrl(null);
      return;
    }

    const processAndRender = async () => {
      try {
        setIsProcessing(true);
        
        // Process the image
        const imageData = processImage(
          originalImage,
          algorithm,
          dotSize,
          contrast,
          colorMode,
          spacing,
          angle,
          customColors
        );
        
        // Render to canvas
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        canvas.width = imageData.width;
        canvas.height = imageData.height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        ctx.putImageData(imageData, 0, 0);
        
        // Get data URL for display
        const dataUrl = canvas.toDataURL('image/png');
        setProcessedImageUrl(dataUrl);

        // Generate a shareable URL with parameters
        const params = new URLSearchParams();
        params.append('algorithm', algorithm);
        params.append('dotSize', dotSize.toString());
        params.append('contrast', contrast.toString());
        params.append('colorMode', colorMode);
        params.append('spacing', spacing.toString());
        params.append('angle', angle.toString());
        
        if (colorMode === 'custom' && customColors.length > 0) {
          params.append('colors', customColors.join(','));
        }
        
        // In a real app, you'd probably save the image to Supabase here
        // and generate a real shareable URL
        const baseUrl = window.location.origin + '/share';
        setShareUrl(`${baseUrl}?${params.toString()}`);
        
      } catch (error) {
        console.error('Error processing image:', error);
        toast.error('Error processing image. Please try again.');
      } finally {
        setIsProcessing(false);
      }
    };

    // Debounce the processing to avoid too many updates
    const debounceTimeout = setTimeout(() => {
      processAndRender();
    }, 300);

    return () => {
      clearTimeout(debounceTimeout);
    };
  }, [
    originalImage, 
    algorithm, 
    dotSize, 
    contrast, 
    colorMode, 
    spacing, 
    angle, 
    customColors,
    setIsProcessing
  ]);

  const handleDownload = () => {
    if (!processedImageUrl || !downloadLinkRef.current) return;
    
    downloadLinkRef.current.href = processedImageUrl;
    downloadLinkRef.current.download = `halftone-${algorithm}-${Date.now()}.png`;
    downloadLinkRef.current.click();
  };

  const handleCopyShareLink = () => {
    if (!shareUrl) return;
    
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        toast.success('Share link copied to clipboard!');
      })
      .catch(() => {
        toast.error('Failed to copy link. Please try again.');
      });
  };

  const toggleQRCode = () => {
    setShowQRCode(prev => !prev);
  };

  if (!originalImage) {
    return (
      <div className="p-4 text-center text-gray-500">
        <p>Upload an image to see the preview</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hidden canvas for processing */}
      <canvas ref={canvasRef} className="hidden" />
      
      {/* Hidden download link */}
      <a ref={downloadLinkRef} className="hidden" />
      
      {/* Preview section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border rounded-lg p-4">
          <h3 className="text-lg font-medium mb-2">Original Image</h3>
          <div className="bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
            <img 
              src={originalImage.src} 
              alt="Original" 
              className="max-w-full max-h-[60vh] object-contain"
            />
          </div>
        </div>
        
        <div className="border rounded-lg p-4">
          <h3 className="text-lg font-medium mb-2">Processed Image</h3>
          <div className="bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden min-h-[200px]">
            {isProcessing ? (
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
            ) : processedImageUrl ? (
              <img 
                src={processedImageUrl} 
                alt="Processed" 
                className="max-w-full max-h-[60vh] object-contain"
              />
            ) : (
              <p className="text-gray-500">Processing...</p>
            )}
          </div>
        </div>
      </div>
      
      {/* Action buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleDownload}
          disabled={!processedImageUrl || isProcessing}
          className="btn btn-primary flex items-center gap-2"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" 
            />
          </svg>
          Download Image
        </button>
        
        <button
          onClick={handleCopyShareLink}
          disabled={!shareUrl || isProcessing}
          className="btn btn-secondary flex items-center gap-2"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" 
            />
          </svg>
          Copy Share Link
        </button>
        
        <button
          onClick={toggleQRCode}
          disabled={!shareUrl || isProcessing}
          className="btn btn-secondary flex items-center gap-2"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" 
            />
          </svg>
          {showQRCode ? 'Hide QR Code' : 'Show QR Code'}
        </button>
      </div>
      
      {/* QR Code */}
      {showQRCode && shareUrl && (
        <div className="flex justify-center">
          <div className="p-4 bg-white rounded-lg shadow-md">
            <QRCodeSVG value={shareUrl} size={200} />
          </div>
        </div>
      )}
    </div>
  );
};

export default ImagePreview;