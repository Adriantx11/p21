import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

// Load environment variables
dotenv.config();

const updateUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📦 Connected to MongoDB');

    // Find users with invalid subscriptionStatus
    const usersToUpdate = await User.find({
      subscriptionStatus: { $nin: ['free', 'monthly', 'pro'] }
    });

    console.log(`Found ${usersToUpdate.length} users with invalid subscriptionStatus`);

    // Update users with 'pro' status to 'monthly'
    const result = await User.updateMany(
      { subscriptionStatus: 'pro' },
      { $set: { subscriptionStatus: 'monthly' } }
    );

    console.log(`Updated ${result.modifiedCount} users from 'pro' to 'monthly'`);

    // Update any other invalid statuses to 'free'
    const invalidResult = await User.updateMany(
      { subscriptionStatus: { $nin: ['free', 'monthly', 'pro'] } },
      { $set: { subscriptionStatus: 'free' } }
    );

    console.log(`Updated ${invalidResult.modifiedCount} users with invalid status to 'free'`);

    console.log('✅ User update completed');
  } catch (error) {
    console.error('❌ Error updating users:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📦 Disconnected from MongoDB');
  }
};

// Run the script
updateUsers(); 