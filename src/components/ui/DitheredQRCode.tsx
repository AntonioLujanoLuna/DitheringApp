// src/components/ui/DitheredQRCode.tsx
import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode.react';
import { processImage } from '../../lib/algorithms';
import { DitheringAlgorithm, ColorMode } from '../../store/useEditorStore';

interface DitheredQRCodeProps {
  value: string;
  size: number;
  algorithm: DitheringAlgorithm;
  dotSize: number;
  contrast: number;
  colorMode: ColorMode;
  spacing: number;
  angle: number;
  customColors: string[];
  title?: string;
  description?: string;
  imagePreview?: string;
  includePreview?: boolean;
}

const DitheredQRCode: React.FC<DitheredQRCodeProps> = ({
  value,
  size,
  algorithm,
  dotSize,
  contrast,
  colorMode,
  spacing,
  angle,
  customColors,
  title = 'Shared Settings',
  description = 'Scan to apply these dithering settings',
  imagePreview,
  includePreview = false
}) => {
  const qrRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isProcessing, setIsProcessing] = useState(true);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  
  useEffect(() => {
    const processQRCode = async () => {
      if (!qrRef.current || !canvasRef.current) return;
      
      setIsProcessing(true);
      
      // Get QR code SVG
      const qrSvg = qrRef.current.querySelector('svg');
      if (!qrSvg) return;
      
      // Convert SVG to image
      const svgData = new XMLSerializer().serializeToString(qrSvg);
      const img = new Image();
      
      img.onload = () => {
        // Process the image using the dithering algorithms
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext('2d')!;
        
        canvas.width = size;
        canvas.height = size;
        
        // Process the image
        const processedData = processImage(
          img,
          algorithm,
          dotSize,
          contrast,
          colorMode,
          spacing,
          angle,
          customColors
        );
        
        // Draw the processed data
        ctx.putImageData(processedData, 0, 0);
        
        // Create download URL for the processed QR code
        setDownloadUrl(canvas.toDataURL('image/png'));
        setIsProcessing(false);
      };
      
      img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    };
    
    processQRCode();
  }, [value, size, algorithm, dotSize, contrast, colorMode, spacing, angle, customColors]);
  
  // Handle download
  const handleDownload = () => {
    if (!downloadUrl) return;
    
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `dithered-qr-code-${algorithm}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  return (
    <div className={`relative ${includePreview ? 'p-4 border border-gray-200 rounded-lg bg-white' : ''}`}>
      {/* Hidden QR code for processing */}
      <div 
        ref={qrRef} 
        className="absolute opacity-0 pointer-events-none"
        style={{ width: size, height: size }}
      >
        <QRCode 
          value={value} 
          size={size}
          includeMargin={true}
        />
      </div>
      
      {includePreview && (
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative">
            {/* Canvas to display processed QR code */}
            <div className="relative">
              {isProcessing && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-70 rounded-md">
                  <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
              <canvas 
                ref={canvasRef} 
                width={size} 
                height={size}
                className="border border-gray-200 rounded-md shadow-sm"
              />
            </div>
            
            <div className="mt-2 flex justify-center">
              <button
                onClick={handleDownload}
                className="text-xs text-primary-600 hover:text-primary-800 flex items-center space-x-1"
                disabled={isProcessing}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>Download QR Code</span>
              </button>
            </div>
          </div>
          
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-gray-900">{title}</h3>
            <p className="text-sm text-gray-600 mb-3">{description}</p>
            
            {imagePreview && (
              <div className="mt-3">
                <p className="text-xs text-gray-500 mb-1">Preview:</p>
                <img 
                  src={imagePreview} 
                  alt="Settings Preview" 
                  className="w-full max-h-40 object-contain border border-gray-200 rounded"
                />
              </div>
            )}
            
            <div className="mt-3">
              <p className="text-xs text-gray-500 mb-1">Algorithm: <span className="font-medium text-gray-700">{algorithm}</span></p>
              {colorMode !== 'bw' && (
                <p className="text-xs text-gray-500">Color Mode: <span className="font-medium text-gray-700">{colorMode}</span></p>
              )}
            </div>
          </div>
        </div>
      )}
      
      {!includePreview && (
        <canvas 
          ref={canvasRef} 
          width={size} 
          height={size}
          className="border border-gray-200 rounded-md"
        />
      )}
    </div>
  );
};

export default DitheredQRCode;