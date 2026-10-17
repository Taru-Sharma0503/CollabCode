import apiClient from './apiClient';

export const fileApi = {
  async list(workspaceId) {
    const res = await apiClient.get(`/workspaces/${workspaceId}/files`);
    return res.data;
  },

  async getById(workspaceId, fileId) {
    const res = await apiClient.get(`/workspaces/${workspaceId}/files/${fileId}`);
    return res.data;
  },

  async create(workspaceId, data) {
    const res = await apiClient.post(`/workspaces/${workspaceId}/files`, data);
    return res.data;
  },

  async update(workspaceId, fileId, data) {
    const res = await apiClient.patch(`/workspaces/${workspaceId}/files/${fileId}`, data);
    return res.data;
  },

  async delete(workspaceId, fileId) {
    await apiClient.delete(`/workspaces/${workspaceId}/files/${fileId}`);
  },

  async duplicate(workspaceId, fileId, data) {
    const res = await apiClient.post(`/workspaces/${workspaceId}/files/${fileId}/duplicate`, data);
    return res.data;
  }
};
