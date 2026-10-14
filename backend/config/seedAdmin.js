import User from '../models/User.js';
import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';

export const seedAdminUser = async () => {
  try {
    const adminEmail = 'batiyauadminabhay62@gmail.com';
    let admin = await User.findOne({ email: adminEmail }).select('+password');

    if (!admin) {
      admin = new User({
        name: 'Abhay (Admin)',
        username: 'batiyauadminabhay62',
        email: adminEmail,
        password: 'adminabhay@62', // Will be hashed by pre-save hook
        role: 'superadmin',
        bio: 'Official Batiyau Chat Administrator 🛡️',
        phoneNumber: '+919876543210',
      });
      await admin.save();
      console.log(`👑 [ADMIN SEED] Superadmin created: ${adminEmail} (password: adminabhay@62)`);
    } else {
      let changed = false;
      if (admin.role !== 'superadmin' && admin.role !== 'admin') {
        admin.role = 'superadmin';
        changed = true;
      }
      if (admin.isBanned) {
        admin.isBanned = false;
        changed = true;
      }
      // Verify password
      const isMatch = await admin.matchPassword('adminabhay@62');
      if (!isMatch) {
        admin.password = 'adminabhay@62'; // Pre-save hook will hash it
        changed = true;
      }
      if (changed) {
        await admin.save();
        console.log(`👑 [ADMIN SEED] Superadmin updated and verified: ${adminEmail}`);
      } else {
        console.log(`👑 [ADMIN SEED] Superadmin verified: ${adminEmail}`);
      }
    }

    // Ensure Test User exists (do not overwrite admin unblock/block actions on server restart)
    let testUser = await User.findOne({ email: 'testuser99@gmail.com' });
    if (!testUser) {
      testUser = new User({
        name: 'Test User',
        username: 'testuser99',
        email: 'testuser99@gmail.com',
        password: 'password123',
        phoneNumber: '+919876543219',
        isBanned: true,
        blockType: 'temporary',
        banReason: 'Repeated spam messages and unsolicited links',
        blockedAt: new Date(),
        blockExpiryDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        blockedByName: 'Abhay (Super Admin)',
        blockHistory: [{
          action: 'block',
          blockType: 'temporary',
          duration: '24 Hours',
          reason: 'Repeated spam messages and unsolicited links',
          blockedAt: new Date(),
          expiryDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
          adminName: 'Abhay (Super Admin)',
          createdAt: new Date(),
        }],
      });
      await testUser.save();
      console.log('🔒 Test User initialized in database');
    }

    // Ensure Official Batiyao System Channel User exists
    await ensureBatiyaoSystemUser();

    // 1. WhatsApp Privacy: Ensure all users have lastSeen set to 'everyone' by default
    await User.updateMany(
      { $or: [{ 'privacySettings.lastSeen': 'nobody' }, { 'privacySettings.lastSeen': null }, { 'privacySettings.lastSeen': { $exists: false } }] },
      { $set: { 'privacySettings.lastSeen': 'everyone' } }
    );

    // 2. Remove obsolete corrupted encrypted test messages (from old client-side hash tests)
    const delResult = await Message.deleteMany({ isEncrypted: true });
    if (delResult.deletedCount > 0) {
      console.log(`🧹 [CLEANUP] Removed ${delResult.deletedCount} corrupted hash messages`);
      // Re-sync lastMessage in all conversations
      const allConvs = await Conversation.find({});
      for (const conv of allConvs) {
        const latestMsg = await Message.findOne({ conversation: conv._id }).sort({ createdAt: -1 });
        conv.lastMessage = latestMsg ? latestMsg._id : null;
        conv.lastMessageAt = latestMsg ? latestMsg.createdAt : conv.updatedAt;
        await conv.save();
      }
    }
  } catch (error) {
    console.error('⚠️ [ADMIN SEED] Error seeding admin account:', error.message);
  }
};

export const ensureBatiyaoSystemUser = async () => {
  try {
    const officialEmail = 'official@batiyao.internal';
    let batiyao = await User.findOne({
      $or: [{ email: officialEmail }, { username: 'batiyao' }, { isOfficial: true }],
    });

    if (!batiyao) {
      batiyao = new User({
        name: 'Batiyao',
        username: 'batiyao',
        email: officialEmail,
        password: 'batiyao_system_secure_pass_9988!',
        role: 'superadmin',
        bio: 'Official Batiyao Channel 📢 • Announcements, Updates & System Alerts',
        phoneNumber: '+910000000000',
        isOfficial: true,
        status: 'online',
      });
      await batiyao.save();
      console.log('🤖 [SYSTEM SEED] Batiyao Official system user created successfully');
    } else {
      let changed = false;
      if (!batiyao.isOfficial) {
        batiyao.isOfficial = true;
        changed = true;
      }
      if (batiyao.name !== 'Batiyao' && batiyao.name !== 'Batiyao Official') {
        batiyao.name = 'Batiyao';
        changed = true;
      }
      if (changed) {
        await batiyao.save();
      }
    }
    return batiyao;
  } catch (error) {
    console.error('⚠️ [SYSTEM SEED] Error ensuring Batiyao system user:', error.message);
    return null;
  }
};
