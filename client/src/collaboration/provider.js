import * as Y from 'yjs';
import { SOCKET_EVENTS } from '../../../shared/contracts/socketEvents';

export class SocketIOYjsProvider {
  constructor({ workspaceId, fileId, ydoc, socket }) {
    this.workspaceId = workspaceId;
    this.fileId = fileId;
    this.ydoc = ydoc;
    this.socket = socket;
    this.connected = false;
    this.synced = false;

    this.onDocUpdate = this.handleDocUpdate.bind(this);
    this.onServerSync = this.handleServerSync.bind(this);
    this.onReconnect = this.handleReconnect.bind(this);

    this.init();
  }

  init() {
    // 1. Listen for local Yjs updates and send to server
    this.ydoc.on('update', this.onDocUpdate);

    // 2. Listen for remote sync events
    this.socket.on(SOCKET_EVENTS.DOCUMENT_SYNC, this.onServerSync);
    this.socket.on('connect', this.onReconnect);

    // 3. Join the document room
    this.joinDocument();
  }

  joinDocument() {
    if (!this.socket || !this.socket.connected) return;

    this.socket.emit(
      SOCKET_EVENTS.DOCUMENT_JOIN,
      { workspaceId: this.workspaceId, fileId: this.fileId },
      (response) => {
        if (response?.ok && response.initialUpdate) {
          try {
            const binaryUpdate = Uint8Array.from(atob(response.initialUpdate), (c) => c.charCodeAt(0));
            Y.applyUpdate(this.ydoc, binaryUpdate, 'server');
            this.synced = true;
            this.connected = true;
          } catch (err) {
            console.error('[YjsProvider] Failed to apply initial update:', err);
          }
        }
      }
    );
  }

  handleDocUpdate(update, origin) {
    // If update originated from server, do not echo back
    if (origin === 'server') return;

    if (this.socket && this.socket.connected) {
      const base64Update = btoa(String.fromCharCode(...update));
      this.socket.emit(SOCKET_EVENTS.DOCUMENT_SYNC, {
        workspaceId: this.workspaceId,
        fileId: this.fileId,
        update: base64Update
      });
    }
  }

  handleServerSync(data) {
    if (data.workspaceId === this.workspaceId && data.fileId === this.fileId) {
      try {
        const binaryUpdate = Uint8Array.from(atob(data.update), (c) => c.charCodeAt(0));
        Y.applyUpdate(this.ydoc, binaryUpdate, 'server');
      } catch (err) {
        console.error('[YjsProvider] Failed to apply server sync:', err);
      }
    }
  }

  handleReconnect() {
    this.joinDocument();
  }

  destroy() {
    this.ydoc.off('update', this.onDocUpdate);
    this.socket.off(SOCKET_EVENTS.DOCUMENT_SYNC, this.onServerSync);
    this.socket.off('connect', this.onReconnect);

    if (this.socket && this.socket.connected) {
      this.socket.emit(SOCKET_EVENTS.DOCUMENT_LEAVE, {
        workspaceId: this.workspaceId,
        fileId: this.fileId
      });
    }
  }
}
