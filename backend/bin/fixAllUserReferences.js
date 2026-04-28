require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Manager = require('../src/models/Manager');
const Employee = require('../src/models/Employee');

const fixAllReferences = async () => {
  try {
    console.log('\n🔧 ════════════════════════════════════');
    console.log('   FIXING ALL USER REFERENCES');
    console.log('════════════════════════════════════\n');
    
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected\n');

    // ═══ FIX MANAGERS ═══
    console.log('👔 FIXING MANAGERS...\n');
    const managers = await Manager.find({});
    console.log(`📊 Total Managers: ${managers.length}\n`);
    
    let fixedManagers = 0;
    let brokenManagers = [];
    
    for (const manager of managers) {
      console.log(`Processing: ${manager.firstName} ${manager.lastName}`);
      
      // Check current userId
      let user = null;
      if (manager.userId) {
        user = await User.findById(manager.userId);
      }
      
      if (!user) {
        console.log(`  ⚠️  No valid user found - Searching...`);
        
        // Try to find by email pattern or create new
        const email = `${manager.firstName.toLowerCase()}.${manager.lastName.toLowerCase()}@company.com`;
        
        user = await User.findOne({ 
          role: 'manager',
          $or: [
            { email: { $regex: manager.firstName, $options: 'i' } },
            { email: { $regex: manager.cnic, $options: 'i' } }
          ]
        });
        
        if (!user) {
          console.log(`  ❌ No user found - Creating new user`);
          
          // Create new user account
          user = new User({
            email: email,
            password: 'Password123!', // Default password
            role: 'manager',
            isActive: true
          });
          await user.save();
          console.log(`  ✅ Created new user: ${user.email}`);
        }
        
        // Update manager with correct userId
        manager.userId = user._id;
        await manager.save();
        console.log(`  ✅ FIXED - userId updated`);
        fixedManagers++;
      } else {
        console.log(`  ✅ Already valid`);
      }
      console.log('');
    }
    
    console.log(`✅ Managers Fixed: ${fixedManagers}/${managers.length}\n`);

    // ═══ FIX EMPLOYEES ═══
    console.log('👤 FIXING EMPLOYEES...\n');
    const employees = await Employee.find({});
    console.log(`📊 Total Employees: ${employees.length}\n`);
    
    let fixedEmployees = 0;
    
    for (const employee of employees) {
      console.log(`Processing: ${employee.firstName} ${employee.lastName} (${employee.employeeCode})`);
      
      // Check current userId
      let user = null;
      if (employee.userId) {
        user = await User.findById(employee.userId);
      }
      
      if (!user) {
        console.log(`  ⚠️  No valid user found - Searching...`);
        
        const email = `${employee.employeeCode.toLowerCase()}@company.com`;
        
        user = await User.findOne({ 
          role: 'employee',
          $or: [
            { email: { $regex: employee.firstName, $options: 'i' } },
            { email: { $regex: employee.employeeCode, $options: 'i' } }
          ]
        });
        
        if (!user) {
          console.log(`  ❌ No user found - Creating new user`);
          
          user = new User({
            email: email,
            password: 'Password123!',
            role: 'employee',
            isActive: true
          });
          await user.save();
          console.log(`  ✅ Created new user: ${user.email}`);
        }
        
        employee.userId = user._id;
        await employee.save();
        console.log(`  ✅ FIXED - userId updated`);
        fixedEmployees++;
      } else {
        console.log(`  ✅ Already valid`);
      }
      console.log('');
    }
    
    console.log(`✅ Employees Fixed: ${fixedEmployees}/${employees.length}\n`);

    // ═══ VERIFY FIX ═══
    console.log('\n🔍 VERIFYING FIX...\n');
    
    const brokenManagersAfter = await Manager.find({ userId: null });
    const brokenEmployeesAfter = await Employee.find({ userId: null });
    
    console.log(`❌ Broken Managers: ${brokenManagersAfter.length}`);
    console.log(`❌ Broken Employees: ${brokenEmployeesAfter.length}`);
    
    if (brokenManagersAfter.length === 0 && brokenEmployeesAfter.length === 0) {
      console.log('\n✅ ALL REFERENCES FIXED SUCCESSFULLY!\n');
    } else {
      console.log('\n⚠️  Some references still broken - may need manual fix\n');
    }
    
    await mongoose.connection.close();
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
};

fixAllReferences();