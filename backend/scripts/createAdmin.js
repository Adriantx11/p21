import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const createAdminUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('📦 Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists');
      console.log('Email:', existingAdmin.email);
      process.exit(0);
    }

    // Create admin user
    const adminUser = new User({
      name: 'Admin User',
      email: 'admin@galaxy-subscriptions.com',
      password: 'admin123456',
      numericId: '123456789',
      role: 'admin',
      subscriptionStatus: 'monthly',
      subscriptionExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
    });

    await adminUser.save();

    console.log('✅ Admin user created successfully!');
    console.log('Email: admin@galaxy-subscriptions.com');
    console.log('Password: admin123456');
    console.log('Numeric ID: 123456789');
    console.log('\n⚠️  Remember to change these credentials in production!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }
};

createAdminUser(); 