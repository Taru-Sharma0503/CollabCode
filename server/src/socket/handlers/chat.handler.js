const Message = require('../../models/Message');
const Membership = require('../../models/Membership');
const { SOCKET_EVENTS, ROOMS } = require('../../../../shared/contracts/socketEvents');

function registerChatHandlers(io, socket) {
  socket.on(SOCKET_EVENTS.CHAT_SEND, async (data, callback) => {
    try {
      const { workspaceId, clientMessageId, body } = data || {};
      if (!workspaceId || !body || typeof body !== 'string' || body.trim().length === 0) {
        if (typeof callback === 'function') callback({ ok: false, error: 'workspaceId and message body are required' });
        return;
      }

      // Check membership
      const membership = await Membership.findOne({ workspaceId, userId: socket.user.id });
      if (!membership) {
        if (typeof callback === 'function') callback({ ok: false, error: 'Unauthorized: Not a workspace member' });
        return;
      }

      const message = await Message.create({
        workspaceId,
        sender: {
          id: socket.user.id,
          name: socket.user.name,
          avatarUrl: socket.user.avatarUrl || null
        },
        body: body.trim(),
        clientMessageId: clientMessageId || null
      });

      const canonicalMessage = {
        id: message.id,
        workspaceId: message.workspaceId.toString(),
        sender: message.sender,
        body: message.body,
        clientMessageId: message.clientMessageId,
        createdAt: message.createdAt
      };

      // Broadcast to all participants in workspace room
      io.to(ROOMS.workspace(workspaceId)).emit(SOCKET_EVENTS.CHAT_MESSAGE, canonicalMessage);

      if (typeof callback === 'function') {
        callback({
          ok: true,
          message: canonicalMessage
        });
      }
    } catch (err) {
      console.error('[Socket] chat:send error:', err);
      if (typeof callback === 'function') callback({ ok: false, error: err.message });
    }
  });
}

module.exports = registerChatHandlers;
