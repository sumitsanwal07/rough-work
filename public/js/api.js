// public/js/api.js - Frontend API Client & State Management

class ApiClient {
  constructor() {
    this.token = localStorage.getItem('ceh_token') || null;
    this.currentUser = JSON.parse(localStorage.getItem('ceh_user') || 'null');
    this.listeners = [];
  }

  onAuthChange(callback) {
    this.listeners.push(callback);
  }

  notifyAuthChange() {
    this.listeners.forEach(cb => cb(this.currentUser));
  }

  setSession(user, token) {
    this.currentUser = user;
    this.token = token;
    localStorage.setItem('ceh_token', token);
    localStorage.setItem('ceh_user', JSON.stringify(user));
    this.notifyAuthChange();
  }

  clearSession() {
    this.currentUser = null;
    this.token = null;
    localStorage.removeItem('ceh_token');
    localStorage.removeItem('ceh_user');
    this.notifyAuthChange();
  }

  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(endpoint, {
        ...options,
        headers
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired or invalid
          if (this.token) {
            this.clearSession();
          }
        }
        throw new Error(data.error || `HTTP error ${response.status}`);
      }

      return data;
    } catch (err) {
      console.error(`API Error on ${endpoint}:`, err);
      throw err;
    }
  }

  // Auth Methods
  async registerStudent(formData) {
    const res = await this.request('/api/auth/register-student', {
      method: 'POST',
      body: JSON.stringify(formData)
    });
    this.setSession(res.user, res.token);
    return res;
  }

  async registerOrganizer(formData) {
    const res = await this.request('/api/auth/register-organizer', {
      method: 'POST',
      body: JSON.stringify(formData)
    });
    this.setSession(res.user, res.token);
    return res;
  }

  async login(email, password, requiredRole = null) {
    const res = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, requiredRole })
    });
    this.setSession(res.user, res.token);
    return res;
  }

  async logout() {
    try {
      await this.request('/api/auth/logout', { method: 'POST' });
    } catch (e) {}
    this.clearSession();
  }

  async fetchMe() {
    if (!this.token) return null;
    try {
      const res = await this.request('/api/auth/me');
      this.currentUser = res.user;
      localStorage.setItem('ceh_user', JSON.stringify(res.user));
      this.notifyAuthChange();
      return res.user;
    } catch (e) {
      this.clearSession();
      return null;
    }
  }

  async forgotPassword(email) {
    return this.request('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  }

  async resetPassword(email, newPassword) {
    return this.request('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, newPassword })
    });
  }

  async updateProfile(profileData) {
    const res = await this.request('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
    this.currentUser = res.user;
    localStorage.setItem('ceh_user', JSON.stringify(res.user));
    this.notifyAuthChange();
    return res.user;
  }

  // Events Methods
  async getEvents(params = {}) {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.category && params.category !== 'All') query.append('category', params.category);
    if (params.dateFilter) query.append('dateFilter', params.dateFilter);
    return this.request(`/api/events?${query.toString()}`);
  }

  async getEventById(id) {
    return this.request(`/api/events/${id}`);
  }

  async createEvent(eventData) {
    return this.request('/api/events', {
      method: 'POST',
      body: JSON.stringify(eventData)
    });
  }

  async updateEvent(id, eventData) {
    return this.request(`/api/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(eventData)
    });
  }

  async cancelEvent(id) {
    return this.request(`/api/events/${id}`, {
      method: 'DELETE'
    });
  }

  // RSVPs
  async toggleRsvp(eventId, notes = '') {
    return this.request(`/api/events/${eventId}/rsvp`, {
      method: 'POST',
      body: JSON.stringify({ notes })
    });
  }

  async getMyRsvps(filter = 'all') {
    return this.request(`/api/rsvps/my?filter=${filter}`);
  }

  async getEventAttendees(eventId) {
    return this.request(`/api/events/${eventId}/attendees`);
  }

  // Organizer
  async getOrganizerEvents() {
    return this.request('/api/organizer/events');
  }

  // Admin
  async getAdminPending() {
    return this.request('/api/admin/pending');
  }

  async approveEvent(eventId) {
    return this.request(`/api/admin/events/${eventId}/approve`, {
      method: 'POST'
    });
  }

  async rejectEvent(eventId, reason) {
    return this.request(`/api/admin/events/${eventId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
  }

  async getAdminAllEvents(params = {}) {
    const query = new URLSearchParams();
    if (params.status) query.append('status', params.status);
    if (params.category) query.append('category', params.category);
    if (params.search) query.append('search', params.search);
    return this.request(`/api/admin/events?${query.toString()}`);
  }

  async getAdminStats() {
    return this.request('/api/admin/stats');
  }

  async getAuditLogs(limit = 100) {
    return this.request(`/api/admin/audit-logs?limit=${limit}`);
  }

  async getOrganizerApplications(status = 'all') {
    return this.request(`/api/admin/organizer-applications?status=${status}`);
  }

  async reviewOrganizerApp(id, status) {
    return this.request(`/api/admin/organizer-applications/${id}/review`, {
      method: 'POST',
      body: JSON.stringify({ status })
    });
  }

  async getUsers(params = {}) {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.role) query.append('role', params.role);
    return this.request(`/api/admin/users?${query.toString()}`);
  }

  async updateUserRole(userId, role) {
    return this.request(`/api/admin/users/${userId}/role`, {
      method: 'POST',
      body: JSON.stringify({ role })
    });
  }

  // Notifications
  async getNotifications() {
    return this.request('/api/notifications');
  }

  async getUnreadCount() {
    return this.request('/api/notifications/unread-count');
  }

  async markNotificationRead(id) {
    return this.request(`/api/notifications/${id}/read`, { method: 'POST' });
  }

  async markAllNotificationsRead() {
    return this.request('/api/notifications/read-all', { method: 'POST' });
  }

  async clearNotifications() {
    return this.request('/api/notifications', { method: 'DELETE' });
  }

  // Reminders
  async getReminderPreferences() {
    return this.request('/api/reminders/preferences');
  }

  async updateReminderPreferences(prefs) {
    return this.request('/api/reminders/preferences', {
      method: 'POST',
      body: JSON.stringify(prefs)
    });
  }

  async runReminderScan() {
    return this.request('/api/reminders/scan', { method: 'POST' });
  }
}

export const api = new ApiClient();

// Toast notification helper
export function showToast(message, type = 'info', duration = 4000) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  let iconSvg = '';
  if (type === 'success') {
    iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
  } else if (type === 'error') {
    iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f87171" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
  } else {
    iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
  }

  toast.innerHTML = `
    ${iconSvg}
    <div style="flex: 1; word-break: break-word;">${message}</div>
    <button style="color: #64748b; font-size: 1.1rem; padding: 2px;" onclick="this.parentElement.remove()">&times;</button>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(50px)';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}
