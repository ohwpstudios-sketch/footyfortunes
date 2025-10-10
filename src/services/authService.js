// authService.js - Complete Authentication Service with Debugging

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
   */
  initializeAuth: () => {
    console.log('🔄 Initializing auth from storage...');
    
    try {
      const storedSession = sessionStorage.getItem(SESSION_KEY);
      
      if (!storedSession) {
        console.log('ℹ️ No stored session found');
        return {
          isAuthenticated: false,
          user: null,
          token: null
        };
      }

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
      console.log('👤 User:', parsed.user?.email);
      console.log('🔑 Role:', parsed.user?.role);
      console.log('🎫 Token:', parsed.token ? 'Present' : 'Missing');
      
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
   */
  saveSession: (session) => {
    console.log('💾 Saving session...');
    
    // Handle both calling styles
    let token, user;
    if (session.token && session.user) {
      token = session.token;
      user = session.user;
    } else {
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
      console.log('👤 User:', user.email);
      console.log('🔑 Role:', user.role);
      console.log('🎫 Token:', token ? 'Saved' : 'Missing');
      console.log('⏰ Expires:', new Date(expiresAt).toLocaleString());
    } catch (error) {
      console.error('❌ Error saving session to storage:', error);
    }

    return sessionCache;
  },

  /**
   * Get current session
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

    console.log('📋 Getting session - Token present:', !!sessionCache.token);
    return sessionCache;
  },

  /**
   * Get current user
   */
  getUser: () => {
    const session = authService.getSession();
    return session?.user || null;
  },

  /**
   * Get current token
   */
  getToken: () => {
    const session = authService.getSession();
    const token = session?.token || null;
    console.log('🎫 Getting token:', token ? 'Present' : 'Missing');
    return token;
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated: () => {
    const session = authService.getSession();
    const isAuth = !!(session && session.token && session.user);
    console.log('🔐 Is authenticated:', isAuth);
    return isAuth;
  },

  /**
   * Check if current user is admin
   */
  isAdmin: () => {
    const session = authService.getSession();
    const isAdmin = session?.user?.role === 'admin';
    console.log('👑 Is admin:', isAdmin);
    return isAdmin;
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
   */
  getAuthHeader: () => {
    const session = authService.getSession();
    
    if (session?.token) {
      console.log('🔑 Auth header with token');
      return {
        'Authorization': `Bearer ${session.token}`,
        'Content-Type': 'application/json'
      };
    }
    
    console.log('⚠️ Auth header without token');
    return {
      'Content-Type': 'application/json'
    };
  },

  /**
   * Check if session needs refresh
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

// Auto-initialize on import
if (typeof window !== 'undefined') {
  authService.initializeAuth();
}

export default authService;