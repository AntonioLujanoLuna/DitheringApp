import React from 'react';
import { useEditorStore } from '../../../store/useEditorStore';
import { useThemeStore } from '../../../store/useThemeStore';

interface AlgorithmSelectorProps {
  onBeforeChange?: () => void;
}

const AlgorithmSelector: React.FC<AlgorithmSelectorProps> = ({ onBeforeChange }) => {
  const { algorithm, setAlgorithm } = useEditorStore();
  const { darkMode } = useThemeStore();
  
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (onBeforeChange) {
      onBeforeChange();
    }
    setAlgorithm(e.target.value as any);
  };
  
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium">
        Dithering Algorithm
      </label>
      
      <select
        value={algorithm}
        onChange={handleChange}
        className={`w-full p-2 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
      >
        <option value="ordered">Ordered Dithering</option>
        <option value="floydSteinberg">Floyd-Steinberg Dithering</option>
        <option value="atkinson">Atkinson Dithering</option>
        <option value="halftone">Halftone Dithering</option>
        <option value="jarvisJudiceNinke">Jarvis-Judice-Ninke Dithering</option>
        <option value="stucki">Stucki Dithering</option>
        <option value="burkes">Burkes Dithering</option>
        <option value="sierraLite">Sierra Lite Dithering</option>
        <option value="random">Random Dithering</option>
        <option value="voidAndCluster">Void and Cluster Dithering</option>
        <option value="blueNoise">Blue Noise Dithering</option>
        <option value="riemersma">Riemersma Dithering</option>
        <option value="directBinarySearch">Direct Binary Search Dithering</option>
        <option value="pattern">Pattern Dithering</option>
        <option value="multiTone">Multi-tone Dithering</option>
        <option value="selective">Selective Dithering</option>
      </select>
    </div>
  );
};

export default AlgorithmSelector; 