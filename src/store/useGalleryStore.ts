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
  likes?: number;
  isLiked?: boolean;
}

interface GalleryState {
  myImages: ImageItem[];
  currentPage: number;
  pageSize: number;
  isLoading: boolean;
  error: string | null;
  hasMoreMyImages: boolean;
  
  // Actions
  fetchMyImages: () => Promise<void>;
  loadMoreMyImages: () => Promise<void>;
  saveImageToCollection: (imageData: Omit<ImageItem, 'id' | 'created_at'>) => Promise<ImageItem>;
  deleteImage: (imageId: string) => Promise<void>;
  likeImage: (imageId: string) => Promise<void>;
  unlikeImage: (imageId: string) => Promise<void>;
}

export const useGalleryStore = create<GalleryState>((set, get) => ({
  myImages: [],
  currentPage: 1,
  pageSize: 12,
  isLoading: false,
  error: null,
  hasMoreMyImages: true,
  
  fetchMyImages: async () => {
    try {
      set({ isLoading: true, error: null, currentPage: 1 });
      
      const images = await getImages(0, get().pageSize);
      const totalCount = await getImageCount();
      
      set({ 
        myImages: images, 
        isLoading: false,
        hasMoreMyImages: images.length < totalCount
      });
      
    } catch (error: any) {
      console.error('Error fetching my images:', error);
      set({ error: error.message, isLoading: false });
    }
  },
  
  loadMoreMyImages: async () => {
    const { currentPage, pageSize, myImages, isLoading } = get();
    
    if (isLoading) return;
    
    try {
      set({ isLoading: true, error: null });
      
      const nextPage = currentPage + 1;
      const offset = (nextPage - 1) * pageSize;
      
      const moreImages = await getImages(offset, pageSize);
      const totalCount = await getImageCount();
      
      if (moreImages.length === 0) {
        set({ hasMoreMyImages: false, isLoading: false });
        return;
      }
      
      set({ 
        myImages: [...myImages, ...moreImages], 
        currentPage: nextPage,
        isLoading: false,
        hasMoreMyImages: myImages.length + moreImages.length < totalCount
      });
      
    } catch (error: any) {
      console.error('Error loading more images:', error);
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
  },
  
  likeImage: async (imageId) => {
    // In a full implementation, this would call an API
    // For now, we'll just update the local state
    set(state => ({
      myImages: state.myImages.map(img => 
        img.id === imageId 
          ? { ...img, isLiked: true, likes: (img.likes || 0) + 1 } 
          : img
      )
    }));
  },
  
  unlikeImage: async (imageId) => {
    // In a full implementation, this would call an API
    // For now, we'll just update the local state
    set(state => ({
      myImages: state.myImages.map(img => 
        img.id === imageId && img.isLiked
          ? { ...img, isLiked: false, likes: Math.max(0, (img.likes || 1) - 1) } 
          : img
      )
    }));
  }
}));

// Helper function to get the total image count
// In a real implementation, this would be an API call
async function getImageCount(): Promise<number> {
  try {
    const allImages = await getImages();
    return allImages.length;
  } catch (error) {
    console.error('Error getting image count:', error);
    return 0;
  }
}