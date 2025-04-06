import { useState, useEffect, useRef } from 'react';
import { getProfile, updateProfile, changePassword, deleteAccount, uploadProfileImage } from '../services/api';

interface User {
  id: number;
  username: string;
  email: string;
  full_name?: string;
  bio?: string;
  profile_image?: string;
  phone?: string;
  location?: string;
}

const SettingsPage = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  
  // Form states
  const [profileForm, setProfileForm] = useState({
    fullName: '',
    username: '',
    email: '',
    bio: '',
    phone: '',
    location: ''
  });
  
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    eventReminders: true,
    messageAlerts: true,
    weeklyDigest: false,
    marketingEmails: false
  });
  
  const [privacySettings, setPrivacySettings] = useState({
    publicProfile: true,
    showLastSeen: true,
    shareActivity: true,
    allowTagging: true
  });
  
  // Password change state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
  
  // Delete account state
  const [deleteForm, setDeleteForm] = useState({
    password: ''
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  
  // Payment methods
  const paymentMethods = [
    {
      id: 1,
      type: 'visa',
      lastFour: '4242',
      expiry: '09/25',
      isDefault: true
    },
    {
      id: 2,
      type: 'mastercard',
      lastFour: '5678',
      expiry: '12/24',
      isDefault: false
    }
  ];
  
  // Transaction history
  const transactions = [
    {
      id: 1,
      date: '2023-04-15',
      description: 'Tennis Coaching Session',
      amount: 45.00,
      status: 'completed'
    },
    {
      id: 2,
      date: '2023-04-10',
      description: 'Basketball Court Booking',
      amount: 30.00,
      status: 'completed'
    },
    {
      id: 3,
      date: '2023-04-05',
      description: 'Premium Membership Fee',
      amount: 19.99,
      status: 'completed'
    },
    {
      id: 4,
      date: '2023-03-28',
      description: 'Equipment Purchase',
      amount: 87.50,
      status: 'completed'
    }
  ];
  
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Fetch user data when component mounts
  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      try {
        const response = await getProfile();
        const userData = response.data.user;
        setUser(userData);
        
        // Initialize form with user data
        setProfileForm({
          fullName: userData.full_name || '',
          username: userData.username || '',
          email: userData.email || '',
          bio: userData.bio || '',
          phone: '',
          location: ''
        });
        
        // Note: In a real app, we would also fetch notification and privacy settings
        // from the backend here. For now, we'll keep the default values.
        
      } catch (error) {
        console.error('Error fetching user data:', error);
        // Show error message (without toast)
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserData();
  }, []);
  
  // Form handlers
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileForm({
      ...profileForm,
      [name]: value
    });
  };
  
  const handleToggleChange = (setting: string, section: string) => {
    if (section === 'notifications') {
      setNotificationSettings({
        ...notificationSettings,
        [setting]: !notificationSettings[setting as keyof typeof notificationSettings]
      });
    } else if (section === 'privacy') {
      setPrivacySettings({
        ...privacySettings,
        [setting]: !privacySettings[setting as keyof typeof privacySettings]
      });
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    
    try {
      // Prepare data for API call
      const profileData = {
        full_name: profileForm.fullName,
        bio: profileForm.bio,
        // Note: In a real app, we might also update other fields like location and phone
        // if they were part of the user schema
      };
      
      // Update profile via API
      const response = await updateProfile(profileData);
      
      // Update local user state with response data
      if (response.data && response.data.user) {
        setUser(response.data.user);
        // Show success message (without toast)
        alert('Profile updated successfully');
      }
      
      // Note: In a real app, we would also submit notification and privacy settings
      // to the backend here.
      console.log('Form submitted:', { profileForm, notificationSettings, privacySettings });
      
    } catch (error) {
      console.error('Error updating profile:', error);
      // Show error message (without toast)
      alert('Failed to update profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };
  
  // Handle password form input changes
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm({
      ...passwordForm,
      [name]: value
    });
  };
  
  // Handle delete form input changes
  const handleDeleteFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDeleteForm({
      ...deleteForm,
      [name]: value
    });
  };
  
  // Submit password change
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      setPasswordError('All fields are required');
      return;
    }
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    
    if (passwordForm.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }
    
    setPasswordError('');
    setIsSubmittingPassword(true);
    
    try {
      await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      
      // Reset the form
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      alert('Password changed successfully');
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      if (axiosError.response?.data?.message) {
        setPasswordError(axiosError.response.data.message);
      } else {
        setPasswordError('Failed to change password');
      }
    } finally {
      setIsSubmittingPassword(false);
    }
  };
  
  // Submit account deletion
  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!deleteForm.password) {
      setDeleteError('Password is required to delete your account');
      return;
    }
    
    // Confirm deletion
    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone and will remove all your data.'
    );
    
    if (!confirmed) return;
    
    setDeleteError('');
    setIsDeletingAccount(true);
    
    try {
      await deleteAccount({
        password: deleteForm.password
      });
      
      // Log out the user
      localStorage.removeItem('token');
      window.location.href = '/login';
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      if (axiosError.response?.data?.message) {
        setDeleteError(axiosError.response.data.message);
      } else {
        setDeleteError('Failed to delete account');
      }
    } finally {
      setIsDeletingAccount(false);
    }
  };
  
  // Handle file selection for profile image upload
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }
    
    const file = e.target.files[0];
    handleFileUpload(file);
  };
  
  // Upload profile image
  const handleFileUpload = async (file: File) => {
    if (!file) return;
    
    try {
      setUploadingImage(true);
      
      const response = await uploadProfileImage(file);
      
      if (response.data && response.data.user) {
        setUser(response.data.user);
        alert('Profile picture updated successfully');
      }
    } catch (error) {
      console.error('Error uploading profile image:', error);
      alert('Failed to upload profile image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };
  
  // Trigger file input click
  const handleOpenFileDialog = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Remove profile image
  const handleRemoveProfileImage = async () => {
    try {
      const response = await updateProfile({
        profile_image: ''
      });
      
      if (response.data && response.data.user) {
        setUser(response.data.user);
        alert('Profile picture removed successfully');
      }
    } catch (error) {
      console.error('Error removing profile image:', error);
      alert('Failed to remove profile image. Please try again.');
    }
  };
  
  // Show loading state while fetching user data
  if (isLoading) {
    return (
      <div className="bg-gray-50 min-h-screen p-4 md:p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-3 text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-gray-50 min-h-screen p-4 md:p-8">
      {/* Hidden file input for profile image upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*"
        className="hidden"
      />
      
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm mb-6 p-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Settings</h1>
          <p className="text-gray-600 mt-1">Manage your account settings and preferences</p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar */}
          <div className="w-full md:w-64 shrink-0">
            <div className="bg-white rounded-xl shadow-sm p-4">
              <nav className="flex flex-col space-y-1">
                {[
                  { id: 'profile', label: 'Profile Settings', icon: '👤' },
                  { id: 'notifications', label: 'Notifications', icon: '🔔' },
                  { id: 'privacy', label: 'Privacy', icon: '🔒' },
                  { id: 'payment', label: 'Payment Methods', icon: '💳' },
                  { id: 'billing', label: 'Billing History', icon: '📃' },
                  { id: 'account', label: 'Account', icon: '⚙️' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="mr-3">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>
          
          {/* Main content */}
          <div className="flex-1">
            <div className="bg-white rounded-xl shadow-sm p-6">
              {activeTab === 'profile' && (
                <div>
                  <h2 className="text-xl font-bold text-gray-800 mb-1">Profile Settings</h2>
                  <p className="text-gray-600 mb-6">Update your personal information and profile details</p>
                  
                  <form className="space-y-6" onSubmit={handleSubmit}>
                    <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-gray-200">
                      <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-100">
                        {uploadingImage ? (
                          <div className="absolute inset-0 flex items-center justify-center bg-gray-200 bg-opacity-70">
                            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        ) : (
                          <>
                            <img
                              src={user?.profile_image || "https://i.pravatar.cc/150?u=alex"}
                              alt="Profile"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all flex items-center justify-center opacity-0 hover:opacity-100">
                              <button 
                                type="button" 
                                className="bg-white rounded-full p-2 shadow-md"
                                onClick={handleOpenFileDialog}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                      <div className="space-y-2">
                        <h3 className="font-medium text-gray-900">Profile Picture</h3>
                        <div className="flex space-x-3">
                          <button
                            type="button"
                            className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            onClick={handleOpenFileDialog}
                          >
                            Change Photo
                          </button>
                          <button
                            type="button"
                            className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none"
                            onClick={handleRemoveProfileImage}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                          Full Name
                        </label>
                        <input
                          type="text"
                          id="fullName"
                          name="fullName"
                          value={profileForm.fullName}
                          onChange={handleProfileChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                          Username
                        </label>
                        <input
                          type="text"
                          id="username"
                          name="username"
                          value={profileForm.username}
                          onChange={handleProfileChange}
                          disabled // Username usually shouldn't be changed easily
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                          Email Address
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={profileForm.email}
                          onChange={handleProfileChange}
                          disabled // Email usually requires verification to change
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          value={profileForm.phone}
                          onChange={handleProfileChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      
                      <div className="md:col-span-2">
                        <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                          Location
                        </label>
                        <input
                          type="text"
                          id="location"
                          name="location"
                          value={profileForm.location}
                          onChange={handleProfileChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      
                      <div className="md:col-span-2">
                        <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                          Bio
                        </label>
                        <textarea
                          id="bio"
                          name="bio"
                          rows={4}
                          value={profileForm.bio}
                          onChange={handleProfileChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        ></textarea>
                        <p className="mt-1 text-sm text-gray-500">Brief description for your profile</p>
                      </div>
                    </div>
                    
                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                      <button
                        type="button"
                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      >
                        {isSubmitting ? (
                          <>
                            <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Updating...
                          </>
                        ) : (
                          'Save Changes'
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}
              
              {activeTab === 'notifications' && (
                <div>
                  <h2 className="text-xl font-bold text-gray-800 mb-1">Notification Settings</h2>
                  <p className="text-gray-600 mb-6">Manage how you receive notifications and alerts</p>
                  
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-900 pb-2 border-b border-gray-200">
                        Email Notifications
                      </h3>
                      
                      {[
                        {
                          id: 'emailNotifications',
                          name: 'Email Notifications',
                          description: 'Receive email notifications for important updates',
                          checked: notificationSettings.emailNotifications
                        },
                        {
                          id: 'weeklyDigest',
                          name: 'Weekly Digest',
                          description: 'Receive a weekly summary of your activity',
                          checked: notificationSettings.weeklyDigest
                        },
                        {
                          id: 'marketingEmails',
                          name: 'Marketing Emails',
                          description: 'Receive promotional offers and updates',
                          checked: notificationSettings.marketingEmails
                        }
                      ].map((item) => (
                        <div key={item.id} className="flex items-center justify-between py-4 transition-colors hover:bg-gray-50 px-3 -mx-3 rounded-lg">
                          <div className="pr-6">
                            <h4 className="text-sm font-medium text-gray-900">{item.name}</h4>
                            <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                          </div>
                          <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                            <input
                              type="checkbox"
                              id={item.id}
                              checked={item.checked}
                              onChange={() => handleToggleChange(item.id, 'notifications')}
                              className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 border-gray-300 appearance-none cursor-pointer transition-transform duration-200 ease-in-out"
                              style={{ 
                                transform: item.checked ? 'translateX(100%)' : 'translateX(0)',
                                borderColor: item.checked ? '#3B82F6' : '#D1D5DB',
                              }}
                            />
                            <label
                              htmlFor={item.id}
                              className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${
                                item.checked ? 'bg-blue-500' : 'bg-gray-300'
                              }`}
                            ></label>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-900 pb-2 border-b border-gray-200">
                        Push Notifications
                      </h3>
                      
                      {[
                        {
                          id: 'pushNotifications',
                          name: 'Push Notifications',
                          description: 'Receive notifications on your device',
                          checked: notificationSettings.pushNotifications
                        },
                        {
                          id: 'eventReminders',
                          name: 'Event Reminders',
                          description: 'Get reminded about upcoming events',
                          checked: notificationSettings.eventReminders
                        },
                        {
                          id: 'messageAlerts',
                          name: 'Message Alerts',
                          description: 'Get notified about new messages',
                          checked: notificationSettings.messageAlerts
                        }
                      ].map((item) => (
                        <div key={item.id} className="flex items-center justify-between py-4 transition-colors hover:bg-gray-50 px-3 -mx-3 rounded-lg">
                          <div className="pr-6">
                            <h4 className="text-sm font-medium text-gray-900">{item.name}</h4>
                            <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                          </div>
                          <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                            <input
                              type="checkbox"
                              id={item.id}
                              checked={item.checked}
                              onChange={() => handleToggleChange(item.id, 'notifications')}
                              className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 border-gray-300 appearance-none cursor-pointer transition-transform duration-200 ease-in-out"
                              style={{ 
                                transform: item.checked ? 'translateX(100%)' : 'translateX(0)',
                                borderColor: item.checked ? '#3B82F6' : '#D1D5DB',
                              }}
                            />
                            <label
                              htmlFor={item.id}
                              className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${
                                item.checked ? 'bg-blue-500' : 'bg-gray-300'
                              }`}
                            ></label>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                      <button
                        type="button"
                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      >
                        Reset to Default
                      </button>
                      <button
                        type="button"
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {activeTab === 'privacy' && (
                <div>
                  <h2 className="text-xl font-bold text-gray-800 mb-1">Privacy Settings</h2>
                  <p className="text-gray-600 mb-6">Control your privacy and visibility preferences</p>
                  
                  <div className="space-y-6">
                    {[
                      {
                        id: 'publicProfile',
                        name: 'Public Profile',
                        description: 'Allow others to view your profile information',
                        checked: privacySettings.publicProfile
                      },
                      {
                        id: 'showLastSeen',
                        name: 'Show Last Seen',
                        description: 'Allow others to see when you were last active',
                        checked: privacySettings.showLastSeen
                      },
                      {
                        id: 'shareActivity',
                        name: 'Share Activity',
                        description: 'Share your sports activities with your connections',
                        checked: privacySettings.shareActivity
                      },
                      {
                        id: 'allowTagging',
                        name: 'Allow Tagging',
                        description: 'Allow others to tag you in photos and posts',
                        checked: privacySettings.allowTagging
                      }
                    ].map((item) => (
                      <div 
                        key={item.id} 
                        className="flex items-center justify-between py-4 px-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="pr-6">
                          <h4 className="text-sm font-medium text-gray-900">{item.name}</h4>
                          <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                        </div>
                        <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                          <input
                            type="checkbox"
                            id={item.id}
                            checked={item.checked}
                            onChange={() => handleToggleChange(item.id, 'privacy')}
                            className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 border-gray-300 appearance-none cursor-pointer transition-transform duration-200 ease-in-out"
                            style={{ 
                              transform: item.checked ? 'translateX(100%)' : 'translateX(0)',
                              borderColor: item.checked ? '#3B82F6' : '#D1D5DB',
                            }}
                          />
                          <label
                            htmlFor={item.id}
                            className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${
                              item.checked ? 'bg-blue-500' : 'bg-gray-300'
                            }`}
                          ></label>
                        </div>
                      </div>
                    ))}
                    
                    <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <h3 className="text-sm font-medium text-gray-900 mb-2">Privacy Policy</h3>
                      <p className="text-sm text-gray-500 mb-4">
                        By using our platform, you agree to our privacy policy which outlines how your data is collected, used, and protected.
                      </p>
                      <a 
                        href="#" 
                        className="text-sm font-medium text-blue-600 hover:text-blue-800"
                      >
                        Read our full Privacy Policy
                      </a>
                    </div>
                    
                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                      <button
                        type="button"
                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      >
                        Reset to Default
                      </button>
                      <button
                        type="button"
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {activeTab === 'payment' && (
                <div>
                  <h2 className="text-xl font-bold text-gray-800 mb-1">Payment Methods</h2>
                  <p className="text-gray-600 mb-6">Manage your payment methods and preferences</p>
                  
                  <div className="space-y-6">
                    {paymentMethods.map(method => (
                      <div 
                        key={method.id} 
                        className={`border rounded-lg overflow-hidden ${
                          method.isDefault ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-center p-4">
                          <div className="w-12 h-8 mr-4 flex items-center justify-center">
                            {method.type === 'visa' ? (
                              <svg className="w-12 h-8" viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect width="48" height="32" rx="4" fill="#2566AF"/>
                                <path d="M18.5 21.9H15L17.1 10.1H20.6L18.5 21.9Z" fill="white"/>
                                <path d="M30.4 10.4C29.7 10.1 28.6 9.8 27.3 9.8C24.3 9.8 22.1 11.4 22.1 13.7C22.1 15.5 23.7 16.5 24.9 17.1C26.1 17.7 26.5 18.1 26.5 18.6C26.5 19.4 25.5 19.8 24.6 19.8C23.4 19.8 22.7 19.6 21.6 19.1L21.1 18.9L20.6 21.7C21.4 22.1 22.9 22.4 24.4 22.4C27.6 22.4 29.7 20.8 29.7 18.3C29.7 16.9 28.9 15.8 27 14.9C25.8 14.3 25.1 13.9 25.1 13.3C25.1 12.8 25.7 12.3 26.9 12.3C27.9 12.3 28.6 12.5 29.2 12.8L29.6 13L30.4 10.4Z" fill="white"/>
                                <path d="M34.9 17.8C35.2 17 36.1 14.7 36.1 14.7C36.1 14.7 36.3 14.1 36.5 13.7L36.7 14.5C36.7 14.5 37.2 17.1 37.4 17.8H34.9ZM39.2 10.1H36.6C35.8 10.1 35.2 10.3 34.8 11.1L30.1 21.9H33.3C33.3 21.9 33.8 20.5 33.9 20.2C34.3 20.2 37.4 20.2 37.9 20.2C38 20.6 38.3 21.9 38.3 21.9H41.1L39.2 10.1Z" fill="white"/>
                                <path d="M14.4 10.1L11.4 18.1L11.1 16.8C10.5 15 8.9 13 7.1 12L9.8 21.9H13L17.7 10.1H14.4Z" fill="white"/>
                                <path d="M8.8 10.1H3.8L3.7 10.4C7.4 11.2 9.8 13.7 10.7 16.8L9.5 11.1C9.3 10.4 9.1 10.2 8.8 10.1Z" fill="#FAA61A"/>
                              </svg>
                            ) : (
                              <svg className="w-12 h-8" viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect width="48" height="32" rx="4" fill="#16366F"/>
                                <path d="M33.4 16C33.4 19.9 30.3 23 26.4 23C22.5 23 19.4 19.9 19.4 16C19.4 12.1 22.5 9 26.4 9C30.3 9 33.4 12.1 33.4 16Z" fill="#D9222A"/>
                                <path d="M28.6 16C28.6 17.8 27.1 19.3 25.3 19.3C23.5 19.3 22 17.8 22 16C22 14.2 23.5 12.7 25.3 12.7C27.1 12.7 28.6 14.2 28.6 16Z" fill="#EE9F2D"/>
                                <path d="M13.4 9L13.9 11.5H12.1L13.4 9Z" fill="#D9222A"/>
                                <path d="M36.4 9L35.9 11.5H37.7L36.4 9Z" fill="#D9222A"/>
                                <path d="M39.4 21.9L35.8 9H33.4C32.6 9 32 9.4 31.7 10.1L25.3 21.9H28.5L29.4 19.6H34.3L34.7 21.9H39.4ZM30.5 17.1L32.3 12.5L33.3 17.1H30.5Z" fill="white"/>
                                <path d="M24.4 9L20 21.9H17L21.4 9H24.4Z" fill="white"/>
                                <path d="M29.5 9L26.7 17.6L26.5 16.5C25.9 14.7 24.1 12.8 22.1 11.8L24.6 21.9H27.8L32.7 9H29.5Z" fill="white"/>
                                <path d="M19.5 11.2C19.4 10.9 19.2 10.7 18.8 10.6C17.9 10.3 16.2 10.2 14.3 11.2L14.2 11.3C14.2 11.3 14.5 9.7 16.6 9.1C18.8 8.5 20.3 9.3 20.4 9.7C20.5 10 20 11.1 19.5 11.2Z" fill="#D9222A"/>
                                <path d="M9.6 21.9L9.5 21.7C12.9 20.3 14.8 17.5 15.6 15.3L14.6 10.3C14.6 10.3 14.4 9.2 15.3 9L18.8 9C18.6 12.4 17.1 18.1 9.6 21.9Z" fill="white"/>
                              </svg>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">•••• •••• •••• {method.lastFour}</div>
                            <div className="text-xs text-gray-500">Expires {method.expiry}</div>
                          </div>
                          {method.isDefault && (
                            <div className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-md">
                              Default
                            </div>
                          )}
                        </div>
                        <div className="flex items-center justify-end gap-2 bg-gray-50 p-3 border-t border-gray-200">
                          {!method.isDefault && (
                            <button className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                              Make Default
                            </button>
                          )}
                          <button className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                            Edit
                          </button>
                          <button className="px-3 py-1.5 text-xs font-medium text-red-600 hover:text-red-800 focus:outline-none">
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                    
                    <div className="mt-6 text-center">
                      <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        <svg className="mr-2 -ml-1 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        Add New Payment Method
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {activeTab === 'billing' && (
                <div>
                  <h2 className="text-xl font-bold text-gray-800 mb-1">Billing History</h2>
                  <p className="text-gray-600 mb-6">View your transaction history and download invoices</p>
                  
                  <div className="overflow-hidden border border-gray-200 rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Description
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Amount
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th scope="col" className="relative px-6 py-3">
                            <span className="sr-only">Action</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {transactions.map(transaction => (
                          <tr key={transaction.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatDate(transaction.date)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {transaction.description}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              ${transaction.amount.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                transaction.status === 'completed' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {transaction.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button className="text-blue-600 hover:text-blue-900 focus:outline-none">
                                Receipt
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="flex items-center justify-between mt-6">
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-gray-700">
                        Showing <span className="font-medium">1</span> to <span className="font-medium">{transactions.length}</span> of{' '}
                        <span className="font-medium">{transactions.length}</span> transactions
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        disabled
                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-400 bg-gray-100"
                      >
                        Previous
                      </button>
                      <button
                        disabled
                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-400 bg-gray-100"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {activeTab === 'account' && (
                <div>
                  <h2 className="text-xl font-bold text-gray-800 mb-1">Account Settings</h2>
                  <p className="text-gray-600 mb-6">Manage your account and security preferences</p>
                  
                  <div className="space-y-6">
                    <div className="bg-white p-6 border border-gray-200 rounded-lg">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Security</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button 
                          className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          onClick={() => setShowPasswordModal(true)}
                        >
                          <svg className="h-5 w-5 mr-2 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 12a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                            <path fillRule="evenodd" d="M10 2a8 8 0 00-8 8v1a6 6 0 0012 0v-1a8 8 0 00-4-7z" clipRule="evenodd" />
                          </svg>
                          Change Password
                        </button>
                        <button className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                          <svg className="h-5 w-5 mr-2 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v-1l1-1 1-1-.257-.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z" clipRule="evenodd" />
                          </svg>
                          Two-Factor Authentication
                        </button>
                      </div>
                    </div>
                    
                    <div className="bg-white p-6 border border-gray-200 rounded-lg">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Account Information</h3>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-500">Username</p>
                          <p className="font-medium">{user?.username}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Email</p>
                          <p className="font-medium">{user?.email}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Account Type</p>
                          <p className="font-medium">Standard</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Account ID</p>
                          <p className="font-medium">{user?.id}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white p-6 border border-gray-200 rounded-lg">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Connected Accounts</h3>
                      <button className="flex items-center justify-center w-full px-4 py-3 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        <svg className="h-5 w-5 mr-2 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        Connect Account
                      </button>
                    </div>
                    
                    <div className="bg-red-50 p-6 border border-red-100 rounded-lg">
                      <h3 className="text-lg font-medium text-red-800 mb-2">Danger Zone</h3>
                      <p className="text-sm text-red-600 mb-4">These actions are permanent and cannot be undone</p>
                      <div className="space-y-3">
                        <button className="flex items-center justify-center w-full px-4 py-3 border border-red-300 rounded-md text-sm font-medium text-red-700 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                          Deactivate Account
                        </button>
                        <button 
                          onClick={() => setShowDeleteModal(true)}
                          className="flex items-center justify-center w-full px-4 py-3 bg-red-600 border border-red-600 rounded-md text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          Delete Account
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* For now, just showing placeholders for other tabs */}
              {activeTab !== 'profile' && activeTab !== 'notifications' && activeTab !== 'privacy' && activeTab !== 'payment' && activeTab !== 'billing' && activeTab !== 'account' && (
                <div className="text-center py-12 text-gray-500">
                  Loading {activeTab} tab...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Change Password</h3>
              <button 
                onClick={() => setShowPasswordModal(false)}
                className="text-gray-500 hover:text-gray-800"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handlePasswordSubmit}>
              {passwordError && (
                <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-md">
                  {passwordError}
                </div>
              )}
              
              <div className="mb-4">
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  id="currentPassword"
                  name="currentPassword"
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="flex justify-end space-x-3 mt-5">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  {isSubmittingPassword ? (
                    <span className="hidden">Password being updated...</span>
                  ) : (
                    'Change Password'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-red-700">Delete Account</h3>
              <button 
                onClick={() => setShowDeleteModal(false)}
                className="text-gray-500 hover:text-gray-800"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-gray-800 mb-4">
                This action is permanent and will delete all your data, including events, comments, and personal information.
              </p>
              <p className="text-red-600 font-semibold mb-4">
                This action cannot be undone.
              </p>
            </div>
            
            <form onSubmit={handleDeleteAccount}>
              {deleteError && (
                <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-md">
                  {deleteError}
                </div>
              )}
              
              <div className="mb-4">
                <label htmlFor="deleteAccountPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Enter your password to confirm
                </label>
                <input
                  type="password"
                  id="deleteAccountPassword"
                  name="password"
                  value={deleteForm.password}
                  onChange={handleDeleteFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                />
              </div>
              
              <div className="flex justify-end space-x-3 mt-5">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  {isDeletingAccount ? (
                    <span className="hidden">Account being deleted...</span>
                  ) : (
                    'Delete Account'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage; 