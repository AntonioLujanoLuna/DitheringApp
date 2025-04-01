import { RefObject } from 'react';
import { downloadSVG } from '../lib/export/svgExport';
import { DitheringAlgorithm, PatternType } from '../store/useEditingSessionStore'; // Import necessary types

interface UseImageExporterProps {
  canvasRef: RefObject<HTMLCanvasElement>;
  algorithm: DitheringAlgorithm;
  dotSize?: number;
  spacing?: number;
  angle?: number;
  patternType?: PatternType;
  // Add other options if needed for SVG export (e.g., simplified)
}

interface UseImageExporterReturn {
  handleDownload: () => void;
  handleDownloadSVG: () => void;
}

export function useImageExporter({
  canvasRef,
  algorithm,
  dotSize = 4, // Provide defaults or ensure they are passed
  spacing = 5,
  angle = 45,
  patternType = 'dots',
}: UseImageExporterProps): UseImageExporterReturn {

  // Download the processed image as PNG
  const handleDownload = () => {
    if (!canvasRef.current) return;
    
    const link = document.createElement('a');
    link.download = `dithered-${algorithm}-${Date.now()}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
    // No need to remove link, browser handles it
  };

  // Download SVG version
  const handleDownloadSVG = () => {
    if (!canvasRef.current) return;
    
    downloadSVG(
      canvasRef.current,
      algorithm,
      {
        dotSize,
        spacing,
        angle,
        patternType,
        simplified: false, // Default to higher quality
        fileName: `dithered-${algorithm}-vector-${Date.now()}.svg`,
      }
    );
  };

  return { handleDownload, handleDownloadSVG };
} 