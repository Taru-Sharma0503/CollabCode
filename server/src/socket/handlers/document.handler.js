const Membership = require('../../models/Membership');
const File = require('../../models/File');
const documentManager = require('../../collaboration/documentManager');
const { SOCKET_EVENTS, ROOMS } = require('../../../../shared/contracts/socketEvents');

function registerDocumentHandlers(io, socket) {
  socket.on(SOCKET_EVENTS.DOCUMENT_JOIN, async (data, callback) => {
    try {
      const { workspaceId, fileId } = data || {};
      if (!workspaceId || !fileId) {
        if (typeof callback === 'function') callback({ ok: false, error: 'workspaceId and fileId are required' });
        return;
      }

      // Check membership
      const membership = await Membership.findOne({ workspaceId, userId: socket.user.id });
      if (!membership) {
        if (typeof callback === 'function') callback({ ok: false, error: 'Unauthorized: Not a workspace member' });
        return;
      }

      // Verify file exists
      const file = await File.findOne({ _id: fileId, workspaceId });
      if (!file) {
        if (typeof callback === 'function') callback({ ok: false, error: 'File not found' });
        return;
      }

      const room = ROOMS.document(workspaceId, fileId);
      socket.join(room);

      // Get initial Yjs document state
      const encodedState = await documentManager.getEncodedState(workspaceId, fileId);
      const base64Update = Buffer.from(encodedState).toString('base64');

      if (typeof callback === 'function') {
        callback({
          ok: true,
          documentId: fileId,
          initialUpdate: base64Update
        });
      }
    } catch (err) {
      console.error('[Socket] document:join error:', err);
      if (typeof callback === 'function') callback({ ok: false, error: err.message });
    }
  });

  socket.on(SOCKET_EVENTS.DOCUMENT_LEAVE, (data, callback) => {
    try {
      const { workspaceId, fileId } = data || {};
      if (workspaceId && fileId) {
        socket.leave(ROOMS.document(workspaceId, fileId));
      }
      if (typeof callback === 'function') callback({ ok: true });
    } catch (err) {
      if (typeof callback === 'function') callback({ ok: false, error: err.message });
    }
  });

  socket.on(SOCKET_EVENTS.DOCUMENT_SYNC, async (data) => {
    try {
      const { workspaceId, fileId, update } = data || {};
      if (!workspaceId || !fileId || !update) return;

      const updateBuffer = typeof update === 'string'
        ? Buffer.from(update, 'base64')
        : Buffer.from(update);

      // Apply update to server Y.Doc
      await documentManager.applyClientUpdate(workspaceId, fileId, updateBuffer);

      // Broadcast update to other collaborators in the same document room
      socket.to(ROOMS.document(workspaceId, fileId)).emit(SOCKET_EVENTS.DOCUMENT_SYNC, {
        workspaceId,
        fileId,
        update: typeof update === 'string' ? update : Buffer.from(update).toString('base64'),
        senderId: socket.user.id
      });
    } catch (err) {
      console.error('[Socket] document:sync error:', err);
    }
  });
}

module.exports = registerDocumentHandlers;
