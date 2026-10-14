import mongoose from 'mongoose';

const systemSettingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      unique: true,
      default: 'global_settings',
    },
    maintenanceMode: {
      type: Boolean,
      default: false,
    },
    allowNewRegistrations: {
      type: Boolean,
      default: true,
    },
    allowGroupCreation: {
      type: Boolean,
      default: true,
    },
    allowMediaUploads: {
      type: Boolean,
      default: true,
    },
    maxUploadSizeMb: {
      type: Number,
      default: 50,
    },
    allowCalling: {
      type: Boolean,
      default: true,
    },
    e2eeEnforced: {
      type: Boolean,
      default: true,
    },
    broadcastNotice: {
      type: String,
      default: '',
    },
    sessionTimeoutHours: {
      type: Number,
      default: 72,
    },
    spamThresholdPerHour: {
      type: Number,
      default: 60,
    },
    notificationSoundDefault: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const SystemSetting = mongoose.model('SystemSetting', systemSettingSchema);

export default SystemSetting;
