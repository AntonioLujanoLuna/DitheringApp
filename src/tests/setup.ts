import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { TextDecoder, TextEncoder } from 'util';

// Mock canvas
class MockCanvas {
  getContext() {
    return {
      drawImage: vi.fn(),
      putImageData: vi.fn(),
      getImageData: vi.fn(() => ({
        data: new Uint8ClampedArray(100 * 100 * 4),
        width: 100,
        height: 100,
      })),
    };
  }
  
  toBlob(callback: (blob: Blob | null) => void) {
    const blob = new Blob(['mock-image-data'], { type: 'image/png' });
    callback(blob);
  }
  
  toDataURL() {
    return 'data:image/png;base64,mockbase64data';
  }
}

// Mock HTML elements
global.HTMLCanvasElement.prototype.getContext = function() {
  return {
    drawImage: vi.fn(),
    putImageData: vi.fn(),
    getImageData: vi.fn(() => ({
      data: new Uint8ClampedArray(100 * 100 * 4),
      width: 100,
      height: 100,
    })),
  };
};

global.HTMLCanvasElement.prototype.toBlob = function(callback) {
  const blob = new Blob(['mock-image-data'], { type: 'image/png' });
  callback(blob);
};

global.HTMLCanvasElement.prototype.toDataURL = function() {
  return 'data:image/png;base64,mockbase64data';
};

// TextEncoder/TextDecoder are needed by some tests
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;

// Mock window.URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => 'mock-object-url');
global.URL.revokeObjectURL = vi.fn();

// Mock window.fs for file reading in dithering algorithms
(window as any).fs = {
  readFile: vi.fn(async () => new Uint8Array([0, 1, 2, 3])),
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor(callback: any) {}
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock Supabase
vi.mock('../lib/supabase/client', () => {
  return {
    supabase: {
      auth: {
        getUser: vi.fn(() => Promise.resolve({ 
          data: { user: { id: 'test-user-id', email: 'test@example.com' } },
          error: null
        })),
        signInWithPassword: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
      },
      storage: {
        from: vi.fn(() => ({
          upload: vi.fn(() => Promise.resolve({ data: { path: 'test-path' }, error: null })),
          getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://test-url.com/image.png' } })),
          remove: vi.fn(),
        })),
      },
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: null, error: null })),
            order: vi.fn(() => ({
              limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
            })),
            in: vi.fn(() => ({
              group: vi.fn(() => Promise.resolve({ data: [], error: null })),
            })),
          })),
          order: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
            range: vi.fn(() => Promise.resolve({ data: [], error: null })),
          })),
        })),
        insert: vi.fn(() => ({ select: vi.fn(() => Promise.resolve({ data: [], error: null })) })),
        update: vi.fn(() => ({ eq: vi.fn(() => Promise.resolve({ error: null })) })),
        delete: vi.fn(() => ({ eq: vi.fn(() => Promise.resolve({ error: null })) })),
      })),
    },
  };
});