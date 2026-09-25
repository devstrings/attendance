// recoverAdmin.js
// Is file ko backend/bin/ folder me rakho (superAdminCreator.js ke saath)
// Kyunki '../src/models/User' path bin/ folder se relative hai

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../src/models/User');

async function run() {
  try {
    console.log('\n📡 MongoDB se connect ho raha hai...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected!\n');

    // ================================
    // STEP 1: Sab admin/superadmin users dikhao
    // ================================
    const admins = await User.find({
      role: { $in: ['admin', 'superadmin', 'super-admin', 'Super Admin'] }
    }).select('email role isActive');

    console.log('📋 Mojood Admins:');
    console.table(admins.map(a => ({
      id: a._id.toString(),
      email: a.email,
      role: a.role
    })));

    if (admins.length === 0) {
      console.log('❌ Koi admin nahi mila is role filter se.');
      console.log('   Sab users dekhne ke liye neeche wali line uncomment karo:');
      // const all = await User.find({}).select('email role');
      // console.table(all.map(a => ({ email: a.email, role: a.role })));
      await mongoose.disconnect();
      return;
    }

    // ================================
    // STEP 2: Password reset karo
    // ================================
    const TARGET_EMAIL = 'usmanhafeez147@gmail.com'; // <-- confirm/change karo (lowercase)
    const NEW_PASSWORD = 'Admin@123'; // <-- naya password

    const user = await User.findOne({ email: TARGET_EMAIL.toLowerCase() });

    if (!user) {
      console.log(`\n❌ Email "${TARGET_EMAIL}" se koi user nahi mila.`);
      console.log('   Upar wali list se sahi email copy karke TARGET_EMAIL me daalo.');
      await mongoose.disconnect();
      return;
    }

    // Direct field set karo — .save() pre-save hook khud hash kar dega
    user.password = NEW_PASSWORD;
    user.role = 'admin';
    await user.save();

    // Verify
    const saved = await User.findOne({ email: TARGET_EMAIL.toLowerCase() });
    const isMatch = await bcrypt.compare(NEW_PASSWORD, saved.password);

    console.log(`\n✅ Password reset ho gaya!`);
    console.log(`   📧 Email:    ${TARGET_EMAIL}`);
    console.log(`   🔑 Password: ${NEW_PASSWORD}`);
    console.log(`   🧪 Verify:   ${isMatch ? '✅ Sahi hai, login kar sakte ho' : '❌ FAIL — hook check karo'}`);

    await mongoose.disconnect();
    process.exit(0);

  } catch (err) {
    console.error('\n❌ Error:', err.message);
    if (mongoose.connection.readyState === 1) await mongoose.disconnect();
    process.exit(1);
  }
}

run();