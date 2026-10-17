const mongoose = require('mongoose');
const { normalizeIdPlugin } = require('../utils/normalizeId');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    passwordHash: {
      type: String,
      required: true
    },
    avatarUrl: {
      type: String,
      default: null
    },
    resetPasswordTokenHash: {
      type: String,
      default: null
    },
    resetPasswordExpiresAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

userSchema.plugin(normalizeIdPlugin);

userSchema.methods.toSafeObject = function () {
  const obj = this.toJSON();
  delete obj.passwordHash;
  delete obj.resetPasswordTokenHash;
  delete obj.resetPasswordExpiresAt;
  return obj;
};

const User = mongoose.model('User', userSchema);
module.exports = User;
