import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Import core pages
import Home from './pages/Home';
import Editor from './pages/Editor';
import CommunityGallery from './pages/CommunityGallery';
import MyGallery from './pages/MyGallery';
import Profile from './pages/Profile';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import SharePage from './pages/SharePage';
import ImageDetails from './components/gallery/ImageDetails';
import BatchProcessor from './components/batch/BatchProcessor';

// Import layout and auth components
import Layout from './components/layout/Layout';
import RequireAuth from './components/auth/RequireAuth';

// For debugging - simple test component
const TestComponent = () => (
  <div style={{ padding: 50, maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
    <h1>Dithering App is Working!</h1>
    <p>If you're seeing this message, the React application has loaded correctly.</p>
    <p>Check the browser console for any additional errors.</p>
    <button 
      onClick={() => alert('UI is responsive!')}
      style={{ 
        padding: '10px 20px', 
        margin: '20px 0', 
        background: '#0ea5e9', 
        color: 'white', 
        border: 'none', 
        borderRadius: '4px', 
        cursor: 'pointer' 
      }}
    >
      Test Interaction
    </button>
  </div>
);

function App() {
  console.log('App component rendering');
  
  return (
    <BrowserRouter>
      <ToastContainer position="top-right" autoClose={3000} />
      
      {/* Debug message */}
      <div style={{ position: 'fixed', bottom: 0, right: 0, background: 'rgba(0,0,0,0.7)', color: 'white', padding: '4px 8px', fontSize: '12px' }}>
        App loaded at: {new Date().toLocaleTimeString()}
      </div>
      
      <Routes>
        <Route path="/" element={<Layout />}>
          {/* Main routes */}
          <Route index element={<Home />} />
          <Route path="editor" element={<Editor />} />
          <Route path="batch" element={<RequireAuth><BatchProcessor /></RequireAuth>} />
          <Route path="gallery">
            <Route path="community" element={<CommunityGallery />} />
            <Route path="my" element={<RequireAuth><MyGallery /></RequireAuth>} />
            <Route path="image/:id" element={<ImageDetails />} />
          </Route>
          <Route path="share" element={<SharePage />} />
          <Route path="profile" element={<RequireAuth><Profile /></RequireAuth>} />
          <Route path="login" element={<Login />} />
          <Route path="signup" element={<Signup />} />
          <Route path="test" element={<TestComponent />} />
        </Route>
        
        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;