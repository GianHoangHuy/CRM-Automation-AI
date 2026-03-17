const { Schema, model } = require('mongoose');

const sessionSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    token: { type: String, required: true },
    device: { type: String, default: 'unknown' },
    ipAddress: { type: String },
    expiresAt: { type: Date, required: true },
  },{ timestamps: true });

sessionSchema.pre('save', async function (next) {
  if (!this.expiresAt) {
    this.expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 2);
  }
  next();
});

sessionSchema.virtual('isActive').get(function () { return this.expiresAt > new Date(); });

module.exports = model('Session', sessionSchema);