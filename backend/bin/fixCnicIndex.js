require('dotenv').config();
const mongoose = require('mongoose');

const fixCnicIndex = async () => {
  try {
    console.log('\n🔧 ════════════════════════════════════');
    console.log('   CNIC INDEX FIXER');
    console.log('════════════════════════════════════\n');

    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB!\n');

    // Drop CNIC index from employees collection
    console.log('🗑️  Attempting to drop CNIC index...');
    
    try {
      await mongoose.connection.db.collection('employees').dropIndex('cnic_1');
      console.log('✅ CNIC index dropped successfully!\n');
    } catch (error) {
      if (error.code === 27) {
        console.log('ℹ️  Index "cnic_1" does not exist (already dropped)\n');
      } else {
        console.error('❌ Error dropping index:', error.message, '\n');
      }
    }

    // List remaining indexes
    console.log('📋 Current indexes on employees collection:');
    const indexes = await mongoose.connection.db.collection('employees').indexes();
    indexes.forEach((index, i) => {
      console.log(`   ${i + 1}. ${index.name}:`, JSON.stringify(index.key));
    });
    console.log('');

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

fixCnicIndex();