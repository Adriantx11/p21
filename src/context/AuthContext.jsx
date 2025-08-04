import React, { createContext, useState, useEffect } from 'react';
import apiService from '../services/api';

// Create auth context
const AuthContext = createContext();

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user from token on initial render
  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const user = await apiService.getCurrentUser();
          setCurrentUser(user);
          localStorage.setItem('user', JSON.stringify(user));
        }
      } catch (error) {
        console.error('Error loading user:', error);
        // Clear invalid token
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      const userData = await apiService.login(email, password);
      setCurrentUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      return true;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  // Register function
  const register = async (name, email, password, numericId) => {
    try {
      const userData = await apiService.register(name, email, password, numericId);
      setCurrentUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      return true;
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setCurrentUser(null);
      localStorage.removeItem('user');
    }
  };

  // Update subscription status
  const updateSubscription = async (planId) => {
    try {
      const result = await apiService.upgradeSubscription(planId);
      if (result.user) {
        const updatedUser = { ...currentUser, ...result.user };
        setCurrentUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
      return true;
    } catch (error) {
      console.error('Update subscription error:', error);
      throw error;
    }
  };

  // Update user profile
  const updateProfile = async (updates) => {
    try {
      const updatedUser = await apiService.updateProfile(updates);
      setCurrentUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      return updatedUser;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  };

  // Check if user is admin
  const isAdmin = () => {
    return currentUser?.role === 'admin';
  };

  // Auth context value
  const value = {
    currentUser,
    loading,
    login,
    register,
    logout,
    updateSubscription,
    updateProfile,
    isAdmin
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Export the context for the separate hook file
export { AuthContext };