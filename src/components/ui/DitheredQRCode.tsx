import React, { useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  processImage,
  DitheringAlgorithm, 
  ColorMode 
} from '../lib/algorithms';

interface DitheredQRCodeProps {
  value: string;
  size?: number;
  algorithm?: DitheringAlgorithm;
  dotSize?: number;
  contrast?: number;
  colorMode?: ColorMode;
  spacing?: number;
  angle?: number;
  customColors?: string[];
  qrCodeOptions?: {
    level?: 'L' | 'M' | 'Q' | 'H';
    includeMargin?: boolean;
    bgColor?: string;
    fgColor?: string;
  };
  className?: string;
}

/**
 * A component that renders a QR code with dithering effects applied
 */
const DitheredQRCode: React.FC<DitheredQRCodeProps> = ({
  value,
  size = 200,
  algorithm = 'halftone',
  dotSize = 3,
  contrast = 70,
  colorMode = 'bw',
  spacing = 4,
  angle = 45,
  customColors = ['#000000', '#ffffff'],
  qrCodeOptions = {
    level: 'H', // Use high error correction for better readability after effects
    includeMargin: true,
    bgColor: '#ffffff',
    fgColor: '#000000'
  },
  className = ''
}) => {
  const [processedQrUrl, setProcessedQrUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const originalQrRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Effect to generate and process the QR code
  useEffect(() => {
    if (!originalQrRef.current || !canvasRef.current) return;
    
    // Wait for the QR code SVG to render
    const timer = setTimeout(() => {
      const processQrCode = async () => {
        try {
          setIsProcessing(true);
          setError(null);
          
          // Get the rendered SVG
          const svgElement = originalQrRef.current?.querySelector('svg');
          if (!svgElement) {
            throw new Error('QR code SVG not found');
          }
          
          // Convert SVG to a data URL
          const svgData = new XMLSerializer().serializeToString(svgElement);
          const svgBlob = new Blob([svgData], { type: 'image/svg+xml' });
          const svgUrl = URL.createObjectURL(svgBlob);
          
          // Create an image from the SVG
          const img = new Image();
          img.src = svgUrl;
          
          // Wait for the image to load
          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => reject(new Error('Failed to load QR code image'));
          });
          
          // Draw the image to our canvas
          const canvas = canvasRef.current!;
          canvas.width = size;
          canvas.height = size;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            throw new Error('Canvas context not available');
          }
          
          // Draw the original QR code
          ctx.drawImage(img, 0, 0, size, size);
          
          // Apply dithering effect
          const imageData = ctx.getImageData(0, 0, size, size);
          
          // Process the image with the selected dithering algorithm
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
          
          ctx.putImageData(processedData, 0, 0);
          
          // Get the processed image as a data URL
          const processedUrl = canvas.toDataURL('image/png');
          setProcessedQrUrl(processedUrl);
          
          // Clean up
          URL.revokeObjectURL(svgUrl);
        } catch (err) {
          console.error('Error processing QR code:', err);
          setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
          setIsProcessing(false);
        }
      };
      
      processQrCode();
    }, 300); // Give time for the SVG to render
    
    return () => {
      clearTimeout(timer);
    };
  }, [
    value,
    size,
    algorithm,
    dotSize,
    contrast,
    colorMode,
    spacing,
    angle,
    customColors,
    qrCodeOptions
  ]);
  
  return (
    <div className={`relative ${className}`}>
      {/* Hidden div to render the original QR code SVG */}
      <div 
        ref={originalQrRef} 
        className="absolute opacity-0 pointer-events-none"
        aria-hidden="true"
      >
        <QRCodeSVG
          value={value}
          size={size}
          level={qrCodeOptions.level}
          includeMargin={qrCodeOptions.includeMargin}
          bgColor={qrCodeOptions.bgColor}
          fgColor={qrCodeOptions.fgColor}
        />
      </div>
      
      {/* Hidden canvas for processing */}
      <canvas 
        ref={canvasRef} 
        className="hidden" 
        width={size} 
        height={size}
      />
      
      {/* Display element for the processed QR code */}
      <div className="flex items-center justify-center">
        {isProcessing ? (
          // Loading state
          <div className="flex items-center justify-center bg-gray-100 rounded-lg" style={{ width: size, height: size }}>
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
          </div>
        ) : error ? (
          // Error state - fall back to regular QR code
          <div className="text-center">
            <QRCodeSVG
              value={value}
              size={size}
              level={qrCodeOptions.level}
              includeMargin={qrCodeOptions.includeMargin}
              bgColor={qrCodeOptions.bgColor}
              fgColor={qrCodeOptions.fgColor}
            />
            <p className="text-xs text-red-500 mt-2">
              Error applying effect (standard QR shown)
            </p>
          </div>
        ) : (
          // Success state - show processed QR code
          <img 
            src={processedQrUrl!} 
            alt="Dithered QR Code" 
            width={size} 
            height={size}
            className="rounded-lg"
          />
        )}
      </div>
    </div>
  );
};

export default DitheredQRCode;