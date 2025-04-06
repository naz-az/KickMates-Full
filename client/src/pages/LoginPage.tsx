import { useState, useContext, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const LoginPage = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  
  const { login, error, clearError, isLoading } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get redirect path from location state, session storage, or default to home
  const from = location.state?.from?.pathname || sessionStorage.getItem('redirectPath') || '/';
  
  // Clear redirect path when mounting the login page
  useEffect(() => {
    // Remove the stored path once it's been used
    if (sessionStorage.getItem('redirectPath')) {
      sessionStorage.removeItem('redirectPath');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    
    // Simple validation
    if (!identifier || !password) {
      setFormError('Please enter both email/username and password');
      return;
    }
    
    try {
      await login(identifier, password);
      navigate(from, { replace: true });
    } catch {
      // Error is handled by the context
    }
  };

  return (
    <div className="flex min-h-screen">
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Log In to KickMates</h1>
            <p className="text-text-light">Welcome back! Please enter your details to sign in.</p>
          </div>
          
          {(error || formError) && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-error rounded-md">
              {formError || error}
            </div>
          )}
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="identifier" className="block mb-2 font-medium text-text-dark">
                Email or Username
              </label>
              <input
                type="text"
                id="identifier"
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value);
                  clearError();
                }}
                placeholder="john@example.com or john_doe"
                required
                className="w-full p-3 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block mb-2 font-medium text-text-dark">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  clearError();
                }}
                placeholder="••••••••"
                required
                className="w-full p-3 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            
            <button 
              type="submit" 
              className="w-full py-3 px-4 bg-primary text-white font-medium rounded-md hover:bg-primary-dark transition-colors disabled:opacity-70"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          
          <div className="mt-8 text-center">
            <p className="text-text-light">
              Don't have an account? <Link to="/register" className="text-primary font-medium">Sign Up</Link>
            </p>
          </div>
        </div>
      </div>
      
      <div className="hidden lg:block lg:w-1/2 bg-gray-900">
        <img 
          src="https://images.unsplash.com/photo-1526506118085-60ce8714f8c5" 
          alt="Sports" 
          className="w-full h-full object-cover opacity-80"
        />
      </div>
    </div>
  );
};

export default LoginPage; 