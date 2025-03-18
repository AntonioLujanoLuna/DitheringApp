# Testing Guide for Halftone Dithering App

This document provides guidelines and instructions for testing the Halftone Dithering App.

## Testing Stack

The app uses the following testing tools:

- **Vitest**: Fast testing framework compatible with Vite
- **Testing Library**: For React component testing
- **jsdom**: For simulating a DOM environment in tests
- **vi.mock**: For mocking dependencies and external services

## Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode (for development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Test Structure

Tests are organized into four main categories:

1. **Unit Tests**: Testing individual functions and algorithms
2. **Component Tests**: Testing UI components in isolation
3. **Store Tests**: Testing Zustand store logic
4. **Integration Tests**: Testing component interactions and workflows

### Test File Naming Conventions

- Unit tests: `*.test.ts`
- Component tests: `*.test.tsx`
- Store tests: `useStore.test.ts`
- Integration tests: `pages/*.test.tsx`

## Writing New Tests

### Unit Tests

For pure functions and algorithms, focus on testing:
- Input/output relationships
- Edge cases
- Error handling

Example:

```typescript
describe('rgbToGrayscale', () => {
  it('should convert RGB image data to grayscale', () => {
    const imageData = new ImageData(2, 2);
    // Set up test data
    imageData.data[0] = 100; // R
    imageData.data[1] = 150; // G
    imageData.data[2] = 200; // B
    imageData.data[3] = 255; // A
    
    const result = rgbToGrayscale(imageData);
    
    // Using luminance formula: 0.299*R + 0.587*G + 0.114*B
    const expected = 0.299*100 + 0.587*150 + 0.114*200;
    expect(result[0]).toBeCloseTo(expected);
  });
});
```

### Component Tests

For React components, focus on testing:
- Rendering and UI behavior
- User interactions (clicks, input changes)
- State changes within the component
- Accessibility

Example:

```typescript
describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
  
  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
  
  it('displays loading state when isLoading is true', () => {
    render(<Button isLoading>Click me</Button>);
    // Check for loading indicator
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    // Text should still be there but visually hidden
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
});
```

### Store Tests

For Zustand stores, focus on testing:
- Initial state
- Actions and state updates
- Handling of async operations
- Error states

Example:

```typescript
describe('useAuthStore', () => {
  it('should update user on successful login', async () => {
    // Mock Supabase response
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: { user: { id: 'test-id', email: 'test@example.com' } },
      error: null,
    });
    
    const store = useAuthStore.getState();
    await store.login('test@example.com', 'password');
    
    expect(store.user).not.toBeNull();
    expect(store.user?.email).toBe('test@example.com');
    expect(store.error).toBeNull();
  });
});
```

### Integration Tests

For integration tests, focus on testing:
- Workflows across multiple components
- Page-level functionality
- Data flow between components
- User journeys

Example:

```typescript
describe('Editor Page', () => {
  it('should process and display image when uploaded', async () => {
    render(<Editor />);
    
    // Mock file upload
    const file = new File([''], 'test.png', { type: 'image/png' });
    const input = screen.getByLabelText(/upload/i);
    fireEvent.change(input, { target: { files: [file] } });
    
    // Wait for processing to complete
    await waitFor(() => {
      expect(screen.getByAltText('Processed')).toBeInTheDocument();
    });
    
    // Test download functionality
    const downloadButton = screen.getByText('Download Image');
    expect(downloadButton).not.toBeDisabled();
  });
});
```

## Mocking

### Mocking Zustand Stores

```typescript
vi.mock('../store/useAuthStore', () => ({
  useAuthStore: vi.fn(() => ({
    user: { id: 'test-id', email: 'test@example.com' },
    profile: { username: 'testuser' },
    isLoading: false,
    error: null,
    login: vi.fn(),
    logout: vi.fn(),
  })),
}));
```

### Mocking Supabase

```typescript
vi.mock('../lib/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(() => Promise.resolve({
        data: { user: { id: 'test-id' } },
        error: null,
      })),
      // Add other methods as needed
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: { /* mock data */ },
            error: null,
          })),
        })),
      })),
      // Add other query methods as needed
    })),
  },
}));
```

### Mocking Canvas

Canvas operations need special handling in tests:

```typescript
// In setup file or test file
const mockCanvas = {
  getContext: () => ({
    drawImage: vi.fn(),
    putImageData: vi.fn(),
    getImageData: vi.fn(() => ({
      data: new Uint8ClampedArray(100 * 100 * 4),
      width: 100,
      height: 100,
    })),
  }),
  toBlob: (callback) => {
    callback(new Blob(['mock-data'], { type: 'image/png' }));
  },
};

vi.spyOn(document, 'createElement').mockImplementation((tag) => {
  if (tag === 'canvas') return mockCanvas;
  return document.createElement(tag);
});
```

## Coverage Goals

- Unit tests: Aim for 90%+ coverage of algorithm code
- Component tests: Aim for 80%+ coverage of UI components
- Store tests: Aim for 90%+ coverage of store logic
- Integration tests: Cover all main user flows

Run coverage reports regularly to identify areas needing more tests.

## Troubleshooting Tests

### Common Issues

1. **Async Test Failures**:
   - Use `await waitFor(() => { expect(...) })` for async operations
   - Check that promises are properly resolved

2. **Component Not Found**:
   - Use `screen.debug()` to check what's actually rendered
   - Check that you're using the right query method (getBy, queryBy, findBy)

3. **Mocking Problems**:
   - Ensure mocks are defined before component renders
   - Check that the mock path exactly matches the import path
   - Use `vi.clearAllMocks()` in beforeEach for clean mocks between tests

4. **Canvas/WebGL Issues**:
   - Canvas operations need explicit mocking
   - Consider creating a separate mock module for complex canvas operations