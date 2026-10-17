const mongoose = require('mongoose');
const { normalizeIdPlugin } = require('../utils/normalizeId');
const { FILE_TYPES } = require('../../../shared/contracts/constants');

const fileSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'File',
      default: null,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: Object.values(FILE_TYPES),
      default: FILE_TYPES.FILE,
      required: true
    },
    language: {
      type: String,
      default: 'javascript'
    },
    size: {
      type: Number,
      default: 0
    },
    content: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

fileSchema.index({ workspaceId: 1, parentId: 1, name: 1 }, { unique: true });
fileSchema.plugin(normalizeIdPlugin);

const File = mongoose.model('File', fileSchema);
module.exports = File;
