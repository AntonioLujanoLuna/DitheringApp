import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useGalleryStore } from '../store/useGalleryStore';
import { usePresetStore } from '../store/usePresetStore';
import { toast } from 'react-toastify';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Tabs, { TabItem } from '../components/ui/Tabs';

const Profile: React.FC = () => {
  const { user, profile, updateProfile, logout, error } = useAuthStore();
  const { myImages } = useGalleryStore();
  const { myPresets } = usePresetStore();
  
  const [username, setUsername] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState('');
  const navigate = useNavigate();
  
  useEffect(() => {
    if (profile?.username) {
      setUsername(profile.username);
    }
  }, [profile]);
  
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);
  
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      await updateProfile({ username: username.trim() || null });
      toast.success('Profile updated successfully');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleLogout = async () => {
    await logout();
    navigate('/');
  };
  
  const handleRequestAccountDeletion = () => {
    if (deleteConfirmInput.toLowerCase() !== 'delete my account') {
      toast.error('Please type "delete my account" to confirm');
      return;
    }
    
    // In a real app, this would connect to a backend endpoint to delete the account
    toast.info('Account deletion request submitted. Our team will process your request within 48 hours.');
    setShowDeleteConfirm(false);
    setDeleteConfirmInput('');
  };
  
  // Define tabs
  const tabs: TabItem[] = [
    {
      id: 'profile',
      label: 'Profile Settings',
      content: (
        <div className="space-y-6">
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              value={user?.email || ''}
              disabled
              helperText="Email cannot be changed"
            />
            
            <Input
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Choose a username"
              helperText="This will be displayed with your shared images"
            />
            
            <div className="pt-2">
              <Button
                type="submit"
                isLoading={isSubmitting}
                disabled={isSubmitting}
              >
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      )
    },
    {
      id: 'account',
      label: 'Account',
      content: (
        <div className="space-y-8">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Account Information</h3>
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Email Address</dt>
                <dd className="mt-1 text-sm text-gray-900">{user?.email}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Username</dt>
                <dd className="mt-1 text-sm text-gray-900">{profile?.username || '(Not set)'}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Member Since</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {user?.created_at 
                    ? new Date(user.created_at).toLocaleDateString() 
                    : 'Unknown'}
                </dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Account Usage</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {myImages.length} Images • {myPresets.length} Presets
                </dd>
              </div>
            </dl>
          </div>
          
          <div className="pt-2 border-t border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Account Actions</h3>
            
            <div className="space-y-4">
              <div>
                <Button 
                  onClick={handleLogout}
                  variant="secondary"
                >
                  Log Out
                </Button>
              </div>
              
              <div className="pt-4 border-t border-gray-200">
                <h4 className="text-sm font-medium text-red-600 mb-2">Danger Zone</h4>
                
                {!showDeleteConfirm ? (
                  <Button 
                    onClick={() => setShowDeleteConfirm(true)}
                    variant="danger"
                  >
                    Delete Account
                  </Button>
                ) : (
                  <div className="space-y-3 p-4 bg-red-50 rounded-md border border-red-200">
                    <p className="text-sm text-red-600">
                      This action is permanent and cannot be undone. All your data, including images and presets, will be deleted.
                    </p>
                    <Input
                      label="Type 'delete my account' to confirm"
                      value={deleteConfirmInput}
                      onChange={(e) => setDeleteConfirmInput(e.target.value)}
                      className="bg-white"
                    />
                    <div className="flex space-x-3">
                      <Button 
                        onClick={handleRequestAccountDeletion}
                        variant="danger"
                        disabled={deleteConfirmInput.toLowerCase() !== 'delete my account'}
                      >
                        Confirm Deletion
                      </Button>
                      <Button 
                        onClick={() => {
                          setShowDeleteConfirm(false);
                          setDeleteConfirmInput('');
                        }}
                        variant="ghost"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'privacy',
      label: 'Privacy',
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Privacy Settings</h3>
            
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="default-public"
                    type="checkbox"
                    className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    defaultChecked
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="default-public" className="font-medium text-gray-700">
                    Make images public by default
                  </label>
                  <p className="text-gray-500">
                    When enabled, new images you create will be shared to the community gallery by default.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="show-profile"
                    type="checkbox"
                    className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    defaultChecked
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="show-profile" className="font-medium text-gray-700">
                    Show username with shared images
                  </label>
                  <p className="text-gray-500">
                    Your username will be displayed alongside your public images.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="analytics"
                    type="checkbox"
                    className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    defaultChecked
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="analytics" className="font-medium text-gray-700">
                    Allow anonymous usage analytics
                  </label>
                  <p className="text-gray-500">
                    Help us improve by allowing collection of anonymous usage data.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="pt-4">
            <Button variant="primary">Save Privacy Settings</Button>
          </div>
          
          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Data & Privacy</h3>
            <p className="text-sm text-gray-600 mb-4">
              We take your privacy seriously. Your data is only used to provide and improve our service.
              You can request a copy of your data or delete your account at any time.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button variant="secondary">Download My Data</Button>
              <Button variant="ghost">Privacy Policy</Button>
            </div>
          </div>
        </div>
      )
    }
  ];
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-primary-600 to-primary-800 px-6 py-8">
          <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0">
            <div className="md:flex-1">
              <h1 className="text-3xl font-bold text-white">Account Settings</h1>
              <p className="text-primary-100 mt-1">
                Manage your profile, privacy, and account information
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-white">
              <span className="text-sm">Status:</span>{' '}
              <span className="font-medium">Active Account</span>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          <Tabs tabs={tabs} variant="underline" />
        </div>
      </div>
    </div>
  );
};

export default Profile;