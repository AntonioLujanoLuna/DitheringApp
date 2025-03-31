// src/components/layout/Layout.tsx
import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';

const Layout: React.FC = () => {
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-gray-200 py-4">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold text-primary-600">
            Halftone
          </Link>
          
          <nav className="hidden md:flex space-x-6">
            <Link 
              to="/editor" 
              className={`font-medium ${isActive('/editor') ? 'text-primary-600' : 'text-gray-700 hover:text-primary-600'}`}
            >
              Editor
            </Link>
            <Link 
              to="/gallery/my" 
              className={`font-medium ${isActive('/gallery') ? 'text-primary-600' : 'text-gray-700 hover:text-primary-600'}`}
            >
              My Gallery
            </Link>
          </nav>
          
          <div className="flex items-center">
            <div className="hidden md:block">
              <Link 
                to="/editor" 
                className="btn btn-primary"
              >
                Create New
              </Link>
            </div>
            
            <button className="md:hidden p-2 text-gray-700">
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
      
      <footer className="bg-gray-100 py-8 mt-10">
        <div className="container mx-auto px-4">
          <div className="md:flex md:justify-between">
            <div className="mb-6 md:mb-0">
              <Link to="/" className="text-xl font-bold text-gray-800">
                Halftone
              </Link>
              <p className="mt-2 text-gray-600 max-w-md">
                A client-side web application for applying halftone dithering effects to images.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
              <div>
                <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wider">App</h3>
                <ul className="mt-4 space-y-4">
                  <li>
                    <Link to="/editor" className="text-gray-600 hover:text-primary-600">
                      Editor
                    </Link>
                  </li>
                  <li>
                    <Link to="/gallery/my" className="text-gray-600 hover:text-primary-600">
                      My Gallery
                    </Link>
                  </li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wider">Links</h3>
                <ul className="mt-4 space-y-4">
                  <li>
                    <a href="https://github.com/" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-primary-600">
                      GitHub
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-gray-600 hover:text-primary-600">
                      Buy Me a Coffee
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="mt-8 border-t border-gray-200 pt-8 md:flex md:items-center md:justify-between">
            <div className="text-sm text-gray-500">
              © {new Date().getFullYear()} Halftone. All rights reserved.
            </div>
            
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-primary-600">
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