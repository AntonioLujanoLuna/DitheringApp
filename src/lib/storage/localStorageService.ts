// src/lib/storage/localStorageService.ts
import localforage from 'localforage';

// Configure localforage
localforage.config({
  name: 'halftone-dithering-app',
  version: 1.0,
  storeName: 'halftone_store',
  description: 'Local storage for Halftone Dithering App'
});

// Create separate instances for different collections
export const imageStore = localforage.createInstance({
  name: 'halftone-dithering-app',
  storeName: 'images'
});

export const presetStore = localforage.createInstance({
  name: 'halftone-dithering-app',
  storeName: 'presets'
});

// Image storage
export const saveImage = async (image: any) => {
  const id = `image_${Date.now()}`;
  const imageWithId = { ...image, id, created_at: new Date().toISOString() };
  await imageStore.setItem(id, imageWithId);
  return imageWithId;
};

export const getImages = async () => {
  const images: any[] = [];
  await imageStore.iterate((value: any) => {
    images.push(value);
  });
  return images.sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
};

export const getImage = async (id: string) => {
  return await imageStore.getItem(id);
};

export const deleteImage = async (id: string) => {
  await imageStore.removeItem(id);
};

// Preset storage
export const savePreset = async (preset: any) => {
  const id = `preset_${Date.now()}`;
  const presetWithId = { ...preset, id, created_at: new Date().toISOString() };
  await presetStore.setItem(id, presetWithId);
  return presetWithId;
};

export const getPresets = async () => {
  const presets: any[] = [];
  await presetStore.iterate((value: any) => {
    presets.push(value);
  });
  return presets.sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
};

export const deletePreset = async (id: string) => {
  await presetStore.removeItem(id);
};