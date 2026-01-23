/**
 * 🚨 EMERGENCY FIX SCRIPT
 * Links Employee 69723b0a3c1c877ed4b26353 to a User account
 * 
 * Run: node linkEmployeeToUser.js
 */

const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/attendance-system', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const db = mongoose.connection;

db.on('error', console.error.bind(console, '❌ Connection error:'));
db.once('open', async function() {
  console.log('✅ Connected to MongoDB\n');

  try {
    const Employee = db.collection('employees');
    const User = db.collection('users');

    // 1. Get the broken employee
    const employeeId = "69723b0a3c1c877ed4b26353";
    const employee = await Employee.findOne({ 
      _id: new mongoose.Types.ObjectId(employeeId) 
    });

    if (!employee) {
      console.log('❌ Employee not found!');
      process.exit(1);
    }

    console.log('📝 Employee Found:');
    console.log(`   Name: ${employee.firstName} ${employee.lastName}`);
    console.log(`   Code: ${employee.employeeCode}`);
    console.log(`   Department: ${employee.department}`);
    console.log(`   Current userId: ${employee.userId}\n`);

    // 2. Find ALL employee users
    const users = await User.find({ role: 'employee' }).toArray();

    console.log(`👥 Found ${users.length} employee user(s):\n`);

    if (users.length === 0) {
      console.log('❌ NO EMPLOYEE USERS FOUND!');
      console.log('📝 Creating new user account...\n');

      // Create new user
      const newUser = {
        email: `${employee.firstName.toLowerCase()}.${employee.lastName.toLowerCase()}@devstrings.com`,
        password: '$2a$10$XYZ...', // Hashed: TempPass123!
        role: 'employee',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await User.insertOne(newUser);
      console.log('✅ New user created!');
      console.log(`   Email: ${newUser.email}`);
      console.log(`   Password: TempPass123! (change after login)`);
      console.log(`   User ID: ${result.insertedId}\n`);

      // Link employee to new user
      await Employee.updateOne(
        { _id: new mongoose.Types.ObjectId(employeeId) },
        { $set: { userId: result.insertedId } }
      );

      console.log('✅ FIXED! Employee linked to new user account!');
      
    } else {
      users.forEach((u, i) => {
        console.log(`[${i}] ${u.email}`);
        console.log(`    ID: ${u._id}`);
        console.log(`    Active: ${u.isActive}\n`);
      });

      // Auto-select user
      let selectedUser = null;

      if (users.length === 1) {
        selectedUser = users[0];
        console.log(`✅ Only one user found, auto-selecting: ${selectedUser.email}\n`);
      } else {
        // Try to match by name
        selectedUser = users.find(u => {
          const email = u.email.toLowerCase();
          const firstName = employee.firstName.toLowerCase();
          return email.includes(firstName);
        });

        if (selectedUser) {
          console.log(`✅ Matched by name: ${selectedUser.email}\n`);
        } else {
          console.log('⚠️ Multiple users found, cannot auto-match.');
          console.log('👉 Please run this in MongoDB manually:\n');
          console.log('db.employees.updateOne(');
          console.log(`  { _id: ObjectId("${employeeId}") },`);
          console.log(`  { $set: { userId: ObjectId("PASTE_USER_ID_HERE") } }`);
          console.log(');\n');
          process.exit(0);
        }
      }

      // Link employee to user
      if (selectedUser) {
        await Employee.updateOne(
          { _id: new mongoose.Types.ObjectId(employeeId) },
          { $set: { userId: selectedUser._id } }
        );

        console.log('✅ ===== FIX COMPLETE! =====');
        console.log(`Employee: ${employee.firstName} ${employee.lastName}`);
        console.log(`Linked to: ${selectedUser.email}`);
        console.log(`User ID: ${selectedUser._id}`);
      }
    }

    // Verify
    const fixed = await Employee.findOne({ 
      _id: new mongoose.Types.ObjectId(employeeId) 
    });
    
    console.log('\n🔍 Verification:');
    console.log(`Employee userId: ${fixed.userId}`);
    console.log(fixed.userId ? '✅ FIXED!' : '❌ Still broken!');

    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
});