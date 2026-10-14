import mongoose from 'mongoose';

const securityEventSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['failed_login', 'new_device', 'suspicious_ip', 'session_revoked', 'password_changed', 'multiple_sessions'],
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    userIdentifier: {
      type: String, // email or phone attempted
      default: '',
    },
    ip: {
      type: String,
      default: '127.0.0.1',
    },
    device: {
      type: String,
      default: 'Unknown Device',
    },
    browser: {
      type: String,
      default: 'Unknown Browser',
    },
    location: {
      type: String,
      default: 'Local Network',
    },
    details: {
      type: String,
      default: '',
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'low',
    },
    isResolved: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const SecurityEvent = mongoose.model('SecurityEvent', securityEventSchema);

export default SecurityEvent;
