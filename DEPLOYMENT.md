# Deploying to GitHub Pages with WebAssembly Support

This guide explains how to deploy the Dithering App to GitHub Pages, including the WebAssembly components for accelerated image processing.

## Prerequisites

- A GitHub account
- The repository cloned to your local machine

## Setup

1. Make sure your repository is public (or you have GitHub Pages enabled for private repositories)

2. Update the `base` property in `vite.config.ts` to match your repository name:
   ```js
   base: '/your-repo-name/', // GitHub Pages repository name
   ```

3. If you haven't already, create a GitHub repository with the same name as specified in the `base` property.

## Building WebAssembly Locally

Before deploying, you can build the WebAssembly modules locally:

1. Install Rust from https://www.rust-lang.org/tools/install

2. Install wasm-pack:
   ```bash
   cargo install wasm-pack
   ```

3. Build the WebAssembly module:
   ```bash
   cd rust_wasm
   wasm-pack build --target web
   ```

4. Create the necessary directories and copy the files:
   ```bash
   mkdir -p ../public/assets
   cp pkg/dithering_wasm_bg.wasm ../public/assets/dithering_wasm.wasm
   cp pkg/dithering_wasm.js ../src/lib/wasm/
   ```

## Automatic GitHub Pages Deployment

The project is configured to automatically build and deploy to GitHub Pages using GitHub Actions:

1. Push your changes to the `main` branch:
   ```bash
   git add .
   git commit -m "Update app for GitHub Pages deployment"
   git push origin main
   ```

2. The GitHub Action will:
   - Install Rust and wasm-pack
   - Build the WebAssembly module
   - Build the React application
   - Deploy to the `gh-pages` branch

3. Go to your repository Settings > Pages and ensure:
   - Source is set to "Deploy from a branch"
   - Branch is set to "gh-pages" and folder to "/ (root)"

## Troubleshooting WebAssembly on GitHub Pages

If WebAssembly doesn't work on GitHub Pages:

1. **CORS Issues**: GitHub Pages doesn't support custom headers, so you may need to:
   - Use a service like Cloudflare Workers to add CORS headers
   - Or use the JS fallback which will be activated automatically

2. **Loading Failures**: The app includes a fallback mechanism:
   - If WebAssembly fails to load, it will use JavaScript implementations
   - This state is saved in localStorage to avoid repeated failed attempts

3. **Debug Console**: Check the browser console for loading messages:
   - "WebAssembly module loaded successfully" indicates proper loading
   - Error messages will indicate what went wrong

## Testing

After deployment, your app should be available at:
```
https://[your-username].github.io/[your-repo-name]/
```

The first time you use a dithering algorithm, check the console to confirm if WebAssembly is being used. 