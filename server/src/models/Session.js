const mongoose = require('mongoose');
const { normalizeIdPlugin } = require('../utils/normalizeId');

const sessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    refreshTokenHash: {
      type: String,
      required: true
    },
    deviceInfo: {
      type: String,
      default: 'Unknown device / browser'
    },
    ipAddress: {
      type: String,
      default: ''
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true
    },
    isRevoked: {
      type: Boolean,
      default: false
    },
    lastActiveAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

sessionSchema.plugin(normalizeIdPlugin);

const Session = mongoose.model('Session', sessionSchema);
module.exports = Session;
