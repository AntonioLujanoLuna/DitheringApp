import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Layout from './components/layout/Layout';
import RequireAuth from './components/auth/RequireAuth';

// Pages
import Editor from './pages/Editor';
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import Profile from './pages/Profile';
import CommunityGallery from './pages/CommunityGallery';
import MyGallery from './pages/MyGallery';
import ImageDetails from './components/gallery/ImageDetails';
import SharePage from './pages/SharePage';

function App() {
  return (
    <BrowserRouter>
      <ToastContainer position="top-right" autoClose={3000} />
      <Routes>
        <Route path="/" element={<Layout />}>
          {/* Public routes */}
          <Route index element={<Home />} />
          <Route path="login" element={<Login />} />
          <Route path="signup" element={<Signup />} />
          <Route path="editor" element={<Editor />} />
          <Route path="gallery/community" element={<CommunityGallery />} />
          <Route path="gallery/image/:id" element={<ImageDetails />} />
          <Route path="share" element={<SharePage />} />
          
          {/* Protected routes */}
          <Route path="profile" element={
            <RequireAuth>
              <Profile />
            </RequireAuth>
          } />
          <Route path="gallery/my" element={
            <RequireAuth>
              <MyGallery />
            </RequireAuth>
          } />
          
          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;