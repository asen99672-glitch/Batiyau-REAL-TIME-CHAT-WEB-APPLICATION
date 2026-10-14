import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username cannot exceed 30 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Password by default API response mein nahi aayega
    },
    profilePicture: {
      type: String,
      default: '',
    },
    bio: {
      type: String,
      default: '',
      maxlength: [200, 'Bio cannot exceed 200 characters'],
    },
    status: {
      type: String,
      enum: ['online', 'offline', 'away'],
      default: 'offline',
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    lastLogin: {
      type: Date,
      default: Date.now,
    },
    phoneNumber: {
      type: String,
      trim: true,
      default: '',
    },
    // Current user ki phone contact list
    contacts: [
      {
        name: {
          type: String,
          trim: true,
        },
        phoneNumber: {
          type: String,
          trim: true,
          required: true,
        },
        username: {
          type: String,
          trim: true,
          default: '',
        },
        savedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    // WhatsApp Privacy Settings
    privacySettings: {
      lastSeen: {
        type: String,
        enum: ['everyone', 'contacts', 'contacts_except', 'nobody'],
        default: 'everyone',
      },
      lastSeenExcluded: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      online: {
        type: String,
        enum: ['everyone', 'same_as_last_seen'],
        default: 'everyone',
      },
      profilePicture: {
        type: String,
        enum: ['everyone', 'contacts', 'contacts_except', 'nobody'],
        default: 'everyone',
      },
      profilePictureExcluded: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      about: {
        type: String,
        enum: ['everyone', 'contacts', 'contacts_except', 'nobody'],
        default: 'everyone',
      },
      aboutExcluded: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      status: {
        type: String,
        enum: ['contacts', 'contacts_except', 'only_share_with'],
        default: 'contacts_except',
      },
      statusExcluded: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      statusOnlyWith: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      readReceipts: {
        type: Boolean,
        default: true,
      },
      defaultMessageTimer: {
        type: String,
        enum: ['off', '24h', '7d', '90d'],
        default: 'off',
      },
      groups: {
        type: String,
        enum: ['everyone', 'contacts', 'contacts_except'],
        default: 'everyone',
      },
      groupsExcluded: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      blockedContacts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      appLock: {
        type: String,
        enum: ['immediately', '1min', '15min', '30min', 'off'],
        default: '15min',
      },
      blockUnknownMessages: {
        type: Boolean,
        default: false,
      },
      protectIpInCalls: {
        type: Boolean,
        default: true,
      },
      turnOffLinkPreviews: {
        type: Boolean,
        default: false,
      },
    },
    // Role-based access control (Admin Panel)
    role: {
      type: String,
      enum: ['user', 'moderator', 'support_admin', 'security_admin', 'admin', 'superadmin'],
      default: 'user',
    },
    isOfficial: {
      type: Boolean,
      default: false,
    },
    // 1. Blocked User fields & History
    isBanned: {
      type: Boolean,
      default: false,
    },
    banReason: {
      type: String,
      default: '',
    },
    blockType: {
      type: String,
      enum: ['temporary', 'permanent'],
      default: 'permanent',
    },
    blockedAt: {
      type: Date,
    },
    blockedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    blockedByName: {
      type: String,
      default: '',
    },
    blockExpiryDate: {
      type: Date,
    },
    blockHistory: [
      {
        action: {
          type: String,
          enum: ['block', 'unblock', 'extend', 'reason_change', 'made_permanent'],
          required: true,
        },
        blockType: {
          type: String,
          enum: ['temporary', 'permanent'],
          default: 'permanent',
        },
        duration: {
          type: String,
          default: '',
        },
        reason: {
          type: String,
          default: '',
        },
        blockedAt: {
          type: Date,
          default: Date.now,
        },
        expiryDate: {
          type: Date,
        },
        adminId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        adminName: {
          type: String,
          default: 'Admin',
        },
        notificationSent: {
          type: Boolean,
          default: false,
        },
        notes: {
          type: String,
          default: '',
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // 2. Suspended User fields & History
    isSuspended: {
      type: Boolean,
      default: false,
    },
    suspendReason: {
      type: String,
      default: '',
    },
    suspendedAt: {
      type: Date,
    },
    suspendedUntil: {
      type: Date,
    },
    suspensionDuration: {
      type: String,
      default: '24 Hours',
    },
    suspendedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    suspendedByName: {
      type: String,
      default: '',
    },
    suspensionHistory: [
      {
        action: {
          type: String,
          enum: ['suspend', 'activate', 'extend'],
          required: true,
        },
        duration: {
          type: String,
          default: '',
        },
        reason: {
          type: String,
          default: '',
        },
        startedAt: {
          type: Date,
          default: Date.now,
        },
        endsAt: {
          type: Date,
        },
        adminId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        adminName: {
          type: String,
          default: 'Admin',
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // 3. Deleted / Archived User fields & History (OWASP Compliant)
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    deletedByName: {
      type: String,
      default: '',
    },
    deletionReason: {
      type: String,
      default: '',
    },
    deletionType: {
      type: String,
      enum: ['User requested', 'Admin action', 'Policy violation'],
      default: 'Admin action',
    },
    retentionExpiryDate: {
      type: Date,
    },
    isPurged: {
      type: Boolean,
      default: false,
    },
    purgedAt: {
      type: Date,
    },
    purgedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    purgedByName: {
      type: String,
      default: '',
    },
    deletionHistory: [
      {
        action: {
          type: String,
          enum: ['delete', 'restore', 'archive', 'purge'],
          required: true,
        },
        deletionType: {
          type: String,
          default: 'Admin action',
        },
        reason: {
          type: String,
          default: '',
        },
        notes: {
          type: String,
          default: '',
        },
        adminId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        adminName: {
          type: String,
          default: 'Admin',
        },
        performedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other', 'Not specified'],
      default: 'Not specified',
    },
    loginSessions: [
      {
        device: { type: String, default: 'Desktop' },
        browser: { type: String, default: 'Chrome' },
        os: { type: String, default: 'Windows' },
        ip: { type: String, default: '103.21.244.45' },
        lastActive: { type: Date, default: Date.now },
        current: { type: Boolean, default: false },
      },
    ],
    devices: [
      {
        deviceId: { type: String },
        name: { type: String },
        type: { type: String, default: 'web' },
        lastActive: { type: Date, default: Date.now },
      },
    ],
    // End-to-End Encryption (E2EE) Public Key (JWK String)
    publicKey: {
      type: String,
      default: '',
    },
    // Account Security (WhatsApp Account Settings)
    accountSecurity: {
      twoStepVerification: {
        enabled: { type: Boolean, default: false },
        pin: { type: String, default: '' },
      },
      securityNotifications: {
        type: Boolean,
        default: true,
      },
    },
    // Chats Preferences (WhatsApp Chat Settings)
    chatsPreferences: {
      enterIsSend: {
        type: Boolean,
        default: false,
      },
      fontSize: {
        type: String,
        enum: ['small', 'medium', 'large'],
        default: 'medium',
      },
      keepChatsArchived: {
        type: Boolean,
        default: true,
      },
      mediaAutoDownload: {
        photos: { type: Boolean, default: true },
        audio: { type: Boolean, default: true },
        videos: { type: Boolean, default: false },
        documents: { type: Boolean, default: true },
      },
    },
    // Notification Preferences (WhatsApp Notification Settings)
    notificationPreferences: {
      conversationTones: {
        type: Boolean,
        default: true,
      },
      showPreviews: {
        type: Boolean,
        default: true,
      },
      reactionNotifications: {
        type: Boolean,
        default: true,
      },
      sound: {
        type: String,
        default: 'default',
      },
    },
  },
  {
    timestamps: true, // createdAt and updatedAt auto manage hoga
  }
);

// Password save karne se pehle hash karo (bcrypt)
userSchema.pre('save', async function () {
  // Agar password change nahi hua toh hash mat karo
  if (!this.isModified('password')) return;

  // Salt generate karo aur password hash karo
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Password compare karne ka method
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;
