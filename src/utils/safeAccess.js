// Safe access utility functions for production builds
export const SafeAccess = {
  // Safe object property access
  get: (obj, path, defaultValue = undefined) => {
    try {
      if (!obj || typeof obj !== 'object') return defaultValue;
      
      const keys = Array.isArray(path) ? path : path.split('.');
      let result = obj;
      
      for (const key of keys) {
        if (result === null || result === undefined || typeof result !== 'object') {
          return defaultValue;
        }
        result = result[key];
      }
      
      return result !== undefined ? result : defaultValue;
    } catch (error) {
      console.warn('SafeAccess.get error:', error);
      return defaultValue;
    }
  },

  // Safe array access
  getArray: (arr, index, defaultValue = undefined) => {
    try {
      if (!Array.isArray(arr) || index < 0 || index >= arr.length) {
        return defaultValue;
      }
      return arr[index] !== undefined ? arr[index] : defaultValue;
    } catch (error) {
      console.warn('SafeAccess.getArray error:', error);
      return defaultValue;
    }
  },

  // Safe function call
  call: (fn, defaultValue = undefined, ...args) => {
    try {
      if (typeof fn !== 'function') return defaultValue;
      return fn(...args);
    } catch (error) {
      console.warn('SafeAccess.call error:', error);
      return defaultValue;
    }
  },

  // Safe JSON parse
  parseJSON: (jsonString, defaultValue = {}) => {
    try {
      if (!jsonString || typeof jsonString !== 'string') return defaultValue;
      return JSON.parse(jsonString);
    } catch (error) {
      console.warn('SafeAccess.parseJSON error:', error);
      return defaultValue;
    }
  },

  // Safe string operations
  getString: (value, defaultValue = '') => {
    try {
      if (value === null || value === undefined) return defaultValue;
      return String(value);
    } catch (error) {
      console.warn('SafeAccess.getString error:', error);
      return defaultValue;
    }
  },

  // Safe number operations
  getNumber: (value, defaultValue = 0) => {
    try {
      if (value === null || value === undefined) return defaultValue;
      const num = Number(value);
      return isNaN(num) ? defaultValue : num;
    } catch (error) {
      console.warn('SafeAccess.getNumber error:', error);
      return defaultValue;
    }
  },

  // Safe boolean operations
  getBoolean: (value, defaultValue = false) => {
    try {
      if (value === null || value === undefined) return defaultValue;
      return Boolean(value);
    } catch (error) {
      console.warn('SafeAccess.getBoolean error:', error);
      return defaultValue;
    }
  },
};

// Safe async operations
export const SafeAsync = {
  // Safe async function execution
  execute: async (asyncFn, defaultValue = null, ...args) => {
    try {
      if (typeof asyncFn !== 'function') return defaultValue;
      return await asyncFn(...args);
    } catch (error) {
      console.warn('SafeAsync.execute error:', error);
      return defaultValue;
    }
  },

  // Safe promise handling
  handle: async (promise, defaultValue = null) => {
    try {
      return await promise;
    } catch (error) {
      console.warn('SafeAsync.handle error:', error);
      return defaultValue;
    }
  },

  // Safe timeout wrapper
  timeout: (promise, timeoutMs = 10000, timeoutValue = null) => {
    return Promise.race([
      promise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), timeoutMs)
      )
    ]).catch(() => timeoutValue);
  },
};

// Production-safe console replacement
export const SafeConsole = {
  log: (...args) => {
    try {
      if (typeof console !== 'undefined' && console.log) {
        console.log(...args);
      }
    } catch (error) {
      // Silently fail
    }
  },

  error: (...args) => {
    try {
      if (typeof console !== 'undefined' && console.error) {
        console.error(...args);
      }
    } catch (error) {
      // Silently fail
    }
  },

  warn: (...args) => {
    try {
      if (typeof console !== 'undefined' && console.warn) {
        console.warn(...args);
      }
    } catch (error) {
      // Silently fail
    }
  },
};
