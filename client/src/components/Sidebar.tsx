import { Link, useLocation } from 'react-router-dom';
import { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { 
  HomeIcon, 
  CalendarIcon, 
  UserGroupIcon, 
  ChatBubbleLeftRightIcon, 
  UserIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  BellIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';

interface SidebarProps {
  collapsed: boolean;
  toggleSidebar: () => void;
}

const Sidebar = ({ collapsed, toggleSidebar }: SidebarProps) => {
  const location = useLocation();
  const { user } = useContext(AuthContext);

  // Navigation items for non-authenticated users
  const publicNavItems = [
    { path: '/', icon: HomeIcon, label: 'Home' },
    { path: '/events', icon: CalendarIcon, label: 'Events' },
    // { path: '/teams', icon: UserGroupIcon, label: 'Teams' },
    // { path: '/chat', icon: ChatBubbleLeftRightIcon, label: 'Chat' },
  ];

  // Additional navigation items for authenticated users
  const privateNavItems = [
    { path: '/dashboard', icon: HomeIcon, label: 'Dashboard' },
    { path: '/messages', icon: ChatBubbleLeftRightIcon, label: 'Messages' },
    { path: '/members', icon: UserGroupIcon, label: 'Members' },
    { path: '/notifications', icon: BellIcon, label: 'Notifications' },
    { path: '/profile', icon: UserIcon, label: 'Profile' },
    { path: '/settings', icon: Cog6ToothIcon, label: 'Settings' },
  ];

  return (
    <div className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <div className="sidebar-logo">
        <div className="sidebar-logo-text">KickMates</div>
      </div>
      
      <nav className="sidebar-nav">
        {/* Always show public navigation items */}
        {publicNavItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`sidebar-nav-item ${location.pathname === item.path ? 'active' : ''}`}
          >
            <item.icon className="sidebar-nav-icon" />
            <span className="sidebar-nav-text">{item.label}</span>
            {collapsed && (
              <div className="tooltip">
                {item.label}
              </div>
            )}
          </Link>
        ))}

        {/* Show private navigation items only for authenticated users */}
        {user && privateNavItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`sidebar-nav-item ${location.pathname === item.path ? 'active' : ''}`}
          >
            <item.icon className="sidebar-nav-icon" />
            <span className="sidebar-nav-text">{item.label}</span>
            {collapsed && (
              <div className="tooltip">
                {item.label}
              </div>
            )}
          </Link>
        ))}
      </nav>

      <div className="sidebar-toggle">
        <button 
          onClick={toggleSidebar}
          className="sidebar-toggle-btn"
        >
          {collapsed ? (
            <ArrowRightIcon className="h-5 w-5" />
          ) : (
            <ArrowLeftIcon className="h-5 w-5" />
          )}
        </button>
      </div>
    </div>
  );
};

export default Sidebar; 