const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config();

// ✅ FIXED: User model is inside src/models/
const User = require(path.join(__dirname, 'src', 'models', 'User'));

const createSuperAdmin = async () => {
  try {
    console.log('🚀 SUPER ADMIN CREATOR');
    console.log('📂 Current directory:', __dirname);
    console.log('📡 Connecting to MongoDB...');

    // Connect to MongoDB
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/attendance-system';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB!');

    // Delete ALL existing users
    console.log('🗑️  Deleting ALL existing users...');
    const deleteResult = await User.deleteMany({});
    console.log(`✅ Deleted ${deleteResult.deletedCount} user(s)`);

    // Create new admin
    console.log('👤 Creating NEW admin user...');
    
    const plainPassword = 'Admin@123';
    console.log('🔐 Plain password:', plainPassword);

    // ✅ Let the model's pre-save hook handle hashing
    const admin = new User({
      email: 'admin@shop.com',
      password: plainPassword,  // Plain password - pre-save hook will hash it
      role: 'admin',
      isActive: true,
      isEmailVerified: true
    });

    // Save (pre-save hook will hash the password)
    await admin.save();
    console.log('✅ Admin saved to database!');

    // Verify admin was created
    console.log('🔍 Verifying admin...');
    const savedAdmin = await User.findOne({ email: 'admin@shop.com' });
    
    if (savedAdmin) {
      console.log('✅ Admin verified in database!');
      console.log('   ID:', savedAdmin._id);
      console.log('   Email:', savedAdmin.email);
      console.log('   Role:', savedAdmin.role);
      console.log('   Active:', savedAdmin.isActive);
      console.log('   Password hash (first 30):', savedAdmin.password.substring(0, 30));
      
      // ✅ CRITICAL: Test password comparison
      console.log('🧪 Testing password...');
      const isMatch = await bcrypt.compare(plainPassword, savedAdmin.password);
      console.log('   Password match:', isMatch ? '✅ YES' : '❌ NO');
      
      if (!isMatch) {
        console.error('\n❌ ERROR: Password verification FAILED!');
        console.error('This means the password was not hashed correctly.');
        console.error('Please check the User model pre-save hook.\n');
      } else {
        console.log('\n╔═══════════════════════════════════════════╗');
        console.log('║  ✅ ADMIN CREATED SUCCESSFULLY!           ║');
        console.log('╚═══════════════════════════════════════════╝');
        console.log('\n📋 LOGIN CREDENTIALS:');
        console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('   📧 Email:    admin@shop.com');
        console.log('   🔑 Password: Admin@123');
        console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('\n🌐 Login URL: http://localhost:3000/admin/login');
        console.log('💡 TIP: Make sure your backend server is running!');
        console.log('   Run: npm start (in backend folder)\n');
      }
    } else {
      console.error('❌ Admin not found after creation!');
    }

    // Close connection
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error creating super admin:');
    console.error(error);
    
    // Close connection on error
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    
    process.exit(1);
  }
};

// Run the function
createSuperAdmin();