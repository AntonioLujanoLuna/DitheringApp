import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

const Header: React.FC = () => {
  const { user, profile, logout } = useAuthStore();
  const navigate = useNavigate();
  
  const handleLogout = async () => {
    await logout();
    navigate('/');
  };
  
  return (
    <header className="bg-white shadow">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold text-primary-600">
          Halftone Dithering App
        </Link>
        
        <nav className="flex items-center space-x-6">
          <Link to="/editor" className="text-gray-700 hover:text-primary-600">
            Editor
          </Link>
          <Link to="/gallery/community" className="text-gray-700 hover:text-primary-600">
            Community Gallery
          </Link>
          {user ? (
            <>
              <Link to="/gallery/my" className="text-gray-700 hover:text-primary-600">
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
      </div>
    </header>
  );
};

export default Header;