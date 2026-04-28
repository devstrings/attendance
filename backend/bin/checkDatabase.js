require('dotenv').config();
const mongoose = require('mongoose');
const Employee = require('../src/models/Employee');
const Manager = require('../src/models/Manager');
const User = require('../src/models/User');

const checkDatabase = async () => {
  try {
    console.log('\n🔍 ════════════════════════════════════');
    console.log('   DATABASE STATUS CHECKER');
    console.log('════════════════════════════════════\n');

    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB!\n');

    // Check specific manager from error
    const managerId = '69772c80532397a26d2db060';
    console.log('🔎 Checking specific manager from error...');
    console.log('   Manager ID:', managerId);
    
    const manager = await Manager.findById(managerId);
    
    if (manager) {
      console.log('\n✅ MANAGER FOUND:');
      console.log('   Name:', `${manager.firstName} ${manager.lastName}`);
      console.log('   Manager._id:', manager._id);
      console.log('   userId:', manager.userId);
      console.log('   Department:', manager.department);
      console.log('   Phone:', manager.phoneNumber);
      
      if (manager.userId) {
        const user = await User.findById(manager.userId);
        if (user) {
          console.log('\n✅ USER ACCOUNT FOUND:');
          console.log('   User._id:', user._id);
          console.log('   Email:', user.email);
          console.log('   Role:', user.role);
          console.log('   Active:', user.isActive);
        } else {
          console.log('\n❌ USER ACCOUNT NOT FOUND!');
          console.log('   Manager has userId:', manager.userId);
          console.log('   But no User document exists with this ID');
          console.log('   🔧 This needs to be fixed!');
        }
      } else {
        console.log('\n❌ MANAGER HAS NO userId!');
        console.log('   This is the problem - userId is null/missing');
        console.log('   🔧 Run: node bin/fixAllUserReferences.js');
      }
    } else {
      console.log('\n❌ MANAGER NOT FOUND with ID:', managerId);
    }

    console.log('\n─────────────────────────────────────');
    console.log('📊 OVERALL DATABASE STATS:');
    console.log('─────────────────────────────────────\n');

    // Check all managers
    const allManagers = await Manager.countDocuments();
    const managersWithUserId = await Manager.countDocuments({ userId: { $exists: true, $ne: null } });
    const managersWithoutUserId = await Manager.countDocuments({ 
      $or: [
        { userId: null },
        { userId: { $exists: false } }
      ]
    });

    console.log('👔 MANAGERS:');
    console.log('   Total:', allManagers);
    console.log('   With userId:', managersWithUserId, '✅');
    console.log('   Without userId:', managersWithoutUserId, '❌');

    // Check all employees
    const allEmployees = await Employee.countDocuments();
    const employeesWithUserId = await Employee.countDocuments({ userId: { $exists: true, $ne: null } });
    const employeesWithoutUserId = await Employee.countDocuments({ 
      $or: [
        { userId: null },
        { userId: { $exists: false } }
      ]
    });

    console.log('\n👤 EMPLOYEES:');
    console.log('   Total:', allEmployees);
    console.log('   With userId:', employeesWithUserId, '✅');
    console.log('   Without userId:', employeesWithoutUserId, '❌');

    // Show broken records
    if (managersWithoutUserId > 0) {
      console.log('\n⚠️  BROKEN MANAGERS:');
      const brokenManagers = await Manager.find({ 
        $or: [{ userId: null }, { userId: { $exists: false } }]
      }).limit(5);
      
      brokenManagers.forEach((mgr, i) => {
        console.log(`   ${i + 1}. ${mgr.firstName} ${mgr.lastName} (${mgr._id})`);
      });
    }

    if (employeesWithoutUserId > 0) {
      console.log('\n⚠️  BROKEN EMPLOYEES:');
      const brokenEmployees = await Employee.find({ 
        $or: [{ userId: null }, { userId: { $exists: false } }]
      }).limit(5);
      
      brokenEmployees.forEach((emp, i) => {
        console.log(`   ${i + 1}. ${emp.firstName} ${emp.lastName} (${emp._id})`);
      });
    }

    console.log('\n════════════════════════════════════');
    
    if (managersWithoutUserId > 0 || employeesWithoutUserId > 0) {
      console.log('⚠️  ACTION REQUIRED:');
      console.log('   Run: node bin/fixAllUserReferences.js');
    } else {
      console.log('✅ All references are valid!');
    }
    
    console.log('════════════════════════════════════\n');

    await mongoose.connection.close();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
};

checkDatabase();