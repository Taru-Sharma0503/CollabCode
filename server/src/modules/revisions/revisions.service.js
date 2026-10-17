const Revision = require('../../models/Revision');
const Workspace = require('../../models/Workspace');
const File = require('../../models/File');
const documentManager = require('../../collaboration/documentManager');
const { AppError } = require('../../middleware/errorHandler');
const { ERROR_CODES } = require('../../../../shared/contracts/constants');

class RevisionsService {
  async listRevisions(workspaceId, { page = 1, limit = 20 }) {
    const skip = (Math.max(1, parseInt(page, 10)) - 1) * Math.max(1, parseInt(limit, 10));
    const take = Math.min(100, Math.max(1, parseInt(limit, 10)));

    const total = await Revision.countDocuments({ workspaceId });
    const revisions = await Revision.find({ workspaceId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(take);

    const items = revisions.map((r) => ({
      id: r.id,
      workspaceId: r.workspaceId.toString(),
      createdBy: r.createdBy,
      message: r.message,
      version: r.version,
      fileCount: r.filesSnapshot?.length || 0,
      createdAt: r.createdAt
    }));

    return {
      items,
      pagination: {
        page: parseInt(page, 10) || 1,
        limit: take,
        total,
        totalPages: Math.ceil(total / take)
      }
    };
  }

  async getRevision(workspaceId, revisionId) {
    const revision = await Revision.findOne({ _id: revisionId, workspaceId });
    if (!revision) {
      throw new AppError('Revision not found.', 404, ERROR_CODES.NOT_FOUND);
    }

    return {
      id: revision.id,
      workspaceId: revision.workspaceId.toString(),
      createdBy: revision.createdBy,
      message: revision.message,
      version: revision.version,
      filesSnapshot: revision.filesSnapshot || [],
      createdAt: revision.createdAt
    };
  }

  async createRevision(workspaceId, user, { message }) {
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      throw new AppError('Revision message is required.', 422, ERROR_CODES.VALIDATION_ERROR);
    }

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      throw new AppError('Workspace not found.', 404, ERROR_CODES.NOT_FOUND);
    }

    // Flush any pending in-memory Yjs updates to ensure latest contents in File model
    await documentManager.flushAll();

    // Snapshot all current workspace files
    const currentFiles = await File.find({ workspaceId });
    const filesSnapshot = currentFiles.map((f) => ({
      fileId: f.id,
      parentId: f.parentId ? f.parentId.toString() : null,
      name: f.name,
      type: f.type,
      language: f.language,
      content: f.content || ''
    }));

    const nextVersion = (workspace.version || 1) + 1;
    workspace.version = nextVersion;
    await workspace.save();

    const revision = await Revision.create({
      workspaceId,
      createdBy: {
        id: user.id,
        name: user.name
      },
      message: message.trim(),
      version: nextVersion,
      filesSnapshot
    });

    return {
      id: revision.id,
      workspaceId: revision.workspaceId.toString(),
      createdBy: revision.createdBy,
      message: revision.message,
      version: revision.version,
      createdAt: revision.createdAt
    };
  }

  async compareRevisions(workspaceId, { fromId, toId }) {
    const [revFrom, revTo] = await Promise.all([
      Revision.findOne({ _id: fromId, workspaceId }),
      Revision.findOne({ _id: toId, workspaceId })
    ]);

    if (!revFrom || !revTo) {
      throw new AppError('One or both revisions for comparison not found.', 404, ERROR_CODES.NOT_FOUND);
    }

    const fromMap = new Map();
    (revFrom.filesSnapshot || []).forEach((f) => fromMap.set(f.fileId || f.name, f));

    const toMap = new Map();
    (revTo.filesSnapshot || []).forEach((f) => toMap.set(f.fileId || f.name, f));

    const allKeys = new Set([...fromMap.keys(), ...toMap.keys()]);
    const filesDiff = [];

    for (const key of allKeys) {
      const fromFile = fromMap.get(key);
      const toFile = toMap.get(key);

      if (!fromFile && toFile) {
        filesDiff.push({
          name: toFile.name,
          type: toFile.type,
          status: 'added',
          oldContent: '',
          newContent: toFile.content || ''
        });
      } else if (fromFile && !toFile) {
        filesDiff.push({
          name: fromFile.name,
          type: fromFile.type,
          status: 'deleted',
          oldContent: fromFile.content || '',
          newContent: ''
        });
      } else if (fromFile && toFile) {
        const isModified = fromFile.content !== toFile.content;
        filesDiff.push({
          name: toFile.name,
          type: toFile.type,
          status: isModified ? 'modified' : 'unchanged',
          oldContent: fromFile.content || '',
          newContent: toFile.content || ''
        });
      }
    }

    return {
      fromRevision: { id: revFrom.id, version: revFrom.version, message: revFrom.message },
      toRevision: { id: revTo.id, version: revTo.version, message: revTo.message },
      files: filesDiff
    };
  }

  async restoreRevision(workspaceId, revisionId, user, { expectedVersion }) {
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      throw new AppError('Workspace not found.', 404, ERROR_CODES.NOT_FOUND);
    }

    if (expectedVersion !== undefined && expectedVersion !== workspace.version) {
      throw new AppError('Version conflict: Workspace has changed since your last view.', 409, ERROR_CODES.VERSION_CONFLICT);
    }

    const revision = await Revision.findOne({ _id: revisionId, workspaceId });
    if (!revision) {
      throw new AppError('Revision to restore not found.', 404, ERROR_CODES.NOT_FOUND);
    }

    // 1. Create a safety snapshot of current state before replacing
    await this.createRevision(workspaceId, user, {
      message: `Automatic backup before restoring revision ${revision.version} (${revision.message})`
    });

    // 2. Restore files from revision snapshot
    await File.deleteMany({ workspaceId });

    for (const snap of revision.filesSnapshot || []) {
      const restoredFile = await File.create({
        workspaceId,
        parentId: snap.parentId || null,
        name: snap.name,
        type: snap.type,
        language: snap.language,
        content: snap.content || '',
        size: Buffer.byteLength(snap.content || '', 'utf8')
      });

      // Update in-memory Yjs doc if active
      const key = `${workspaceId}:${restoredFile.id}`;
      if (documentManager.docs.has(key)) {
        const docEntry = documentManager.docs.get(key);
        const ytext = docEntry.ydoc.getText('monaco');
        docEntry.ydoc.transact(() => {
          ytext.delete(0, ytext.length);
          ytext.insert(0, snap.content || '');
        });
      }
    }

    // Increment workspace version
    workspace.version = (workspace.version || 1) + 1;
    await workspace.save();

    return {
      revision: {
        id: revision.id,
        version: revision.version,
        message: revision.message
      },
      restoredAt: new Date().toISOString()
    };
  }
}

module.exports = new RevisionsService();
