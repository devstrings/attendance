const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/attendance-system')
  .then(async () => {
    console.log('✅ Connected to MongoDB');
    
    // Drop CNIC index
    try {
      await mongoose.connection.db.collection('employees').dropIndex('cnic_1');
      console.log('✅ CNIC index dropped successfully!');
    } catch (error) {
      console.log('ℹ️ Index may not exist:', error.message);
    }
    
    mongoose.disconnect();
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });