const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

async function seedSuperAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/timetabl');
    
    // Check if super admin exists
    const adminExists = await User.findOne({ role: 'SUPER_ADMIN', isDeleted: false });
    
    if (adminExists) {
      console.log('Super Admin already exists with email:', adminExists.email);
      console.log('You can log in using:');
      console.log(`Email: ${adminExists.email}`);
      console.log('Password: (the password originally set)');
    } else {
      const superAdmin = await User.create({
        userId: 'SUPER_ADMIN',
        name: 'System Administrator',
        email: 'admin@timetabl.com',
        password: 'password123',
        role: 'SUPER_ADMIN',
        isApproved: true,
        isActive: true
      });
      console.log('Super Admin created successfully!');
      console.log('You can log in using:');
      console.log('Email: admin@timetabl.com');
      console.log('Password: password123');
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error seeding super admin:', err);
    process.exit(1);
  }
}

seedSuperAdmin();
