import apiClient from './apiClient';

export const revisionApi = {
  async list(workspaceId, params) {
    const res = await apiClient.get(`/workspaces/${workspaceId}/revisions`, { params });
    return res.data;
  },

  async getById(workspaceId, revisionId) {
    const res = await apiClient.get(`/workspaces/${workspaceId}/revisions/${revisionId}`);
    return res.data;
  },

  async create(workspaceId, data) {
    const res = await apiClient.post(`/workspaces/${workspaceId}/revisions`, data);
    return res.data;
  },

  async compare(workspaceId, fromId, toId) {
    const res = await apiClient.get(`/workspaces/${workspaceId}/revisions/compare`, {
      params: { from: fromId, to: toId }
    });
    return res.data;
  },

  async restore(workspaceId, revisionId, expectedVersion) {
    const res = await apiClient.post(`/workspaces/${workspaceId}/revisions/${revisionId}/restore`, {
      expectedVersion
    });
    return res.data;
  }
};
