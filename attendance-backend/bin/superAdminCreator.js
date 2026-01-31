require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// ✅ SIMPLE PATH
const User = require('../src/models/User');

const createSuperAdmin = async () => {
  try {
    console.log('\n🚀 ════════════════════════════════════');
    console.log('   SUPER ADMIN CREATOR');
    console.log('════════════════════════════════════\n');

    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB!\n');

    console.log('🗑️  Deleting ALL existing users...');
    const deleteResult = await User.deleteMany({});
    console.log(`✅ Deleted ${deleteResult.deletedCount} user(s)\n`);

    console.log('👤 Creating NEW admin user...');
    const plainPassword = 'Admin@123';

    const admin = new User({
      email: 'admin@shop.com',
      password: plainPassword,
      role: 'admin',
      isActive: true,
      isEmailVerified: true
    });

    await admin.save();
    console.log('✅ Admin saved to database!\n');

    console.log('🔍 Verifying admin creation...');
    const savedAdmin = await User.findOne({ email: 'admin@shop.com' });
    
    if (savedAdmin) {
      console.log('✅ Admin found in database!');
      console.log('   📧 Email:', savedAdmin.email);
      console.log('   👤 Role:', savedAdmin.role);
      console.log('   🟢 Active:', savedAdmin.isActive);
      
      console.log('\n🧪 Testing password...');
      const isMatch = await bcrypt.compare(plainPassword, savedAdmin.password);
      
      if (isMatch) {
        console.log('   ✅ Password verification: SUCCESS!\n');
        
        console.log('╔═══════════════════════════════════════════╗');
        console.log('║  ✅ ADMIN CREATED SUCCESSFULLY!           ║');
        console.log('╚═══════════════════════════════════════════╝');
        console.log('\n📋 LOGIN CREDENTIALS:');
        console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('   📧 Email:    admin@shop.com');
        console.log('   🔑 Password: Admin@123');
        console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      } else {
        console.error('   ❌ Password verification FAILED!\n');
      }
    } else {
      console.error('❌ Admin not found after creation!\n');
    }

    await mongoose.connection.close();
    console.log('✅ Database connection closed\n');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
};

createSuperAdmin();