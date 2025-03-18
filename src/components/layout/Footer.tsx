import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-100 mt-12">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-600 text-sm">
            &copy; {new Date().getFullYear()} Halftone Dithering App
          </p>
          <div className="flex space-x-4 mt-2 md:mt-0">
            <a href="#" className="text-gray-600 hover:text-primary-600 text-sm">
              Terms of Service
            </a>
            <a href="#" className="text-gray-600 hover:text-primary-600 text-sm">
              Privacy Policy
            </a>
            <a href="#" className="text-gray-600 hover:text-primary-600 text-sm">
              Contact
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;