import { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <nav className="bg-white shadow-md w-full md:w-64 md:min-h-screen">
      <div className="px-4 py-5 md:py-8 flex flex-col h-full">
        <div className="flex items-center justify-between md:justify-center mb-6">
          <Link to="/" className="text-2xl font-bold">
            <span className="text-primary">Kick</span>Mates
          </Link>

          <button 
            className={`md:hidden flex flex-col justify-center items-center w-8 h-8 ${menuOpen ? 'space-y-0' : 'space-y-1.5'}`} 
            onClick={toggleMenu}
          >
            <span className={`block w-6 h-0.5 bg-gray-600 transition-all ${menuOpen ? 'rotate-45 translate-y-0.5' : ''}`}></span>
            <span className={`block w-6 h-0.5 bg-gray-600 transition-all ${menuOpen ? 'opacity-0' : 'opacity-100'}`}></span>
            <span className={`block w-6 h-0.5 bg-gray-600 transition-all ${menuOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></span>
          </button>
        </div>

        <div className={`md:flex flex-col flex-1 ${menuOpen ? 'flex' : 'hidden'}`}>
          <div className="space-y-1 mb-6">
            <Link to="/" 
              className="block px-4 py-2 rounded-md hover:bg-gray-100 transition-colors text-text-dark hover:text-primary" 
              onClick={() => setMenuOpen(false)}
            >
              Home
            </Link>
            <Link to="/events" 
              className="block px-4 py-2 rounded-md hover:bg-gray-100 transition-colors text-text-dark hover:text-primary" 
              onClick={() => setMenuOpen(false)}
            >
              Events
            </Link>
            {user && (
              <>
                <Link to="/dashboard" 
                  className="block px-4 py-2 rounded-md hover:bg-gray-100 transition-colors text-text-dark hover:text-primary" 
                  onClick={() => setMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link to="/calendar" 
                  className="block px-4 py-2 rounded-md hover:bg-gray-100 transition-colors text-text-dark hover:text-primary" 
                  onClick={() => setMenuOpen(false)}
                >
                  Calendar
                </Link>
                <Link to="/chat" 
                  className="block px-4 py-2 rounded-md hover:bg-gray-100 transition-colors text-text-dark hover:text-primary" 
                  onClick={() => setMenuOpen(false)}
                >
                  Messages
                </Link>
              </>
            )}
          </div>

          <div className="mt-auto">
            {user ? (
              <div className="relative group">
                <button className="w-full flex items-center justify-between p-4 text-left border-t border-gray-100">
                  <span className="font-medium text-text-dark">{user.username}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                <div className="absolute bottom-full left-0 w-full mb-1 bg-white shadow-lg rounded-md py-1 hidden group-hover:block">
                  <Link to="/profile" 
                    className="block px-4 py-2 hover:bg-gray-100 text-text-dark hover:text-primary" 
                    onClick={() => setMenuOpen(false)}
                  >
                    My Profile
                  </Link>
                  <Link to="/dashboard" 
                    className="block px-4 py-2 hover:bg-gray-100 text-text-dark hover:text-primary" 
                    onClick={() => setMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link to="/events/create" 
                    className="block px-4 py-2 hover:bg-gray-100 text-text-dark hover:text-primary" 
                    onClick={() => setMenuOpen(false)}
                  >
                    Create Event
                  </Link>
                  <Link to="/settings" 
                    className="block px-4 py-2 hover:bg-gray-100 text-text-dark hover:text-primary" 
                    onClick={() => setMenuOpen(false)}
                  >
                    Settings
                  </Link>
                  <hr className="my-1 border-gray-100" />
                  <button 
                    onClick={handleLogout} 
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-text-dark hover:text-error"
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2 p-4 border-t border-gray-100">
                <Link to="/login" className="text-primary font-medium py-2 text-center hover:text-primary-dark transition-colors">
                  Login
                </Link>
                <Link to="/register" className="bg-primary text-white py-2 px-4 rounded-md text-center font-medium hover:bg-primary-dark transition-colors">
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 