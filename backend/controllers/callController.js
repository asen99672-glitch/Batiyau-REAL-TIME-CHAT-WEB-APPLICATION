import Call from '../models/Call.js';
import { emitToUser } from '../socket/socket.js';

// @desc    Get user's call history
// @route   GET /api/calls
// @access  Private
export const getCallHistory = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const calls = await Call.find({
      $or: [{ caller: userId }, { receiver: userId }],
    })
      .populate('caller', 'name username profilePicture status lastSeen')
      .populate('receiver', 'name username profilePicture status lastSeen')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(calls);
  } catch (error) {
    next(error);
  }
};

// @desc    Log a new call record
// @route   POST /api/calls
// @access  Private
export const createCallLog = async (req, res, next) => {
  try {
    const { receiverId, callerId, type, status, duration } = req.body;

    if (!receiverId) {
      return res.status(400).json({ message: 'Receiver ID is required' });
    }

    const actualCallerId = callerId || req.user._id;

    const call = await Call.create({
      caller: actualCallerId,
      receiver: receiverId,
      type: type || 'audio',
      status: status || 'completed',
      duration: duration || 0,
    });

    const populatedCall = await Call.findById(call._id)
      .populate('caller', 'name username profilePicture status lastSeen')
      .populate('receiver', 'name username profilePicture status lastSeen');

    // Real-time broadcast to both caller and receiver via Socket.IO
    const io = req.app.get('io');
    if (io && populatedCall) {
      const callerIdStr = (populatedCall.caller?._id || populatedCall.caller)?.toString();
      const receiverIdStr = (populatedCall.receiver?._id || populatedCall.receiver)?.toString();
      if (callerIdStr) {
        emitToUser(io, callerIdStr, 'callLogCreated', populatedCall);
      }
      if (receiverIdStr && receiverIdStr !== callerIdStr) {
        emitToUser(io, receiverIdStr, 'callLogCreated', populatedCall);
      }
    }

    res.status(201).json(populatedCall);
  } catch (error) {
    next(error);
  }
};

// @desc    Clear call history
// @route   DELETE /api/calls
// @access  Private
export const clearCallHistory = async (req, res, next) => {
  try {
    const userId = req.user._id;

    await Call.deleteMany({
      $or: [{ caller: userId }, { receiver: userId }],
    });

    const io = req.app.get('io');
    if (io) {
      emitToUser(io, userId, 'callHistoryCleared', { userId });
    }

    res.json({ message: 'Call history cleared successfully' });
  } catch (error) {
    next(error);
  }
};

