const Membership = require('../../models/Membership');
const Workspace = require('../../models/Workspace');
const awarenessManager = require('../../collaboration/awarenessManager');
const { SOCKET_EVENTS, ROOMS } = require('../../../../shared/contracts/socketEvents');
const { PRESENCE_STATUS } = require('../../../../shared/contracts/constants');

function registerWorkspaceHandlers(io, socket) {
  socket.on(SOCKET_EVENTS.WORKSPACE_JOIN, async (data, callback) => {
    try {
      const { workspaceId } = data || {};
      if (!workspaceId) {
        if (typeof callback === 'function') callback({ ok: false, error: 'workspaceId required' });
        return;
      }

      // Check membership
      const membership = await Membership.findOne({ workspaceId, userId: socket.user.id });
      if (!membership) {
        if (typeof callback === 'function') callback({ ok: false, error: 'Unauthorized: Not a workspace member' });
        return;
      }

      const workspace = await Workspace.findById(workspaceId);
      if (!workspace) {
        if (typeof callback === 'function') callback({ ok: false, error: 'Workspace not found' });
        return;
      }

      // Join room
      const room = ROOMS.workspace(workspaceId);
      socket.join(room);

      // Track presence
      const presenceObj = awarenessManager.setPresence(workspaceId, socket.user, {
        status: PRESENCE_STATUS.ACTIVE,
        socketId: socket.id
      });

      // Broadcast presence updated to all peers in workspace
      socket.to(room).emit(SOCKET_EVENTS.PRESENCE_UPDATED, presenceObj);

      const allPresence = awarenessManager.getWorkspacePresence(workspaceId);

      if (typeof callback === 'function') {
        callback({
          ok: true,
          workspace: { id: workspace.id, name: workspace.name },
          presence: allPresence
        });
      }
    } catch (err) {
      console.error('[Socket] workspace:join error:', err);
      if (typeof callback === 'function') callback({ ok: false, error: err.message });
    }
  });

  socket.on(SOCKET_EVENTS.WORKSPACE_LEAVE, async (data, callback) => {
    try {
      const { workspaceId } = data || {};
      if (workspaceId) {
        const room = ROOMS.workspace(workspaceId);
        socket.leave(room);

        const offline = awarenessManager.removeSocket(workspaceId, socket.user.id, socket.id);
        if (offline) {
          io.to(room).emit(SOCKET_EVENTS.PRESENCE_UPDATED, offline);
        }
      }

      if (typeof callback === 'function') {
        callback({ ok: true });
      }
    } catch (err) {
      if (typeof callback === 'function') callback({ ok: false, error: err.message });
    }
  });
}

module.exports = registerWorkspaceHandlers;
