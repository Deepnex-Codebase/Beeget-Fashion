import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/user.model.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

async function fixSubadminPermissions() {
  try {
    // Find all subadmin users
    const subadmins = await User.find({ roles: 'subadmin' });
    
    console.log(`Found ${subadmins.length} subadmin users to update:`);
    
    // Update each subadmin's permissions
    for (const user of subadmins) {
      console.log(`\nUpdating Subadmin: ${user.name} (${user.email})`);
      console.log(`Before - Department: ${user.department || 'Not set'}`);
      console.log(`Before - Permissions: ${user.permissions?.length ? user.permissions.join(', ') : 'Not set'}`);
      
      // Ensure permissions is an array
      if (!user.permissions || !Array.isArray(user.permissions)) {
        user.permissions = [];
      }
      
      // Add 'all_permissions' and 'manage_orders' if not already present
      if (!user.permissions.includes('all_permissions')) {
        user.permissions.push('all_permissions');
      }
      
      if (!user.permissions.includes('manage_orders')) {
        user.permissions.push('manage_orders');
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

// Run the fix function
fixSubadminPermissions();