/* ================================================================
   FILE: api.js
   PROJECT: UNILUS Sports Hub - Frontend
   DESCRIPTION: API calls to the backend
   ================================================================ */

// ================================================================
// API BASE URL
// ================================================================

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// ================================================================
// API HELPER FUNCTIONS
// ================================================================

// Get auth token from localStorage
function getToken() {
    return localStorage.getItem('token');
}

// Set auth token
function setToken(token) {
    if (token) {
        localStorage.setItem('token', token);
    } else {
        localStorage.removeItem('token');
    }
}

// Get user from localStorage
function getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
}

// Set user
function setUser(user) {
    if (user) {
        localStorage.setItem('user', JSON.stringify(user));
    } else {
        localStorage.removeItem('user');
    }
}

// Clear all auth data
function clearAuth() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
}

// API request helper
async function apiRequest(endpoint, method = 'GET', data = null) {
    const url = `${API_URL}${endpoint}`;
    const headers = {
        'Content-Type': 'application/json',
    };

    const token = getToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const options = {
        method,
        headers,
    };

    if (data) {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(url, options);
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Something went wrong');
        }

        return result;
    } catch (error) {
        throw error;
    }
}

// ================================================================
// AUTH API
// ================================================================

export const authAPI = {
    // Student Registration
    register: async (data) => {
        return apiRequest('/auth/register', 'POST', data);
    },

    // Student Login
    login: async (data) => {
        return apiRequest('/auth/login', 'POST', data);
    },

    // Staff Login
    staffLogin: async (data) => {
        return apiRequest('/auth/staff-login', 'POST', data);
    },

    // Get current user
    me: async () => {
        return apiRequest('/auth/me', 'GET');
    },

    // Logout
    logout: () => {
        clearAuth();
    },
};

// ================================================================
// FACILITY API
// ================================================================

export const facilityAPI = {
    // Get all facilities
    getAll: async () => {
        return apiRequest('/facilities', 'GET');
    },

    // Get facility by ID
    getById: async (id) => {
        return apiRequest(`/facilities/${id}`, 'GET');
    },
};

// ================================================================
// BOOKING API
// ================================================================

export const bookingAPI = {
    // Create booking
    create: async (data) => {
        return apiRequest('/bookings', 'POST', data);
    },

    // Get my bookings
    getMy: async () => {
        return apiRequest('/bookings/my', 'GET');
    },

    // Cancel booking
    cancel: async (id) => {
        return apiRequest(`/bookings/${id}/cancel`, 'PUT');
    },
};

// ================================================================
// NOTIFICATION API
// ================================================================

export const notificationAPI = {
    // Get for login page
    getForLogin: async () => {
        return apiRequest('/notifications/login', 'GET');
    },

    // Get for dashboard
    getForDashboard: async () => {
        return apiRequest('/notifications/dashboard', 'GET');
    },
};

// ================================================================
// STAFF API
// ================================================================

export const staffAPI = {
    // Get dashboard stats
    getDashboard: async () => {
        return apiRequest('/staff/dashboard', 'GET');
    },

    // Validate QR code
    validateQR: async (qrData) => {
        return apiRequest('/staff/qr/validate', 'POST', { qrData });
    },

    // Check in student
    checkIn: async (bookingId) => {
        return apiRequest('/staff/checkin', 'POST', { bookingId });
    },

    // Get check-in history
    getCheckIns: async () => {
        return apiRequest('/staff/checkins', 'GET');
    },

    // Get all bookings
    getAllBookings: async (filters = {}) => {
        const query = new URLSearchParams(filters).toString();
        return apiRequest(`/staff/bookings${query ? '?' + query : ''}`, 'GET');
    },

    // Get all notifications
    getNotifications: async () => {
        return apiRequest('/staff/notifications', 'GET');
    },

    // Create notification
    createNotification: async (data) => {
        return apiRequest('/staff/notifications', 'POST', data);
    },

    // Update notification
    updateNotification: async (id, data) => {
        return apiRequest(`/staff/notifications/${id}`, 'PUT', data);
    },

    // Delete notification
    deleteNotification: async (id) => {
        return apiRequest(`/staff/notifications/${id}`, 'DELETE');
    },

    // Toggle notification visibility
    toggleNotification: async (id, field) => {
        return apiRequest(`/staff/notifications/${id}/toggle?field=${field}`, 'PUT');
    },

    // Get prices
    getPrices: async () => {
        return apiRequest('/staff/prices', 'GET');
    },

    // Update prices
    updatePrices: async (facilityId, data) => {
        return apiRequest(`/staff/prices/${facilityId}`, 'PUT', data);
    },
};

// ================================================================
// QR API
// ================================================================

export const qrAPI = {
    // Get QR data for booking
    getQR: async (bookingId) => {
        return apiRequest(`/qr/${bookingId}`, 'GET');
    },
};

// ================================================================
// EXPORT TOKENS HELPERS
// ================================================================

export { getToken, setToken, getUser, setUser, clearAuth };