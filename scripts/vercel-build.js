// At the top of the file
process.env.ROLLUP_NATIVE_EXTENSIONS = 'false';

// When executing the build command
execSync('vite build --config vite.vercel.config.js', { 
  stdio: 'inherit',
  env: { 
    ...process.env,
    DISABLE_PWA: 'true',
    NODE_ENV: 'production',
    ROLLUP_NATIVE_EXTENSIONS: 'false'
  }
});