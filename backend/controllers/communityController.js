import Community from '../models/Community.js';
import Conversation from '../models/Conversation.js';
import User from '../models/User.js';

// @desc    Get all communities for current user
// @route   GET /api/communities
// @access  Private
export const getCommunities = async (req, res) => {
  try {
    const userId = req.user._id;

    const communities = await Community.find({
      $or: [{ members: userId }, { admin: userId }, { admins: userId }],
    })
      .populate('admin', 'name username profilePicture')
      .populate('admins', 'name username profilePicture')
      .populate('members', 'name username profilePicture')
      .populate({
        path: 'announcementGroup',
        populate: [
          { path: 'lastMessage' },
          { path: 'participants', select: 'name username profilePicture' },
        ],
      })
      .populate({
        path: 'groups',
        populate: [
          { path: 'lastMessage' },
          { path: 'participants', select: 'name username profilePicture' },
        ],
      })
      .sort({ updatedAt: -1 });

    res.json(communities);
  } catch (error) {
    console.error('Error fetching communities:', error);
    res.status(500).json({ message: 'Failed to fetch communities' });
  }
};

// @desc    Create new community
// @route   POST /api/communities
// @access  Private
export const createCommunity = async (req, res) => {
  try {
    const { name, description, icon } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Community name is required' });
    }

    const userId = req.user._id;

    // 1. Create the official Announcement Group
    const announcementGroup = await Conversation.create({
      isGroup: true,
      groupName: `${name.trim()} Announcements`,
      groupDescription: `Official announcement channel for ${name.trim()}`,
      groupAdmin: userId,
      groupAdmins: [userId],
      participants: [userId],
      isAnnouncementGroup: true,
      groupImage: icon || '',
      groupPermissions: {
        sendMessages: false, // only admins
        editGroupSettings: false,
        addMembers: false,
        sendMessageHistory: true,
        approveNewMembers: false,
      },
    });

    // 2. Create the Community
    const community = await Community.create({
      name: name.trim(),
      description: description ? description.trim() : '',
      icon: icon || '',
      admin: userId,
      admins: [userId],
      members: [userId],
      announcementGroup: announcementGroup._id,
      groups: [],
    });

    // Link conversation to community
    announcementGroup.community = community._id;
    await announcementGroup.save();

    const populated = await Community.findById(community._id)
      .populate('admin', 'name username profilePicture')
      .populate('admins', 'name username profilePicture')
      .populate('members', 'name username profilePicture')
      .populate({
        path: 'announcementGroup',
        populate: [
          { path: 'lastMessage' },
          { path: 'participants', select: 'name username profilePicture' },
        ],
      })
      .populate({
        path: 'groups',
        populate: [
          { path: 'lastMessage' },
          { path: 'participants', select: 'name username profilePicture' },
        ],
      });

    const io = req.app.get('io');
    if (io) {
      io.emit('communityCreated', populated);
    }

    res.status(201).json(populated);
  } catch (error) {
    console.error('Error creating community:', error);
    res.status(500).json({ message: 'Failed to create community' });
  }
};

// @desc    Get community by ID
// @route   GET /api/communities/:id
// @access  Private
export const getCommunityDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const community = await Community.findById(id)
      .populate('admin', 'name username profilePicture')
      .populate('admins', 'name username profilePicture')
      .populate('members', 'name username profilePicture')
      .populate({
        path: 'announcementGroup',
        populate: [
          { path: 'lastMessage' },
          { path: 'participants', select: 'name username profilePicture' },
        ],
      })
      .populate({
        path: 'groups',
        populate: [
          { path: 'lastMessage' },
          { path: 'participants', select: 'name username profilePicture' },
        ],
      });

    if (!community) {
      return res.status(404).json({ message: 'Community not found' });
    }

    res.json(community);
  } catch (error) {
    console.error('Error fetching community details:', error);
    res.status(500).json({ message: 'Failed to fetch community details' });
  }
};

