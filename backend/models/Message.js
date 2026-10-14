import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Private chat ke liye receiver
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
    },
    message: {
      type: String,
      default: '',
    },
    // End-to-End Encryption (E2EE)
    isEncrypted: {
      type: Boolean,
      default: false,
    },
    iv: {
      type: String,
      default: '',
    },
    messageType: {
      type: String,
      enum: ['text', 'image', 'video', 'audio', 'document', 'file'],
      default: 'text',
    },
    // File/Image attachments ke liye
    attachments: [
      {
        url: String,
        filename: String,
        size: Number,
        mimetype: String,
      },
    ],
    // Message reactions (WhatsApp style)
    reactions: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        emoji: {
          type: String,
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    // Message padhaa gaya ya nahi
    isRead: {
      type: Boolean,
      default: false,
    },
    // Message deliver hua ya nahi
    isDelivered: {
      type: Boolean,
      default: false,
    },
    // Message delete hua ya nahi
    isDeleted: {
      type: Boolean,
      default: false,
    },
    // Message star karne wale users
    starredBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    // Quoted message reply (WhatsApp style)
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
    },
    // Pinned message status
    isPinned: {
      type: Boolean,
      default: false,
    },
    pinnedAt: {
      type: Date,
    },
    pinnedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    // Reported message tracking
    isReported: {
      type: Boolean,
      default: false,
    },
    reportedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    // Delete for me (hides message only for users in this array)
    deletedFor: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Message = mongoose.model('Message', messageSchema);

export default Message;
