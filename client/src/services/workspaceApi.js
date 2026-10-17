import apiClient from './apiClient';

export const workspaceApi = {
  async list(params) {
    const res = await apiClient.get('/workspaces', { params });
    return res.data;
  },

  async create(data) {
    const res = await apiClient.post('/workspaces', data);
    return res.data;
  },

  async getById(workspaceId) {
    const res = await apiClient.get(`/workspaces/${workspaceId}`);
    return res.data;
  },

  async update(workspaceId, data) {
    const res = await apiClient.patch(`/workspaces/${workspaceId}`, data);
    return res.data;
  },

  async delete(workspaceId) {
    await apiClient.delete(`/workspaces/${workspaceId}`);
  },

  async getMembers(workspaceId) {
    const res = await apiClient.get(`/workspaces/${workspaceId}/members`);
    return res.data;
  },

  async inviteMember(workspaceId, data) {
    const res = await apiClient.post(`/workspaces/${workspaceId}/invitations`, data);
    return res.data;
  },

  async acceptInvitation(token) {
    const res = await apiClient.post(`/invitations/${token}/accept`);
    return res.data;
  },

  async updateMemberRole(workspaceId, userId, role) {
    const res = await apiClient.patch(`/workspaces/${workspaceId}/members/${userId}`, { role });
    return res.data;
  },

  async removeMember(workspaceId, userId) {
    await apiClient.delete(`/workspaces/${workspaceId}/members/${userId}`);
  },

  async getMessages(workspaceId, params) {
    const res = await apiClient.get(`/workspaces/${workspaceId}/messages`, { params });
    return res.data;
  }
};
