import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  USER_DATA: '@karnavati_user_data',
  USER_CREDENTIALS: '@karnavati_credentials',
  TICKET_CACHE: '@karnavati_tickets',
  PAYMENT_CACHE: '@karnavati_payments',
  SESSION_TOKEN: '@karnavati_session',
  AUTO_LOGIN: '@karnavati_auto_login',
};

class StorageService {
  // User data methods
  async saveUserData(userData) {
    try {
      const jsonValue = JSON.stringify(userData);
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, jsonValue);
      return true;
    } catch (error) {
      console.error('Error saving user data:', error);
      return false;
    }
  }

  async getUserData() {
    try {
      const jsonValue = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  }

  async clearUserData() {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
      await AsyncStorage.removeItem(STORAGE_KEYS.USER_CREDENTIALS);
      await this.clearSession(); // Clear session as well
      return true;
    } catch (error) {
      console.error('Error clearing user data:', error);
      return false;
    }
  }

  // Credentials methods
  async saveCredentials(credentials) {
    try {
      const jsonValue = JSON.stringify(credentials);
      await AsyncStorage.setItem(STORAGE_KEYS.USER_CREDENTIALS, jsonValue);
      return true;
    } catch (error) {
      console.error('Error saving credentials:', error);
      return false;
    }
  }

  async getCredentials() {
    try {
      const jsonValue = await AsyncStorage.getItem(STORAGE_KEYS.USER_CREDENTIALS);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error('Error getting credentials:', error);
      return null;
    }
  }

  // Session management methods
  async createSession(userData) {
    try {
      const sessionData = {
        userId: userData.id,
        username: userData.username,
        buildingId: userData.buildingId,
        loginTime: new Date().toISOString(),
        isActive: true,
      };
      
      const jsonValue = JSON.stringify(sessionData);
      await AsyncStorage.setItem(STORAGE_KEYS.SESSION_TOKEN, jsonValue);
      await AsyncStorage.setItem(STORAGE_KEYS.AUTO_LOGIN, 'true');
      
      return true;
    } catch (error) {
      console.error('Error creating session:', error);
      return false;
    }
  }

  async getActiveSession() {
    try {
      const sessionValue = await AsyncStorage.getItem(STORAGE_KEYS.SESSION_TOKEN);
      const autoLogin = await AsyncStorage.getItem(STORAGE_KEYS.AUTO_LOGIN);
      
      if (sessionValue && autoLogin === 'true') {
        const sessionData = JSON.parse(sessionValue);
        
        // Check if session is still valid (optional: add expiry logic here)
        if (sessionData.isActive) {
          return sessionData;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error getting active session:', error);
      return null;
    }
  }

  async clearSession() {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.SESSION_TOKEN);
      await AsyncStorage.removeItem(STORAGE_KEYS.AUTO_LOGIN);
      return true;
    } catch (error) {
      console.error('Error clearing session:', error);
      return false;
    }
  }

  async setAutoLogin(enabled) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.AUTO_LOGIN, enabled ? 'true' : 'false');
      return true;
    } catch (error) {
      console.error('Error setting auto login:', error);
      return false;
    }
  }

  // Ticket cache methods
  async saveTicketsCache(tickets) {
    try {
      const jsonValue = JSON.stringify(tickets);
      await AsyncStorage.setItem(STORAGE_KEYS.TICKET_CACHE, jsonValue);
      return true;
    } catch (error) {
      console.error('Error saving tickets cache:', error);
      return false;
    }
  }

  async getTicketsCache() {
    try {
      const jsonValue = await AsyncStorage.getItem(STORAGE_KEYS.TICKET_CACHE);
      return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (error) {
      console.error('Error getting tickets cache:', error);
      return [];
    }
  }

  // Payment cache methods
  async savePaymentsCache(payments) {
    try {
      const jsonValue = JSON.stringify(payments);
      await AsyncStorage.setItem(STORAGE_KEYS.PAYMENT_CACHE, jsonValue);
      return true;
    } catch (error) {
      console.error('Error saving payments cache:', error);
      return false;
    }
  }

  async getPaymentsCache() {
    try {
      const jsonValue = await AsyncStorage.getItem(STORAGE_KEYS.PAYMENT_CACHE);
      return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (error) {
      console.error('Error getting payments cache:', error);
      return [];
    }
  }

  // Generic methods
  async setItem(key, value) {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
      return true;
    } catch (error) {
      console.error(`Error setting item ${key}:`, error);
      return false;
    }
  }

  async getItem(key) {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error(`Error getting item ${key}:`, error);
      return null;
    }
  }

  async removeItem(key) {
    try {
      await AsyncStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing item ${key}:`, error);
      return false;
    }
  }

  async clear() {
    try {
      await AsyncStorage.clear();
      return true;
    } catch (error) {
      console.error('Error clearing storage:', error);
      return false;
    }
  }
}

export default new StorageService();
