const Y = require('yjs');
const File = require('../models/File');
const DocumentSnapshot = require('../models/DocumentSnapshot');

class DocumentPersistence {
  /**
   * Load existing Yjs document state from DocumentSnapshot or bootstrap from File.content
   */
  async loadDocumentState(workspaceId, fileId, ydoc) {
    const latestSnapshot = await DocumentSnapshot.findOne({ workspaceId, fileId })
      .sort({ createdAt: -1 });

    if (latestSnapshot && latestSnapshot.state) {
      try {
        const binaryState = Buffer.from(latestSnapshot.state, 'base64');
        Y.applyUpdate(ydoc, binaryState);
        return { source: 'snapshot', version: latestSnapshot.version };
      } catch (err) {
        console.warn(`[DocumentPersistence] Failed to apply snapshot for file ${fileId}, falling back to file content:`, err.message);
      }
    }

    // Fallback to File.content for initial bootstrap
    const file = await File.findOne({ _id: fileId, workspaceId });
    if (file && file.content) {
      const ytext = ydoc.getText('monaco');
      if (ytext.length === 0) {
        ytext.insert(0, file.content);
      }
      return { source: 'file_content', version: 1 };
    }

    return { source: 'empty', version: 1 };
  }

  /**
   * Persist current Yjs document state to DocumentSnapshot and update File.content
   */
  async persistDocument(workspaceId, fileId, ydoc) {
    try {
      const stateUpdate = Y.encodeStateAsUpdate(ydoc);
      const base64State = Buffer.from(stateUpdate).toString('base64');
      const textContent = ydoc.getText('monaco').toString();
      const size = Buffer.byteLength(textContent, 'utf8');

      // Update current file content and size
      await File.updateOne(
        { _id: fileId, workspaceId },
        { content: textContent, size, updatedAt: new Date() }
      );

      // Create or update snapshot
      await DocumentSnapshot.create({
        workspaceId,
        fileId,
        state: base64State,
        version: 1
      });

      return true;
    } catch (err) {
      console.error(`[DocumentPersistence] Failed to persist file ${fileId}:`, err);
      return false;
    }
  }
}

module.exports = new DocumentPersistence();
