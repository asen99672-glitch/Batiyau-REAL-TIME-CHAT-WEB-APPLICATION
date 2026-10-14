import mongoose from 'mongoose';

const systemNotificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Announcement title is required'],
      trim: true,
    },
    content: {
      type: String,
      required: [true, 'Announcement content is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: ['announcement', 'warning', 'maintenance', 'critical', 'update'],
      default: 'announcement',
    },
    level: {
      type: String,
      enum: ['info', 'warning', 'critical', 'maintenance'],
      default: 'info',
    },
    sentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    senderName: {
      type: String,
      default: 'Batiyao Official',
    },
    target: {
      type: String,
      enum: ['all', 'selected'],
      default: 'all',
    },
    targetUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    sendAsChatMessage: {
      type: Boolean,
      default: true,
    },
    recipientCount: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const SystemNotification = mongoose.model('SystemNotification', systemNotificationSchema);

export default SystemNotification;
