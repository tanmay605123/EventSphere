// Unified API Service — powered by Supabase with graceful fallback
import { supabaseService } from './supabaseService.js';

const API_BASE_URL = '/api';

const getCurrentLocalUser = () => {
  try {
    const raw = localStorage.getItem('eventsphere_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const getHeaders = (includeAuth = true) => {
  const headers = {
    'Content-Type': 'application/json',
  };
  if (includeAuth) {
    const token = localStorage.getItem('eventsphere_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return headers;
};

const handleResponse = async (response) => {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || 'Something went wrong');
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
};

export const api = {
  // -----------------------------------------------------------
  // AUTH
  // -----------------------------------------------------------
  async signup(userData) {
    // Directly register user in Supabase
    return await supabaseService.signUp(
      userData.name,
      userData.email,
      userData.password,
      userData.phone
    );
  },

  async login(credentials) {
    try {
      const res = await supabaseService.login(
        credentials.email,
        credentials.password
      );
      return res;
    } catch (err) {
      // If user was created in local backend, fallback to local backend
      try {
        const res = await fetch(`${API_BASE_URL}/login`, {
          method: 'POST',
          headers: getHeaders(false),
          body: JSON.stringify(credentials),
        });
        return await handleResponse(res);
      } catch {
        throw err;
      }
    }
  },

  // -----------------------------------------------------------
  // EVENTS
  // -----------------------------------------------------------
  async getEvents(filters = {}) {
    try {
      const res = await supabaseService.getEvents(filters);
      if (res && res.events && res.events.length > 0) {
        return res;
      }
    } catch (e) {
      console.warn('Supabase getEvents fallback notice', e);
    }

    // Fallback to Express backend if needed
    try {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.category && filters.category !== 'All') params.append('category', filters.category);
      if (filters.day && filters.day !== 'All') params.append('day', filters.day);
      if (filters.date) params.append('date', filters.date);
      if (filters.time && filters.time !== 'All') params.append('time', filters.time);

      const queryString = params.toString() ? `?${params.toString()}` : '';
      const res = await fetch(`${API_BASE_URL}/events${queryString}`, {
        method: 'GET',
        headers: getHeaders(true),
      });
      return await handleResponse(res);
    } catch {
      return await supabaseService.getEvents(filters);
    }
  },

  async getEventById(id) {
    const user = getCurrentLocalUser();
    const userId = user?.id || user?._id;

    try {
      const res = await supabaseService.getEventById(id, userId);
      if (res && res.event) {
        return res;
      }
    } catch (e) {
      console.warn('Supabase getEventById notice', e);
    }

    // Express backend fallback
    try {
      const res = await fetch(`${API_BASE_URL}/events/${id}`, {
        method: 'GET',
        headers: getHeaders(true),
      });
      const data = await handleResponse(res);
      const attendees = await supabaseService.getAttendeesForEvent(id);
      return {
        ...data,
        attendees: attendees.length > 0 ? attendees : (data.attendees || []),
      };
    } catch {
      return await supabaseService.getEventById(id, userId);
    }
  },

  async registerForEvent(eventId) {
    const user = getCurrentLocalUser();
    if (!user) {
      throw new Error('Please log in to register for this event');
    }

    try {
      const res = await supabaseService.registerForEvent(eventId, user);
      return res;
    } catch (err) {
      try {
        const res = await fetch(`${API_BASE_URL}/events/${eventId}/register`, {
          method: 'POST',
          headers: getHeaders(true),
        });
        return await handleResponse(res);
      } catch {
        throw err;
      }
    }
  },

  // -----------------------------------------------------------
  // ATTENDEES (For "user who registers also shows there")
  // -----------------------------------------------------------
  async getAttendeesForEvent(eventId) {
    return await supabaseService.getAttendeesForEvent(eventId);
  },

  // -----------------------------------------------------------
  // REGISTRATIONS & PROFILE
  // -----------------------------------------------------------
  async getMyRegistrations() {
    const user = getCurrentLocalUser();
    const userId = user?.id || user?._id;

    if (userId) {
      const res = await supabaseService.getMyRegistrations(userId);
      if (res?.registrations?.length > 0) {
        return res;
      }
    }

    try {
      const res = await fetch(`${API_BASE_URL}/profile/registrations`, {
        method: 'GET',
        headers: getHeaders(true),
      });
      return await handleResponse(res);
    } catch {
      return { registrations: [] };
    }
  },

  async cancelRegistration(regId) {
    const user = getCurrentLocalUser();
    const userId = user?.id || user?._id;

    if (userId) {
      await supabaseService.cancelRegistration(regId, userId);
    }

    try {
      const res = await fetch(`${API_BASE_URL}/registrations/${regId}`, {
        method: 'DELETE',
        headers: getHeaders(true),
      });
      return await handleResponse(res);
    } catch {
      return { success: true };
    }
  },

  async getProfile() {
    try {
      const sessionData = await supabaseService.getCurrentSession();
      if (sessionData?.user) {
        return { user: sessionData.user };
      }
    } catch (e) {
      console.warn('Supabase getProfile notice', e);
    }

    const res = await fetch(`${API_BASE_URL}/profile`, {
      method: 'GET',
      headers: getHeaders(true),
    });
    return handleResponse(res);
  },

  async updateProfile(profileData) {
    try {
      const res = await supabaseService.updateProfile(profileData);
      if (res?.user) {
        return res;
      }
    } catch (e) {
      console.warn('Supabase updateProfile notice', e);
    }

    const res = await fetch(`${API_BASE_URL}/profile`, {
      method: 'PUT',
      headers: getHeaders(true),
      body: JSON.stringify(profileData),
    });
    return handleResponse(res);
  },

  async updatePassword(passwordData) {
    try {
      if (passwordData.newPassword) {
        await supabaseService.changePassword(passwordData.newPassword);
        return { success: true, message: 'Password updated successfully' };
      }
    } catch (e) {
      console.warn('Supabase changePassword notice', e);
    }

    const res = await fetch(`${API_BASE_URL}/profile/password`, {
      method: 'PUT',
      headers: getHeaders(true),
      body: JSON.stringify(passwordData),
    });
    return handleResponse(res);
  },
};
