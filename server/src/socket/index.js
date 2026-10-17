const { verifyAccessToken } = require('../utils/token');
const { SOCKET_EVENTS, ROOMS } = require('../../../shared/contracts/socketEvents');
const registerWorkspaceHandlers = require('./handlers/workspace.handler');
const registerPresenceHandlers = require('./handlers/presence.handler');
const registerDocumentHandlers = require('./handlers/document.handler');
const registerChatHandlers = require('./handlers/chat.handler');
const awarenessManager = require('../collaboration/awarenessManager');

function initSocketIO(io) {
  // Authentication middleware for Socket.IO
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token ||
      (socket.handshake.headers.authorization && socket.handshake.headers.authorization.split(' ')[1]);

    if (!token) {
      return next(new Error('Authentication token required'));
    }

    const payload = verifyAccessToken(token);
    if (!payload || !payload.id) {
      return next(new Error('Invalid or expired authentication token'));
    }

    socket.user = {
      id: payload.id,
      email: payload.email,
      name: payload.name
    };

    next();
  });

  io.on('connection', (socket) => {
    // Join personal user room for direct notifications
    socket.join(ROOMS.user(socket.user.id));

    // Register event handlers
    registerWorkspaceHandlers(io, socket);
    registerPresenceHandlers(io, socket);
    registerDocumentHandlers(io, socket);
    registerChatHandlers(io, socket);

    socket.on('disconnect', (reason) => {
      // Clean up presence across all rooms
      const removedEntries = awarenessManager.removeSocketFromAll(socket.id, socket.user.id);
      for (const { workspaceId, presence } of removedEntries) {
        io.to(ROOMS.workspace(workspaceId)).emit(SOCKET_EVENTS.PRESENCE_UPDATED, presence);
      }
    });
  });

  return io;
}

module.exports = {
  initSocketIO
};