// @desc    Add a group to community (create new or add existing)
// @route   POST /api/communities/:id/groups
// @access  Private
export const addCommunityGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const { groupName, groupDescription, existingGroupId } = req.body;
    const userId = req.user._id;

    const community = await Community.findById(id);
    if (!community) {
      return res.status(404).json({ message: 'Community not found' });
    }

    // Check if caller is community admin
    const isAdmin =
      community.admin.toString() === userId.toString() ||
      community.admins.some((a) => a.toString() === userId.toString());

    if (!isAdmin) {
      return res
        .status(403)
        .json({ message: 'Only community admins can add groups to this community' });
    }

    let conversation;

    if (existingGroupId) {
      conversation = await Conversation.findById(existingGroupId);
      if (!conversation) {
        return res.status(404).json({ message: 'Group not found' });
      }
      conversation.community = community._id;
      await conversation.save();
    } else {
      if (!groupName || !groupName.trim()) {
        return res.status(400).json({ message: 'Group name is required' });
      }

      conversation = await Conversation.create({
        isGroup: true,
        groupName: groupName.trim(),
        groupDescription: groupDescription ? groupDescription.trim() : '',
        groupAdmin: userId,
        groupAdmins: [userId],
        participants: community.members, // include community members
        community: community._id,
      });
    }

    // Add to community groups if not already present
    if (!community.groups.includes(conversation._id)) {
      community.groups.push(conversation._id);
      await community.save();
    }

    const updatedCommunity = await Community.findById(id)
      .populate('admin', 'name username profilePicture')
      .populate('admins', 'name username profilePicture')
      .populate('members', 'name username profilePicture')
      .populate({
        path: 'announcementGroup',
        populate: [
          { path: 'lastMessage' },
          { path: 'participants', select: 'name username profilePicture' },
        ],
      })
      .populate({
        path: 'groups',
        populate: [
          { path: 'lastMessage' },
          { path: 'participants', select: 'name username profilePicture' },
        ],
      });

    const io = req.app.get('io');
    if (io) {
      io.emit('communityUpdated', updatedCommunity);
    }

    res.json({
      community: updatedCommunity,
      group: conversation,
    });
  } catch (error) {
    console.error('Error adding group to community:', error);
    res.status(500).json({ message: 'Failed to add group to community' });
  }
};

// @desc    Join community
// @route   POST /api/communities/:id/join
// @access  Private
export const joinCommunity = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const community = await Community.findById(id);
    if (!community) {
      return res.status(404).json({ message: 'Community not found' });
    }

    if (!community.members.includes(userId)) {
      community.members.push(userId);
      await community.save();

      // Add user to announcement group
      if (community.announcementGroup) {
        await Conversation.findByIdAndUpdate(community.announcementGroup, {
          $addToSet: { participants: userId },
        });
      }
    }

    const updated = await Community.findById(id)
      .populate('admin', 'name username profilePicture')
      .populate('admins', 'name username profilePicture')
      .populate('members', 'name username profilePicture')
      .populate('announcementGroup')
      .populate('groups');

    const io = req.app.get('io');
    if (io) {
      io.emit('communityUpdated', updated);
    }

    res.json(updated);
  } catch (error) {
    console.error('Error joining community:', error);
    res.status(500).json({ message: 'Failed to join community' });
  }
};

// @desc    Leave community
// @route   POST /api/communities/:id/leave
// @access  Private
export const leaveCommunity = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const community = await Community.findById(id);
    if (!community) {
      return res.status(404).json({ message: 'Community not found' });
    }

    community.members = community.members.filter(
      (m) => m.toString() !== userId.toString()
    );
    community.admins = community.admins.filter(
      (a) => a.toString() !== userId.toString()
    );

    await community.save();

    // Remove from announcement group
    if (community.announcementGroup) {
      await Conversation.findByIdAndUpdate(community.announcementGroup, {
        $pull: { participants: userId },
      });
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('communityUpdated', { communityId: id });
    }

    res.json({ message: 'Left community successfully', communityId: id });
  } catch (error) {
    console.error('Error leaving community:', error);
    res.status(500).json({ message: 'Failed to leave community' });
  }
};

// @desc    Delete community
// @route   DELETE /api/communities/:id
// @access  Private
export const deleteCommunity = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const community = await Community.findById(id);
    if (!community) {
      return res.status(404).json({ message: 'Community not found' });
    }

    if (community.admin.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ message: 'Only creator can delete this community' });
    }

    // Unlink conversations
    await Conversation.updateMany(
      { community: community._id },
      { $unset: { community: 1 } }
    );

    await Community.findByIdAndDelete(id);

    const io = req.app.get('io');
    if (io) {
      io.emit('communityDeleted', { communityId: id });
    }

    res.json({ message: 'Community deleted successfully', communityId: id });
  } catch (error) {
    console.error('Error deleting community:', error);
    res.status(500).json({ message: 'Failed to delete community' });
  }
};
