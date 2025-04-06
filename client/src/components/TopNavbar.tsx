import { useState, useContext, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { NotificationContext } from '../context/NotificationContext';

interface TopNavbarProps {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
}

interface User {
  id: number;
  username: string;
  name?: string;
  email: string;
  avatar?: string;
  profile_image?: string;
}

const TopNavbar = ({ sidebarCollapsed, toggleSidebar }: TopNavbarProps) => {
  const { user, logout } = useContext(AuthContext);
  const { unreadCount } = useContext(NotificationContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  
  // Get the page title based on the current route
  const getPageTitle = () => {
    const path = location.pathname;
    
    if (path === '/') return 'Home';
    if (path.startsWith('/events') && path.length > 7) return 'Event Details';
    if (path.startsWith('/events')) return 'Events';
    if (path === '/dashboard') return 'Dashboard';
    if (path === '/messages') return 'Messages';
    if (path === '/notifications') return 'Notifications';
    if (path === '/profile') return 'Profile';
    if (path === '/settings') return 'Settings';
    
    // Default title
    return 'KickMates';
  };
  
  // Toggle profile dropdown menu
  const toggleProfileMenu = () => {
    setProfileMenuOpen(!profileMenuOpen);
  };
  
  // Handle logout
  const handleLogout = () => {
    logout();
    setProfileMenuOpen(false);
    navigate('/login');
  };
  
  // Default avatar if user doesn't have one
  const defaultAvatar = 'https://i.pravatar.cc/150?img=68';
  
  return (
    <div className="navbar">
      <div className="navbar-title flex items-center">
        <button 
          className="sidebar-toggle-btn mr-3 hover:bg-gray-100 p-2 rounded-lg"
          onClick={toggleSidebar}
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {sidebarCollapsed ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          )}
        </button>
        {getPageTitle()}
      </div>
      
      <div className="navbar-actions">
        {user && (
          <Link to="/notifications" className="notification-icon">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount}</span>
            )}
          </Link>
        )}
        
        <div className="relative">
          <button className="profile-button" onClick={toggleProfileMenu}>
            <img 
              src={(user as User)?.avatar || (user as User)?.profile_image || defaultAvatar} 
              alt={(user as User)?.name || (user as User)?.username || 'User'} 
              className="profile-avatar"
            />
            <span className="hidden sm:inline-block">{(user as User)?.name || (user as User)?.username || 'User'}</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {profileMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-50 py-1 border border-gray-200">
              {user && (
                <>
                  <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => setProfileMenuOpen(false)}>
                    Your Profile
                  </Link>
                  <Link to="/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => setProfileMenuOpen(false)}>
                    Settings
                  </Link>
                  <Link to="/notifications" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => setProfileMenuOpen(false)}>
                    Notifications
                    {unreadCount > 0 && (
                      <span className="ml-2 inline-flex items-center justify-center h-5 w-5 rounded-full bg-primary text-white text-xs">
                        {unreadCount}
                      </span>
                    )}
                  </Link>
                  <div className="border-t border-gray-100 my-1"></div>
                  <button 
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={handleLogout}
                  >
                    Sign out
                  </button>
                </>
              )}
              {!user && (
                <>
                  <Link to="/login" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => setProfileMenuOpen(false)}>
                    Log In
                  </Link>
                  <Link to="/register" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => setProfileMenuOpen(false)}>
                    Register
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TopNavbar; 