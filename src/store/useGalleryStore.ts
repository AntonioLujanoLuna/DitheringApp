// src/store/useGalleryStore.ts
import { create } from 'zustand';
import { 
  saveImage, 
  getImages, 
  deleteImage as deleteLocalImage 
} from '../lib/storage/localStorageService';

export interface ImageItem {
  id: string;
  title: string;
  description: string | null;
  processedUrl: string;
  originalUrl: string;
  created_at: string;
  processingSettings?: any;
}

interface GalleryState {
  myImages: ImageItem[];
  isLoading: boolean;
  error: string | null;
  // Actions
  fetchMyImages: () => Promise<void>;
  saveImageToCollection: (imageData: Omit<ImageItem, 'id' | 'created_at'>) => Promise<ImageItem>;
  deleteImage: (imageId: string) => Promise<void>;
}

export const useGalleryStore = create<GalleryState>((set) => ({
  myImages: [],
  isLoading: false,
  error: null,
  
  fetchMyImages: async () => {
    try {
      set({ isLoading: true, error: null });
      
      const images = await getImages();
      
      set({ 
        myImages: images, 
        isLoading: false 
      });
      
    } catch (error: any) {
      console.error('Error fetching my images:', error);
      set({ error: error.message, isLoading: false });
    }
  },
  
  saveImageToCollection: async (imageData) => {
    try {
      set({ isLoading: true, error: null });
      
      const savedImage = await saveImage(imageData);
      
      // Update local state
      set(state => ({
        myImages: [savedImage, ...state.myImages],
        isLoading: false
      }));
      
      return savedImage;
      
    } catch (error: any) {
      console.error('Error saving image:', error);
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },
  
  deleteImage: async (imageId) => {
    try {
      set({ isLoading: true, error: null });
      
      await deleteLocalImage(imageId);
      
      // Update local state
      set(state => ({
        myImages: state.myImages.filter(img => img.id !== imageId),
        isLoading: false
      }));
      
    } catch (error: any) {
      console.error('Error deleting image:', error);
      set({ error: error.message, isLoading: false });
    }
  }
}));