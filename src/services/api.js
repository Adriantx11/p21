const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Helper method to get auth headers
  getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    };
  }

  // Helper method to handle responses
  async handleResponse(response) {
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Something went wrong');
    }
    
    return data;
  }

  // Auth endpoints
  async login(email, password) {
    const response = await fetch(`${this.baseURL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const data = await this.handleResponse(response);
    
    // Store token
    if (data.token) {
      localStorage.setItem('token', data.token);
    }
    
    return data;
  }

  async register(name, email, password, numericId) {
    const response = await fetch(`${this.baseURL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, email, password, numericId })
    });

    const data = await this.handleResponse(response);
    
    // Store token
    if (data.token) {
      localStorage.setItem('token', data.token);
    }
    
    return data;
  }

  async logout() {
    try {
      await fetch(`${this.baseURL}/auth/logout`, {
        method: 'POST',
        headers: this.getAuthHeaders()
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always remove token from localStorage
      localStorage.removeItem('token');
    }
  }

  async getCurrentUser() {
    const response = await fetch(`${this.baseURL}/auth/me`, {
      headers: this.getAuthHeaders()
    });

    return this.handleResponse(response);
  }

  // User endpoints
  async updateProfile(updates) {
    const response = await fetch(`${this.baseURL}/users/profile`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(updates)
    });

    return this.handleResponse(response);
  }

  async changePassword(currentPassword, newPassword) {
    const response = await fetch(`${this.baseURL}/users/password`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ currentPassword, newPassword })
    });

    return this.handleResponse(response);
  }

  // Admin endpoints
  async getUsers() {
    const response = await fetch(`${this.baseURL}/users`, {
      headers: this.getAuthHeaders()
    });

    const data = await this.handleResponse(response);
    return data.users || data; // Return users array or full response
  }

  async updateUser(userId, updates) {
    const response = await fetch(`${this.baseURL}/users/${userId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(updates)
    });

    return this.handleResponse(response);
  }

  async deleteUser(userId) {
    const response = await fetch(`${this.baseURL}/users/${userId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });

    return this.handleResponse(response);
  }

  // Subscription endpoints
  async getSubscriptionPlans() {
    const response = await fetch(`${this.baseURL}/subscriptions/plans`);
    return this.handleResponse(response);
  }

  async upgradeSubscription(planId, paymentMethod = null) {
    const response = await fetch(`${this.baseURL}/subscriptions/upgrade`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ planId, paymentMethod })
    });

    const data = await this.handleResponse(response);
    
    // Update user data in localStorage if provided
    if (data.user) {
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUser = { ...currentUser, ...data.user };
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
    
    return data;
  }

  async getSubscriptionStatus() {
    const response = await fetch(`${this.baseURL}/subscriptions/status`, {
      headers: this.getAuthHeaders()
    });

    return this.handleResponse(response);
  }

  async cancelSubscription() {
    const response = await fetch(`${this.baseURL}/subscriptions/cancel`, {
      method: 'POST',
      headers: this.getAuthHeaders()
    });

    const data = await this.handleResponse(response);
    
    // Update user data in localStorage if provided
    if (data.user) {
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUser = { ...currentUser, ...data.user };
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
    
    return data;
  }

  // Admin subscription endpoints
  async getSubscriptionStats() {
    const response = await fetch(`${this.baseURL}/subscriptions/stats`, {
      headers: this.getAuthHeaders()
    });

    return this.handleResponse(response);
  }

  // Amazon Checker endpoints
  async getAmazonStats() {
    const response = await fetch(`${this.baseURL}/amazon/stats`, {
      headers: this.getAuthHeaders()
    });

    return this.handleResponse(response);
  }

  async getAmazonCookie() {
    const response = await fetch(`${this.baseURL}/amazon/get-cookie`, {
      headers: this.getAuthHeaders()
    });

    return this.handleResponse(response);
  }

  async getAmazonRegionalCookie() {
    const response = await fetch(`${this.baseURL}/amazon/get-regional-cookie`, {
      headers: this.getAuthHeaders()
    });

    return this.handleResponse(response);
  }

  async saveAmazonRegionalCookie(cookie) {
    const response = await fetch(`${this.baseURL}/amazon/save-regional-cookie`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ cookie })
    });

    return this.handleResponse(response);
  }
  
  async checkCardsWithRegionalCookie(cards) {
    const response = await fetch(`${this.baseURL}/amazon/check-regional-cards`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ cards })
    });

    return this.handleResponse(response);
  }

  async updateUserSubscription(userId, updates) {
    const response = await fetch(`${this.baseURL}/subscriptions/${userId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(updates)
    });

    return this.handleResponse(response);
  }

  // Health check
  async healthCheck() {
    const response = await fetch(`${this.baseURL}/health`);
    return this.handleResponse(response);
  }
}

// Create and export a single instance
const apiService = new ApiService();
export default apiService; 