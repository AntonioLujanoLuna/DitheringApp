// src/components/ui/DitheredQRCode.tsx
import React, { useEffect, useRef } from 'react';
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
  customColors
}) => {
  const qrRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const processQRCode = async () => {
      if (!qrRef.current || !canvasRef.current) return;
      
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
      };
      
      img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    };
    
    processQRCode();
  }, [value, size, algorithm, dotSize, contrast, colorMode, spacing, angle, customColors]);
  
  return (
    <div className="relative">
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
      
      {/* Canvas to display processed QR code */}
      <canvas 
        ref={canvasRef} 
        width={size} 
        height={size}
        className="border border-gray-200 rounded-md"
      />
    </div>
  );
};

export default DitheredQRCode;