// authService.js - Complete Authentication Service
// Handles user authentication, session management, and persistence

const SESSION_KEY = 'footy_session';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// In-memory session cache
let sessionCache = {
  token: null,
  user: null,
  expiresAt: null
};

export const authService = {
  /**
   * Initialize authentication on app load
   * Call this in your App.tsx useEffect on mount
   * @returns {Object} { isAuthenticated, user, token }
   */
  initializeAuth: () => {
    console.log('🔄 Initializing auth from storage...');
    
    try {
      // Try to restore session from sessionStorage
      const storedSession = sessionStorage.getItem(SESSION_KEY);
      
      if (!storedSession) {
        console.log('ℹ️ No stored session found');
        return {
          isAuthenticated: false,
          user: null,
          token: null
        };
      }

      // Parse stored session
      const parsed = JSON.parse(storedSession);
      
      // Check if session has expired
      if (parsed.expiresAt && new Date(parsed.expiresAt) <= new Date()) {
        console.log('⏰ Session expired, clearing...');
        authService.clearSession();
        return {
          isAuthenticated: false,
          user: null,
          token: null
        };
      }

      // Session is valid, restore it
      sessionCache = parsed;
      console.log('✅ Session restored successfully');
      console.log('👤 User:', parsed.user?.email || parsed.user?.name);
      console.log('🔑 Role:', parsed.user?.role);
      
      return {
        isAuthenticated: true,
        user: parsed.user,
        token: parsed.token
      };
      
    } catch (error) {
      console.error('❌ Error initializing auth:', error);
      authService.clearSession();
      return {
        isAuthenticated: false,
        user: null,
        token: null
      };
    }
  },

  /**
   * Save session after successful login
   * @param {string} token - JWT token from backend
   * @param {Object} user - User object { id, email, name, role }
   */
  saveSession: (token, user) => {
    console.log('💾 Saving session...');
    
    if (!token || !user) {
      console.error('❌ Invalid session data - token or user missing');
      return null;
    }

    const expiresAt = new Date(Date.now() + SESSION_DURATION).toISOString();
    
    sessionCache = {
      token,
      user,
      expiresAt
    };

    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionCache));
      console.log('✅ Session saved successfully');
      console.log('👤 User:', user.email || user.name);
      console.log('🔑 Role:', user.role);
      console.log('⏰ Expires:', new Date(expiresAt).toLocaleString());
    } catch (error) {
      console.error('❌ Error saving session to storage:', error);
    }

    return sessionCache;
  },

  /**
   * Get current session
   * Checks validity and returns session or null
   * @returns {Object|null} Session object or null if expired/invalid
   */
  getSession: () => {
    // Check if session exists in cache
    if (!sessionCache.token || !sessionCache.user) {
      // Try to restore from storage
      const restored = authService.initializeAuth();
      if (!restored.isAuthenticated) {
        return null;
      }
    }

    // Check if session has expired
    if (sessionCache.expiresAt && new Date(sessionCache.expiresAt) <= new Date()) {
      console.log('⏰ Session expired');
      authService.clearSession();
      return null;
    }

    return sessionCache;
  },

  /**
   * Get current user
   * @returns {Object|null} User object or null
   */
  getUser: () => {
    const session = authService.getSession();
    return session?.user || null;
  },

  /**
   * Get current token
   * @returns {string|null} JWT token or null
   */
  getToken: () => {
    const session = authService.getSession();
    return session?.token || null;
  },

  /**
   * Check if user is authenticated
   * @returns {boolean}
   */
  isAuthenticated: () => {
    const session = authService.getSession();
    return !!(session && session.token && session.user);
  },

  /**
   * Check if current user is admin
   * @returns {boolean}
   */
  isAdmin: () => {
    const session = authService.getSession();
    return session?.user?.role === 'admin';
  },

  /**
   * Clear session on logout
   */
  clearSession: () => {
    console.log('🗑️ Clearing session...');
    
    sessionCache = {
      token: null,
      user: null,
      expiresAt: null
    };
    
    try {
      sessionStorage.removeItem(SESSION_KEY);
      console.log('✅ Session cleared');
    } catch (error) {
      console.error('❌ Error clearing session:', error);
    }
  },

  /**
   * Logout user and redirect to home
   */
  logout: () => {
    console.log('🚪 Logging out...');
    authService.clearSession();
    window.location.href = '/';
  },

  /**
   * Get authorization header for API calls
   * @returns {Object} Headers object with Authorization if logged in
   */
  getAuthHeader: () => {
    const session = authService.getSession();
    
    if (session?.token) {
      return {
        'Authorization': `Bearer ${session.token}`,
        'Content-Type': 'application/json'
      };
    }
    
    return {
      'Content-Type': 'application/json'
    };
  },

  /**
   * Check if session needs refresh (expires in less than 1 hour)
   * @returns {boolean}
   */
  needsRefresh: () => {
    const session = authService.getSession();
    if (!session?.expiresAt) return false;
    
    const expiresAt = new Date(session.expiresAt);
    const oneHourFromNow = new Date(Date.now() + (60 * 60 * 1000));
    
    return expiresAt < oneHourFromNow;
  },

  /**
   * Debug method - prints current session state
   */
  debugSession: () => {
    console.log('=== AUTH DEBUG ===');
    console.log('Cache:', sessionCache);
    console.log('Storage:', sessionStorage.getItem(SESSION_KEY));
    console.log('Is Authenticated:', authService.isAuthenticated());
    console.log('Is Admin:', authService.isAdmin());
    console.log('User:', authService.getUser());
    console.log('Token:', authService.getToken());
    console.log('==================');
  }
};

// Auto-initialize on import (optional, but helpful)
if (typeof window !== 'undefined') {
  // Only run in browser environment
  authService.initializeAuth();
}

export default authService;