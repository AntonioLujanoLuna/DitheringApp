export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
          is_admin: boolean
        }
        Insert: {
          id: string
          username?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
          is_admin?: boolean
        }
        Update: {
          id?: string
          username?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
          is_admin?: boolean
        }
      }
      images: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          original_url: string
          processed_url: string
          is_public: boolean
          processing_settings: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          original_url: string
          processed_url: string
          is_public?: boolean
          processing_settings: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          original_url?: string
          processed_url?: string
          is_public?: boolean
          processing_settings?: Json
          created_at?: string
          updated_at?: string
        }
      }
      presets: {
        Row: {
          id: string
          user_id: string
          name: string
          settings: Json
          is_public: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          settings: Json
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          settings?: Json
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      likes: {
        Row: {
          id: string
          user_id: string
          image_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          image_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          image_id?: string
          created_at?: string
        }
      }
      analytics: {
        Row: {
          id: string
          event_type: string
          event_data: Json | null
          user_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          event_type: string
          event_data?: Json | null
          user_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          event_type?: string
          event_data?: Json | null
          user_id?: string | null
          created_at?: string
        }
      }
    }
  }
}