import mongoose from 'mongoose';

const adminAuditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      index: true,
    },
    admin: {
      type: String,
      default: 'Admin',
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    target: {
      type: String,
      default: 'System',
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    details: {
      type: String,
      default: '',
    },
    ip: {
      type: String,
      default: '127.0.0.1',
    },
    status: {
      type: String,
      enum: ['info', 'success', 'warning', 'danger'],
      default: 'info',
    },
  },
  {
    timestamps: true,
  }
);

const AdminAuditLog = mongoose.model('AdminAuditLog', adminAuditLogSchema);

export default AdminAuditLog;
