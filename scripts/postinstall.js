console.log('Running postinstall script...');

// Check if we're in a Vercel environment
const isVercel = process.env.VERCEL === '1';

if (isVercel) {
  console.log('Detected Vercel environment - skipping PWA setup.');
  process.env.DISABLE_PWA = 'true';
} else {
  console.log('Not in Vercel environment - proceeding with normal setup.');
}

// Exit successfully
process.exit(0); 