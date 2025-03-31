// src/lib/supabase/client.ts
export const supabase = {
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    },
    storage: {
      from: () => ({
        upload: () => Promise.resolve({ data: {}, error: null }),
        getPublicUrl: () => ({ data: { publicUrl: 'test-url' } }),
      }),
    },
    from: () => ({
      insert: () => Promise.resolve({ error: null }),
    }),
  };