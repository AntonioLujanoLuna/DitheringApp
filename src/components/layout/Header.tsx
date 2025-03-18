import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

const Header: React.FC = () => {
  const { user, profile, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const handleLogout = async () => {
    await logout();
    navigate('/');
    setMobileMenuOpen(false);
  };
  
  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };
  
  return (
    <header className="bg-white shadow">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold text-primary-600 flex items-center">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24"
            className="h-8 w-8 mr-2 text-primary-600" 
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="6" />
            <circle cx="12" cy="12" r="2" />
          </svg>
          <span className="hidden sm:inline">Halftone Dithering App</span>
          <span className="inline sm:hidden">Halftone</span>
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link 
            to="/editor" 
            className={`text-gray-700 hover:text-primary-600 ${location.pathname === '/editor' ? 'text-primary-600 font-medium' : ''}`}
          >
            Editor
          </Link>
          <Link 
            to="/batch" 
            className={`text-gray-700 hover:text-primary-600 ${location.pathname === '/batch' ? 'text-primary-600 font-medium' : ''}`}
          >
            Batch Process
          </Link>
          <Link 
            to="/gallery/community" 
            className={`text-gray-700 hover:text-primary-600 ${location.pathname.includes('/gallery/community') ? 'text-primary-600 font-medium' : ''}`}
          >
            Community Gallery
          </Link>
          {user ? (
            <>
              <Link 
                to="/gallery/my" 
                className={`text-gray-700 hover:text-primary-600 ${location.pathname.includes('/gallery/my') ? 'text-primary-600 font-medium' : ''}`}
              >
                My Collection
              </Link>
              <div className="relative group">
                <button className="flex items-center text-gray-700 hover:text-primary-600">
                  {profile?.username || user.email?.split('@')[0] || 'User'}
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-4 w-4 ml-1" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M19 9l-7 7-7-7" 
                    />
                  </svg>
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-md py-1 z-10 hidden group-hover:block">
                  <Link 
                    to="/profile" 
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                  >
                    Profile Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="text-gray-700 hover:text-primary-600">
                Login
              </Link>
              <Link 
                to="/signup" 
                className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
              >
                Sign Up
              </Link>
            </>
          )}
        </nav>
        
        {/* Mobile menu button */}
        <button 
          className="md:hidden text-gray-500 hover:text-gray-700 focus:outline-none"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? (
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-6 w-6" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M6 18L18 6M6 6l12 12" 
              />
            </svg>
          ) : (
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-6 w-6" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M4 6h16M4 12h16M4 18h16" 
              />
            </svg>
          )}
        </button>
      </div>
      
      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 py-2">
          <div className="container mx-auto px-4 space-y-1">
            <Link 
              to="/editor" 
              className={`block py-2 ${location.pathname === '/editor' ? 'text-primary-600 font-medium' : 'text-gray-700'}`}
              onClick={closeMobileMenu}
            >
              Editor
            </Link>
            <Link 
              to="/batch" 
              className={`block py-2 ${location.pathname === '/batch' ? 'text-primary-600 font-medium' : 'text-gray-700'}`}
              onClick={closeMobileMenu}
            >
              Batch Process
            </Link>
            <Link 
              to="/gallery/community" 
              className={`block py-2 ${location.pathname.includes('/gallery/community') ? 'text-primary-600 font-medium' : 'text-gray-700'}`}
              onClick={closeMobileMenu}
            >
              Community Gallery
            </Link>
            {user ? (
              <>
                <Link 
                  to="/gallery/my" 
                  className={`block py-2 ${location.pathname.includes('/gallery/my') ? 'text-primary-600 font-medium' : 'text-gray-700'}`}
                  onClick={closeMobileMenu}
                >
                  My Collection
                </Link>
                <Link 
                  to="/profile" 
                  className={`block py-2 ${location.pathname === '/profile' ? 'text-primary-600 font-medium' : 'text-gray-700'}`}
                  onClick={closeMobileMenu}
                >
                  Profile Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left py-2 text-gray-700"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="flex flex-col space-y-2 pt-2">
                <Link 
                  to="/login" 
                  className="block py-2 text-center text-gray-700 border border-gray-300 rounded-md"
                  onClick={closeMobileMenu}
                >
                  Login
                </Link>
                <Link 
                  to="/signup" 
                  className="block py-2 text-center bg-primary-600 text-white rounded-md hover:bg-primary-700"
                  onClick={closeMobileMenu}
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;