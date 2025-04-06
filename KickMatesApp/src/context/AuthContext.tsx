import React, { createContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { login as apiLogin, register as apiRegister, getProfile } from '../services/api';

interface User {
  id: number;
  username: string;
  email: string;
  full_name?: string;
  bio?: string;
  profile_image?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (identifier: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  full_name?: string;
  bio?: string;
}

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: false,
  error: null,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  clearError: () => {},
});

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check for existing token on app load
  useEffect(() => {
    const loadToken = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('token');
        if (storedToken) {
          setToken(storedToken);
          // Fetch user profile
          const response = await getProfile();
          setUser(response.data.user);
        }
      } catch (err) {
        console.error('Error loading auth state:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadToken();
  }, []);

  const login = async (identifier: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('[AUTH] Attempting login with:', { email: identifier });
      const response = await apiLogin(identifier, password);
      console.log('[AUTH] Login successful, response:', JSON.stringify(response.data));
      const { token, user } = response.data;
      
      // Save auth data
      await AsyncStorage.setItem('token', token);
      setToken(token);
      setUser(user);
      console.log('[AUTH] User authenticated:', user.id);
    } catch (err: any) {
      console.error('[AUTH] Login error:', err);
      
      if (err.response) {
        console.error('[AUTH] Error response:', {
          status: err.response.status,
          data: JSON.stringify(err.response.data)
        });
        const errorMsg = err.response?.data?.message || 'Login failed. Please check your credentials.';
        setError(errorMsg);
      } else if (err.request) {
        console.error('[AUTH] No response received:', err.request);
        setError('Network error. Server did not respond.');
      } else {
        console.error('[AUTH] Request setup error:', err.message);
        setError(err.message || 'Login failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterData) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiRegister(userData);
      const { token, user } = response.data;
      
      // Save auth data
      await AsyncStorage.setItem('token', token);
      setToken(token);
      setUser(user);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Registration failed. Please try again.';
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      // Clear auth data
      await AsyncStorage.removeItem('token');
      setToken(null);
      setUser(null);
    } catch (err) {
      console.error('Error during logout:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      isLoading, 
      error, 
      login, 
      register, 
      logout,
      clearError
    }}>
      {children}
    </AuthContext.Provider>
  );
}; 