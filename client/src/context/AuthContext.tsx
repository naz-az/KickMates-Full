import { createContext, useState, useEffect, ReactNode } from 'react';
import { login as apiLogin, register as apiRegister, getProfile } from '../services/api';
import { AxiosError } from 'axios';
import { socketService } from '../services/socketService';

interface User {
  id: number;
  username: string;
  email: string;
  full_name?: string;
  bio?: string;
  profile_image?: string;
}

interface RegisterUserData {
  username: string;
  email: string;
  password: string;
  full_name?: string;
  bio?: string;
}

interface ErrorResponse {
  message: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (identifier: string, password: string) => Promise<void>;
  register: (userData: RegisterUserData) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  isAuthenticated: () => boolean;
  updateUserState: (updatedUser: User) => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: false,
  error: null,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  clearError: () => {},
  isAuthenticated: () => false,
  updateUserState: () => {},
});

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Connect to socket when user is loaded
  useEffect(() => {
    if (user && localStorage.getItem('token')) {
      // Initialize socket connection
      socketService.connect(user.id.toString(), localStorage.getItem('token') || '');
    }

    // Cleanup socket connection on unmount
    return () => {
      socketService.disconnect();
    };
  }, [user]);

  // Load user from local storage
  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = localStorage.getItem('token');

        if (token) {
          const res = await getProfile();
          setUser(res.data.user);
        }
      } catch (err) {
        console.error('Failed to load user', err);
        localStorage.removeItem('token');
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  // Login
  const login = async (identifier: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await apiLogin(identifier, password);
      
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
      
      // Connect to socket after successful login
      socketService.connect(res.data.user.id.toString(), res.data.token);
    } catch (err: unknown) {
      const axiosError = err as AxiosError<ErrorResponse>;
      setError(
        axiosError.response?.data?.message || 'Login failed'
      );
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Register
  const register = async (userData: RegisterUserData) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await apiRegister(userData);
      
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
      
      // Connect to socket after successful registration
      socketService.connect(res.data.user.id.toString(), res.data.token);
    } catch (err: unknown) {
      const axiosError = err as AxiosError<ErrorResponse>;
      setError(
        axiosError.response?.data?.message || 'Registration failed'
      );
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout
  const logout = () => {
    // Disconnect socket
    socketService.disconnect();
    
    localStorage.removeItem('token');
    setUser(null);
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };
  
  // Check if user is authenticated
  const isAuthenticated = () => {
    return !!user && !!localStorage.getItem('token');
  };

  // Update user state function to be called when profile is updated
  const updateUserState = (updatedUser: User) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoading, 
      error, 
      login, 
      register, 
      logout, 
      clearError,
      isAuthenticated,
      updateUserState
    }}>
      {children}
    </AuthContext.Provider>
  );
}; 