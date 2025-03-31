// src/App.tsx
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Import core pages
import Home from './pages/Home';
import Editor from './pages/Editor';
import MyGallery from './pages/MyGallery';
import SharePage from './pages/SharePage';

// Import layout components
import Layout from './components/layout/Layout';

function App() {
  console.log('App component rendering');
  
  return (
    // Use HashRouter instead of BrowserRouter for GitHub Pages compatibility
    <HashRouter>
      <ToastContainer position="top-right" autoClose={3000} />
      
      <Routes>
        <Route path="/" element={<Layout />}>
          {/* Main routes */}
          <Route index element={<Home />} />
          <Route path="editor" element={<Editor />} />
          <Route path="gallery/my" element={<MyGallery />} />
          <Route path="share" element={<SharePage />} />
          
          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

export default App;