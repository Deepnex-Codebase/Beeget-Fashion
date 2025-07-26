import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/user.model.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

async function debugSubadminUsers() {
  try {
    // Find all subadmin users
    const subadmins = await User.find({ roles: 'subadmin' });
    
    console.log(`Found ${subadmins.length} subadmin users:`);
    
    // Log each subadmin's details
    subadmins.forEach((user, index) => {
      console.log(`\nSubadmin #${index + 1}:`);
      console.log(`ID: ${user._id}`);
      console.log(`Name: ${user.name}`);
      console.log(`Email: ${user.email}`);
      console.log(`Department: ${user.department || 'Not set'}`);
      console.log(`Permissions: ${user.permissions?.length ? user.permissions.join(', ') : 'Not set'}`);
      console.log(`Roles: ${user.roles.join(', ')}`);
      console.log(`Is Verified: ${user.isVerified}`);
    });
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    await mongoose.disconnect();
  }
}

// Run the debug function
debugSubadminUsers();