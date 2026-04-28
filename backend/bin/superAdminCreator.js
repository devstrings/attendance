require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');

// ✅ Correct path (bin/ folder se src/models/)
const User = require('../src/models/User');

// ================================
// ADMINS LIST — yahan add/remove karo
// ================================
const ADMINS = [
  {
    email: 'usmanhafeez147@gmail.com',
    password: 'Admin@123',
    displayName: 'Usman Hafeez',
  },
  // Doosra admin chahiye to uncomment karo:
  // {
  //   email: 'admin2@yourcompany.com',
  //   password: 'Admin@123',
  //   displayName: 'Admin Two',
  // },
];

// ================================
// ADMIN WELCOME EMAIL TEMPLATE
// ================================
const getAdminWelcomeEmail = (displayName, email, password) => `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:30px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.1);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:40px 30px;text-align:center;">
            <div style="font-size:52px;margin-bottom:10px;">🛡️</div>
            <h1 style="color:#fff;margin:0;font-size:26px;font-weight:700;">Admin Access Granted</h1>
            <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:15px;">Attendance Management System</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:36px 40px;">
            <p style="color:#374151;font-size:17px;margin:0 0 8px;">
              Assalam-o-Alaikum, <strong>${displayName}</strong>!
            </p>
            <p style="color:#6b7280;font-size:15px;line-height:1.7;margin:0 0 28px;">
              Aapko <strong>Attendance Management System</strong> ka <strong>Administrator</strong> banaya gaya hai.
              Ab aap poora system manage kar sakte hain — employees, managers, attendance, leaves, aur settings.
            </p>

            <!-- Role Badge -->
            <div style="text-align:center;margin-bottom:24px;">
              <span style="display:inline-block;background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;padding:8px 24px;border-radius:30px;font-size:14px;font-weight:700;letter-spacing:1px;">
                ⚡ ROLE: ADMINISTRATOR
              </span>
            </div>

            <!-- Credentials Box -->
            <div style="background:linear-gradient(135deg,#f8f7ff,#f0f4ff);border:1px solid #e0e7ff;border-radius:12px;padding:26px;margin-bottom:26px;">
              <h3 style="color:#4f46e5;margin:0 0 18px;font-size:14px;text-transform:uppercase;letter-spacing:1px;">🔐 Login Credentials</h3>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #e0e7ff;">
                    <span style="color:#9ca3af;font-size:12px;display:block;margin-bottom:4px;">📧 Email Address</span>
                    <strong style="color:#1f2937;font-size:16px;">${email}</strong>
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #e0e7ff;">
                    <span style="color:#9ca3af;font-size:12px;display:block;margin-bottom:4px;">🔑 Password</span>
                    <strong style="color:#1f2937;font-size:16px;background:#fff;padding:5px 14px;border-radius:8px;border:1px solid #d1d5db;display:inline-block;font-family:monospace;">${password}</strong>
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0;">
                    <span style="color:#9ca3af;font-size:12px;display:block;margin-bottom:4px;">🌐 Admin Panel URL</span>
                    <strong style="color:#667eea;font-size:15px;">http://localhost:3001</strong>
                  </td>
                </tr>
              </table>
            </div>

            <!-- Admin Powers -->
            <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:22px;margin-bottom:24px;">
              <h3 style="color:#374151;margin:0 0 14px;font-size:14px;text-transform:uppercase;letter-spacing:1px;">🎯 Admin Powers</h3>
              <table cellpadding="0" cellspacing="0">
                <tr><td style="padding:5px 0;color:#555;font-size:14px;">✅ &nbsp;Employees aur Managers manage karna</td></tr>
                <tr><td style="padding:5px 0;color:#555;font-size:14px;">✅ &nbsp;Leave requests approve / reject karna</td></tr>
                <tr><td style="padding:5px 0;color:#555;font-size:14px;">✅ &nbsp;Attendance records dekhna aur edit karna</td></tr>
                <tr><td style="padding:5px 0;color:#555;font-size:14px;">✅ &nbsp;Salary aur reports manage karna</td></tr>
                <tr><td style="padding:5px 0;color:#555;font-size:14px;">✅ &nbsp;Announcements banana</td></tr>
                <tr><td style="padding:5px 0;color:#555;font-size:14px;">✅ &nbsp;System settings configure karna</td></tr>
              </table>
            </div>

            <!-- Warning -->
            <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:16px;margin-bottom:28px;">
              <p style="margin:0;color:#92400e;font-size:13px;line-height:1.6;">
                ⚠️ <strong>Security Notice:</strong> Pehli login ke baad apna password zaroor change karein.
                Apni credentials kisi ke saath share mat karein.
              </p>
            </div>

            <!-- CTA -->
            <div style="text-align:center;">
              <a href="http://localhost:3001"
                 style="display:inline-block;background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;text-decoration:none;padding:15px 44px;border-radius:50px;font-size:16px;font-weight:700;box-shadow:0 4px 15px rgba(102,126,234,0.4);">
                🚀 Admin Panel Kholen
              </a>
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;padding:18px 40px;text-align:center;border-top:1px solid #e5e7eb;">
            <p style="margin:0;color:#9ca3af;font-size:12px;">
              © ${new Date().getFullYear()} Attendance Management System &nbsp;|&nbsp; Ye automated email hai, reply mat karein.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
`;

