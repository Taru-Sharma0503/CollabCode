const mongoose = require('mongoose');
const { normalizeIdPlugin } = require('../utils/normalizeId');
const { EXECUTION_STATUS } = require('../../../shared/contracts/constants');

const executionSchema = new mongoose.Schema(
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
    language: {
      type: String,
      required: true
    },
    stdin: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: Object.values(EXECUTION_STATUS),
      default: EXECUTION_STATUS.QUEUED,
      required: true
    },
    stdout: {
      type: String,
      default: ''
    },
    stderr: {
      type: String,
      default: ''
    },
    exitCode: {
      type: Number,
      default: null
    },
    duration: {
      type: Number,
      default: null
    }
  },
  {
    timestamps: true
  }
);

executionSchema.plugin(normalizeIdPlugin);

const Execution = mongoose.model('Execution', executionSchema);
module.exports = Execution;
