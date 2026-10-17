const mongoose = require('mongoose');
const { normalizeIdPlugin } = require('../utils/normalizeId');
const { ROLES } = require('../../../shared/contracts/constants');

const invitationSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.MEMBER,
      required: true
    },
    tokenHash: {
      type: String,
      required: true,
      index: true
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'revoked'],
      default: 'pending'
    }
  },
  {
    timestamps: true
  }
);

invitationSchema.plugin(normalizeIdPlugin);

const Invitation = mongoose.model('Invitation', invitationSchema);
module.exports = Invitation;
