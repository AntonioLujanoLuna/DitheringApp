import React, { useState } from 'react';
import { useThemeStore } from '../../store/useThemeStore';

interface Step {
  title: string;
  description: string;
  image?: string;
}

interface OnboardingTutorialProps {
  onComplete: () => void;
  onSkip: () => void;
}

const OnboardingTutorial: React.FC<OnboardingTutorialProps> = ({ 
  onComplete,
  onSkip
}) => {
  const { darkMode } = useThemeStore();
  const [currentStep, setCurrentStep] = useState(0);
  
  // Define tutorial steps
  const steps: Step[] = [
    {
      title: 'Welcome to Halftone',
      description: 'This app lets you apply dithering and halftone effects to your images. Let\'s walk through the basics of using the app.',
      image: '/images/tutorial/welcome.png'
    },
    {
      title: 'Upload Your Image',
      description: 'Start by uploading an image to process. You can drag and drop or click to select a file.',
      image: '/images/tutorial/upload.png'
    },
    {
      title: 'Choose an Algorithm',
      description: 'Select a dithering algorithm to apply to your image. Each algorithm produces a different visual effect.',
      image: '/images/tutorial/algorithm.png'
    },
    {
      title: 'Adjust Parameters',
      description: 'Fine-tune the effect using sliders for settings like dot size, contrast, and spacing.',
      image: '/images/tutorial/parameters.png'
    },
    {
      title: 'Save Your Work',
      description: 'Download your image or save it to your collection. You can also save your settings as a preset for future use.',
      image: '/images/tutorial/save.png'
    },
    {
      title: 'Keyboard Shortcuts',
      description: 'Use keyboard shortcuts to work faster. Press "?" at any time to see available shortcuts.',
      image: '/images/tutorial/shortcuts.png'
    }
  ];
  
  // Next step
  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };
  
  // Previous step
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${darkMode ? 'bg-gray-900/90' : 'bg-gray-100/90'}`}>
      <div className={`relative w-full max-w-2xl rounded-lg shadow-xl overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        {/* Progress bar */}
        <div className="w-full h-1 bg-gray-200 dark:bg-gray-700">
          <div 
            className="h-full bg-primary-500" 
            style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
          />
        </div>
        
        <div className="p-6">
          {/* Step content */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">{steps[currentStep].title}</h2>
            
            {steps[currentStep].image && (
              <div className={`w-full rounded-lg overflow-hidden ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} flex justify-center p-4`}>
                <img 
                  src={steps[currentStep].image} 
                  alt={steps[currentStep].title}
                  className="max-h-64 object-contain"
                  onError={(e) => {
                    // Fallback if image fails to load
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
            
            <p className="text-lg">{steps[currentStep].description}</p>
          </div>
          
          {/* Navigation buttons */}
          <div className="flex justify-between mt-8">
            <div>
              {currentStep > 0 && (
                <button
                  onClick={handlePrevious}
                  className={`py-2 px-4 rounded-lg ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
                >
                  Previous
                </button>
              )}
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={onSkip}
                className={`py-2 px-4 rounded-lg ${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-800'}`}
              >
                Skip Tutorial
              </button>
              
              <button
                onClick={handleNext}
                className="py-2 px-4 bg-primary-500 hover:bg-primary-600 text-white rounded-lg"
              >
                {currentStep < steps.length - 1 ? 'Next' : 'Get Started'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingTutorial; 