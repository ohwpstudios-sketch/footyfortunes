// apiService.js - Create this file in src/services folder

import authService from './authService';

// Get API base URL from environment or use default
const API_BASE_URL = 'https://footyfortunes-api.ghwmelite.workers.dev';
console.log('🔍 API_BASE_URL:', API_BASE_URL);
console.log('🔍 VITE_API_URL:', import.meta.env.VITE_API_URL);

// Generic fetch wrapper with error handling
const apiFetch = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...authService.getAuthHeader(),
        ...options.headers
      }
    });

    const data = await response.json();
    
    // Handle 401 Unauthorized (session expired)
    if (response.status === 401) {
      authService.clearSession();
      window.location.href = '/login';
      throw new Error('Session expired. Please login again.');
    }

    return {
      ok: response.ok,
      status: response.status,
      data
    };
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const apiService = {
  // ============ AUTH ENDPOINTS ============
  login: async (email, password) => {
    return apiFetch('/api/auth/login', {  // ✅ FIXED - Added /api
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  },

  register: async (email, password) => {
    return apiFetch('/api/auth/register', {  // ✅ FIXED - Added /api
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  },

  // ============ PICKS ENDPOINTS ============
  getTodaysPicks: async () => {
    return apiFetch('/api/picks/today', {
      method: 'GET'
    });
  },

  getPickById: async (pickId) => {
    return apiFetch(`/api/picks/${pickId}`, {
      method: 'GET'
    });
  },

  getArchive: async (limit = 50, offset = 0) => {
    return apiFetch(`/api/picks/archive?limit=${limit}&offset=${offset}`, {
      method: 'GET'
    });
  },

  // ============ ADMIN ENDPOINTS ============
  admin: {
    // Get dashboard stats
    getStats: async () => {
      return apiFetch('/api/admin/stats', {
        method: 'GET'
      });
    },

    // PICK MANAGEMENT
    getAllPicks: async () => {
      return apiFetch('/api/admin/picks', {
        method: 'GET'
      });
    },

    createPick: async (pickData) => {
      return apiFetch('/api/admin/picks', {
        method: 'POST',
        body: JSON.stringify(pickData)
      });
    },

    updatePick: async (pickId, pickData) => {
      return apiFetch(`/api/admin/picks/${pickId}`, {
        method: 'PUT',
        body: JSON.stringify(pickData)
      });
    },

    deletePick: async (pickId) => {
      return apiFetch(`/api/admin/picks/${pickId}`, {
        method: 'DELETE'
      });
    },

    updatePickResult: async (pickId, result, finalScore = null) => {
      return apiFetch('/api/admin/picks/update-result', {
        method: 'POST',
        body: JSON.stringify({ pickId, result, finalScore })
      });
    },

    autoDetectFixtures: async (matches) => {
      return apiFetch('/api/admin/picks/auto-detect-fixtures', {
        method: 'POST',
        body: JSON.stringify({ matches })
      });
    },

    // USER MANAGEMENT
    getAllUsers: async () => {
      return apiFetch('/api/admin/users', {
        method: 'GET'
      });
    },

    updateUserRole: async (userId, role) => {
      return apiFetch(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role })
      });
    },

    updateUserStatus: async (userId, status) => {
      return apiFetch(`/api/admin/users/${userId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });
    },

    deleteUser: async (userId) => {
      return apiFetch(`/api/admin/users/${userId}`, {
        method: 'DELETE'
      });
    },

    // SUBSCRIBER MANAGEMENT
    getAllSubscribers: async () => {
      return apiFetch('/api/admin/subscribers', {
        method: 'GET'
      });
    },

    deleteSubscriber: async (subscriberId) => {
      return apiFetch(`/api/admin/subscribers/${subscriberId}`, {
        method: 'DELETE'
      });
    },

    // SETTINGS
    getSettings: async () => {
      return apiFetch('/api/admin/settings', {
        method: 'GET'
      });
    },

    updateSettings: async (settings) => {
      return apiFetch('/api/admin/settings', {
        method: 'PUT',
        body: JSON.stringify(settings)
      });
    },

    uploadFile: async (file, type) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      return fetch(`${API_BASE_URL}/api/admin/upload`, {
        method: 'POST',
        headers: {
          'Authorization': authService.getAuthHeader().Authorization
        },
        body: formData
      }).then(res => res.json());
    }
  },

  // ============ SUBSCRIPTION ENDPOINTS ============
  subscribe: async (email, preferences) => {
    return apiFetch('/api/subscribe', {
      method: 'POST',
      body: JSON.stringify({ email, preferences })
    });
  },

  unsubscribe: async (email) => {
    return apiFetch('/api/unsubscribe', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  }
};

export default apiService;