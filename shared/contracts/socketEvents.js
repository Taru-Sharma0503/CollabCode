/**
 * Shared Socket.IO Event Contract Definitions
 */

export const SOCKET_EVENTS = {
  // Client -> Server
  WORKSPACE_JOIN: 'workspace:join',
  WORKSPACE_LEAVE: 'workspace:leave',
  PRESENCE_UPDATE: 'presence:update',
  DOCUMENT_JOIN: 'document:join',
  DOCUMENT_LEAVE: 'document:leave',
  DOCUMENT_SYNC: 'document:sync',
  CHAT_SEND: 'chat:send',

  // Server -> Client
  PRESENCE_UPDATED: 'presence:updated',
  DOCUMENT_CHANGED: 'document:changed',
  FILE_CREATED: 'file:created',
  FILE_RENAMED: 'file:renamed',
  FILE_DELETED: 'file:deleted',
  CHAT_MESSAGE: 'chat:message',
  COMMENT_CREATED: 'comment:created',
  COMMENT_RESOLVED: 'comment:resolved',
  EXECUTION_OUTPUT: 'execution:output',
  EXECUTION_STATUS: 'execution:status',
  SERVER_ERROR: 'server:error'
};

export const ROOMS = {
  workspace: (workspaceId) => `workspace:${workspaceId}`,
  document: (workspaceId, fileId) => `document:${workspaceId}:${fileId}`,
  user: (userId) => `user:${userId}`
};

export default {
  SOCKET_EVENTS,
  ROOMS
};
