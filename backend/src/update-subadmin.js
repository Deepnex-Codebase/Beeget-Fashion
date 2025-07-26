import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/user.model.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

async function updateSubadminUsers() {
  try {
    // Find all subadmin users
    const subadmins = await User.find({ roles: 'subadmin' });
    
    console.log(`Found ${subadmins.length} subadmin users to update:`);
    
    // Update each subadmin's department and permissions
    for (const user of subadmins) {
      console.log(`\nUpdating Subadmin: ${user.name} (${user.email})`);
      console.log(`Before - Department: ${user.department || 'Not set'}`);
      console.log(`Before - Permissions: ${user.permissions?.length ? user.permissions.join(', ') : 'Not set'}`);
      
      // Standardize department name to lowercase
      if (user.department) {
        user.department = user.department.toLowerCase();
      } else {
        user.department = 'all';
      }
      
      // Ensure permissions is an array and contains 'all_permissions' for full access
      if (!user.permissions || !Array.isArray(user.permissions) || user.permissions.length === 0) {
        user.permissions = ['all_permissions'];
      }
      
      // Save the updated user
      await user.save();
      
      console.log(`After - Department: ${user.department}`);
      console.log(`After - Permissions: ${user.permissions.join(', ')}`);
    }
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    await mongoose.disconnect();
  }
}

// Run the update function
updateSubadminUsers();