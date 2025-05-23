import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import OnboardingTutorial from '../components/ui/OnboardingTutorial';
import { useUserStore } from '../store/useUserStore';
import { useThemeStore } from '../store/useThemeStore';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { hasCompletedTutorial, setHasCompletedTutorial } = useUserStore();
  const { darkMode } = useThemeStore();
  const [showTutorial, setShowTutorial] = useState(false);
  
  // Check if we should show the tutorial on first visit
  useEffect(() => {
    // Short delay to ensure the page is loaded first
    const timer = setTimeout(() => {
      if (!hasCompletedTutorial) {
        setShowTutorial(true);
      }
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [hasCompletedTutorial]);
  
  // Handle tutorial completion
  const handleTutorialComplete = () => {
    setHasCompletedTutorial(true);
    setShowTutorial(false);
    navigate('/editor');
  };
  
  // Handle tutorial skip
  const handleTutorialSkip = () => {
    setHasCompletedTutorial(true);
    setShowTutorial(false);
  };
  
  // Handle manual tutorial launch
  const handleShowTutorial = () => {
    setShowTutorial(true);
  };
  
  return (
    <div className={darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}>
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary-500 to-primary-700 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Transform Your Images with Halftone Dithering
          </h1>
          <p className="text-xl md:text-2xl max-w-3xl mx-auto mb-10">
            Create stunning vintage and comic book style artwork with our powerful
            dithering algorithms and effects.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/editor" className="bg-white text-primary-700 hover:bg-gray-100 px-8 py-3 rounded-md font-medium text-lg">
              Start Creating
            </Link>
            <Link to="/gallery/my" className="bg-transparent border border-white hover:bg-white hover:text-primary-700 px-8 py-3 rounded-md font-medium text-lg">
              View Gallery
            </Link>
            <button 
              onClick={handleShowTutorial} 
              className="bg-transparent border border-white hover:bg-white hover:text-primary-700 px-8 py-3 rounded-md font-medium text-lg"
            >
              Take the Tour
            </button>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className={`py-16 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Powerful Dithering Tools</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className={`text-center p-6 ${darkMode ? 'border-gray-700 bg-gray-700' : 'border-gray-200 bg-white'} border rounded-lg hover:shadow-lg transition-shadow`}>
              <div className="bg-primary-100 text-primary-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Multiple Algorithms</h3>
              <p className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
                Choose from Ordered, Floyd-Steinberg, Atkinson, and classic Halftone dithering methods.
              </p>
            </div>
            
            <div className={`text-center p-6 ${darkMode ? 'border-gray-700 bg-gray-700' : 'border-gray-200 bg-white'} border rounded-lg hover:shadow-lg transition-shadow`}>
              <div className="bg-primary-100 text-primary-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Color Control</h3>
              <p className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
                Work in B&W, RGB, CMYK, or create your own custom color palettes.
              </p>
            </div>
            
            <div className={`text-center p-6 ${darkMode ? 'border-gray-700 bg-gray-700' : 'border-gray-200 bg-white'} border rounded-lg hover:shadow-lg transition-shadow`}>
              <div className="bg-primary-100 text-primary-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Fine-Tuning</h3>
              <p className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
                Adjust dot size, contrast, spacing, and angle for perfect results.
              </p>
            </div>
            
            <div className={`text-center p-6 ${darkMode ? 'border-gray-700 bg-gray-700' : 'border-gray-200 bg-white'} border rounded-lg hover:shadow-lg transition-shadow`}>
              <div className="bg-primary-100 text-primary-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Save & Share</h3>
              <p className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
                Download your creations, save to your collection, or share with others via link.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Call to Action */}
      <section className="bg-primary-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Create Your Own?</h2>
          <p className="text-xl max-w-2xl mx-auto mb-8">
            Start transforming your images with our powerful dithering tools today.
            All processing happens in your browser - no account needed!
          </p>
          
          <div className="flex justify-center gap-4">
            <Link to="/editor" className="bg-white text-primary-700 hover:bg-gray-100 px-8 py-3 rounded-md font-medium text-lg">
              Open Editor
            </Link>
          </div>
        </div>
      </section>
      
      {/* Tutorial Modal */}
      {showTutorial && (
        <OnboardingTutorial 
          onComplete={handleTutorialComplete}
          onSkip={handleTutorialSkip}
        />
      )}
    </div>
  );
};

export default Home;