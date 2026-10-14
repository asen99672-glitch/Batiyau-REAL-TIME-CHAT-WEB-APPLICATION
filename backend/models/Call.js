import mongoose from 'mongoose';

const callSchema = new mongoose.Schema(
  {
    caller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['audio', 'video'],
      default: 'audio',
    },
    status: {
      type: String,
      enum: ['incoming', 'outgoing', 'missed', 'completed', 'declined'],
      default: 'completed',
    },
    duration: {
      type: Number, // Duration in seconds
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Call = mongoose.model('Call', callSchema);

export default Call;
