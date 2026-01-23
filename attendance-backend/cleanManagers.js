const mongoose = require('mongoose');

async function clean() {
  await mongoose.connect('mongodb://localhost:27017/attendance-system');
  await mongoose.connection.db.collection('managers').drop();
  console.log('✅ Managers collection dropped!');
  process.exit(0);
}

clean().catch(err => {
  console.log('Collection already empty or not found');
  process.exit(0);
});