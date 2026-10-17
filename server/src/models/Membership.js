const mongoose = require('mongoose');
const { normalizeIdPlugin } = require('../utils/normalizeId');
const { ROLES } = require('../../../shared/contracts/constants');

const membershipSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.MEMBER,
      required: true
    }
  },
  {
    timestamps: true
  }
);

membershipSchema.index({ workspaceId: 1, userId: 1 }, { unique: true });
membershipSchema.plugin(normalizeIdPlugin);

const Membership = mongoose.model('Membership', membershipSchema);
module.exports = Membership;
