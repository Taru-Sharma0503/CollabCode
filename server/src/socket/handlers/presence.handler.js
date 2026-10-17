const awarenessManager = require('../../collaboration/awarenessManager');
const { SOCKET_EVENTS, ROOMS } = require('../../../../shared/contracts/socketEvents');

function registerPresenceHandlers(io, socket) {
  socket.on(SOCKET_EVENTS.PRESENCE_UPDATE, (data) => {
    try {
      const { workspaceId, activeFileId, status, cursor } = data || {};
      if (!workspaceId) return;

      const updated = awarenessManager.setPresence(workspaceId, socket.user, {
        status,
        activeFileId,
        cursor,
        socketId: socket.id
      });

      // Broadcast to everyone else in the workspace
      socket.to(ROOMS.workspace(workspaceId)).emit(SOCKET_EVENTS.PRESENCE_UPDATED, updated);
    } catch (err) {
      console.error('[Socket] presence:update error:', err);
    }
  });
}

module.exports = registerPresenceHandlers;
