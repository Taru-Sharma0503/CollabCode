const mongoose = require('mongoose');
const { normalizeIdPlugin } = require('../utils/normalizeId');

const messageSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true
    },
    sender: {
      id: {
        type: String,
        required: true
      },
      name: {
        type: String,
        required: true
      },
      avatarUrl: {
        type: String,
        default: null
      }
    },
    body: {
      type: String,
      required: true,
      trim: true
    },
    clientMessageId: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
);

messageSchema.index({ workspaceId: 1, createdAt: -1 });
messageSchema.plugin(normalizeIdPlugin);

const Message = mongoose.model('Message', messageSchema);
module.exports = Message;
