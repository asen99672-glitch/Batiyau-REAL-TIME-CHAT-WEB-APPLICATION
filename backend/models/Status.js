import mongoose from 'mongoose';

const statusSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['text', 'image', 'video'],
      default: 'text',
    },
    // For media: file URL; for text: message string
    content: {
      type: String,
      required: true,
    },
    // Optional caption for image/video
    caption: {
      type: String,
      default: '',
      trim: true,
    },
    // Background color / gradient for text status
    backgroundColor: {
      type: String,
      default: '#128c7e',
    },
    fontFamily: {
      type: String,
      default: 'sans-serif',
    },
    // List of users who have viewed this status
    viewers: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        viewedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours TTL
      index: { expires: '1s' }, // MongoDB automatic TTL deletion
    },
  },
  {
    timestamps: true,
  }
);

// Index for fast query of active statuses within last 24h
statusSchema.index({ createdAt: -1 });
statusSchema.index({ user: 1, createdAt: -1 });

const Status = mongoose.model('Status', statusSchema);

export default Status;
