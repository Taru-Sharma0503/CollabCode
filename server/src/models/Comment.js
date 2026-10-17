const mongoose = require('mongoose');
const { normalizeIdPlugin } = require('../utils/normalizeId');
const { COMMENT_STATUS } = require('../../../shared/contracts/constants');

const commentSchema = new mongoose.Schema(
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
    author: {
      id: {
        type: String,
        required: true
      },
      name: {
        type: String,
        required: true
      }
    },
    body: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      enum: Object.values(COMMENT_STATUS),
      default: COMMENT_STATUS.OPEN
    },
    anchor: {
      start: {
        type: Number,
        required: true
      },
      end: {
        type: Number,
        required: true
      }
    },
    replies: [
      {
        id: {
          type: String,
          default: () => new mongoose.Types.ObjectId().toString()
        },
        author: {
          id: {
            type: String,
            required: true
          },
          name: {
            type: String,
            required: true
          }
        },
        body: {
          type: String,
          required: true
        },
        createdAt: {
          type: Date,
          default: Date.now
        }
      }
    ]
  },
  {
    timestamps: true
  }
);

commentSchema.index({ workspaceId: 1, fileId: 1, status: 1 });
commentSchema.plugin(normalizeIdPlugin);

const Comment = mongoose.model('Comment', commentSchema);
module.exports = Comment;
