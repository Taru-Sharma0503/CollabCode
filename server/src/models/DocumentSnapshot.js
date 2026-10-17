const mongoose = require('mongoose');
const { normalizeIdPlugin } = require('../utils/normalizeId');

const documentSnapshotSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true
    },
    fileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'File',
      required: true,
      index: true
    },
    state: {
      type: String, // Base64 encoded binary Yjs document state
      required: true
    },
    version: {
      type: Number,
      default: 1
    }
  },
  {
    timestamps: true
  }
);

documentSnapshotSchema.index({ workspaceId: 1, fileId: 1, createdAt: -1 });
documentSnapshotSchema.plugin(normalizeIdPlugin);

const DocumentSnapshot = mongoose.model('DocumentSnapshot', documentSnapshotSchema);
module.exports = DocumentSnapshot;
