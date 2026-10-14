import mongoose from 'mongoose';
import Report from '../models/Report.js';
import User from '../models/User.js';
import Message from '../models/Message.js';
import AdminAuditLog from '../models/AdminAuditLog.js';

// Helper to log admin actions persistently
const logAdminAction = async (action, target, details, adminName = 'Admin', adminId = null, status = 'info', ip = '127.0.0.1') => {
  try {
    await AdminAuditLog.create({
      action,
      admin: adminName,
      adminId,
      target,
      details,
      status,
      ip,
    });
  } catch (err) {
    console.error('Failed to persist admin audit log:', err);
  }
};

export const getAdminReports = async (req, res) => {
  try {
    const { type, status, priority, search, page = 1, limit = 50 } = req.query;
    const query = {};

    if (type && type !== 'all') {
      if (type === 'user_reports') query.reportType = 'user';
      else if (type === 'message_reports') query.reportType = 'message';
      else if (type === 'group_reports') query.reportType = 'group';
      else query.category = type; // spam, harassment, fake_account, etc
    }
    if (status && status !== 'all') query.status = status;
    if (priority && priority !== 'all') query.severity = priority;
    
    // For simple text search, we can use regex if reason is searchable
    if (search && search.trim() !== '') {
      const term = search.trim();
      if (mongoose.Types.ObjectId.isValid(term)) {
        query._id = new mongoose.Types.ObjectId(term);
      } else {
        query.reason = new RegExp(term, 'i');
      }
    }

    const reports = await Report.find(query)
      .populate('reportedUser', 'name username profilePicture phoneNumber createdAt status lastSeen isBanned')
      .populate('reportedBy', 'name username profilePicture')
      .populate('resolvedBy', 'name username')
      .populate('message', 'content messageType attachments sender createdAt')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Report.countDocuments(query);

    res.json({ success: true, reports, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    console.error('Error in getAdminReports:', err);
    res.status(500).json({ message: 'Failed to fetch reports' });
  }
};

export const createReport = async (req, res) => {
  try {
    const { reportedUser, reportType, category, reason, messageId, severity } = req.body;
    
    const newReport = await Report.create({
      reportedUser,
      reportedBy: req.user._id,
      reportType: reportType || 'user',
      category: category || 'other',
      reason,
      message: messageId,
      severity: severity || 'medium',
    });

    const populatedReport = await Report.findById(newReport._id)
      .populate('reportedUser', 'name username profilePicture')
      .populate('reportedBy', 'name username profilePicture');

    // Notify admins via socket
    const io = req.app.get('io');
    if (io) {
      io.emit('adminReportCreated', populatedReport);
    }

    res.status(201).json({ success: true, report: populatedReport });
  } catch (err) {
    console.error('Error creating report:', err);
    res.status(500).json({ message: 'Failed to create report' });
  }
};

export const resolveAdminReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, actionTaken, notes } = req.body; // status: 'resolved', 'rejected', 'under_investigation'
    
    const report = await Report.findById(id);
    if (!report) return res.status(404).json({ message: 'Report not found' });

    if (status) report.status = status;
    if (actionTaken) report.actionTaken = actionTaken;
    if (notes) {
      report.notes = (report.notes ? report.notes + '\n\n' : '') + `[${new Date().toISOString()}] ${req.user.name}: ${notes}`;
    }
    
    if (status === 'resolved' || status === 'rejected') {
      report.resolvedBy = req.user._id;
      report.resolvedAt = new Date();
    }

    await report.save();

    await logAdminAction(
      `report_${status || 'updated'}`,
      report.reportedUser.toString(),
      `Report ${id} updated to ${status || report.status}. Action: ${actionTaken || 'none'}.`,
      req.user.name,
      req.user._id
    );

    const updatedReport = await Report.findById(id)
      .populate('reportedUser', 'name username profilePicture phoneNumber createdAt status lastSeen isBanned')
      .populate('reportedBy', 'name username profilePicture')
      .populate('resolvedBy', 'name username')
      .populate('message', 'content messageType attachments sender createdAt');

    const io = req.app.get('io');
    if (io) {
      io.emit('adminReportUpdated', { report: updatedReport });
    }

    res.json({ success: true, report: updatedReport });
  } catch (err) {
    console.error('Error resolving report:', err);
    res.status(500).json({ message: 'Failed to update report' });
  }
};
