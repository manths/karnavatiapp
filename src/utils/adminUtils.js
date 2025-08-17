import DatabaseService from '../services/database';
import { USER_ROLES, USER_STATUS } from '../constants/userRoles';

// Admin utility functions
export const AdminUtils = {
  // Create first admin user - can be called from admin console or initial setup
  async createFirstAdmin(countryCode, mobileNumber) {
    try {
      const result = await DatabaseService.promoteToAdmin(countryCode, mobileNumber);
      if (result.success) {
        // Also approve the user if they're pending
        const userResult = await DatabaseService.getUserByMobile(countryCode, mobileNumber);
        if (userResult.success && userResult.data.status === USER_STATUS.PENDING) {
          await DatabaseService.updateUserStatus(userResult.data.id, USER_STATUS.APPROVED);
        }
      }
      return result;
    } catch (error) {
      console.error('Error creating first admin:', error);
      return { success: false, error: error.message };
    }
  },

  // Check if there are any admin users in the system
  async hasAdminUsers(buildingId = null) {
    try {
      const result = await DatabaseService.getAdminUsers(buildingId);
      return { success: true, hasAdmins: result.success && result.data.length > 0 };
    } catch (error) {
      console.error('Error checking admin users:', error);
      return { success: false, error: error.message };
    }
  },

  // Get pending request count for admin notifications
  async getPendingRequestCount(buildingId = null) {
    try {
      const result = await DatabaseService.getPendingRequests(buildingId);
      return { 
        success: true, 
        count: result.success ? result.data.length : 0,
        requests: result.success ? result.data : []
      };
    } catch (error) {
      console.error('Error getting pending request count:', error);
      return { success: false, error: error.message, count: 0 };
    }
  },

  // Send notification to admins about new user registration
  async notifyAdminsNewUser(userData) {
    try {
      const admins = await DatabaseService.getAdminUsers(userData.buildingId);
      if (admins.success && admins.data.length > 0) {
        // In a real app, you would send push notifications here
        console.log(`New user ${userData.username} registered - notifying ${admins.data.length} admins`);
        
        // For now, just log the notification
        // TODO: Implement push notifications
        return { success: true, notifiedAdmins: admins.data.length };
      }
      return { success: true, notifiedAdmins: 0 };
    } catch (error) {
      console.error('Error notifying admins:', error);
      return { success: false, error: error.message };
    }
  },
};

// User session management utilities
export const SessionUtils = {
  // Check user session and return appropriate navigation route
  async getInitialRoute() {
    try {
      const StorageService = require('../services/storage').default;
      
      // Check if there's an active session
      const hasSession = await StorageService.hasActiveSession();
      if (!hasSession) {
        return { route: 'BuildingSelection', params: {} };
      }

      // Get user data from session
      const userData = await StorageService.getUserData();
      if (!userData) {
        return { route: 'BuildingSelection', params: {} };
      }

      // Check user status and route accordingly
      switch (userData.status) {
        case USER_STATUS.PENDING:
          return { route: 'AccountPending', params: {} };
        
        case USER_STATUS.REJECTED:
          // Clear session for rejected users
          await StorageService.clearSession();
          return { route: 'Auth', params: { buildingId: userData.buildingId } };
        
        case USER_STATUS.APPROVED:
          return { route: 'Main', params: {} };
        
        default:
          return { route: 'AccountPending', params: {} };
      }
    } catch (error) {
      console.error('Error getting initial route:', error);
      return { route: 'BuildingSelection', params: {} };
    }
  },

  // Update session with latest user data
  async refreshUserSession() {
    try {
      const StorageService = require('../services/storage').default;
      const userData = await StorageService.getUserData();
      
      if (userData && userData.id) {
        // Fetch latest user data from database
        const result = await DatabaseService.getUserById(userData.id);
        if (result.success) {
          // Update local storage with latest data
          await StorageService.saveUserData(result.data);
          return { success: true, userData: result.data };
        }
      }
      
      return { success: false, error: 'No user data found' };
    } catch (error) {
      console.error('Error refreshing user session:', error);
      return { success: false, error: error.message };
    }
  },
};
