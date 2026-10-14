import Status from '../models/Status.js';
import User from '../models/User.js';

// @desc    Get all active statuses (last 24 hours)
// @route   GET /api/status
// @access  Private
export const getAllStatuses = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);
    const currentUserId = req.user._id.toString();
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Fetch statuses not expired
    const activeStatuses = await Status.find({
      createdAt: { $gte: twentyFourHoursAgo },
    })
      .populate('user', 'name username profilePicture privacySettings contacts phoneNumber')
      .populate('viewers.user', 'name username profilePicture')
      .sort({ createdAt: 1 });

    const myBlocked = (currentUser?.privacySettings?.blockedContacts || []).map((id) => (id._id || id).toString());
    const normalizePhone = (p) => (p || '').replace(/\D/g, '');

    // Group statuses by user
    const myStatuses = [];
    const othersGrouped = {};

    activeStatuses.forEach((status) => {
      const statusUser = status.user;
      const statusUserId = statusUser?._id?.toString();
      if (!statusUserId) return;

      if (statusUserId === currentUserId) {
        myStatuses.push(status);
        return;
      }

      // Check blocking
      if (myBlocked.includes(statusUserId)) return;
      const theirBlocked = (statusUser?.privacySettings?.blockedContacts || []).map((id) => (id._id || id).toString());
      if (theirBlocked.includes(currentUserId)) return;

      // Check status privacy rules
      const creatorPrivacy = statusUser?.privacySettings || {};
      const statusRule = creatorPrivacy.status || 'contacts';

      if (statusRule === 'contacts_except') {
        const excluded = (creatorPrivacy.statusExcluded || []).map((id) => (id._id || id).toString());
        if (excluded.includes(currentUserId)) return;
      } else if (statusRule === 'only_share_with') {
        const onlyWith = (creatorPrivacy.statusOnlyWith || []).map((id) => (id._id || id).toString());
        if (!onlyWith.includes(currentUserId)) return;
      } else if (statusRule === 'contacts') {
        // Must be in creator's contacts
        const creatorContacts = statusUser.contacts || [];
        const isCurrentInContacts = creatorContacts.some((c) => {
          const d1 = normalizePhone(c.phoneNumber);
          const d2 = normalizePhone(currentUser?.phoneNumber);
          return d1 && d2 && d1.slice(-10) === d2.slice(-10);
        });
        if (!isCurrentInContacts) return;
      }

      const safeUser = {
        _id: statusUser._id,
        name: statusUser.name,
        username: statusUser.username,
        profilePicture: statusUser.profilePicture,
      };

      if (!othersGrouped[statusUserId]) {
        othersGrouped[statusUserId] = {
          user: safeUser,
          statuses: [],
          hasUnseen: false,
          lastUpdated: status.createdAt,
        };
      }
      othersGrouped[statusUserId].statuses.push(status);
      othersGrouped[statusUserId].lastUpdated = status.createdAt;

      // Check if current user has viewed this status
      const isViewedByMe = status.viewers?.some(
        (v) => (v.user?._id || v.user)?.toString() === currentUserId
      );
      if (!isViewedByMe) {
        othersGrouped[statusUserId].hasUnseen = true;
      }
    });

    const recentUpdates = [];
    const viewedUpdates = [];

    Object.values(othersGrouped).forEach((group) => {
      if (group.hasUnseen) {
        recentUpdates.push(group);
      } else {
        viewedUpdates.push(group);
      }
    });

    // Sort by latest update time descending
    recentUpdates.sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated));
    viewedUpdates.sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated));

    res.json({
      myStatuses,
      recentUpdates,
      viewedUpdates,
    });
  } catch (error) {
    console.error('Error fetching statuses:', error);
    res.status(500).json({ message: 'Failed to fetch statuses' });
  }
};

