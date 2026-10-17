const Y = require('yjs');
const documentPersistence = require('./documentPersistence');

class DocumentManager {
  constructor() {
    this.docs = new Map(); // key: `${workspaceId}:${fileId}`, value: { ydoc, saveTimeout, lastSaved }
  }

  getKey(workspaceId, fileId) {
    return `${workspaceId}:${fileId}`;
  }

  async getOrCreateDoc(workspaceId, fileId) {
    const key = this.getKey(workspaceId, fileId);

    if (this.docs.has(key)) {
      return this.docs.get(key).ydoc;
    }

    const ydoc = new Y.Doc();
    await documentPersistence.loadDocumentState(workspaceId, fileId, ydoc);

    const docEntry = {
      ydoc,
      workspaceId,
      fileId,
      saveTimeout: null,
      lastSaved: Date.now()
    };

    // Attach listener to trigger debounced auto-persistence on changes
    ydoc.on('update', () => {
      this.scheduleSave(workspaceId, fileId);
    });

    this.docs.set(key, docEntry);
    return ydoc;
  }

  scheduleSave(workspaceId, fileId, delayMs = 3000) {
    const key = this.getKey(workspaceId, fileId);
    const docEntry = this.docs.get(key);
    if (!docEntry) return;

    if (docEntry.saveTimeout) {
      clearTimeout(docEntry.saveTimeout);
    }

    docEntry.saveTimeout = setTimeout(async () => {
      await documentPersistence.persistDocument(workspaceId, fileId, docEntry.ydoc);
      docEntry.lastSaved = Date.now();
      docEntry.saveTimeout = null;
    }, delayMs);
  }

  async applyClientUpdate(workspaceId, fileId, updateBuffer) {
    const ydoc = await this.getOrCreateDoc(workspaceId, fileId);
    Y.applyUpdate(ydoc, updateBuffer);
    return ydoc;
  }

  async getEncodedState(workspaceId, fileId) {
    const ydoc = await this.getOrCreateDoc(workspaceId, fileId);
    return Y.encodeStateAsUpdate(ydoc);
  }

  async flushAll() {
    for (const [key, docEntry] of this.docs.entries()) {
      if (docEntry.saveTimeout) {
        clearTimeout(docEntry.saveTimeout);
        docEntry.saveTimeout = null;
      }
      await documentPersistence.persistDocument(docEntry.workspaceId, docEntry.fileId, docEntry.ydoc);
    }
  }
}

module.exports = new DocumentManager();
