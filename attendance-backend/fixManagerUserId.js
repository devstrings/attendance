const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/attendance-system');

const db = mongoose.connection;

db.once('open', async function() {
  console.log('✅ Connected to MongoDB\n');

  try {
    const Manager = db.collection('managers');
    const User = db.collection('users');

    // Get broken manager
    const manager = await Manager.findOne({ 
      _id: new mongoose.Types.ObjectId("69723a923c1c877ed4b262a4") 
    });

    if (!manager) {
      console.log('❌ Manager not found!');
      process.exit(1);
    }

    console.log('📝 Manager Found:');
    console.log(`   Name: ${manager.firstName} ${manager.lastName}`);
    console.log(`   Current userId: ${manager.userId}\n`);

    // Find manager users
    const users = await User.find({ role: 'manager' }).toArray();

    console.log(`👥 Found ${users.length} manager user(s):\n`);

    if (users.length === 0) {
      console.log('❌ No manager users found!');
      console.log('Create a user first, then run this again.');
      process.exit(1);
    }

    users.forEach((u, i) => {
      console.log(`[${i}] ${u.email} - ID: ${u._id}`);
    });

    // Auto-match
    let selectedUser = null;

    if (users.length === 1) {
      selectedUser = users[0];
      console.log(`\n✅ Only one user, auto-selecting: ${selectedUser.email}\n`);
    } else {
      selectedUser = users.find(u => 
        u.email.toLowerCase().includes(manager.firstName.toLowerCase())
      );

      if (selectedUser) {
        console.log(`\n✅ Matched: ${selectedUser.email}\n`);
      } else {
        console.log('\n⚠️ Cannot auto-match. Run manually:\n');
        console.log('db.managers.updateOne(');
        console.log(`  { _id: ObjectId("69723a923c1c877ed4b262a4") },`);
        console.log(`  { $set: { userId: ObjectId("PASTE_USER_ID") } }`);
        console.log(');\n');
        process.exit(0);
      }
    }

    // Link manager to user
    if (selectedUser) {
      await Manager.updateOne(
        { _id: new mongoose.Types.ObjectId("69723a923c1c877ed4b262a4") },
        { $set: { userId: selectedUser._id } }
      );

      console.log('✅ FIXED!');
      console.log(`Manager: ${manager.firstName} ${manager.lastName}`);
      console.log(`Linked to: ${selectedUser.email}`);
      console.log(`User ID: ${selectedUser._id}`);
    }

    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
});