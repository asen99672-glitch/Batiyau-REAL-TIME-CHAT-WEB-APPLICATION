import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema(
  {
    reportedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reportType: {
      type: String,
      enum: ['user', 'message'],
      default: 'user',
    },
    message: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
    },
    category: {
      type: String,
      enum: ['harassment', 'spam', 'fake_account', 'inappropriate', 'fraud', 'other'],
      default: 'harassment',
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'under_investigation', 'resolved', 'rejected'],
      default: 'pending',
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    notes: {
      type: String,
      default: '',
    },
    actionTaken: {
      type: String,
      enum: ['none', 'warned', 'suspended', 'banned', 'message_deleted', 'dismissed'],
      default: 'none',
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    resolvedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const Report = mongoose.model('Report', reportSchema);

export default Report;