// ================================
// EMAIL SEND FUNCTION
// ================================
const sendWelcomeEmail = async (displayName, email, password) => {
  try {
    let transportConfig;

    // Pehle DB se SMTP try karo
    try {
      const SmtpSettings = require('../src/models/SmtpSettings');
      const smtp = await SmtpSettings.findOne({}).sort({ updatedAt: -1 });
      if (smtp && smtp.host) {
        transportConfig = {
          host: smtp.host,
          port: smtp.port || 587,
          secure: smtp.secure || false,
          auth: { user: smtp.user, pass: smtp.password }
        };
        console.log('   📡 SMTP: database se load hua');
      }
    } catch (e) {
      // SmtpSettings nahi mila
    }

    // Fallback: .env
    if (!transportConfig) {
      transportConfig = {
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        }
      };
      console.log('   📡 SMTP: .env se load hua');
    }

    const transporter = nodemailer.createTransport(transportConfig);

    await transporter.sendMail({
      from: `"Attendance System" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '🛡️ Admin Access — Attendance Management System',
      html: getAdminWelcomeEmail(displayName, email, password)
    });

    console.log(`   ✅ Welcome email bhej diya → ${email}`);
  } catch (err) {
    console.warn(`   ⚠️  Email fail hua (non-fatal): ${err.message}`);
    console.warn(`   ℹ️  .env mein EMAIL_USER aur EMAIL_PASSWORD check karein`);
  }
};

// ================================
// MAIN FUNCTION
// ================================
const createSuperAdmin = async () => {
  try {
    console.log('\n╔═══════════════════════════════════════╗');
    console.log('║       SUPER ADMIN CREATOR             ║');
    console.log('╚═══════════════════════════════════════╝\n');

    console.log('📡 MongoDB se connect ho raha hai...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected!\n');

    for (const adminData of ADMINS) {
      console.log(`\n👤 Processing: ${adminData.email}`);
      console.log('   ─────────────────────────────────────');

      // Already exists check
      const existing = await User.findOne({ email: adminData.email.toLowerCase() });

      if (existing) {
        console.log(`   ℹ️  Pehle se DB mein hai — dobara create nahi hoga`);
        console.log(`   📧 Welcome email bhej raha hai...`);
        await sendWelcomeEmail(adminData.displayName, adminData.email, adminData.password);
        continue;
      }

      // New admin — User model mein sirf ye fields hain
      const admin = new User({
        email: adminData.email.toLowerCase(),
        password: adminData.password,  // ✅ pre-save hook hash kar dega
        role: 'admin',
        isActive: true,
        isEmailVerified: true,
      });

      await admin.save();
      console.log(`   ✅ Admin DB mein save ho gaya`);

      // Password verify
      const saved = await User.findOne({ email: adminData.email.toLowerCase() });
      const isMatch = await bcrypt.compare(adminData.password, saved.password);
      console.log(`   🧪 Password check: ${isMatch ? '✅ Sahi hai' : '❌ FAIL — User model ka pre-save hook check karein'}`);

      // Welcome email
      console.log(`   📧 Welcome email bhej raha hai...`);
      await sendWelcomeEmail(adminData.displayName, adminData.email, adminData.password);

      console.log(`\n   ╔═══════════════════════════════════════╗`);
      console.log(`   ║  🎉 ADMIN BAN GAYA!                   ║`);
      console.log(`   ╠═══════════════════════════════════════╣`);
      console.log(`   ║  📧 Email:    ${adminData.email.padEnd(23)}║`);
      console.log(`   ║  🔑 Password: ${adminData.password.padEnd(23)}║`);
      console.log(`   ║  🌐 Login:    http://localhost:3001    ║`);
      console.log(`   ╚═══════════════════════════════════════╝`);
    }

    await mongoose.connection.close();
    console.log('\n✅ Kaam mukammal! Connection band ho gaya.\n');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    if (error.code === 11000) {
      console.error('   ℹ️  Duplicate entry — ye admin already exist karta hai');
    }
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
};

createSuperAdmin();