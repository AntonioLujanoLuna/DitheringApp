import { create } from 'zustand';
import { supabase } from '../lib/supabase/client';

export interface ImageItem {
  id: string;
  title: string;
  description: string | null;
  processed_url: string;
  is_public: boolean;
  created_at: string;
  user_id: string;
  username: string | null;
  like_count: number;
  user_has_liked: boolean;
  processing_settings?: any;
}

interface GalleryState {
  myImages: ImageItem[];
  communityImages: ImageItem[];
  isLoading: boolean;
  error: string | null;
  // Pagination
  myImagesPage: number;
  communityImagesPage: number;
  hasMoreMyImages: boolean;
  hasMoreCommunityImages: boolean;
  // Actions
  fetchMyImages: () => Promise<void>;
  fetchCommunityImages: () => Promise<void>;
  loadMoreMyImages: () => Promise<void>;
  loadMoreCommunityImages: () => Promise<void>;
  likeImage: (imageId: string) => Promise<void>;
  unlikeImage: (imageId: string) => Promise<void>;
  deleteImage: (imageId: string) => Promise<void>;
  fetchImageById: (imageId: string) => Promise<any>;
}

const ITEMS_PER_PAGE = 12;

export const useGalleryStore = create<GalleryState>((set, get) => ({
  myImages: [],
  communityImages: [],
  isLoading: false,
  error: null,
  myImagesPage: 0,
  communityImagesPage: 0,
  hasMoreMyImages: true,
  hasMoreCommunityImages: true,
  
  fetchMyImages: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    try {
      set({ isLoading: true, error: null, myImagesPage: 0 });
      
      const { data, error } = await supabase
        .from('images')
        .select(`
          id, title, description, processed_url, is_public, created_at, user_id,
          profiles(username)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(ITEMS_PER_PAGE);
        
      if (error) throw error;
      
      // Get like counts for these images
      const result = await supabase
        .from('likes')
        .select('image_id, count')
        .in('image_id', data.map(item => item.id));
      // @ts-ignore - group is available but not in types
      const groupedResult = await result.group('image_id');
      
      const { data: likesData, error: likesError } = groupedResult;
      
      if (likesError) throw likesError;
      
      // Check which images the user has liked
      const { data: userLikes, error: userLikesError } = await supabase
        .from('likes')
        .select('image_id')
        .eq('user_id', user.id)
        .in('image_id', data.map(item => item.id));
        
      if (userLikesError) throw userLikesError;
      
      // Create a map of image_id to like count
      const likeCountMap = (likesData || []).reduce((acc: Record<string, number>, item: any) => {
        acc[item.image_id] = parseInt(item.count);
        return acc;
      }, {} as Record<string, number>);
      
      // Create a set of image_ids that the user has liked
      const userLikedSet = new Set((userLikes || []).map(item => item.image_id));
      
      const formattedData = data.map(item => ({
        id: item.id,
        title: item.title,
        description: item.description,
        processed_url: item.processed_url,
        is_public: item.is_public,
        created_at: item.created_at,
        user_id: item.user_id,
        username: item.profiles?.[0]?.username || null,
        like_count: likeCountMap[item.id] || 0,
        user_has_liked: userLikedSet.has(item.id)
      }));
      
      set({ 
        myImages: formattedData, 
        hasMoreMyImages: data.length === ITEMS_PER_PAGE,
        isLoading: false,
        myImagesPage: 1
      });
      
    } catch (error: any) {
      console.error('Error fetching my images:', error);
      set({ error: error.message, isLoading: false });
    }
  },
  
  loadMoreMyImages: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const { myImages, myImagesPage } = get();
    if (!myImagesPage) return;
    
    try {
      set({ isLoading: true, error: null });
      
      const { data, error } = await supabase
        .from('images')
        .select(`
          id, title, description, processed_url, is_public, created_at, user_id,
          profiles(username)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(myImagesPage * ITEMS_PER_PAGE, (myImagesPage + 1) * ITEMS_PER_PAGE - 1);
        
      if (error) throw error;
      
      // Get like counts for these images
      const result = await supabase
        .from('likes')
        .select('image_id, count')
        .in('image_id', data.map(item => item.id));
      // @ts-ignore - group is available but not in types
      const groupedResult = await result.group('image_id');
      
      const { data: likesData, error: likesError } = groupedResult;
      
      if (likesError) throw likesError;
      
      // Check which images the user has liked
      const { data: userLikes, error: userLikesError } = await supabase
        .from('likes')
        .select('image_id')
        .eq('user_id', user.id)
        .in('image_id', data.map(item => item.id));
        
      if (userLikesError) throw userLikesError;
      
      // Create a map of image_id to like count
      const likeCountMap = (likesData || []).reduce((acc: Record<string, number>, item: any) => {
        acc[item.image_id] = parseInt(item.count);
        return acc;
      }, {} as Record<string, number>);
      
      // Create a set of image_ids that the user has liked
      const userLikedSet = new Set((userLikes || []).map(item => item.image_id));
      
      const formattedData = data.map(item => ({
        id: item.id,
        title: item.title,
        description: item.description,
        processed_url: item.processed_url,
        is_public: item.is_public,
        created_at: item.created_at,
        user_id: item.user_id,
        username: item.profiles?.[0]?.username || null,
        like_count: likeCountMap[item.id] || 0,
        user_has_liked: userLikedSet.has(item.id)
      }));
      
      set({ 
        myImages: [...myImages, ...formattedData], 
        hasMoreMyImages: data.length === ITEMS_PER_PAGE,
        isLoading: false,
        myImagesPage: myImagesPage + 1
      });
      
    } catch (error: any) {
      console.error('Error loading more my images:', error);
      set({ error: error.message, isLoading: false });
    }
  },
  
  fetchCommunityImages: async () => {
    try {
      set({ isLoading: true, error: null, communityImagesPage: 0 });
      
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;
      
      const { data, error } = await supabase
        .from('images')
        .select(`
          id, title, description, processed_url, is_public, created_at, user_id,
          profiles(username)
        `)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(ITEMS_PER_PAGE);
        
      if (error) throw error;
      
      // Get like counts for these images
      const result = await supabase
        .from('likes')
        .select('image_id, count')
        .in('image_id', data.map(item => item.id));
      // @ts-ignore - group is available but not in types
      const groupedResult = await result.group('image_id');
      
      const { data: likesData, error: likesError } = groupedResult;
      
      if (likesError) throw likesError;
      
      // Create a map of image_id to like count
      const likeCountMap = (likesData || []).reduce((acc: Record<string, number>, item: any) => {
        acc[item.image_id] = parseInt(item.count);
        return acc;
      }, {} as Record<string, number>);
      
      // Check which images the user has liked (if logged in)
      let userLikedSet = new Set<string>();
      
      if (userId) {
        const { data: userLikes } = await supabase
          .from('likes')
          .select('image_id')
          .eq('user_id', userId)
          .in('image_id', data.map(item => item.id));
          
        if (userLikes) {
          userLikedSet = new Set(userLikes.map(item => item.image_id));
        }
      }
      
      const formattedData = data.map(item => ({
        id: item.id,
        title: item.title,
        description: item.description,
        processed_url: item.processed_url,
        is_public: item.is_public,
        created_at: item.created_at,
        user_id: item.user_id,
        username: item.profiles?.[0]?.username || null,
        like_count: likeCountMap[item.id] || 0,
        user_has_liked: userLikedSet.has(item.id)
      }));
      
      set({ 
        communityImages: formattedData, 
        hasMoreCommunityImages: data.length === ITEMS_PER_PAGE,
        isLoading: false,
        communityImagesPage: 1
      });
      
    } catch (error: any) {
      console.error('Error fetching community images:', error);
      set({ error: error.message, isLoading: false });
    }
  },
  
  loadMoreCommunityImages: async () => {
    const { communityImages, communityImagesPage } = get();
    if (!communityImagesPage) return;
    
    try {
      set({ isLoading: true, error: null });
      
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;
      
      const { data, error } = await supabase
        .from('images')
        .select(`
          id, title, description, processed_url, is_public, created_at, user_id,
          profiles(username)
        `)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .range(
          communityImagesPage * ITEMS_PER_PAGE, 
          (communityImagesPage + 1) * ITEMS_PER_PAGE - 1
        );
        
      if (error) throw error;
      
      // Get like counts for these images
      const result = await supabase
        .from('likes')
        .select('image_id, count')
        .in('image_id', data.map(item => item.id));
      // @ts-ignore - group is available but not in types
      const groupedResult = await result.group('image_id');
      
      const { data: likesData, error: likesError } = groupedResult;
      
      if (likesError) throw likesError;
      
      // Create a map of image_id to like count
      const likeCountMap = (likesData || []).reduce((acc: Record<string, number>, item: any) => {
        acc[item.image_id] = parseInt(item.count);
        return acc;
      }, {} as Record<string, number>);
      
      // Check which images the user has liked (if logged in)
      let userLikedSet = new Set<string>();
      
      if (userId) {
        const { data: userLikes } = await supabase
          .from('likes')
          .select('image_id')
          .eq('user_id', userId)
          .in('image_id', data.map(item => item.id));
          
        if (userLikes) {
          userLikedSet = new Set(userLikes.map(item => item.image_id));
        }
      }
      
      const formattedData = data.map(item => ({
        id: item.id,
        title: item.title,
        description: item.description,
        processed_url: item.processed_url,
        is_public: item.is_public,
        created_at: item.created_at,
        user_id: item.user_id,
        username: item.profiles?.[0]?.username || null,
        like_count: likeCountMap[item.id] || 0,
        user_has_liked: userLikedSet.has(item.id)
      }));
      
      set({ 
        communityImages: [...communityImages, ...formattedData], 
        hasMoreCommunityImages: data.length === ITEMS_PER_PAGE,
        isLoading: false,
        communityImagesPage: communityImagesPage + 1
      });
      
    } catch (error: any) {
      console.error('Error loading more community images:', error);
      set({ error: error.message, isLoading: false });
    }
  },
  
  likeImage: async (imageId) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('likes')
        .insert([
          { user_id: user.id, image_id: imageId }
        ]);
        
      if (error) throw error;
      
      // Update local state
      set(state => {
        const updateImages = (images: ImageItem[]) => 
          images.map(img => 
            img.id === imageId
              ? { ...img, like_count: img.like_count + 1, user_has_liked: true }
              : img
          );
          
        return {
          myImages: updateImages(state.myImages),
          communityImages: updateImages(state.communityImages),
        };
      });
      
    } catch (error: any) {
      console.error('Error liking image:', error);
    }
  },
  
  unlikeImage: async (imageId) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('user_id', user.id)
        .eq('image_id', imageId);
        
      if (error) throw error;
      
      // Update local state
      set(state => {
        const updateImages = (images: ImageItem[]) => 
          images.map(img => 
            img.id === imageId
              ? { ...img, like_count: Math.max(0, img.like_count - 1), user_has_liked: false }
              : img
          );
          
        return {
          myImages: updateImages(state.myImages),
          communityImages: updateImages(state.communityImages),
        };
      });
      
    } catch (error: any) {
      console.error('Error unliking image:', error);
    }
  },
  
  deleteImage: async (imageId) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    try {
      // Get image info to delete storage files
      const { data: imageData, error: fetchError } = await supabase
        .from('images')
        .select('original_url, processed_url')
        .eq('id', imageId)
        .eq('user_id', user.id)
        .single();
        
      if (fetchError) throw fetchError;
      
      // Delete the database record
      const { error: deleteError } = await supabase
        .from('images')
        .delete()
        .eq('id', imageId)
        .eq('user_id', user.id);
        
      if (deleteError) throw deleteError;
      
      // Delete storage files
      if (imageData) {
        // Extract file paths from URLs
        const originalPath = imageData.original_url.split('/').pop();
        const processedPath = imageData.processed_url.split('/').pop();
        
        if (originalPath) {
          await supabase
            .storage
            .from('original-images')
            .remove([`${user.id}/${originalPath}`]);
        }
          
        if (processedPath) {
          await supabase
            .storage
            .from('processed-images')
            .remove([`${user.id}/${processedPath}`]);
        }
      }
      
      // Update local state
      set(state => ({
        myImages: state.myImages.filter(img => img.id !== imageId),
        communityImages: state.communityImages.filter(img => img.id !== imageId),
      }));
      
    } catch (error: any) {
      console.error('Error deleting image:', error);
    }
  },
  
  fetchImageById: async (imageId) => {
    try {
      const { data, error } = await supabase
        .from('images')
        .select(`
          id, title, description, processed_url, original_url, is_public, 
          created_at, user_id, processing_settings,
          profiles(username)
        `)
        .eq('id', imageId)
        .single();
        
      if (error) throw error;
      
      // Get like count
      const { data: likesData, error: likesError } = await supabase
        .from('likes')
        .select('count(*)', { count: 'exact' })
        .eq('image_id', imageId);
        
      if (likesError) throw likesError;
      
      // Check if user has liked the image
      const { data: { user } } = await supabase.auth.getUser();
      let userHasLiked = false;
      
      if (user) {
        const { data: userLike, error: userLikeError } = await supabase
          .from('likes')
          .select('id')
          .eq('user_id', user.id)
          .eq('image_id', imageId)
          .single();
          
        if (!userLikeError && userLike) {
          userHasLiked = true;
        }
      }
      
      return {
        ...data,
        username: data.profiles?.[0]?.username || null,
        like_count: likesData && (likesData as any)[0] ? Number((likesData as any)[0].count) : 0,
        user_has_liked: userHasLiked
      };
      
    } catch (error: any) {
      console.error('Error fetching image:', error);
      throw error;
    }
  }
}));