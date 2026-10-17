import apiClient, { setAccessToken } from './apiClient';

export const authApi = {
  async register(data) {
    const res = await apiClient.post('/auth/register', data);
    if (res.data?.accessToken) {
      setAccessToken(res.data.accessToken);
    }
    return res.data;
  },

  async login(data) {
    const res = await apiClient.post('/auth/login', data);
    if (res.data?.accessToken) {
      setAccessToken(res.data.accessToken);
    }
    return res.data;
  },

  async refresh() {
    const res = await apiClient.post('/auth/refresh');
    if (res.data?.accessToken) {
      setAccessToken(res.data.accessToken);
    }
    return res.data;
  },

  async logout() {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      setAccessToken(null);
    }
  },

  async getMe() {
    const res = await apiClient.get('/auth/me');
    return res.data;
  },

  async forgotPassword(data) {
    const res = await apiClient.post('/auth/forgot-password', data);
    return res.data;
  },

  async resetPassword(data) {
    const res = await apiClient.post('/auth/reset-password', data);
    return res.data;
  },

  async updateProfile(data) {
    const res = await apiClient.patch('/users/me', data);
    return res.data;
  },

  async updatePassword(data) {
    const res = await apiClient.patch('/users/me/password', data);
    return res.data;
  },

  async getSessions() {
    const res = await apiClient.get('/users/me/sessions');
    return res.data;
  },

  async revokeSession(sessionId) {
    await apiClient.delete(`/users/me/sessions/${sessionId}`);
  }
};
