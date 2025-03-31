/**
 * Service Worker Registration
 * This file handles registering the service worker for PWA functionality
 */

export function registerServiceWorker(): void {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/serviceWorker.js')
        .then(registration => {
          console.log('Service Worker registered successfully:', registration.scope);
          
          // Check for updates on page load
          registration.update();
          
          // Set up periodic checks for service worker updates
          setInterval(() => {
            registration.update();
            console.log('Checking for Service Worker updates...');
          }, 1000 * 60 * 60); // Check every hour
        })
        .catch(error => {
          console.error('Service Worker registration failed:', error);
        });
    });
  } else {
    console.log('Service Workers are not supported in this browser.');
  }
}

// Function to check if the app is installed or can be installed
export function checkInstallStatus(): { isInstalled: boolean, canBeInstalled: boolean } {
  // Check if the app is running in standalone mode (installed)
  const isInstalled = window.matchMedia('(display-mode: standalone)').matches || 
                     (navigator as any).standalone === true;
  
  // Check if the browser supports installation
  const canBeInstalled = 'BeforeInstallPromptEvent' in window;
  
  return { isInstalled, canBeInstalled };
}

// Handle the install prompt
let deferredPrompt: any;

// Listen for the beforeinstallprompt event
window.addEventListener('beforeinstallprompt', (event) => {
  // Prevent the default browser install prompt
  event.preventDefault();
  
  // Store the event for later use
  deferredPrompt = event;
  
  // Notify the app that installation is available
  const event2 = new CustomEvent('appInstallAvailable');
  window.dispatchEvent(event2);
});

// Function to show the install prompt
export function promptInstall(): Promise<boolean> {
  if (!deferredPrompt) {
    return Promise.resolve(false);
  }
  
  // Show the install prompt
  deferredPrompt.prompt();
  
  // Wait for the user's choice
  return deferredPrompt.userChoice.then((choiceResult: { outcome: string }) => {
    // Reset the deferredPrompt variable
    deferredPrompt = null;
    
    // Return true if the app was installed
    return choiceResult.outcome === 'accepted';
  });
}

// Listen for successful installation
window.addEventListener('appinstalled', () => {
  // Log the installation
  console.log('Application was successfully installed');
  
  // Reset the deferredPrompt variable
  deferredPrompt = null;
  
  // Notify the app
  const event = new CustomEvent('appInstalled');
  window.dispatchEvent(event);
}); 