import apiClient from './apiClient';

export const commentApi = {
  async list(workspaceId, params) {
    const res = await apiClient.get(`/workspaces/${workspaceId}/comments`, { params });
    return res.data;
  },

  async create(workspaceId, data) {
    const res = await apiClient.post(`/workspaces/${workspaceId}/comments`, data);
    return res.data;
  },

  async reply(workspaceId, commentId, data) {
    const res = await apiClient.post(`/workspaces/${workspaceId}/comments/${commentId}/replies`, data);
    return res.data;
  },

  async update(workspaceId, commentId, data) {
    const res = await apiClient.patch(`/workspaces/${workspaceId}/comments/${commentId}`, data);
    return res.data;
  },

  async resolve(workspaceId, commentId) {
    const res = await apiClient.post(`/workspaces/${workspaceId}/comments/${commentId}/resolve`);
    return res.data;
  },

  async reopen(workspaceId, commentId) {
    const res = await apiClient.post(`/workspaces/${workspaceId}/comments/${commentId}/reopen`);
    return res.data;
  },

  async delete(workspaceId, commentId) {
    await apiClient.delete(`/workspaces/${workspaceId}/comments/${commentId}`);
  }
};
