import { useState, useContext, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { NotificationContext } from '../context/NotificationContext';
import { formatImageUrl } from '../utils/imageUtils';

interface TopNavbarProps {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
}

// Type for the User object
interface User {
  id?: string;
  username?: string;
  name?: string;
  email?: string;
  avatar?: string;
  profile_image?: string;
}

const TopNavbar = ({ sidebarCollapsed, toggleSidebar }: TopNavbarProps) => {
  const { user, logout } = useContext(AuthContext);
  const { unreadCount } = useContext(NotificationContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  
  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
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
    <div className={`navbar ${scrolled ? 'shadow-md bg-white/95 backdrop-blur-md' : 'bg-white'} transition-all duration-300 ease-in-out`}>
      <div className="navbar-title flex items-center">
        <button 
          className="sidebar-toggle-btn mr-3 hover:bg-gray-100 p-2 rounded-lg transition-all duration-300 ease-in-out hover:rotate-180"
          onClick={toggleSidebar}
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {sidebarCollapsed ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          )}
        </button>
        <h1 className="text-xl font-semibold relative group">
          {getPageTitle()}
          <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-secondary group-hover:w-full transition-all duration-500 ease-in-out"></div>
        </h1>
      </div>
      
      <div className="navbar-actions flex items-center">
        {user && (
          <>
            <Link to="/events/create" className="create-event-btn mr-4 flex items-center bg-gradient-to-r from-gray-900 to-gray-700 hover:from-black hover:to-gray-800 text-white py-2 px-3 rounded-lg text-sm transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline-block">Create Event</span>
            </Link>
            <Link to="/notifications" className="notification-icon relative mr-2 group">
              <div className="relative p-2 rounded-full hover:bg-gray-100 transition-all duration-300 ease-in-out">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600 group-hover:text-primary transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="notification-badge flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="absolute right-0 top-full mt-1 w-64 bg-white rounded-lg shadow-lg py-2 z-40 hidden group-hover:block transform origin-top scale-95 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-200 ease-in-out border border-gray-100">
                <div className="px-4 py-2 border-b border-gray-100 mb-2">
                  <h3 className="font-medium text-sm">Notifications</h3>
                  {unreadCount > 0 && (
                    <p className="text-xs text-gray-500">You have {unreadCount} unread notifications</p>
                  )}
                </div>
                <Link to="/notifications" className="block w-full text-center text-sm text-primary py-1 hover:bg-gray-50 transition-colors">
                  View all notifications
                </Link>
              </div>
            </Link>
          </>
        )}
        
        <div className="relative" ref={profileMenuRef}>
          <button 
            className="profile-button group flex items-center px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-all duration-300 ease-in-out"
            onClick={toggleProfileMenu}
            aria-expanded={profileMenuOpen}
            aria-haspopup="true"
          >
            {user ? (
              <img 
                src={(user as User)?.avatar || ((user as User)?.profile_image ? formatImageUrl((user as User)?.profile_image as string) : defaultAvatar)} 
                alt={(user as User)?.name || (user as User)?.username || 'User'} 
                className="profile-avatar ring-2 ring-offset-2 ring-primary/50 group-hover:ring-primary transition-all duration-300"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 overflow-hidden">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
            )}
            <span className="hidden sm:inline-block ml-2 font-medium text-text-dark text-sm group-hover:text-primary transition-colors duration-300">
              {(user as User)?.name || (user as User)?.username || 'User'}
            </span>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className={`h-4 w-4 ml-1 text-gray-400 transition-transform duration-300 ${profileMenuOpen ? 'rotate-180' : ''}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {profileMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-50 py-1 border border-gray-200 animate-fadeIn">
              {user && (
                <>
                  <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors duration-200 flex items-center" onClick={() => setProfileMenuOpen(false)}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                    Your Profile
                  </Link>
                  <Link to="/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors duration-200 flex items-center" onClick={() => setProfileMenuOpen(false)}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                    </svg>
                    Settings
                  </Link>
                  <Link to="/notifications" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors duration-200 flex items-center" onClick={() => setProfileMenuOpen(false)}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                    </svg>
                    Notifications
                    {unreadCount > 0 && (
                      <span className="ml-2 inline-flex items-center justify-center h-5 w-5 rounded-full bg-primary text-white text-xs">
                        {unreadCount}
                      </span>
                    )}
                  </Link>
                  <div className="border-t border-gray-100 my-1"></div>
                  <button 
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-error transition-colors duration-200 flex items-center"
                    onClick={handleLogout}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V7.414l-5-5H3zM8.293 12.707a1 1 0 001.414 0L11 11.414V15a1 1 0 102 0v-3.586l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 000 1.414z" clipRule="evenodd" />
                    </svg>
                    Sign out
                  </button>
                </>
              )}
              {!user && (
                <>
                  <Link to="/login" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors duration-200 flex items-center" onClick={() => setProfileMenuOpen(false)}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 3a1 1 0 011 1v12a1 1 0 01-1 1h12a1 1 0 001-1V7.414l-5-5H3zm5 6a1 1 0 10-2 0v6a1 1 0 102 0V9zm6 0a1 1 0 10-2 0v6a1 1 0 102 0V9z" clipRule="evenodd" />
                    </svg>
                    Log In
                  </Link>
                  <Link to="/register" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors duration-200 flex items-center" onClick={() => setProfileMenuOpen(false)}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                    </svg>
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