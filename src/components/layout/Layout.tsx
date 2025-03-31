// src/components/layout/Layout.tsx
import React, { useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useThemeStore } from '../../store/useThemeStore';

const Layout: React.FC = () => {
  const location = useLocation();
  const { darkMode, toggleDarkMode } = useThemeStore();
  
  // Apply dark mode class to html element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);
  
  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };
  
  return (
    <div className={`min-h-screen flex flex-col ${darkMode ? 'dark bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      <header className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b py-4`}>
        <div className="container mx-auto px-4 flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold text-primary-600">
            Halftone
          </Link>
          
          <nav className="hidden md:flex space-x-6">
            <Link 
              to="/editor" 
              className={`font-medium ${isActive('/editor') ? 'text-primary-600' : darkMode ? 'text-gray-300 hover:text-primary-600' : 'text-gray-700 hover:text-primary-600'}`}
            >
              Editor
            </Link>
            <Link 
              to="/gallery/my" 
              className={`font-medium ${isActive('/gallery') ? 'text-primary-600' : darkMode ? 'text-gray-300 hover:text-primary-600' : 'text-gray-700 hover:text-primary-600'}`}
            >
              My Gallery
            </Link>
          </nav>
          
          <div className="flex items-center space-x-4">
            <button 
              onClick={toggleDarkMode}
              className={`p-2 rounded-full ${darkMode ? 'bg-gray-700 text-yellow-400' : 'bg-gray-200 text-gray-700'}`}
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>
            
            <div className="hidden md:block">
              <Link 
                to="/editor" 
                className={`btn btn-primary`}
              >
                Create New
              </Link>
            </div>
            
            <button className="md:hidden p-2 text-gray-700 dark:text-gray-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>
      
      <main className="flex-grow">
        <Outlet />
      </main>
      
      <footer className={`${darkMode ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-800'} py-8 mt-10`}>
        <div className="container mx-auto px-4">
          <div className="md:flex md:justify-between">
            <div className="mb-6 md:mb-0">
              <Link to="/" className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                Halftone
              </Link>
              <p className={`mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'} max-w-md`}>
                A client-side web application for applying halftone dithering effects to images.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-2">
              <div>
                <h3 className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-800'} uppercase tracking-wider`}>App</h3>
                <ul className="mt-4 space-y-4">
                  <li>
                    <Link to="/editor" className={`${darkMode ? 'text-gray-400 hover:text-primary-500' : 'text-gray-600 hover:text-primary-600'}`}>
                      Editor
                    </Link>
                  </li>
                  <li>
                    <Link to="/gallery/my" className={`${darkMode ? 'text-gray-400 hover:text-primary-500' : 'text-gray-600 hover:text-primary-600'}`}>
                      My Gallery
                    </Link>
                  </li>
                </ul>
              </div>
              
              <div>
                <h3 className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-800'} uppercase tracking-wider`}>Links</h3>
                <ul className="mt-4 space-y-4">
                  <li>
                    <a href="https://github.com/" target="_blank" rel="noopener noreferrer" className={`${darkMode ? 'text-gray-400 hover:text-primary-500' : 'text-gray-600 hover:text-primary-600'}`}>
                      GitHub
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className={`mt-8 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} pt-8 md:flex md:items-center md:justify-between`}>
            <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              © {new Date().getFullYear()} Halftone. All rights reserved.
            </div>
            
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="https://github.com/" className={`${darkMode ? 'text-gray-500 hover:text-primary-500' : 'text-gray-400 hover:text-primary-600'}`}>
                <span className="sr-only">GitHub</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;