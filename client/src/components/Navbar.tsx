import { useContext, useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  // Track scroll position for navbar effects
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  // Check if link is active
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className={`${scrolled ? 'bg-white/95 backdrop-blur-md shadow-lg' : 'bg-white'} 
      w-full md:w-64 md:min-h-screen transition-all duration-300 ease-in-out border-r border-gray-100 z-30`}>
      <div className="px-4 py-5 md:py-8 flex flex-col h-full">
        <div className="flex items-center justify-between md:justify-center mb-6 relative">
          <Link to="/" className="text-2xl font-bold group flex items-center">
            <span className="text-primary bg-clip-text transition-all duration-300 ease-in-out transform group-hover:scale-105">Kick</span>
            <span className="text-text-dark bg-clip-text transition-all duration-300 ease-in-out transform group-hover:scale-105">Mates</span>
            <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-secondary group-hover:w-full transition-all duration-500 ease-in-out"></div>
          </Link>

          <button 
            className={`md:hidden flex flex-col justify-center items-center w-10 h-10 rounded-full hover:bg-gray-100 transition-all duration-300 ${menuOpen ? 'bg-gray-100' : ''}`} 
            onClick={toggleMenu}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            <span className={`block w-6 h-0.5 bg-text-dark transition-all duration-300 ${menuOpen ? 'rotate-45 translate-y-1' : ''}`}></span>
            <span className={`block w-6 h-0.5 bg-text-dark transition-all duration-300 my-1 ${menuOpen ? 'opacity-0' : 'opacity-100'}`}></span>
            <span className={`block w-6 h-0.5 bg-text-dark transition-all duration-300 ${menuOpen ? '-rotate-45 -translate-y-1' : ''}`}></span>
          </button>
        </div>

        <div className={`space-y-1 mb-6 transition-all duration-300 ease-in-out ${menuOpen || window.innerWidth >= 768 ? 'opacity-100 max-h-[1000px]' : 'opacity-0 max-h-0 md:opacity-100 md:max-h-[1000px] overflow-hidden'}`}>
          <NavLink to="/" isActive={isActive('/')} onClick={() => setMenuOpen(false)}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
            Home
          </NavLink>
          <NavLink to="/events" isActive={isActive('/events')} onClick={() => setMenuOpen(false)}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
            Events
          </NavLink>
          {user && (
            <>
              <NavLink to="/dashboard" isActive={isActive('/dashboard')} onClick={() => setMenuOpen(false)}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
                  <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
                </svg>
                Dashboard
              </NavLink>
              <NavLink to="/calendar" isActive={isActive('/calendar')} onClick={() => setMenuOpen(false)}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
                Calendar
              </NavLink>
              <NavLink to="/chat" isActive={isActive('/chat')} onClick={() => setMenuOpen(false)}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                </svg>
                Messages
              </NavLink>
            </>
          )}
        </div>

        <div className={`mt-auto transition-all duration-300 ease-in-out ${menuOpen || window.innerWidth >= 768 ? 'opacity-100 max-h-[1000px]' : 'opacity-0 max-h-0 md:opacity-100 md:max-h-[1000px] overflow-hidden'}`}>
          {user ? (
            <div className="relative group">
              <button className="w-full flex items-center justify-between p-4 text-left rounded-lg hover:bg-gray-50 transition-all duration-300 ease-in-out border-t border-gray-100 group">
                <span className="font-medium text-text-dark flex items-center">
                  <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center mr-2 overflow-hidden">
                    {user.username ? user.username.charAt(0).toUpperCase() : '?'}
                  </div>
                  {user.username}
                </span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 transition-transform duration-300 group-hover:rotate-180" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
              <div className="absolute bottom-full left-0 w-full mb-1 bg-white shadow-lg rounded-md py-1 hidden group-hover:block border border-gray-100 transform opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 ease-in-out">
                <Link to="/profile" 
                  className="block px-4 py-2 hover:bg-gray-50 text-text-dark hover:text-primary transition-colors flex items-center" 
                  onClick={() => setMenuOpen(false)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                  My Profile
                </Link>
                <Link to="/dashboard" 
                  className="block px-4 py-2 hover:bg-gray-50 text-text-dark hover:text-primary transition-colors flex items-center" 
                  onClick={() => setMenuOpen(false)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
                    <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
                  </svg>
                  Dashboard
                </Link>
                <Link to="/events/create" 
                  className="block px-4 py-2 hover:bg-gray-50 text-text-dark hover:text-gray-900 transition-colors flex items-center" 
                  onClick={() => setMenuOpen(false)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-900" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Create Event
                </Link>
                <Link to="/settings" 
                  className="block px-4 py-2 hover:bg-gray-50 text-text-dark hover:text-primary transition-colors flex items-center" 
                  onClick={() => setMenuOpen(false)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                  </svg>
                  Settings
                </Link>
                <hr className="my-1 border-gray-100" />
                <button 
                  onClick={handleLogout} 
                  className="block w-full text-left px-4 py-2 hover:bg-gray-50 text-text-dark hover:text-error transition-colors flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V7.414l-5-5H3zm6.293 11.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L11.586 10l-2.293 2.293z" clipRule="evenodd" />
                  </svg>
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2 p-4 border-t border-gray-100">
              <Link to="/login" className="text-primary font-medium py-2 text-center hover:bg-gray-50 rounded-md transition-all duration-300 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 3a1 1 0 011 1v12a1 1 0 01-1 1h12a1 1 0 001-1V7.414l-5-5H3zm5 6a1 1 0 10-2 0v6a1 1 0 102 0V9zm6 0a1 1 0 10-2 0v6a1 1 0 102 0V9z" clipRule="evenodd" />
                </svg>
                Login
              </Link>
              <Link to="/register" className="bg-gradient-to-r from-gray-900 to-gray-700 hover:from-black hover:to-gray-800 text-white py-2 px-4 rounded-md text-center font-medium transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center shadow-md">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                </svg>
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

// Custom NavLink component with active state styling
const NavLink = ({ to, children, isActive, onClick }) => {
  return (
    <Link 
      to={to} 
      className={`flex items-center px-4 py-2.5 rounded-lg transition-all duration-300 ease-in-out group relative overflow-hidden ${
        isActive(to) 
          ? 'text-white bg-gradient-to-r from-primary to-primary-dark font-medium shadow-md' 
          : 'text-text-dark hover:bg-gray-50'
      }`}
      onClick={onClick}
    >
      {children}
      <div className={`absolute bottom-0 left-0 w-full h-0.5 bg-secondary transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-in-out ${isActive(to) ? 'opacity-0' : ''}`}></div>
    </Link>
  );
};

export default Navbar; 