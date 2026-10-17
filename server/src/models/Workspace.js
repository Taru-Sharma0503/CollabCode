const mongoose = require('mongoose');
const { normalizeIdPlugin } = require('../utils/normalizeId');

const workspaceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      default: '',
      trim: true
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
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

workspaceSchema.plugin(normalizeIdPlugin);

const Workspace = mongoose.model('Workspace', workspaceSchema);
module.exports = Workspace;
