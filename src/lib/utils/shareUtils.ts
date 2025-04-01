// src/lib/utils/shareUtils.ts
import { EditorSettings } from '../../store/useEditingSessionStore';

// Create a shareable URL with settings encoded
export const createShareableLink = (settings: Partial<EditorSettings>): string => {
  const params = new URLSearchParams();
  
  if (settings.algorithm) params.append('algorithm', settings.algorithm);
  if (settings.dotSize !== undefined) params.append('dotSize', settings.dotSize.toString());
  if (settings.contrast !== undefined) params.append('contrast', settings.contrast.toString());
  if (settings.colorMode) params.append('colorMode', settings.colorMode);
  if (settings.spacing !== undefined) params.append('spacing', settings.spacing.toString());
  if (settings.angle !== undefined) params.append('angle', settings.angle.toString());
  if (settings.customColors && settings.customColors.length > 0) {
    params.append('colors', settings.customColors.join(','));
  }
  
  // Using the hash location (for HashRouter compatibility)
  return `${window.location.origin}${window.location.pathname}#/share?${params.toString()}`;
};

// Export settings as a JSON file
export const exportSettingsAsFile = (settings: EditorSettings, name: string): void => {
  const data = JSON.stringify(settings, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `${name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
  document.body.appendChild(a);
  a.click();
  
  // Cleanup
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// Parse settings from URL parameters
export const parseSettingsFromURL = (search: string): Partial<EditorSettings> => {
  const params = new URLSearchParams(search);
  const settings: Partial<EditorSettings> = {};
  
  const algorithm = params.get('algorithm');
  if (algorithm) settings.algorithm = algorithm as any;
  
  const dotSize = params.get('dotSize');
  if (dotSize) settings.dotSize = parseInt(dotSize);
  
  const contrast = params.get('contrast');
  if (contrast) settings.contrast = parseInt(contrast);
  
  const colorMode = params.get('colorMode');
  if (colorMode) settings.colorMode = colorMode as any;
  
  const spacing = params.get('spacing');
  if (spacing) settings.spacing = parseInt(spacing);
  
  const angle = params.get('angle');
  if (angle) settings.angle = parseInt(angle);
  
  const colors = params.get('colors');
  if (colors) settings.customColors = colors.split(',');
  
  return settings;
};