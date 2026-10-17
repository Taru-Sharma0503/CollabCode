const mongoose = require('mongoose');
const { normalizeIdPlugin } = require('../utils/normalizeId');

const fileSnapshotSchema = new mongoose.Schema(
  {
    fileId: String,
    parentId: String,
    name: String,
    type: {
      type: String
    },
    language: String,
    content: String
  },
  { _id: false }
);

const revisionSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true
    },
    createdBy: {
      id: {
        type: String,
        required: true
      },
      name: {
        type: String,
        required: true
      }
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    version: {
      type: Number,
      required: true
    },
    filesSnapshot: [fileSnapshotSchema]
  },
  {
    timestamps: true
  }
);

revisionSchema.index({ workspaceId: 1, createdAt: -1 });
revisionSchema.plugin(normalizeIdPlugin);

const Revision = mongoose.model('Revision', revisionSchema);
module.exports = Revision;
