import apiClient from './apiClient';

export const executionApi = {
  async submit(workspaceId, data) {
    const res = await apiClient.post(`/workspaces/${workspaceId}/executions`, data);
    return res.data;
  },

  async getById(workspaceId, executionId) {
    const res = await apiClient.get(`/workspaces/${workspaceId}/executions/${executionId}`);
    return res.data;
  },

  async cancel(workspaceId, executionId) {
    const res = await apiClient.post(`/workspaces/${workspaceId}/executions/${executionId}/cancel`);
    return res.data;
  }
};
