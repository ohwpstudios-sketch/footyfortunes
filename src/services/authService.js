// authService.js - Create this new file in your src/services folder

// In-memory session storage (persists during browser session only)
let sessionData = {
  token: null,
  user: null,
  expiresAt: null
};

// Session duration: 24 hours
const SESSION_DURATION = 24 * 60 * 60 * 1000;

export const authService = {
  // Initialize auth from session storage on app load
  initializeAuth: () => {
    try {
      // Try to get session from sessionStorage (browser-based, cleared on tab close)
      const storedSession = sessionStorage.getItem('footy_session');
      if (storedSession) {
        const parsed = JSON.parse(storedSession);
        
        // Check if session is still valid
        if (parsed.expiresAt && new Date(parsed.expiresAt) > new Date()) {
          sessionData = parsed;
          return {
            isAuthenticated: true,
            user: parsed.user,
            token: parsed.token
          };
        } else {
          // Session expired, clear it
          authService.clearSession();
        }
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
    }
    
    return {
      isAuthenticated: false,
      user: null,
      token: null
    };
  },

  // Save session after successful login
  saveSession: (token, user) => {
    const expiresAt = new Date(Date.now() + SESSION_DURATION).toISOString();
    
    sessionData = {
      token,
      user,
      expiresAt
    };

    // Store in sessionStorage (survives page refresh but not browser close)
    try {
      sessionStorage.setItem('footy_session', JSON.stringify(sessionData));
    } catch (error) {
      console.error('Error saving session:', error);
    }

    return sessionData;
  },

  // Get current session
  getSession: () => {
    // Check if session is still valid
    if (sessionData.expiresAt && new Date(sessionData.expiresAt) < new Date()) {
      authService.clearSession();
      return null;
    }
    return sessionData;
  },

  // Clear session on logout
  clearSession: () => {
    sessionData = {
      token: null,
      user: null,
      expiresAt: null
    };
    
    try {
      sessionStorage.removeItem('footy_session');
    } catch (error) {
      console.error('Error clearing session:', error);
    }
  },

  // Check if user is admin
  isAdmin: () => {
    const session = authService.getSession();
    return session?.user?.role === 'admin';
  },

  // Get auth header for API calls
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
  }
};

// Export for use in components
export default authService;