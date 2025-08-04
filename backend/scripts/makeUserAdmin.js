import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const makeUserAdmin = async (email) => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('📦 Connected to MongoDB');

    // Find user by email
    const user = await User.findOne({ email: email });
    
    if (!user) {
      console.log('❌ User not found with email:', email);
      process.exit(1);
    }

    // Update user to admin
    user.role = 'admin';
    user.subscriptionStatus = 'monthly';
    user.subscriptionExpiry = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year
    
    await user.save();

    console.log('✅ User updated to admin successfully!');
    console.log('Email:', user.email);
    console.log('Name:', user.name);
    console.log('Role:', user.role);
    console.log('Subscription:', user.subscriptionStatus);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating user to admin:', error);
    process.exit(1);
  }
};

// Get email from command line argument
const email = process.argv[2];

if (!email) {
  console.log('❌ Please provide an email address');
  console.log('Usage: node makeUserAdmin.js <email>');
  console.log('Example: node makeUserAdmin.js tapi11@gmail.com');
  process.exit(1);
}

makeUserAdmin(email); 