// @desc    Create new status (text or media)
// @route   POST /api/status
// @access  Private
export const createStatus = async (req, res) => {
  try {
    const { type, content, caption, backgroundColor, fontFamily } = req.body;
    let statusData = {
      user: req.user._id,
      type: type || 'text',
    };

    if (req.file) {
      const fileUrl = `/uploads/${req.file.filename}`;
      const isVideo = req.file.mimetype.startsWith('video');
      statusData.type = isVideo ? 'video' : 'image';
      statusData.content = fileUrl;
      statusData.caption = caption || '';
    } else {
      if (!content || !content.trim()) {
        return res.status(400).json({ message: 'Status text content is required' });
      }
      statusData.type = 'text';
      statusData.content = content.trim();
      statusData.backgroundColor = backgroundColor || '#128c7e';
      statusData.fontFamily = fontFamily || 'sans-serif';
    }

    const status = await Status.create(statusData);
    const populated = await Status.findById(status._id)
      .populate('user', 'name username profilePicture')
      .populate('viewers.user', 'name username profilePicture');

    // Realtime notification through global io if available
    const io = req.app.get('io');
    if (io) {
      io.emit('newStatus', populated);
    }

    res.status(201).json(populated);
  } catch (error) {
    console.error('Error creating status:', error);
    res.status(500).json({ message: 'Failed to create status' });
  }
};

// @desc    Mark status as viewed by current user
// @route   POST /api/status/:id/view
// @access  Private
export const viewStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user._id;

    const status = await Status.findById(id);
    if (!status) {
      return res.status(404).json({ message: 'Status not found' });
    }

    // Do not add current user as viewer to their own status
    if (status.user.toString() === currentUserId.toString()) {
      return res.json({ message: 'Own status', viewers: status.viewers });
    }

    // WhatsApp Privacy: If viewer has read receipts disabled, do not record their view
    const viewerUser = await User.findById(currentUserId).select('privacySettings');
    if (viewerUser?.privacySettings?.readReceipts === false) {
      return res.json({ message: 'Viewed anonymously (read receipts disabled)', viewers: status.viewers });
    }

    const alreadyViewed = status.viewers.some(
      (v) => (v.user?._id || v.user)?.toString() === currentUserId.toString()
    );

    if (!alreadyViewed) {
      status.viewers.push({
        user: currentUserId,
        viewedAt: new Date(),
      });
      await status.save();

      const updated = await Status.findById(id)
        .populate('user', 'name username profilePicture')
        .populate('viewers.user', 'name username profilePicture');

      const io = req.app.get('io');
      if (io) {
        io.emit('statusViewed', {
          statusId: id,
          viewer: {
            _id: req.user._id,
            name: req.user.name,
            profilePicture: req.user.profilePicture,
            viewedAt: new Date(),
          },
        });
      }

      return res.json(updated);
    }

    res.json(status);
  } catch (error) {
    console.error('Error viewing status:', error);
    res.status(500).json({ message: 'Failed to record view' });
  }
};

// @desc    Delete user's own status
// @route   DELETE /api/status/:id
// @access  Private
export const deleteStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const status = await Status.findById(id);

    if (!status) {
      return res.status(404).json({ message: 'Status not found' });
    }

    if (status.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this status' });
    }

    await Status.findByIdAndDelete(id);

    const io = req.app.get('io');
    if (io) {
      io.emit('statusDeleted', { statusId: id, userId: req.user._id });
    }

    res.json({ message: 'Status deleted successfully', statusId: id });
  } catch (error) {
    console.error('Error deleting status:', error);
    res.status(500).json({ message: 'Failed to delete status' });
  }
};

// @desc    Get status viewers
// @route   GET /api/status/:id/viewers
// @access  Private
export const getStatusViewers = async (req, res) => {
  try {
    const { id } = req.params;
    const status = await Status.findById(id).populate(
      'viewers.user',
      'name username profilePicture'
    );

    if (!status) {
      return res.status(404).json({ message: 'Status not found' });
    }

    if (status.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(status.viewers || []);
  } catch (error) {
    console.error('Error fetching viewers:', error);
    res.status(500).json({ message: 'Failed to fetch viewers' });
  }
};
