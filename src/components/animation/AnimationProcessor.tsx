// Component for processing GIF animations with dithering effects
import React, { useState, useRef } from 'react';
import { useEditorStore } from '../../store/useEditorStore';
import { processGif, downloadProcessedGif } from '../../lib/animation/gifProcessor';
import Button from '../ui/Button';
import { isWebGLSupported } from '../../lib/webgl/webglDithering';

const AnimationProcessor: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processedGifUrl, setProcessedGifUrl] = useState<string | null>(null);
  const [originalGifUrl, setOriginalGifUrl] = useState<string | null>(null);
  const [usingWebGL, setUsingWebGL] = useState(false);
  
  const {
    algorithm,
    dotSize,
    contrast,
    colorMode,
    spacing,
    angle,
    customColors,
    patternType,
    patternSize,
  } = useEditorStore();
  
  const originalGifRef = useRef<HTMLImageElement>(null);
  const processedGifRef = useRef<HTMLImageElement>(null);
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.includes('gif')) {
        alert('Please select a GIF file.');
        return;
      }
      
      setSelectedFile(file);
      
      // Create a URL for the original GIF
      const originalUrl = URL.createObjectURL(file);
      setOriginalGifUrl(originalUrl);
      
      // Check if WebGL can be used
      setUsingWebGL(isWebGLSupported() && 
        (algorithm === 'ordered' || algorithm === 'halftone' || algorithm === 'pattern'));
    }
  };
  
  const handleProcessGif = async () => {
    if (!selectedFile || !originalGifUrl) return;
    
    setIsProcessing(true);
    setProgress(0);
    
    try {
      // Process the GIF
      const result = await processGif(
        originalGifUrl,
        algorithm,
        {
          dotSize,
          contrast,
          colorMode,
          spacing,
          angle,
          patternType,
          patternSize,
          customColors,
          onProgress: setProgress
        }
      );
      
      // Create a URL for the processed GIF
      const processedUrl = URL.createObjectURL(result);
      setProcessedGifUrl(processedUrl);
    } catch (error) {
      console.error('Error processing GIF:', error);
      alert('An error occurred while processing the GIF.');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleDownload = () => {
    if (!processedGifUrl || !selectedFile) return;
    
    // Create a blob from the processed GIF URL
    fetch(processedGifUrl)
      .then(response => response.blob())
      .then(blob => {
        downloadProcessedGif(blob, `halftone-${algorithm}-${selectedFile.name}`);
      })
      .catch(error => {
        console.error('Error downloading GIF:', error);
        alert('An error occurred while downloading the GIF.');
      });
  };
  
  const resetProcessor = () => {
    // Clean up URLs
    if (originalGifUrl) URL.revokeObjectURL(originalGifUrl);
    if (processedGifUrl) URL.revokeObjectURL(processedGifUrl);
    
    setSelectedFile(null);
    setOriginalGifUrl(null);
    setProcessedGifUrl(null);
    setProgress(0);
  };
  
  return (
    <div className="space-y-8">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Animation Processing</h2>
        
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Process GIF animations with dithering effects.
          {usingWebGL && <span className="ml-1 text-primary-600">Using GPU acceleration!</span>}
        </p>
        
        <div className="space-y-4">
          {!selectedFile ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Select GIF Animation
                </label>
                <input
                  type="file"
                  accept="image/gif"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-500 dark:text-gray-400
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-medium
                    file:bg-primary-50 file:text-primary-700 dark:file:bg-primary-900 dark:file:text-primary-300
                    hover:file:bg-primary-100 dark:hover:file:bg-primary-800"
                />
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                  <h3 className="text-sm font-semibold mb-2">Original GIF</h3>
                  <div className="aspect-video bg-gray-100 dark:bg-gray-900 flex items-center justify-center rounded">
                    {originalGifUrl && (
                      <img 
                        ref={originalGifRef}
                        src={originalGifUrl} 
                        alt="Original GIF" 
                        className="max-h-full max-w-full object-contain"
                      />
                    )}
                  </div>
                </div>
                
                <div className="flex-1 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                  <h3 className="text-sm font-semibold mb-2">Processed GIF</h3>
                  <div className="aspect-video bg-gray-100 dark:bg-gray-900 flex items-center justify-center rounded">
                    {processedGifUrl ? (
                      <img 
                        ref={processedGifRef}
                        src={processedGifUrl} 
                        alt="Processed GIF" 
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Process to see result
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={handleProcessGif}
                  disabled={!selectedFile || isProcessing}
                  isLoading={isProcessing}
                >
                  {processedGifUrl ? 'Re-Process GIF' : 'Process GIF'}
                </Button>
                
                {processedGifUrl && (
                  <Button
                    variant="secondary"
                    onClick={handleDownload}
                  >
                    Download Processed GIF
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  onClick={resetProcessor}
                >
                  Select Different GIF
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
      
      {isProcessing && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-3">Processing Animation...</h3>
          
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <div 
              className="bg-primary-600 h-2.5 rounded-full transition-all duration-300" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          
          <p className="text-center mt-2 text-sm text-gray-600 dark:text-gray-400">
            {progress}% complete
          </p>
          
          {progress >= 30 && progress < 70 && (
            <p className="text-center mt-2 text-xs text-gray-500 dark:text-gray-500">
              Processing frames... This may take some time for longer animations.
            </p>
          )}
          
          {progress >= 70 && (
            <p className="text-center mt-2 text-xs text-gray-500 dark:text-gray-500">
              Generating final GIF...
            </p>
          )}
        </div>
      )}
      
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-3">About Animation Processing</h3>
        
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <p>
            The animation processor applies your selected dithering algorithm to each frame of a GIF animation.
            This can create interesting artistic effects, especially with halftone and pattern algorithms.
          </p>
          
          <p>
            <strong>Tips:</strong>
          </p>
          <ul>
            <li>For best results, use GIFs with simple animations and good contrast.</li>
            <li>Processing larger or longer GIFs will take more time.</li>
            <li>The halftone and pattern algorithms create the most interesting animated effects.</li>
            <li>The final GIF size may be larger than the original due to the dithering patterns.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AnimationProcessor;