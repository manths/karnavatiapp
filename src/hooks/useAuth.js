import { useState, useEffect } from 'react';
import StorageService from '../services/storage';
import DatabaseService from '../services/database';

const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const userData = await StorageService.getUserData();
      if (userData) {
        setUser(userData);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (userData) => {
    try {
      await StorageService.saveUserData(userData);
      setUser(userData);
      setIsAuthenticated(true);
      return { success: true };
    } catch (error) {
      console.error('Error during login:', error);
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      await StorageService.clearUserData();
      setUser(null);
      setIsAuthenticated(false);
      return { success: true };
    } catch (error) {
      console.error('Error during logout:', error);
      return { success: false, error: error.message };
    }
  };

  const updateUser = async (updateData) => {
    try {
      if (user) {
        const updatedUser = { ...user, ...updateData };
        await StorageService.saveUserData(updatedUser);
        setUser(updatedUser);
        
        // Also update in database
        await DatabaseService.updateUser(user.id, updateData);
        
        return { success: true };
      }
      return { success: false, error: 'No user found' };
    } catch (error) {
      console.error('Error updating user:', error);
      return { success: false, error: error.message };
    }
  };

  return {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    updateUser,
    checkAuthStatus,
  };
};

export default useAuth;
