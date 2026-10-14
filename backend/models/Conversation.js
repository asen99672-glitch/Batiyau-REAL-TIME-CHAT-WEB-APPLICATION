import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema(
  {
    // Conversation mein kaun kaun hai (private: 2 users, group: multiple)
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    isGroup: {
      type: Boolean,
      default: false,
    },
    groupName: {
      type: String,
      trim: true,
      // Sirf group conversations ke liye
    },
    groupImage: {
      type: String,
      default: '',
    },
    groupDescription: {
      type: String,
      default: '',
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    groupAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    groupAdmins: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    groupPermissions: {
      editGroupSettings: { type: Boolean, default: true },
      sendMessages: { type: Boolean, default: true },
      addMembers: { type: Boolean, default: true },
      sendMessageHistory: { type: Boolean, default: true },
      approveNewMembers: { type: Boolean, default: false },
    },
    inviteCode: {
      type: String,
      default: '',
    },
    community: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Community',
    },
    isAnnouncementGroup: {
      type: Boolean,
      default: false,
    },
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
    disappearingTimer: {
      type: String,
      enum: ['off', '24h', '7d', '90d'],
      default: 'off',
    },
  },
  {
    timestamps: true,
  }
);

const Conversation = mongoose.model('Conversation', conversationSchema);

export default Conversation;
