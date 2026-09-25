// createSuperAdmin2.js
// Ise backend/bin/ folder me rakho (recoverAdmin.js ke saath)

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../src/models/User');

async function run() {
  try {
    console.log('\n📡 MongoDB se connect ho raha hai...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected!\n');

    const EMAIL = 'superadmin@devstrings.com';
    const PASSWORD = 'SuperAdmin@2026!';

    // Check karo already exist to nahi karta
    const existing = await User.findOne({ email: EMAIL.toLowerCase() });
    if (existing) {
      console.log(`⚠️  "${EMAIL}" already DB mein hai (role: ${existing.role}).`);
      console.log('   Agar role update karna hai to alag script use karo.');
      await mongoose.disconnect();
      return;
    }

    const newSuperAdmin = new User({
      email: EMAIL.toLowerCase(),
      password: PASSWORD, // pre-save hook hash karega
      role: 'superadmin',
      isActive: true,
      isEmailVerified: true,
    });

    await newSuperAdmin.save();

    // Verify
    const saved = await User.findById(newSuperAdmin._id);
    const isMatch = await bcrypt.compare(PASSWORD, saved.password);

    console.log('✅ Naya Super Admin account ban gaya!');
    console.log(`   📧 Email:    ${EMAIL}`);
    console.log(`   🔑 Password: ${PASSWORD}`);
    console.log(`   🎭 Role:     superadmin`);
    console.log(`   🧪 Verify:   ${isMatch ? '✅ Sahi hai, login kar sakte ho' : '❌ FAIL'}`);

    await mongoose.disconnect();
    process.exit(0);

  } catch (err) {
    console.error('\n❌ Error:', err.message);
    if (err.code === 11000) {
      console.error('   ℹ️  Duplicate key error — ye email already exist karta hai.');
    }
    if (mongoose.connection.readyState === 1) await mongoose.disconnect();
    process.exit(1);
  }
}

run();